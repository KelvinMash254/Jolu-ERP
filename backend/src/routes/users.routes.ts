import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requirePermission } from '../middleware/auth';
import { hashPassword } from '../services/auth.service';
import { getPagination, paginationMeta } from '../utils/pagination';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users', 'read'), async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = req.query.search
    ? {
        OR: [
          { firstName: { contains: String(req.query.search), mode: 'insensitive' as const } },
          { lastName: { contains: String(req.query.search), mode: 'insensitive' as const } },
          { email: { contains: String(req.query.search), mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: { role: true, companies: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users.map(({ passwordHash, twoFactorSecret, ...u }) => u),
    meta: paginationMeta(total, page, limit),
  });
});

router.post('/', requirePermission('users', 'create'), async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName, phone, roleId, companyIds, branchIds } = req.body;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone,
      roleId,
      companies: companyIds?.length
        ? { create: companyIds.map((id: string, i: number) => ({ companyId: id, isPrimary: i === 0 })) }
        : undefined,
      branches: branchIds?.length
        ? { create: branchIds.map((id: string) => ({ branchId: id })) }
        : undefined,
    },
    include: { role: true, companies: { include: { company: true } } },
  });

  const { passwordHash, twoFactorSecret, ...safeUser } = user;
  res.status(201).json({ success: true, data: safeUser });
});

router.get('/roles', requirePermission('users', 'read'), async (_req, res) => {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
  });
  res.json({ success: true, data: roles });
});

export default router;
