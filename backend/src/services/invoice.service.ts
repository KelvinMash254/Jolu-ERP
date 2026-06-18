import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import { InvoiceType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
    if (invoice.company.logoUrl) {
      // Note: In a real environment we would need to handle image loading (fetch or local path)
      // For now we assume the logo is accessible or we skip it if it fails
      try {
        doc.image(invoice.company.logoUrl, 50, headerY, { width: 60 });
      } catch (e) { /* skip logo if error */ }
    } else {
      doc.fontSize(10).fillColor('#cccccc').text('LOGO', 50, headerY);
    }

    doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text(invoice.company.name, 50, headerY + 70);
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text(invoice.company.address || '', 50, doc.y);
    doc.text(`PIN: ${invoice.company.kraPin || 'N/A'}`);

    doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text(formatInvoiceType(invoice.type), 300, headerY, { align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text(`# ${invoice.invoiceNumber}`, 300, doc.y, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Date: ${invoice.issueDate.toLocaleDateString()}`, 300, doc.y, { align: 'right' });
    if (invoice.dueDate) doc.text(`Due: ${invoice.dueDate.toLocaleDateString()}`, 300, doc.y, { align: 'right' });

    // Customer
    doc.moveDown(2);
    const billToY = doc.y;
    doc.rect(50, billToY, 500, 1).fill('#eeeeee');
    doc.moveDown();
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#999999').text('BILL TO');

    const clientName = invoice.customer?.name || invoice.securityClient?.name || 'N/A';
    const clientPhone = invoice.customer?.phone || invoice.securityClient?.phone || '';
    const clientEmail = invoice.customer?.email || invoice.securityClient?.email || '';
    const clientAddress = invoice.customer?.physicalAddress || invoice.securityClient?.address || '';

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(clientName);
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text(clientPhone);
    doc.text(clientEmail);
    doc.text(clientAddress);

    // Line items table
    doc.moveDown(2);
    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 20).fill(primaryColor);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('Description', 60, tableTop + 5);
    doc.text('Qty', 300, tableTop + 5);
    doc.text('Unit Price', 350, tableTop + 5, { width: 80, align: 'right' });
    doc.text('Total', 450, tableTop + 5, { width: 80, align: 'right' });

    let y = tableTop + 25;
    doc.font('Helvetica').fillColor('#000000');
    for (const line of invoice.lines) {
      doc.text(line.description, 60, y, { width: 230 });
      doc.text(String(line.quantity), 300, y);
      doc.text(Number(line.unitPrice).toLocaleString(), 350, y, { width: 80, align: 'right' });
      doc.text(Number(line.total).toLocaleString(), 450, y, { width: 80, align: 'right' });
      y = doc.y + 10;
      doc.rect(50, y - 5, 500, 0.5).fill('#eeeeee');
    }

    // Totals
    doc.moveDown();
    y = doc.y + 20;
    const totalsX = 300;
    doc.fontSize(10).fillColor('#666666').text('Subtotal', totalsX, y);
    doc.fillColor('#000000').text(`KES ${Number(invoice.subtotal).toLocaleString()}`, 400, y, { align: 'right' });

    y += 20;
    doc.fillColor('#666666').text('VAT (16%)', totalsX, y);
    doc.fillColor('#000000').text(`KES ${Number(invoice.taxAmount).toLocaleString()}`, 400, y, { align: 'right' });

    y += 25;
    doc.rect(totalsX, y - 5, 250, 1).fill('#eeeeee');
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text('Total', totalsX, y);
    doc.text(`KES ${Number(invoice.totalAmount).toLocaleString()}`, 400, y, { align: 'right' });

    if (Number(invoice.amountPaid) > 0) {
      y += 30;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#15803d').text('Amount Paid', totalsX, y);
      doc.text(`KES ${Number(invoice.amountPaid).toLocaleString()}`, 400, y, { align: 'right' });

      y += 20;
      doc.rect(totalsX, y - 5, 250, 1).fill('#eeeeee');
      doc.fillColor('#000000').text('Balance Due', totalsX, y);
      doc.text(`KES ${(Number(invoice.totalAmount) - Number(invoice.amountPaid)).toLocaleString()}`, 400, y, { align: 'right' });
    }

    // Notes
    if (invoice.notes) {
      doc.moveDown(1.5);
      doc.rect(50, doc.y, 500, 1).fill('#eeeeee');
      doc.moveDown();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#999999').text('NOTES & TERMS');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#666666').text(invoice.notes, { width: 500, lineGap: 2 });
    }

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
    TAX_INVOICE: 'INV',
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
