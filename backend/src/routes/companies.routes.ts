import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('companies', 'read'), async (req: AuthRequest, res: Response) => {
  const isGroupAdmin = ['SUPER_ADMIN', 'GROUP_ADMIN'].includes(req.user!.role);

  const companies = isGroupAdmin
    ? await prisma.company.findMany({ include: { branches: true }, where: { isActive: true } })
    : await prisma.company.findMany({
        where: { id: { in: req.user!.companies.map((c) => c.id) }, isActive: true },
        include: { branches: true },
      });

  res.json({ success: true, data: companies });
});

router.get('/consolidated/dashboard', requirePermission('companies', 'read'), async (req: AuthRequest, res: Response) => {
  const companyIds =
    req.user!.role === 'SUPER_ADMIN' || req.user!.role === 'GROUP_ADMIN'
      ? (await prisma.company.findMany({ select: { id: true } })).map((c) => c.id)
      : req.user!.companies.map((c) => c.id);

  const [revenue, customers, leads, invoices, tickets, lowStock] = await Promise.all([
    prisma.invoice.aggregate({
      where: { companyId: { in: companyIds }, status: 'PAID' },
      _sum: { totalAmount: true },
    }),
    prisma.customer.count({ where: { companyId: { in: companyIds } } }),
    prisma.lead.count({ where: { companyId: { in: companyIds }, pipelineStage: { not: 'LOST' } } }),
    prisma.invoice.count({ where: { companyId: { in: companyIds }, status: { in: ['SENT', 'OVERDUE'] } } }),
    prisma.serviceTicket.count({ where: { companyId: { in: companyIds }, status: { not: 'CLOSED' } } }),
    prisma.sparePart.findMany({ where: { companyId: { in: companyIds } } }).then((parts) =>
      parts.filter((p) => p.quantity <= p.reorderLevel).length
    ),
  ]);

  const companyStats = await Promise.all(
    companyIds.map(async (companyId) => {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      const sales = await prisma.invoice.aggregate({
        where: { companyId, status: 'PAID' },
        _sum: { totalAmount: true },
      });
      return {
        companyId,
        companyName: company?.name,
        revenue: Number(sales._sum.totalAmount || 0),
        customers: await prisma.customer.count({ where: { companyId } }),
        openLeads: await prisma.lead.count({ where: { companyId, pipelineStage: { notIn: ['WON', 'LOST'] } } }),
      };
    })
  );

  res.json({
    success: true,
    data: {
      totalRevenue: Number(revenue._sum.totalAmount || 0),
      totalCustomers: customers,
      activeLeads: leads,
      outstandingInvoices: invoices,
      openTickets: tickets,
      lowStockAlerts: lowStock,
      companyBreakdown: companyStats,
    },
  });
});

export default router;
