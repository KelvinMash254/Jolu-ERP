import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'contracts');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: (_, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF contracts are allowed'));
    }

    cb(null, true);
  },
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

router.get(
  '/contracts',
  requirePermission('security', 'read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const contracts = await prisma.securityContract.findMany({
        where: {
          companyId: req.companyId!,
        },
        include: {
          client: true,
          deployments: {
            include: {
              guard: true,
              site: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: contracts,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch contracts',
      });
    }
  }
);


router.get(
  '/contracts/:id/download',
  requirePermission('security', 'read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const contract = await prisma.securityContract.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      if (!contract || !contract.fileUrl) {
        return res.status(404).json({
          success: false,
          message: 'Contract file not found',
        });
      }

      const filePath = path.join(process.cwd(), contract.fileUrl);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
        });
      }

      return res.download(filePath, `${contract.contractNumber}.pdf`);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: 'Download failed',
      });
    }
  }
);

router.post(
  '/contracts',
  requirePermission('security', 'create'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const count = await prisma.securityContract.count({
        where: {
          companyId: req.companyId!,
        },
      });

      const contractNumber = `SEC-${new Date().getFullYear()}-${String(
        count + 1
      ).padStart(5, '0')}`;

      const contract = await prisma.securityContract.create({
        data: {
          companyId: req.companyId!,
          contractNumber,

          clientId: req.body.clientId || null,
          customerId: req.body.customerId || null,

          startDate: new Date(req.body.startDate),
          endDate: req.body.endDate
            ? new Date(req.body.endDate)
            : null,

          monthlyFee: Number(req.body.monthlyFee),
          guardsCount: Number(req.body.guardsCount ?? 1),
          terms: req.body.terms || null,
          status: req.body.status || 'ACTIVE',

          fileUrl: req.file
            ? `uploads/contracts/${req.file.filename}`
            : null,
        },
      });

      res.status(201).json({
        success: true,
        data: contract,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: 'Failed to create contract',
      });
    }
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
