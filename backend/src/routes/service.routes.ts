import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/', requirePermission('aftersales', 'read'), async (req: AuthRequest, res: Response) => {
  const where: Record<string, unknown> = { companyId: req.companyId! };
  if (req.user!.role === 'TECHNICIAN') where.technicianId = req.user!.id;
  if (req.query.status) where.status = req.query.status;

  const tickets = await prisma.serviceTicket.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      machineryUnit: { select: { id: true, productName: true, serialNumber: true } },
      technician: { select: { id: true, firstName: true, lastName: true } },
      sparePartsUsed: { include: { sparePart: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: tickets });
});

router.post('/', requirePermission('aftersales', 'create'), async (req: AuthRequest, res: Response) => {
  const count = await prisma.serviceTicket.count({ where: { companyId: req.companyId! } });
  const ticketNumber = `SRV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const { customerId, machineryUnitId, vehicleId, problem } = req.body;
  const ticket = await prisma.serviceTicket.create({
    data: {
      customerId,
      machineryUnitId,
      vehicleId,
      problem,
      companyId: req.companyId!,
      ticketNumber
    },
  });

  res.status(201).json({ success: true, data: ticket });
});

router.patch('/:id/assign', requirePermission('aftersales', 'update'), async (req: AuthRequest, res: Response) => {
  const { technicianId, scheduledAt } = req.body;
  const ticket = await prisma.serviceTicket.update({
    where: { id: req.params.id },
    data: { technicianId, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, status: 'ASSIGNED' },
  });
  res.json({ success: true, data: ticket });
});

router.patch('/:id/status', requirePermission('aftersales', 'update'), async (req: AuthRequest, res: Response) => {
  const { status, technicianNotes, labourHours } = req.body;
  const ticket = await prisma.serviceTicket.update({
    where: { id: req.params.id },
    data: {
      status,
      technicianNotes,
      labourHours,
      completedAt: status === 'COMPLETED' || status === 'CLOSED' ? new Date() : undefined,
    },
  });
  res.json({ success: true, data: ticket });
});

router.post('/:id/parts', requirePermission('aftersales', 'update'), async (req: AuthRequest, res: Response) => {
  const { sparePartId, quantity } = req.body;
  const part = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
  if (!part || part.quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient spare parts stock' });
  }

  await prisma.sparePart.update({
    where: { id: sparePartId },
    data: { quantity: { decrement: quantity } },
  });

  await prisma.sparePartMovement.create({
    data: { sparePartId, type: 'SERVICE_DEDUCTION', quantity, reference: req.params.id, performedBy: req.user!.id },
  });

  const ticketPart = await prisma.serviceTicketPart.create({
    data: { ticketId: req.params.id, sparePartId, quantity, unitCost: part.costPrice },
  });

  res.status(201).json({ success: true, data: ticketPart });
});

router.get('/reports/technician-performance', requirePermission('aftersales', 'read'), async (req: AuthRequest, res: Response) => {
  const stats = await prisma.serviceTicket.groupBy({
    by: ['technicianId', 'status'],
    where: { companyId: req.companyId! },
    _count: true,
    _sum: { labourHours: true },
  });

  const performance = await Promise.all(
    stats.map(async (s) => {
      const tech = s.technicianId
        ? await prisma.user.findUnique({ where: { id: s.technicianId }, select: { firstName: true, lastName: true } })
        : null;
      return {
        technician: tech ? `${tech.firstName} ${tech.lastName}` : 'Unassigned',
        status: s.status,
        count: s._count,
        totalHours: Number(s._sum.labourHours || 0),
      };
    })
  );

  res.json({ success: true, data: performance });
});

export default router;
