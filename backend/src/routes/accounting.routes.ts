import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import {
  createJournalEntry,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  initializeChartOfAccounts,
} from '../services/accounting.service';
import {
  generateTrialBalancePDF,
  generateIncomeStatementPDF,
  generateBalanceSheetPDF,
  generateReceivablesPDF,
  generateClientStatementPDF,
} from '../services/report.service';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/chart-of-accounts', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId: req.companyId! },
    orderBy: { code: 'asc' },
  });
  res.json({ success: true, data: accounts });
});

router.post('/chart-of-accounts/init', requirePermission('accounting', 'create'), async (req: AuthRequest, res: Response) => {
  await initializeChartOfAccounts(req.companyId!);
  res.json({ success: true, message: 'Chart of accounts initialized' });
});

router.get('/journals', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const entries = await prisma.journalEntry.findMany({
    where: { companyId: req.companyId! },
    include: { lines: { include: { account: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: entries });
});

router.post('/journals', requirePermission('accounting', 'create'), async (req: AuthRequest, res: Response) => {
  const { description, lines, reference } = req.body;
  const entry = await createJournalEntry(req.companyId!, description, lines, {
    reference,
    createdBy: req.user!.id,
  });
  res.status(201).json({ success: true, data: entry });
});

router.get('/reports/trial-balance', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const data = await getTrialBalance(req.companyId!);
  res.json({ success: true, data });
});

router.get('/reports/income-statement', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
  const data = await getIncomeStatement(req.companyId!, startDate, endDate);
  res.json({ success: true, data });
});

router.get('/reports/balance-sheet', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const data = await getBalanceSheet(req.companyId!);
  res.json({ success: true, data });
});

router.get('/receivables', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: req.companyId!,
      status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    include: { customer: true },
    orderBy: { dueDate: 'asc' },
  });
  res.json({ success: true, data: invoices });
});

// PDF download routes for Reports
router.get('/reports/trial-balance/pdf', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const data = await getTrialBalance(req.companyId!);
    const pdfUrl = await generateTrialBalancePDF(req.companyId!, data);
    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/reports/income-statement/pdf', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
    const data = await getIncomeStatement(req.companyId!, startDate, endDate);
    const pdfUrl = await generateIncomeStatementPDF(req.companyId!, data);
    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/reports/balance-sheet/pdf', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const data = await getBalanceSheet(req.companyId!);
    const pdfUrl = await generateBalanceSheetPDF(req.companyId!, data);
    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/receivables/pdf', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: req.companyId!,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      include: { customer: true, securityClient: true },
      orderBy: { dueDate: 'asc' },
    });
    const pdfUrl = await generateReceivablesPDF(req.companyId!, invoices);
    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/payables', requirePermission('accounting', 'read'), async (_req, res) => {
  res.json({ success: true, data: [], message: 'Payables module ready for vendor integration' });
});

// Get list of all clients (Customers + Security Clients) for selection dropdown
router.get('/statements/clients', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId!;
  
  const customers = await prisma.customer.findMany({
    where: { companyId },
    select: { id: true, name: true, phone: true, email: true },
  });

  const securityClients = await prisma.securityClient.findMany({
    where: { companyId },
    select: { id: true, name: true, phone: true, email: true },
  });

  const clients = [
    ...customers.map(c => ({ id: c.id, name: `${c.name} (CRM Customer)`, type: 'customer', email: c.email })),
    ...securityClients.map(sc => ({ id: sc.id, name: `${sc.name} (Security Client)`, type: 'security', email: sc.email }))
  ];

  res.json({ success: true, data: clients });
});

// Get statement for a specific client
router.get('/statements/:clientId', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  const { clientId } = req.params;
  const companyId = req.companyId!;

  // 1. Get client details (check customer first, then security client)
  let clientInfo: any = null;
  let clientType = 'customer';

  const customer = await prisma.customer.findFirst({
    where: { id: clientId, companyId }
  });

  if (customer) {
    clientInfo = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      kraPin: customer.kraPin,
      address: customer.physicalAddress
    };
  } else {
    const sClient = await prisma.securityClient.findFirst({
      where: { id: clientId, companyId }
    });

    if (sClient) {
      clientInfo = {
        id: sClient.id,
        name: sClient.name,
        phone: sClient.phone,
        email: sClient.email,
        kraPin: sClient.kraPin,
        address: sClient.address
      };
      clientType = 'security';
    }
  }

  if (!clientInfo) {
    return res.status(404).json({ success: false, error: 'Client not found' });
  }

  // 2. Fetch all invoices for this client (excluding quotations)
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId,
      type: { not: 'QUOTATION' },
      OR: [
        { customerId: clientId },
        { securityClientId: clientId }
      ]
    },
    include: {
      payments: true
    },
    orderBy: { issueDate: 'asc' }
  });

  // 3. Compile transaction history (Chronological list of Invoices [Debit] and Payments [Credit])
  interface LedgerEntry {
    id: string;
    date: Date;
    type: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
  }

  const ledger: LedgerEntry[] = [];

  for (const inv of invoices) {
    // Add Invoice Debit
    ledger.push({
      id: inv.id,
      date: new Date(inv.issueDate),
      type: 'INVOICE',
      reference: inv.invoiceNumber,
      description: inv.notes || `Invoice ${inv.invoiceNumber}`,
      debit: Number(inv.totalAmount),
      credit: 0
    });

    // Add Payments Credits
    for (const payment of inv.payments) {
      ledger.push({
        id: payment.id,
        date: new Date(payment.paidAt),
        type: 'PAYMENT',
        reference: payment.reference || 'N/A',
        description: `Payment received via ${payment.paymentMethod}`,
        debit: 0,
        credit: Number(payment.amount)
      });
    }
  }

  // Sort chronological
  ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 4. Calculate running balances
  let runningBalance = 0;
  const ledgerWithBalances = ledger.map(entry => {
    runningBalance += (entry.debit - entry.credit);
    return {
      ...entry,
      balance: runningBalance
    };
  });

  const totalInvoiced = ledger.reduce((sum, e) => sum + e.debit, 0);
  const totalPaid = ledger.reduce((sum, e) => sum + e.credit, 0);
  const outstandingBalance = totalInvoiced - totalPaid;

  res.json({
    success: true,
    data: {
      client: clientInfo,
      clientType,
      summary: {
        totalInvoiced,
        totalPaid,
        outstandingBalance
      },
      ledger: ledgerWithBalances
    }
  });
});

// PDF download route for Client Statement of Account
router.get('/statements/:clientId/pdf', requirePermission('accounting', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const companyId = req.companyId!;

    let clientInfo: any = null;
    let clientType = 'customer';

    const customer = await prisma.customer.findFirst({
      where: { id: clientId, companyId }
    });

    if (customer) {
      clientInfo = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        kraPin: customer.kraPin,
        address: customer.physicalAddress
      };
    } else {
      const sClient = await prisma.securityClient.findFirst({
        where: { id: clientId, companyId }
      });

      if (sClient) {
        clientInfo = {
          id: sClient.id,
          name: sClient.name,
          phone: sClient.phone,
          email: sClient.email,
          kraPin: sClient.kraPin,
          address: sClient.address
        };
        clientType = 'security';
      }
    }

    if (!clientInfo) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        type: { not: 'QUOTATION' },
        OR: [
          { customerId: clientId },
          { securityClientId: clientId }
        ]
      },
      include: {
        payments: true
      },
      orderBy: { issueDate: 'asc' }
    });

    interface LedgerEntry {
      id: string;
      date: Date;
      type: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
    }

    const ledger: LedgerEntry[] = [];

    for (const inv of invoices) {
      ledger.push({
        id: inv.id,
        date: new Date(inv.issueDate),
        type: 'INVOICE',
        reference: inv.invoiceNumber,
        description: inv.notes || `Invoice ${inv.invoiceNumber}`,
        debit: Number(inv.totalAmount),
        credit: 0
      });

      for (const payment of inv.payments) {
        ledger.push({
          id: payment.id,
          date: new Date(payment.paidAt),
          type: 'PAYMENT',
          reference: payment.reference || 'N/A',
          description: `Payment received via ${payment.paymentMethod}`,
          debit: 0,
          credit: Number(payment.amount)
        });
      }
    }

    ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;
    const ledgerWithBalances = ledger.map(entry => {
      runningBalance += (entry.debit - entry.credit);
      return {
        ...entry,
        balance: runningBalance
      };
    });

    const totalInvoiced = ledger.reduce((sum, e) => sum + e.debit, 0);
    const totalPaid = ledger.reduce((sum, e) => sum + e.credit, 0);
    const outstandingBalance = totalInvoiced - totalPaid;

    const pdfUrl = await generateClientStatementPDF(companyId, {
      client: clientInfo,
      clientType,
      summary: {
        totalInvoiced,
        totalPaid,
        outstandingBalance
      },
      ledger: ledgerWithBalances
    });

    res.json({ success: true, pdfUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
