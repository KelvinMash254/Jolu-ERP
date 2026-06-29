import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import { InvoiceType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'invoices');

export interface PDFOptions {
  primaryColor?: string;
}

export async function generateInvoicePDF(invoiceId: string, options: PDFOptions = {}): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: true,
      customer: true,
      securityClient: true,
      lines: true,
    },
  });

  if (!invoice) throw new Error('Invoice not found');

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const fileName = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const primaryColor = options.primaryColor || '#0ea5e9'; // Default Jolu blue

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header

const headerY = 50;

try {
  const logoPath = path.join(
    process.cwd(),
    'uploads',
    'logos',
    'machineries.png'
  );

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, headerY, {
      width: 140,
    });
  } else {
    console.log('Logo not found:', logoPath);
  }
} catch (error) {
  console.error('Logo loading failed:', error);
}

    doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text(formatInvoiceType(invoice.type), 300, headerY, { align: 'right' });
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text(invoice.company.name, 300, doc.y, { align: 'right' });
    doc.fontSize(9).font('Helvetica').fillColor('#000000').text(invoice.company.address || '', 300, doc.y, { align: 'right' });
    doc.text(`T: ${invoice.company.phone || ''}`, 300, doc.y, { align: 'right' });
    doc.text(`Email: ${invoice.company.email || ''}`, 300, doc.y, { align: 'right', });
    if (invoice.company.ccEmail) doc.text(`CC: ${invoice.company.ccEmail}`, 300, doc.y, { align: 'right', });
    if (invoice.company.website) doc.text(`Website: ${invoice.company.website}`, 300, doc.y, { align: 'right', });

// Dynamic document labels
const documentLabels: Record<InvoiceType, { number: string; date: string }> = {
  INVOICE: {
    number: 'Invoice No',
    date: 'Invoice Date',
  },
  QUOTATION: {
    number: 'Quotation No',
    date: 'Quotation Date',
  },
  RECEIPT: {
    number: 'Receipt No',
    date: 'Receipt Date',
  },
  PROFORMA: {
    number: 'Proforma No',
    date: 'Proforma Date',
  },
  CREDIT_NOTE: {
    number: 'Credit Note No',
    date: 'Credit Note Date',
  },
  DEBIT_NOTE: {
    number: 'Debit Note No',
    date: 'Debit Note Date',
  },
  PURCHASE_ORDER: {
    number: 'PO No',
    date: 'PO Date',
  },
  DELIVERY_NOTE: {
    number: 'Delivery Note No',
    date: 'Delivery Date',
  },
};

const labels = documentLabels[invoice.type];

doc.moveDown();

doc.fontSize(10)
  .font('Helvetica')
  .text(`${labels.number}:`, 350, doc.y, { continued: true });

doc.font('Helvetica-Bold')
  .text(` ${invoice.invoiceNumber}`, { align: 'right' });

doc.font('Helvetica')
  .text(`${labels.date}:`, 350, doc.y, { continued: true });

doc.text(` ${invoice.issueDate.toLocaleDateString('en-GB')}`, {
  align: 'right',
});

// Only show Due Date on documents that require it
if (
  invoice.type !== InvoiceType.RECEIPT &&
  invoice.type !== InvoiceType.QUOTATION &&
  invoice.type !== InvoiceType.DELIVERY_NOTE
) {
  const dueDate = new Date(invoice.issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  doc.text(`Due Date:`, 350, doc.y, { continued: true });

  doc.text(` ${dueDate.toLocaleDateString('en-GB')}`, {
    align: 'right',
  });
}

    // Customer
     doc.moveDown(2);
    const billToY = doc.y;
    doc.fontSize(10)
   .font('Helvetica')
   .fillColor('#000000')
   .text('Bill to:', 50, billToY); // 50 = left margin
    doc.moveDown(0.5);
    
    const clientName = invoice.customer?.name || invoice.securityClient?.name || 'N/A';
    const clientPhone = invoice.customer?.phone || invoice.securityClient?.phone || '';
    const clientEmail = invoice.customer?.email || invoice.securityClient?.email || '';
    const clientAddress = invoice.customer?.physicalAddress || invoice.securityClient?.address || '';

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(clientName.toUpperCase());
    if (invoice.customer?.idNumber) {
      doc.fontSize(10).text(`ID: ${invoice.customer.idNumber}`);
    }
    doc.fontSize(10).font('Helvetica').text(clientAddress);

    // Line items table
    doc.moveDown(2);
    const tableTop = doc.y;
    
    // Draw table header
    doc.rect(50, tableTop, 500, 20).fill('#d9ead3').stroke('#000000');
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
    doc.text('Details', 55, tableTop + 5, { width: 220, align: 'center' });
    doc.text('Quantity', 275, tableTop + 5, { width: 80, align: 'center' });
    doc.text('Unit Price', 355, tableTop + 5, { width: 90, align: 'center' });
    doc.text('Amount', 445, tableTop + 5, { width: 100, align: 'center' });

    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(10);
    
    for (const line of invoice.lines) {
      const rowHeight = Math.max(25, doc.heightOfString(line.description, { width: 210 }) + 10);
      
      doc.rect(50, y, 225, rowHeight).stroke();
      doc.rect(275, y, 80, rowHeight).stroke();
      doc.rect(355, y, 90, rowHeight).stroke();
      doc.rect(445, y, 105, rowHeight).stroke();
      
      doc.text(line.description, 60, y + 7, { width: 210 });
      doc.text(String(line.quantity), 275, y + 7, { width: 80, align: 'center' });
      doc.text(Number(line.unitPrice).toLocaleString(), 355, y + 7, { width: 85, align: 'right' });
      doc.text(Number(line.total).toLocaleString(undefined, { minimumFractionDigits: 2 }), 445, y + 7, { width: 100, align: 'right' });
      
      y += rowHeight;
    }

    // Total row
    doc.rect(355, y, 90, 25).fill('#d9ead3').stroke('#000000');
    doc.rect(445, y, 105, 25).fill('#d9ead3').stroke('#000000');
    doc.fillColor('#000000').font('Helvetica-Bold');
    doc.text('Total', 360, y + 7, { width: 80, align: 'center' });
    doc.text(`KES ${Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 445, y + 7, { width: 100, align: 'right' });

    // Terms and Bank Details
    y += 40;
    doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions', 50, y, { underline: true });
    doc.font('Helvetica').fontSize(9);
    doc.text('Prices quoted in Kenya Shilling (KES)', 50, y + 15);
    doc.text('Payment due within 30 Days', 50, y + 27);

    y += 50;
    // Bank Details Table
    const bankTableWidth = 250;
    doc.rect(50, y, bankTableWidth, 15).stroke();
    doc.font('Helvetica-Bold').text('Bank Details:', 55, y + 3, { width: bankTableWidth - 10, align: 'center' });
    
    const bankDetails = [
      ['Account Name', 'Jolu Agricultural Machineries Ltd'],
      ['Account Number', '3012099542002'],
      ['Bank Name', 'Kingdom Bank'],
      ['Branch Name', 'Thika'],
      ['Branch Code', '301']
    ];

    let bankY = y + 15;
    for (const [label, value] of bankDetails) {
      doc.rect(50, bankY, bankTableWidth, 15).stroke();
      doc.font('Helvetica-Bold').text(`${label}: `, 55, bankY + 3, { continued: true });
      doc.font('Helvetica').text(value);
      bankY += 15;
    }

    // MPESA Details Table
    y = bankY + 20;
    doc.rect(50, y, bankTableWidth, 15).stroke();
    doc.font('Helvetica-Bold').text('MPESA Details', 55, y + 3, { width: bankTableWidth - 10, align: 'center' });
    
    const mpesaDetails = [
      ['MPESA Paybill', '529901'],
      ['Account Number', '062015'],
      ['Account Name', invoice.company.legalName]
    ];

    let mpesaY = y + 15;
    for (const [label, value] of mpesaDetails) {
      doc.rect(50, mpesaY, bankTableWidth, 15).stroke();
      doc.font('Helvetica-Bold').text(`${label}: `, 55, mpesaY + 3, { continued: true });
      doc.font('Helvetica').text(value);
      mpesaY += 15;
    }

    // Footer
    doc.moveTo(50, 750).lineTo(550, 750).stroke(primaryColor);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text(`For Jolu, With Jolu & Always Jolu`, 50, 765, { align: 'center' });

    doc.end();

    stream.on('finish', async () => {
      const pdfUrl = `/uploads/invoices/${fileName}`;
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl },
      });
      resolve(pdfUrl);
    });
    stream.on('error', reject);
  });
}

function formatInvoiceType(type: InvoiceType): string {
  return type.replace(/_/g, ' ');
}

export async function getNextInvoiceNumber(companyId: string, type: InvoiceType): Promise<string> {
  const prefixMap: Record<InvoiceType, string> = {
    PROFORMA: 'PRO',
    INVOICE: 'INV',
    RECEIPT: 'RCP',
    CREDIT_NOTE: 'CN',
    DEBIT_NOTE: 'DN',
    PURCHASE_ORDER: 'PO',
    DELIVERY_NOTE: 'DN',
    QUOTATION: 'QUO',
  };

  const count = await prisma.invoice.count({ where: { companyId, type } });
  const year = new Date().getFullYear();
  return `${prefixMap[type]}-${year}-${String(count + 1).padStart(6, '0')}`;
}
