import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import multer from 'multer';

const upload = multer({
  dest: 'uploads/contracts/',
});

const router = Router();
router.use(authenticate, requireCompany);

router.get('/clients', requirePermission('security', 'read'), async (req: AuthRequest, res: Response) => {
  const clients = await prisma.securityClient.findMany({
    where: { companyId: req.companyId! },
    include: { 
      _count: { select: { contracts: true, sites: true } },
      contracts: true
    },
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

router.post(
  '/contracts',
  requirePermission('security', 'create'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {

    const count = await prisma.securityContract.count();

    const contractNumber =
      `SEC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const contract = await prisma.securityContract.create({
      data: {
        companyId: req.companyId!,
        contractNumber,

        clientId: req.body.clientId,
        customerId: req.body.customerId || null,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        monthlyFee: Number(req.body.monthlyFee),
        guardsCount: Number(req.body.guardsCount || 1),
        terms: req.body.terms,
        status: req.body.status || 'ACTIVE',
        fileUrl: req.file?.path,
      },
    });

    res.status(201).json({
      success: true,
      data: contract,
    });
  }
);

router.get('/guards', requirePermission('security', 'read'), async (req: AuthRequest, res: Response) => {
  const guards = await prisma.guard.findMany({
    where: { companyId: req.companyId!, isActive: true },
    include: { deployments: { where: { isActive: true }, include: { site: true } } },
  });
  res.json({ success: true, data: guards });
});

router.post(
  '/guards',
  requirePermission('security', 'create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const count = await prisma.guard.count({
        where: { companyId: req.companyId! },
      });

      const employeeNo = `JG-${String(count + 1).padStart(4, '0')}`;

      const guard = await prisma.guard.create({
        data: {
          employeeNo,
          ...req.body,
          companyId: req.companyId!,
        },
      });

      res.status(201).json({
        success: true,
        data: guard,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Failed to create guard',
      });
    }
  }
);

router.get('/sites', requirePermission('security', 'read'), async (req: AuthRequest, res: Response) => {
  const sites = await prisma.site.findMany({
    where: { companyId: req.companyId! },
    include: { client: true, deployments: { include: { guard: true } } },
  });
  res.json({ success: true, data: sites });
});

router.post('/sites', requirePermission('security', 'create'), async (req: AuthRequest, res: Response) => {
  const site = await prisma.site.create({
    data: { ...req.body, companyId: req.companyId! },
  });
  res.status(201).json({ success: true, data: site });
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
