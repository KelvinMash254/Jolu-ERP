import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/clients', requirePermission('security', 'read'), async (req: AuthRequest, res: Response) => {
  const clients = await prisma.securityClient.findMany({
    where: { companyId: req.companyId! },
    include: { _count: { select: { contracts: true, sites: true } } },
  });
  res.json({ success: true, data: clients });
});

router.post('/clients', requirePermission('security', 'create'), async (req: AuthRequest, res: Response) => {
  const client = await prisma.securityClient.create({
    data: { ...req.body, companyId: req.companyId! },
  });
  res.status(201).json({ success: true, data: client });
});

router.get('/contracts', requirePermission('security', 'read'), async (req: AuthRequest, res: Response) => {
  const contracts = await prisma.securityContract.findMany({
    where: { companyId: req.companyId! },
    include: { client: true, deployments: { include: { guard: true, site: true } } },
  });
  res.json({ success: true, data: contracts });
});

router.post('/contracts', requirePermission('security', 'create'), async (req: AuthRequest, res: Response) => {
  const count = await prisma.securityContract.count();
  const contractNumber = `SEC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const { clientId, monthlyFee, startDate, guardsCount, terms } = req.body;
  const contract = await prisma.securityContract.create({
    data: {
      clientId,
      monthlyFee,
      startDate: new Date(startDate),
      guardsCount: guardsCount || 1,
      terms,
      companyId: req.companyId!,
      contractNumber
    },
  });
  res.status(201).json({ success: true, data: contract });
});

router.get('/guards', requirePermission('security', 'read'), async (req: AuthRequest, res: Response) => {
  const guards = await prisma.guard.findMany({
    where: { companyId: req.companyId!, isActive: true },
    include: { deployments: { where: { isActive: true }, include: { site: true } } },
  });
  res.json({ success: true, data: guards });
});

router.post('/guards', requirePermission('security', 'create'), async (req: AuthRequest, res: Response) => {
  const guard = await prisma.guard.create({
    data: { ...req.body, companyId: req.companyId! },
  });
  res.status(201).json({ success: true, data: guard });
});

router.get('/sites', requirePermission('security', 'read'), async (req: AuthRequest, res: Response) => {
  const sites = await prisma.site.findMany({
    where: { companyId: req.companyId! },
    include: { client: true, deployments: { include: { guard: true } } },
  });
  res.json({ success: true, data: sites });
});

router.post('/deployments', requirePermission('security', 'create'), async (req: AuthRequest, res: Response) => {
  const deployment = await prisma.guardDeployment.create({ data: req.body });
  res.status(201).json({ success: true, data: deployment });
});

router.post('/attendance', requirePermission('security', 'create'), async (req: AuthRequest, res: Response) => {
  const attendance = await prisma.guardAttendance.create({ data: req.body });
  res.status(201).json({ success: true, data: attendance });
});

export default router;
