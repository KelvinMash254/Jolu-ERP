import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/', requirePermission('financing', 'read'), async (req: AuthRequest, res: Response) => {
  const where: Record<string, unknown> = { companyId: req.companyId! };
  if (req.query.stage) where.stage = req.query.stage;

  const applications = await prisma.bankFinancingApplication.findMany({
    where,
    include: {
      customer: true,
      allocatedUnit: { select: { id: true, productName: true, serialNumber: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  res.json({ success: true, data: applications });
});

router.post('/', requirePermission('financing', 'create'), async (req: AuthRequest, res: Response) => {
  const { customerId, bankName, loanAmount, depositAmount } = req.body;
  const application = await prisma.bankFinancingApplication.create({
    data: { 
      customerId, 
      bankName, 
      loanAmount, 
      depositAmount: depositAmount || 0,
      companyId: req.companyId! 
    },
  });
  res.status(201).json({ success: true, data: application });
});

router.patch('/:id/stage', requirePermission('financing', 'update'), async (req: AuthRequest, res: Response) => {
  const { stage, rejectionReason, allocatedUnitId } = req.body;
  const data: Record<string, unknown> = { stage };

  if (stage === 'APPROVED') data.approvalDate = new Date();
  if (stage === 'REJECTED') data.rejectionReason = rejectionReason;
  if (stage === 'UNIT_ALLOCATED' && allocatedUnitId) {
    data.allocatedUnitId = allocatedUnitId;
    await prisma.machineryUnit.update({
      where: { id: allocatedUnitId },
      data: { stockStatus: 'RESERVED', reservedForId: req.params.id },
    });
  }

  const application = await prisma.bankFinancingApplication.update({
    where: { id: req.params.id },
    data,
    include: { customer: true, allocatedUnit: true },
  });

  res.json({ success: true, data: application });
});

router.get('/dashboard', requirePermission('financing', 'read'), async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId!;
  const stages = ['DOCUMENTS_SUBMITTED', 'BANK_RECEIVED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DEPOSIT_RECEIVED', 'UNIT_ALLOCATED', 'DELIVERED'];

  const byStage = await Promise.all(
    stages.map(async (stage) => ({
      stage,
      count: await prisma.bankFinancingApplication.count({ where: { companyId, stage: stage as never } }),
    }))
  );

  const totals = await prisma.bankFinancingApplication.aggregate({
    where: { companyId },
    _sum: { loanAmount: true, depositAmount: true },
    _count: true,
  });

  const approved = await prisma.bankFinancingApplication.count({ where: { companyId, stage: 'APPROVED' } });
  const rejected = await prisma.bankFinancingApplication.count({ where: { companyId, stage: 'REJECTED' } });
  const approvalRate = approved + rejected > 0 ? ((approved / (approved + rejected)) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      byStage,
      totalApplications: totals._count,
      totalLoanAmount: Number(totals._sum.loanAmount || 0),
      totalDeposits: Number(totals._sum.depositAmount || 0),
      approvalRate,
    },
  });
});

export default router;
