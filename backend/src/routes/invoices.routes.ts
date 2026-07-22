import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import { getNextInvoiceNumber, generateInvoicePDF } from '../services/invoice.service';
import { sendEmail } from '../services/notification.service';
import { createJournalEntry } from '../services/accounting.service';
import path from "path";
import { config } from '../config';
const router = Router();
router.use(authenticate, requireCompany);

router.get('/', requirePermission('invoices', 'read'), async (req: AuthRequest, res: Response) => {
  const where: Record<string, unknown> = { companyId: req.companyId! };
  if (req.query.status) where.status = req.query.status;
  if (req.query.type) where.type = req.query.type;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      securityClient: { select: { id: true, name: true } },
      lines: true,
    },
    orderBy: { issueDate: 'desc' },
  });

  res.json({ success: true, data: invoices });
});

router.post('/', requirePermission('invoices', 'create'), async (req: AuthRequest, res: Response) => {
  const { type, customerId, securityClientId, contractId, lines, dueDate, notes } = req.body;

  const invoiceNumber = await getNextInvoiceNumber(req.companyId!, type);
  const subtotal = lines.reduce((s: number, l: { total: number }) => s + l.total, 0);
  const taxAmount = lines.reduce(
    (s: number, l: { total: number; taxRate?: number }) => s + l.total * ((l.taxRate || 0) / 100),
    0
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        companyId: req.companyId!,
        invoiceNumber,
        type,
        customerId,
        securityClientId,
        contractId,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        lines: { 
          create: lines.map((l: any) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate || 0,
            total: Number(l.quantity) * Number(l.unitPrice)
          })) 
        },
      },
      include: { lines: true, customer: true },
    });

    const company = await tx.company.findUnique({ where: { id: req.companyId! } });
    if (company && company.code === 'MACHINERIES' && type === 'INVOICE') {
      for (const line of lines) {
        const match = line.description.match(/S\/N:\s*([^\s\)]+)/i);
        if (match) {
          const serialNumber = match[1].trim();
          const unit = await tx.machineryUnit.findFirst({
            where: { companyId: company.id, serialNumber, stockStatus: 'IN_STOCK' }
          });
          if (unit) {
            await tx.machineryUnit.update({
              where: { id: unit.id },
              data: {
                stockStatus: 'SOLD',
                soldAt: new Date(),
              }
            });
            await tx.machineryLifecycleEvent.create({
              data: {
                machineryUnitId: unit.id,
                eventType: 'SOLD',
                description: `Unit sold via Invoice No: ${invoiceNumber}`,
              }
            });
          }
        }
      }
    }

    if (type === 'INVOICE') {
      const journalLines = [
        { accountCode: '1100', debit: Number(inv.totalAmount), description: `Invoice ${inv.invoiceNumber}` },
        { accountCode: '4000', credit: Number(inv.subtotal), description: `Sales from ${inv.invoiceNumber}` },
      ];

      if (Number(inv.taxAmount) > 0) {
        journalLines.push({ 
          accountCode: '2100', 
          credit: Number(inv.taxAmount), 
          description: `VAT from ${inv.invoiceNumber}` 
        });
      }

      const entry = await createJournalEntry(
        req.companyId!,
        `Revenue Recognition - ${inv.invoiceNumber}`,
        journalLines,
        { 
          reference: inv.invoiceNumber, 
          sourceType: 'INVOICE', 
          sourceId: inv.id, 
          createdBy: req.user?.id,
          tx
        }
      );

      return await tx.invoice.update({
        where: { id: inv.id },
        data: { journalEntryId: entry.id },
        include: { lines: true, customer: true }
      });
    }

    return inv;
  });

  res.status(201).json({ success: true, data: invoice });
});

router.get('/:id', requirePermission('invoices', 'read'), async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { lines: true, customer: true, securityClient: true, payments: true, company: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true, data: invoice });
});

router.post('/:id/pdf', requirePermission('invoices', 'read'), async (req: AuthRequest, res: Response) => {
  const { primaryColor } = req.body;
  const pdfUrl = await generateInvoicePDF(req.params.id, { primaryColor });
  res.json({ success: true, data: { pdfUrl } });
});

router.post('/:id/send', requirePermission('invoices', 'update'), async (req: AuthRequest, res: Response) => {
  const { primaryColor } = req.body;
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { customer: true, securityClient: true, company: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const pdfUrl = await generateInvoicePDF(invoice.id, { primaryColor });
  const pdfPath = path.join(process.cwd(), pdfUrl.startsWith('/') ? pdfUrl.substring(1) : pdfUrl);

  const clientName = invoice.customer?.name || invoice.securityClient?.name || 'Valued Client';
  const clientEmail = invoice.customer?.email || invoice.securityClient?.email;
  const invoiceTypeStr = invoice.type.replace(/_/g, ' ');
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A';

  if (clientEmail) {
    let subject = '';
    let bodyIntro = '';
    let bodyClosing = '';

    const companyCode = invoice.company.code;
    const isQuotation = invoice.type === 'QUOTATION';

    if (companyCode === 'MACHINERIES') {
      if (isQuotation) {
        subject = `Quotation for Machinery Purchase – Quotation No. ${invoice.invoiceNumber}`;
        bodyIntro = `Please find attached Quotation No. ${invoice.invoiceNumber} for the tractor/agricultural machinery you requested. This quotation is provided for your review prior to any services or supply of machinery.`;
      } else {
        subject = `Invoice for Machinery Purchase – Invoice No. ${invoice.invoiceNumber}`;
        bodyIntro = `Please find attached Invoice No. ${invoice.invoiceNumber} for your recent tractor/agricultural machinery purchase from Jolu Machineries.`;
      }
      bodyClosing = `Thank you for choosing Jolu Machineries. We look forward to powering your agricultural productivity.`;
    } else if (companyCode === 'SECURITY') {
      if (isQuotation) {
        subject = `Quotation for Security Services – Quotation No. ${invoice.invoiceNumber}`;
        bodyIntro = `Please find attached Quotation No. ${invoice.invoiceNumber} for security guard services. This quotation is provided before services are rendered for your initial evaluation.`;
      } else {
        subject = `Invoice for Security Services Rendered – Invoice No. ${invoice.invoiceNumber}`;
        bodyIntro = `Please find attached Invoice No. ${invoice.invoiceNumber} for security services rendered at your facility.`;
      }
      bodyClosing = `Thank you for trusting Jolu Group Security Ltd to secure your assets.`;
    } else if (companyCode === 'AUTOMOBILE') {
      if (isQuotation) {
        subject = `Quotation for Vehicle Hire – Quotation No. ${invoice.invoiceNumber}`;
        bodyIntro = `Please find attached Quotation No. ${invoice.invoiceNumber} for the vehicle rental/hire service. This quotation details expected charges prior to booking finalization.`;
      } else {
        subject = `Invoice for Vehicle Hire Services – Invoice No. ${invoice.invoiceNumber}`;
        bodyIntro = `Please find attached Invoice No. ${invoice.invoiceNumber} for the automobile hire/rental services provided.`;
      }
      bodyClosing = `Thank you for riding with Jolu Automobile Limited. We wish you a safe and pleasant journey.`;
    } else {
      subject = `${invoiceTypeStr} – No. ${invoice.invoiceNumber}`;
      bodyIntro = `Please find attached ${invoiceTypeStr} No. ${invoice.invoiceNumber} for the services/products agreed.`;
      bodyClosing = `Thank you for your continued trust and business.`;
    }

    const payUrl = `${config.frontendUrl}/pay/${invoice.id}`;

    const text = `
Dear ${clientName},

I hope you are doing well.

${bodyIntro}

${invoiceTypeStr} Summary:

* ${invoiceTypeStr} Number: ${invoice.invoiceNumber}
* ${invoiceTypeStr} Date: ${new Date(invoice.issueDate).toLocaleDateString('en-GB')}
* Amount Due: KES ${Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
* Due Date: ${dueDate}

💳 Click here to pay this invoice online via M-Pesa: ${payUrl}

Kindly review the attached document. Should you have any questions or require any clarification, please do not hesitate to contact us.

${bodyClosing}

Kind regards,

${req.user?.firstName} ${req.user?.lastName || ''}

${invoice.company.legalName}
📞 ${invoice.company.phone || '+254 769 281 518'}
📧 ${invoice.company.email || 'info@jolugroup.co.ke'}
    `;

    // Dynamic Sender Address
    const senderEmail = invoice.company.email || 'info@jolugroup.co.ke';
    const senderName = invoice.company.name;
    const fromHeader = `"${senderName}" <${senderEmail}>`;

    await sendEmail(
      clientEmail,
      subject,
      text,
      undefined, // Let html be auto-generated from text
      [{
        filename: `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }],
      fromHeader
    );
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'SENT', pdfUrl },
  });

  res.json({ success: true, message: 'Invoice sent' });
});

router.post('/:id/payment', requirePermission('invoices', 'update'), async (req: AuthRequest, res: Response) => {
  const { amount, paymentMethod, reference } = req.body;
  const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.companyId! } });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const newAmountPaid = Number(invoice.amountPaid) + amount;
  const status = newAmountPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

  await prisma.invoicePayment.create({
    data: { invoiceId: invoice.id, amount, paymentMethod, reference },
  });

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid: newAmountPaid, status },
  });

  res.json({ success: true, data: updated });
});

export default router;
