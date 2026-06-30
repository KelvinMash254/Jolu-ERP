import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticate, requireCompany, requirePermission } from '../middleware/auth';
import { getPagination, paginationMeta } from '../utils/pagination';

const router = Router();
router.use(authenticate, requireCompany);

router.get('/customers', requirePermission('crm', 'read'), async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const where: Record<string, unknown> = { companyId: req.companyId! };

  if (req.user!.role === 'SALES_REPRESENTATIVE') {
    where.salespersonId = req.user!.id;
  }
  if (req.query.search) {
    where.OR = [
      { name: { contains: String(req.query.search), mode: 'insensitive' } },
      { phone: { contains: String(req.query.search) } },
      { email: { contains: String(req.query.search), mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      include: { salesperson: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({ success: true, data: customers, meta: paginationMeta(total, page, limit) });
});

router.post('/customers', requirePermission('crm', 'create'), async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.create({
    data: { ...req.body, companyId: req.companyId! },
  });
  res.status(201).json({ success: true, data: customer });
});

router.get('/customers/:id', requirePermission('crm', 'read'), async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: {
      salesperson: { select: { id: true, firstName: true, lastName: true } },
      activities: { orderBy: { occurredAt: 'desc' }, take: 20, include: { user: { select: { firstName: true, lastName: true } } } },
      documents: true,
      reminders: { where: { isCompleted: false } },
      invoices: { take: 10, orderBy: { issueDate: 'desc' } },
      bankFinancingApps: true,
      serviceTickets: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json({ success: true, data: customer });
});

router.get('/leads', requirePermission('crm', 'read'), async (req: AuthRequest, res: Response) => {
  const where: Record<string, unknown> = { companyId: req.companyId! };
  if (req.user!.role === 'SALES_REPRESENTATIVE') where.salespersonId = req.user!.id;
  if (req.query.stage) where.pipelineStage = req.query.stage;

  const leads = await prisma.lead.findMany({
    where,
    include: {
      customer: true,
      salesperson: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({ success: true, data: leads });
});

router.post('/leads', requirePermission('crm', 'create'), async (req: AuthRequest, res: Response) => {
  const lead = await prisma.lead.create({
    data: {
      ...req.body,
      companyId: req.companyId!,
      salespersonId: req.body.salespersonId || req.user!.id,
    },
  });
  res.status(201).json({ success: true, data: lead });
});

router.patch('/leads/:id/stage', requirePermission('crm', 'update'), async (req: AuthRequest, res: Response) => {
  const { stage, pipelineStage } = req.body;
  const data: Record<string, unknown> = {};
  if (stage) data.stage = stage;
  if (pipelineStage) {
    data.pipelineStage = pipelineStage;
    if (pipelineStage === 'WON') data.wonAt = new Date();
    if (pipelineStage === 'LOST') data.lostAt = new Date();
  }

  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, data: lead });
});

router.get('/pipeline/kanban', requirePermission('crm', 'read'), async (req: AuthRequest, res: Response) => {
  const stages = ['NEW_LEAD', 'QUALIFIED', 'PROPOSAL_SENT', 'APPLICATION_SUBMITTED', 'BANK_APPROVAL', 'WON', 'LOST'];
  const where: Record<string, unknown> = { companyId: req.companyId! };
  if (req.user!.role === 'SALES_REPRESENTATIVE') where.salespersonId = req.user!.id;

  const kanban = await Promise.all(
    stages.map(async (stage) => ({
      stage,
      leads: await prisma.lead.findMany({
        where: { ...where, pipelineStage: stage as never },
        include: { customer: true, salesperson: { select: { firstName: true, lastName: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
    }))
  );

  res.json({ success: true, data: kanban });
});

router.get('/pipeline/kpis', requirePermission('crm', 'read'), async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId!;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [monthlyWon, quarterlyWon, annualWon, totalLeads, wonLeads, salesByRep] = await Promise.all([
    prisma.lead.count({ where: { companyId, pipelineStage: 'WON', wonAt: { gte: monthStart } } }),
    prisma.lead.count({ where: { companyId, pipelineStage: 'WON', wonAt: { gte: quarterStart } } }),
    prisma.lead.count({ where: { companyId, pipelineStage: 'WON', wonAt: { gte: yearStart } } }),
    prisma.lead.count({ where: { companyId } }),
    prisma.lead.count({ where: { companyId, pipelineStage: 'WON' } }),
    prisma.lead.groupBy({
      by: ['salespersonId'],
      where: { companyId, pipelineStage: 'WON' },
      _count: true,
      _sum: { estimatedValue: true },
    }),
  ]);

  const teamPerformance = await Promise.all(
    salesByRep.map(async (rep) => {
      const user = rep.salespersonId
        ? await prisma.user.findUnique({ where: { id: rep.salespersonId }, select: { firstName: true, lastName: true } })
        : null;
      return {
        salesperson: user ? `${user.firstName} ${user.lastName}` : 'Unassigned',
        dealsWon: rep._count,
        revenue: Number(rep._sum.estimatedValue || 0),
      };
    })
  );

  res.json({
    success: true,
    data: {
      monthlySales: monthlyWon,
      quarterlySales: quarterlyWon,
      annualSales: annualWon,
      conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0,
      teamPerformance,
    },
  });
});

router.post('/activities', requirePermission('crm', 'create'), async (req: AuthRequest, res: Response) => {
  const activity = await prisma.activity.create({
    data: { ...req.body, userId: req.user!.id },
  });
  res.status(201).json({ success: true, data: activity });
});

router.post('/reminders', requirePermission('crm', 'create'), async (req: AuthRequest, res: Response) => {
  const reminder = await prisma.reminder.create({
    data: { ...req.body, userId: req.user!.id },
  });
  res.status(201).json({ success: true, data: reminder });
});

router.post('/leads/:id/convert', requirePermission('crm', 'update'), async (req: AuthRequest, res: Response) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: { customer: true },
  });

  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  
  let customer = lead.customer;
  
  if (!customer) {
    // Create customer if it doesn't exist yet (though usually leads are attached to customers)
    // If not, we might need more info. For now, assume lead has enough or it's already linked.
    return res.status(400).json({ error: 'Lead must be linked to a customer to convert' });
  }

  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: { 
      pipelineStage: 'WON',
      stage: 'DELIVERED', 
      wonAt: new Date(),
    }
  });

  // Ensure customer is active
  await prisma.customer.update({
    where: { id: customer.id },
    data: { isActive: true }
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: 'NOTE',
      subject: 'Lead Converted',
      description: `Lead "${lead.title}" was successfully converted to a deal.`,
      leadId: lead.id,
      customerId: customer.id,
      userId: req.user!.id,
    }
  });

  res.json({ success: true, data: { lead: updatedLead, customer } });
});

export default router;
