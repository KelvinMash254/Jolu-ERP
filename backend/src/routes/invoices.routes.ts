import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import { getNextInvoiceNumber, generateInvoicePDF } from '../services/invoice.service';
import { sendEmail } from '../services/notification.service';

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
    (s: number, l: { total: number; taxRate?: number }) => s + l.total * ((l.taxRate || 16) / 100),
    0
  );

  const invoice = await prisma.invoice.create({
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
      lines: { create: lines },
    },
    include: { lines: true, customer: true },
  });

  res.status(201).json({ success: true, data: invoice });
});

router.get('/:id', requirePermission('invoices', 'read'), async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { lines: true, customer: true, securityClient: true, payments: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true, data: invoice });
});

router.post('/:id/pdf', requirePermission('invoices', 'read'), async (req: AuthRequest, res: Response) => {
  const pdfUrl = await generateInvoicePDF(req.params.id);
  res.json({ success: true, data: { pdfUrl } });
});

router.post('/:id/send', requirePermission('invoices', 'update'), async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { customer: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const pdfUrl = invoice.pdfUrl || (await generateInvoicePDF(invoice.id));

  if (invoice.customer?.email) {
    await sendEmail(
      invoice.customer.email,
      `${invoice.type.replace(/_/g, ' ')} - ${invoice.invoiceNumber}`,
      `Dear ${invoice.customer.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber} for KES ${Number(invoice.totalAmount).toLocaleString()}.\n\nThank you.\nJolu Group`
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
