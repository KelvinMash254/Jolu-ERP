import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requirePermission } from '../middleware/auth';
import { getPagination, paginationMeta } from '../utils/pagination';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = { userId: req.user!.id, ...(req.query.unread === 'true' ? { isRead: false } : {}) };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
  ]);

  res.json({ success: true, data: notifications, meta: paginationMeta(total, page, limit) });
});

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  await prisma.notification.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ success: true });
});

router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});

router.get('/audit', requirePermission('audit', 'read'), async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where: Record<string, unknown> = {};
  if (req.query.module) where.module = req.query.module;
  if (req.query.userId) where.userId = req.query.userId;
  if (req.companyId) where.companyId = req.companyId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ success: true, data: logs, meta: paginationMeta(total, page, limit) });
});

export default router;
