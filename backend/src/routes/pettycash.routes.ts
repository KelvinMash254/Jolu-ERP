import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/accounts', requirePermission('pettycash', 'read'), async (req: AuthRequest, res: Response) => {
  const accounts = await prisma.pettyCashAccount.findMany({
    where: { companyId: req.companyId! },
    include: { branch: true, requests: { take: 5, orderBy: { createdAt: 'desc' } } },
  });
  res.json({ success: true, data: accounts });
});

router.post('/accounts', requirePermission('pettycash', 'create'), async (req: AuthRequest, res: Response) => {
  const account = await prisma.pettyCashAccount.create({
    data: { ...req.body, companyId: req.companyId! },
  });
  res.status(201).json({ success: true, data: account });
});

router.post('/requests', requirePermission('pettycash', 'create'), async (req: AuthRequest, res: Response) => {
  const request = await prisma.pettyCashRequest.create({
    data: { ...req.body, requestedBy: req.user!.id },
  });
  res.status(201).json({ success: true, data: request });
});

router.patch('/requests/:id/approve', requirePermission('pettycash', 'update'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const request = await prisma.pettyCashRequest.update({
    where: { id: req.params.id },
    data: {
      status,
      approvedBy: req.user!.id,
      approvedAt: new Date(),
    },
  });

  if (status === 'APPROVED') {
    await prisma.pettyCashAccount.update({
      where: { id: request.accountId },
      data: { balance: { increment: request.amount } },
    });
  }

  res.json({ success: true, data: request });
});

router.post('/expenses', requirePermission('pettycash', 'create'), async (req: AuthRequest, res: Response) => {
  const { accountId, amount, description, category, receiptUrl } = req.body;
  const account = await prisma.pettyCashAccount.findUnique({ where: { id: accountId } });

  if (!account || Number(account.balance) < amount) {
    return res.status(400).json({ error: 'Insufficient petty cash balance' });
  }

  const expense = await prisma.pettyCashExpense.create({
    data: { accountId, amount, description, category, receiptUrl, recordedBy: req.user!.id },
  });

  await prisma.pettyCashAccount.update({
    where: { id: accountId },
    data: { balance: { decrement: amount } },
  });

  res.status(201).json({ success: true, data: expense });
});

export default router;
