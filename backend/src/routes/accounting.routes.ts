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

router.get('/payables', requirePermission('accounting', 'read'), async (_req, res) => {
  res.json({ success: true, data: [], message: 'Payables module ready for vendor integration' });
});

export default router;
