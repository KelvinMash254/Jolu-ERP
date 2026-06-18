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
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).fillColor(primaryColor).text(invoice.company.name, { align: 'left' });
    doc.fontSize(10).fillColor('#000000').text(invoice.company.address || '', { align: 'left' });
    doc.text(`KRA PIN: ${invoice.company.kraPin || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(16).fillColor(primaryColor).text(formatInvoiceType(invoice.type), { align: 'right' });
    doc.fontSize(10).fillColor('#000000').text(`# ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${invoice.issueDate.toLocaleDateString()}`, { align: 'right' });
    if (invoice.dueDate) doc.text(`Due: ${invoice.dueDate.toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Customer
    const clientName = invoice.customer?.name || invoice.securityClient?.name || 'N/A';
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(clientName);
    if (invoice.customer) {
      doc.text(invoice.customer.phone);
      if (invoice.customer.email) doc.text(invoice.customer.email);
      if (invoice.customer.physicalAddress) doc.text(invoice.customer.physicalAddress);
    }
    doc.moveDown();

    // Line items table
    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 20).fill(primaryColor);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('Description', 60, tableTop + 5);
    doc.text('Qty', 300, tableTop + 5);
    doc.text('Unit Price', 350, tableTop + 5);
    doc.text('Total', 450, tableTop + 5);
    doc.font('Helvetica').fillColor('#000000');

    let y = tableTop + 25;
    for (const line of invoice.lines) {
      doc.text(line.description, 50, y, { width: 240 });
      doc.text(String(line.quantity), 300, y);
      doc.text(Number(line.unitPrice).toLocaleString(), 350, y);
      doc.text(Number(line.total).toLocaleString(), 450, y);
      y += 20;
    }

    doc.moveDown(2);
    y = Math.max(y + 20, doc.y);
    doc.text(`Subtotal: KES ${Number(invoice.subtotal).toLocaleString()}`, 350, y, { align: 'right' });
    doc.text(`VAT (16%): KES ${Number(invoice.taxAmount).toLocaleString()}`, 350, y + 15, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: KES ${Number(invoice.totalAmount).toLocaleString()}`, 350, y + 30, { align: 'right' });
    doc.font('Helvetica');

    if (Number(invoice.amountPaid) > 0) {
      doc.text(`Amount Paid: KES ${Number(invoice.amountPaid).toLocaleString()}`, 350, y + 50, { align: 'right' });
      doc.text(`Balance Due: KES ${(Number(invoice.totalAmount) - Number(invoice.amountPaid)).toLocaleString()}`, 350, y + 65, { align: 'right' });
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
