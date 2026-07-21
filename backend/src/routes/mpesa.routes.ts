import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import { processMpesaCallback, initiateSTKPush } from '../services/mpesa.service';
import prisma from '../config/database';

const router = Router();

router.post('/callback', async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string || req.query.companyId as string;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const result = await processMpesaCallback(req.body, companyId);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Processing failed' });
  }
});

router.use(authenticate, requireCompany);

router.post('/stk-push', requirePermission('payments', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber, amount, invoiceId, accountReference } = req.body;
    const result = await initiateSTKPush(req.companyId!, phoneNumber, amount, invoiceId, accountReference);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("STK PUSH ERROR:", error);
    res.status(500).json({ success: false, error: error.message || 'STK Push failed' });
  }
});

router.get('/transactions', requirePermission('payments', 'read'), async (req: AuthRequest, res: Response) => {
  const transactions = await prisma.mpesaTransaction.findMany({
    where: { companyId: req.companyId! },
    include: { customer: true, invoice: true },
    orderBy: { processedAt: 'desc' },
  });
  res.json({ success: true, data: transactions });
});

export default router;
