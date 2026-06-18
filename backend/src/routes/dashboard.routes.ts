import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/', requirePermission('dashboard', 'read'), async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId!;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    monthlyRevenue,
    outstandingInvoices,
    lowStockParts,
    openTickets,
    activeLeads,
    recentPayments,
    cashPosition,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { companyId, status: 'PAID', updatedAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.findMany({
      where: { companyId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
      include: { customer: { select: { name: true } } },
      take: 10,
    }),
    prisma.sparePart.findMany({ where: { companyId } }).then((parts) =>
      parts.filter((p) => p.quantity <= p.reorderLevel)
    ),
    prisma.serviceTicket.count({ where: { companyId, status: { notIn: ['CLOSED', 'COMPLETED'] } } }),
    prisma.lead.count({ where: { companyId, pipelineStage: { notIn: ['WON', 'LOST'] } } }),
    prisma.invoicePayment.findMany({
      where: { invoice: { companyId } },
      include: { invoice: { select: { invoiceNumber: true } } },
      orderBy: { paidAt: 'desc' },
      take: 5,
    }),
    prisma.chartOfAccount.findMany({
      where: { companyId, code: { in: ['1000', '1300', '1400'] } },
    }),
  ]);

  const salesTrend = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0);
      return prisma.invoice
        .aggregate({
          where: { companyId, status: 'PAID', issueDate: { gte: date, lte: endDate } },
          _sum: { totalAmount: true },
        })
        .then((r) => ({
          month: date.toLocaleString('default', { month: 'short' }),
          revenue: Number(r._sum.totalAmount || 0),
        }));
    })
  );

  res.json({
    success: true,
    data: {
      kpis: {
        monthlyRevenue: Number(monthlyRevenue._sum.totalAmount || 0),
        outstandingAmount: outstandingInvoices.reduce(
          (s, i) => s + (Number(i.totalAmount) - Number(i.amountPaid)),
          0
        ),
        lowStockCount: lowStockParts.length,
        openTickets,
        activeLeads,
        cashPosition: cashPosition.reduce((s, a) => s + Number(a.balance), 0),
      },
      salesTrend,
      outstandingInvoices,
      lowStockParts,
      recentPayments,
    },
  });
});

export default router;
