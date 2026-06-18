import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import { getPagination, paginationMeta } from '../utils/pagination';
import { notifyLowStock } from '../services/notification.service';

const router = Router();
router.use(authenticate, requireCompany);

// Machinery Units
router.get('/machinery', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where: Record<string, unknown> = { companyId: req.companyId! };
  if (req.query.status) where.stockStatus = req.query.status;
  if (req.query.category) where.category = req.query.category;

  const [units, total] = await Promise.all([
    prisma.machineryUnit.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.machineryUnit.count({ where }),
  ]);

  res.json({ success: true, data: units, meta: paginationMeta(total, page, limit) });
});

router.post('/machinery', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  const unit = await prisma.machineryUnit.create({
    data: { ...req.body, companyId: req.companyId! },
  });

  await prisma.machineryLifecycleEvent.create({
    data: {
      machineryUnitId: unit.id,
      eventType: 'CREATED',
      description: 'Unit added to inventory',
      performedBy: req.user!.id,
    },
  });

  res.status(201).json({ success: true, data: unit });
});

router.patch('/machinery/:id/status', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  const { stockStatus } = req.body;
  const unit = await prisma.machineryUnit.update({
    where: { id: req.params.id },
    data: {
      stockStatus,
      soldAt: stockStatus === 'SOLD' ? new Date() : undefined,
      deliveredAt: stockStatus === 'DELIVERED' ? new Date() : undefined,
    },
  });

  await prisma.machineryLifecycleEvent.create({
    data: {
      machineryUnitId: unit.id,
      eventType: 'STATUS_CHANGE',
      description: `Status changed to ${stockStatus}`,
      performedBy: req.user!.id,
    },
  });

  res.json({ success: true, data: unit });
});

router.get('/machinery/:id/lifecycle', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const events = await prisma.machineryLifecycleEvent.findMany({
    where: { machineryUnitId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: events });
});

// Spare Parts
router.get('/spare-parts', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = { companyId: req.companyId! };

  const [parts, total] = await Promise.all([
    prisma.sparePart.findMany({ where, skip, take: limit, orderBy: { partName: 'asc' } }),
    prisma.sparePart.count({ where }),
  ]);

  res.json({ success: true, data: parts, meta: paginationMeta(total, page, limit) });
});

router.post('/spare-parts', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  const part = await prisma.sparePart.create({
    data: { ...req.body, companyId: req.companyId! },
  });
  res.status(201).json({ success: true, data: part });
});

router.post('/spare-parts/:id/stock-in', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  const { quantity, notes } = req.body;
  const part = await prisma.sparePart.update({
    where: { id: req.params.id },
    data: { quantity: { increment: quantity } },
  });

  await prisma.sparePartMovement.create({
    data: { sparePartId: part.id, type: 'STOCK_IN', quantity, notes, performedBy: req.user!.id },
  });

  res.json({ success: true, data: part });
});

router.post('/spare-parts/:id/stock-out', requirePermission('inventory', 'update'), async (req: AuthRequest, res: Response) => {
  const { quantity, notes, reference } = req.body;
  const part = await prisma.sparePart.findUnique({ where: { id: req.params.id } });
  if (!part || part.quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  const updated = await prisma.sparePart.update({
    where: { id: req.params.id },
    data: { quantity: { decrement: quantity } },
  });

  await prisma.sparePartMovement.create({
    data: { sparePartId: part.id, type: 'STOCK_OUT', quantity, notes, reference, performedBy: req.user!.id },
  });

  if (updated.quantity <= updated.reorderLevel) {
    await notifyLowStock(req.companyId!, updated.partName, updated.quantity);
  }

  res.json({ success: true, data: updated });
});

router.get('/spare-parts/low-stock', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const parts = await prisma.sparePart.findMany({
    where: { companyId: req.companyId! },
  });
  const lowStock = parts.filter((p) => p.quantity <= p.reorderLevel);
  res.json({ success: true, data: lowStock });
});

// Vehicles
router.get('/vehicles', requirePermission('inventory', 'read'), async (req: AuthRequest, res: Response) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: req.companyId! },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: vehicles });
});

router.post('/vehicles', requirePermission('inventory', 'create'), async (req: AuthRequest, res: Response) => {
  const vehicle = await prisma.vehicle.create({
    data: { ...req.body, companyId: req.companyId! },
  });
  res.status(201).json({ success: true, data: vehicle });
});

export default router;
