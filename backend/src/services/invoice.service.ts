import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import { InvoiceType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { postPaymentJournal } from './accounting.service';
import { sendEmail } from './notification.service';

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
      payments: true,
    },
  });

  if (!invoice) throw new Error('Invoice not found');

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const fileName = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  // Default colors per company
  const companyColors: Record<string, string> = {
    MACHINERIES: '#18361e', // Dark Green
    SECURITY: '#e82126',    // Bright Red
    AUTOMOBILE: '#e82126',  // Bright Red
  };

  const primaryColor = options.primaryColor || companyColors[invoice.company.code] || '#18361e';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    if (invoice.type === InvoiceType.RECEIPT) {
      const headerY = 50;
      if (invoice.company.logoUrl) {
        try {
          const logoRelativePath = invoice.company.logoUrl.startsWith('/')
            ? invoice.company.logoUrl.substring(1)
            : invoice.company.logoUrl;
          const logoPath = path.join(process.cwd(), logoRelativePath);
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, headerY, { width: 140 });
          } else {
            const altPath = path.join(process.cwd(), logoRelativePath.replace(/^backend\//, ''));
            if (fs.existsSync(altPath)) {
               doc.image(altPath, 50, headerY, { width: 140 });
            }
          }
        } catch (error) {
          console.error('Logo loading failed:', error);
        }
      }

      // Receipt Title
      doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text('PAYMENT RECEIPT', 300, headerY, { align: 'right' });

      const displayCompanyName = invoice.company.code === 'MACHINERIES' ? 'Jolu Machineries' : invoice.company.name;
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text(displayCompanyName, 300, doc.y + 5, { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#000000').text(invoice.company.address || '', 300, doc.y, { align: 'right' });
      doc.text(`T: ${invoice.company.phone || ''}`, 300, doc.y, { align: 'right' });
      doc.text(`Email: ${invoice.company.email || ''}`, 300, doc.y, { align: 'right' });
      if (invoice.company.website) doc.text(`Website: ${invoice.company.website}`, 300, doc.y, { align: 'right' });
      if (invoice.company.kraPin) doc.text(`KRA PIN: ${invoice.company.kraPin}`, 300, doc.y, { align: 'right' });

      doc.moveDown(1.5);
      const infoY = doc.y;

      // Receipt Information Block (Left column)
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text('RECEIPT INFORMATION', 50, infoY);
      doc.font('Helvetica').fontSize(9);
      doc.text(`Receipt Number: ${invoice.invoiceNumber}`, 50, doc.y + 4);
      doc.text(`Receipt Date: ${invoice.issueDate.toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, 50, doc.y + 3);
      if (invoice.invoiceNumber) {
        doc.text(`Linked Invoice No: ${invoice.invoiceNumber}`, 50, doc.y + 3);
      }
      doc.text(`Receipt Status: Original`, 50, doc.y + 3);
      doc.text(`Printed On: ${new Date().toLocaleString('en-GB')}`, 50, doc.y + 3);

      // Customer Details Block (Right column)
      const rightColX = 320;
      doc.fontSize(9).font('Helvetica-Bold').text('CUSTOMER DETAILS', rightColX, infoY);
      doc.font('Helvetica').fontSize(9);
      const clientName = invoice.customer?.name || invoice.securityClient?.name || 'Valued Customer';
      const clientPhone = invoice.customer?.phone || invoice.securityClient?.phone || 'N/A';
      const clientEmail = invoice.customer?.email || invoice.securityClient?.email || 'N/A';
      doc.text(`Customer Name: ${clientName.toUpperCase()}`, rightColX, doc.y + 4);
      if (invoice.customer?.idNumber) {
        doc.text(`Customer ID/Passport: ${invoice.customer.idNumber}`, rightColX, doc.y + 3);
      }
      doc.text(`Phone: ${clientPhone}`, rightColX, doc.y + 3);
      doc.text(`Email: ${clientEmail}`, rightColX, doc.y + 3);

      doc.moveDown(1.5);

      // Payment Details Block
      const paymentY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').text('PAYMENT DETAILS', 50, paymentY);
      doc.moveTo(50, paymentY + 14).lineTo(550, paymentY + 14).stroke('#E5E7EB');

      doc.font('Helvetica').fontSize(9);
      const payment = invoice.payments && invoice.payments[0];
      const payMethod = payment ? payment.paymentMethod : 'M-PESA';
      const payRef = payment ? payment.reference : 'N/A';

      doc.text(`Payment For: Goods / Services / Rentals`, 50, paymentY + 20);
      doc.text(`Payment Method: ${payMethod}`, 50, doc.y + 3);
      doc.text(`Transaction Reference: ${payRef}`, 50, doc.y + 3);
      doc.text(`Currency: KES`, 50, doc.y + 3);

      doc.moveDown(1.5);

      // Item Details Table
      const tableTop = doc.y;
      doc.rect(50, tableTop, 500, 20).fill(primaryColor);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('Description', 55, tableTop + 5, { width: 220, align: 'left' });
      doc.text('Qty', 275, tableTop + 5, { width: 50, align: 'center' });
      doc.text('Unit Price', 325, tableTop + 5, { width: 100, align: 'right' });
      doc.text('Amount', 445, tableTop + 5, { width: 100, align: 'right' });

      let y = tableTop + 20;
      doc.fillColor('#000000').font('Helvetica').fontSize(9);
      for (const line of invoice.lines) {
        const rowHeight = Math.max(20, doc.heightOfString(line.description, { width: 210 }) + 8);
        doc.rect(50, y, 225, rowHeight).stroke('#E5E7EB');
        doc.rect(275, y, 50, rowHeight).stroke('#E5E7EB');
        doc.rect(325, y, 100, rowHeight).stroke('#E5E7EB');
        doc.rect(425, y, 125, rowHeight).stroke('#E5E7EB');
        
        doc.text(line.description, 60, y + 5, { width: 210 });
        doc.text(String(line.quantity), 275, y + 5, { width: 50, align: 'center' });
        doc.text(Number(line.unitPrice).toLocaleString(), 325, y + 5, { width: 95, align: 'right' });
        doc.text(Number(line.total).toLocaleString(undefined, { minimumFractionDigits: 2 }), 425, y + 5, { width: 120, align: 'right' });
        y += rowHeight;
      }

      // Totals Block
      const subtotal = Number(invoice.subtotal);
      const taxAmount = Number(invoice.taxAmount);
      const totalAmount = Number(invoice.totalAmount);
      const amountPaid = Number(invoice.amountPaid || invoice.totalAmount);
      const outstandingBalance = Math.max(0, totalAmount - amountPaid);

      doc.moveDown(1);
      const totalsY = y + 10;
      doc.fontSize(9).font('Helvetica-Bold').text('TOTALS SUMMARY', 320, totalsY);
      doc.moveTo(320, totalsY + 12).lineTo(550, totalsY + 12).stroke('#E5E7EB');

      let currentY = totalsY + 18;
      const drawTotalRow = (label: string, value: string, isBold = false) => {
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(label, 320, currentY);
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(value, 445, currentY, { width: 105, align: 'right' });
        currentY += 15;
      };

      drawTotalRow('Subtotal:', `KES ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      drawTotalRow('Discount:', 'KES 0.00');
      drawTotalRow('Tax/VAT:', `KES ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      drawTotalRow('Total Amount:', `KES ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, true);
      drawTotalRow('Amount Paid:', `KES ${amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, true);
      drawTotalRow('Outstanding Balance:', `KES ${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

      // Received By and Branch Info
      const extraInfoY = currentY + 15;
      doc.font('Helvetica-Bold').text('ADDITIONAL INFORMATION', 50, extraInfoY);
      doc.moveTo(50, extraInfoY + 12).lineTo(300, extraInfoY + 12).stroke('#E5E7EB');

      doc.font('Helvetica').fontSize(8);
      doc.text(`Received By: Authorized Cashier (Jolu ERP)`, 50, extraInfoY + 18);
      doc.text(`Branch: Head Office`, 50, doc.y + 3);
      if (invoice.notes) {
        doc.text(`Notes/Remarks: ${invoice.notes}`, 50, doc.y + 3, { width: 250 });
      }

      // System generated notice
      doc.moveDown(2);
      const noticeY = doc.y + 20;
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#6B7280');
      doc.text('This is a system-generated receipt and is valid without a signature or company stamp.', 50, noticeY, { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor);
      doc.text('For Jolu ERP', 50, noticeY + 15, { align: 'center' });

      // Footer
      doc.moveTo(50, 750).lineTo(550, 750).stroke(primaryColor);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text(`For Jolu, With Jolu & Always Jolu`, 50, 765, { align: 'center' });
    } else {
      // Header

      const headerY = 50;

      if (invoice.company.logoUrl) {
        try {
          // Remove leading slash if present to avoid path.join issues on some systems
          const logoRelativePath = invoice.company.logoUrl.startsWith('/')
            ? invoice.company.logoUrl.substring(1)
            : invoice.company.logoUrl;

          // If it's a URL, we might need to download it, but for local files:
          const logoPath = path.join(process.cwd(), logoRelativePath);

          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, headerY, { width: 140 });
          } else {
            // Try without the 'backend/' prefix if it was incorrectly added
            const altPath = path.join(process.cwd(), logoRelativePath.replace(/^backend\//, ''));
            if (fs.existsSync(altPath)) {
               doc.image(altPath, 50, headerY, { width: 140 });
            } else {
              console.warn('Logo not found at:', logoPath, 'or', altPath);
            }
          }
        } catch (error) {
          console.error('Logo loading failed:', error);
        }
      }

      doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryColor).text(formatInvoiceType(invoice.type).toUpperCase(), 300, headerY, { align: 'right' });

      const displayCompanyName = invoice.company.code === 'MACHINERIES' ? 'Jolu Machineries' : invoice.company.name;
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000').text(displayCompanyName, 300, doc.y + 5, { align: 'right' });
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
      doc.rect(50, tableTop, 500, 20).fill(primaryColor);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
      doc.text('Details', 55, tableTop + 5, { width: 220, align: 'center' });
      doc.text('Quantity', 275, tableTop + 5, { width: 80, align: 'center' });
      doc.text('Unit Price', 355, tableTop + 5, { width: 90, align: 'center' });
      doc.text('Amount', 445, tableTop + 5, { width: 100, align: 'center' });

      let y = tableTop + 20;
      doc.fillColor('#000000').font('Helvetica').fontSize(10);

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
      doc.rect(355, y, 90, 25).fill(primaryColor);
      doc.rect(445, y, 105, 25).fill(primaryColor);
      doc.fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('Total', 360, y + 7, { width: 80, align: 'center' });
      doc.text(`KES ${Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 445, y + 7, { width: 100, align: 'right' });

      // Terms and Bank Details
      y += 40;
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Terms & Conditions', 50, y, { underline: true });
      doc.font('Helvetica').fontSize(9);
      doc.text('Prices quoted in Kenya Shilling (KES)', 50, y + 15);
      doc.text('Payment due within 30 Days', 50, y + 27);

      y += 50;
      // Bank Details Table
      const bankTableWidth = 250;
      doc.rect(50, y, bankTableWidth, 15).stroke();
      doc.font('Helvetica-Bold').text('BANK DETAILS', 55, y + 3, { width: bankTableWidth - 10, align: 'center' });

      let bankDetails = [
        ['Account Name', 'Jolu Agricultural Machineries Ltd'],
        ['Account Number', '3012099542002'],
        ['Bank Name', 'Kingdom Bank'],
        ['Branch', 'Thika (301)']
      ];

      if (invoice.company.code === 'SECURITY') {
        bankDetails = [
          ['Account Name', 'Jolu Group Security Ltd'],
          ['Account Number', '0112099542001'],
          ['Bank Name', 'Co-operative Bank'],
          ['Branch', 'Upper Hill (011)']
        ];
      } else if (invoice.company.code === 'AUTOMOBILE') {
        bankDetails = [
          ['Account Name', 'Jolu Automobile Limited'],
          ['Account Number', '3012099542003'],
          ['Bank Name', 'Kingdom Bank'],
          ['Branch', 'Thika (301)']
        ];
      }

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
      doc.font('Helvetica-Bold').text('MPESA DETAILS', 55, y + 3, { width: bankTableWidth - 10, align: 'center' });

      let mpesaDetails = [
        ['Paybill', '529901'],
        ['Account', '062015'],
        ['Name', 'Jolu Agricultural Machineries Ltd']
      ];

      if (invoice.company.code === 'SECURITY') {
        mpesaDetails = [
          ['Paybill', '400200'],
          ['Account', '011929954200'],
          ['Name', 'Jolu Security Services']
        ];
      } else if (invoice.company.code === 'AUTOMOBILE') {
        mpesaDetails = [
          ['Paybill', '529901'],
          ['Account', '062016'],
          ['Name', invoice.company.legalName]
        ];
      }

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

export async function processPaymentAndSendReceipt(
  invoiceId: string,
  amount: number,
  paymentMethod: string,
  reference: string
) {
  // 1. Get invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, securityClient: true, company: true }
  });
  if (!invoice) throw new Error('Invoice not found');

  // 2. Add payment record
  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId: invoice.id,
      amount,
      paymentMethod,
      reference,
    }
  });

  // 3. Update invoice status
  const newAmountPaid = Number(invoice.amountPaid) + amount;
  const status = newAmountPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid: newAmountPaid, status },
    include: { customer: true, securityClient: true, company: true }
  });

  // 4. Create accounting journal entries to reflect on statements
  await postPaymentJournal(invoice.companyId, amount, paymentMethod, undefined, reference);

  // 5. Generate PAID PDF invoice/receipt
  const pdfUrl = await generateInvoicePDF(invoice.id);
  const pdfPath = path.join(process.cwd(), pdfUrl.startsWith('/') ? pdfUrl.substring(1) : pdfUrl);

  // 6. Send Receipt Email automatically
  const clientEmail = updatedInvoice.customer?.email || updatedInvoice.securityClient?.email;
  const clientName = updatedInvoice.customer?.name || updatedInvoice.securityClient?.name || 'Valued Client';

  if (clientEmail) {
    const subject = `Payment Receipt - ${updatedInvoice.invoiceNumber}`;
    const text = `
=========================================
          PAYMENT RECEIPT
=========================================

Dear ${clientName},

Thank you for your payment. We have successfully processed your payment.

RECEIPT REFERENCE DETAILS:
-----------------------------------------
Receipt Headline: OFFICIAL PAYMENT RECEIPT
Receipt Number:   REC-${reference || 'N/A'}
Invoice Number:   ${updatedInvoice.invoiceNumber}
Payment Date:     ${new Date().toLocaleDateString('en-GB')}
Payment Method:   ${paymentMethod}
Reference Code:   ${reference || 'N/A'}
-----------------------------------------

AMOUNT SUMMARY:
-----------------------------------------
Paid Amount:      KES ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Total Invoice:    KES ${Number(updatedInvoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Amount Paid So Far: KES ${newAmountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Remaining Balance: KES ${(Number(updatedInvoice.totalAmount) - newAmountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
-----------------------------------------

Please find the attached official receipt PDF for your records. Should you have any questions, please reply directly to this email.

Kind regards,
Jolu Group Invoicing & Finance Department
    `;

    const senderEmail = updatedInvoice.company.email || 'info@jolugroup.co.ke';
    const senderName = updatedInvoice.company.name;
    const fromHeader = `"${senderName}" <${senderEmail}>`;

    await sendEmail(
      clientEmail,
      subject,
      text,
      undefined,
      [{
        filename: `Receipt-${updatedInvoice.invoiceNumber.replace(/\//g, '-')}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }],
      fromHeader
    );
  }

  // Fetch and return the latest invoice state with the updated pdfUrl
  const finalInvoice = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: { customer: true, securityClient: true, company: true }
  });

  return finalInvoice || updatedInvoice;
}
