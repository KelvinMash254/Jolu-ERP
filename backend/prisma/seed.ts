import { PrismaClient, RoleName, CompanyCode, BranchCode, AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { initializeChartOfAccounts } from '../src/services/accounting.service';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { module: 'users', action: 'read' }, { module: 'users', action: 'create' }, { module: 'users', action: 'update' },
  { module: 'companies', action: 'read' }, { module: 'companies', action: 'update' },
  { module: 'crm', action: 'read' }, { module: 'crm', action: 'create' }, { module: 'crm', action: 'update' },
  { module: 'inventory', action: 'read' }, { module: 'inventory', action: 'create' }, { module: 'inventory', action: 'update' },
  { module: 'invoices', action: 'read' }, { module: 'invoices', action: 'create' }, { module: 'invoices', action: 'update' },
  { module: 'accounting', action: 'read' }, { module: 'accounting', action: 'create' }, { module: 'accounting', action: 'update' },
  { module: 'aftersales', action: 'read' }, { module: 'aftersales', action: 'create' }, { module: 'aftersales', action: 'update' },
  { module: 'security', action: 'read' }, { module: 'security', action: 'create' }, { module: 'security', action: 'update' },
  { module: 'financing', action: 'read' }, { module: 'financing', action: 'create' }, { module: 'financing', action: 'update' },
  { module: 'payments', action: 'read' }, { module: 'payments', action: 'create' },
  { module: 'pettycash', action: 'read' }, { module: 'pettycash', action: 'create' }, { module: 'pettycash', action: 'update' },
  { module: 'dashboard', action: 'read' },
  { module: 'audit', action: 'read' },
  { module: 'importexport', action: 'read' }, { module: 'importexport', action: 'create' },
];

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((p) => `${p.module}.${p.action}`),
  GROUP_ADMIN: PERMISSIONS.map((p) => `${p.module}.${p.action}`),
  COMPANY_ADMIN: PERMISSIONS.filter((p) => p.module !== 'users' || p.action === 'read').map((p) => `${p.module}.${p.action}`),
  SALES_MANAGER: ['crm.read', 'crm.create', 'crm.update', 'dashboard.read', 'invoices.read', 'invoices.create', 'financing.read', 'financing.create'],
  SALES_REPRESENTATIVE: ['crm.read', 'crm.create', 'crm.update', 'dashboard.read', 'invoices.read'],
  TECHNICIAN: ['aftersales.read', 'aftersales.create', 'aftersales.update', 'inventory.read'],
  FINANCE_TEAM: ['accounting.read', 'accounting.create', 'accounting.update', 'invoices.read', 'invoices.create', 'invoices.update', 'payments.read', 'payments.create', 'pettycash.read', 'pettycash.create', 'dashboard.read'],
  INVENTORY_MANAGER: ['inventory.read', 'inventory.create', 'inventory.update', 'dashboard.read', 'importexport.read', 'importexport.create'],
  BRANCH_ADMIN_NAIROBI: ['crm.read', 'crm.create', 'pettycash.read', 'pettycash.create', 'pettycash.update', 'dashboard.read', 'inventory.read'],
  BRANCH_ADMIN_NAKURU: ['crm.read', 'crm.create', 'pettycash.read', 'pettycash.create', 'pettycash.update', 'dashboard.read', 'inventory.read'],
  AUDITOR: PERMISSIONS.filter((p) => p.action === 'read').map((p) => `${p.module}.${p.action}`),
};

async function main() {
  console.log('Seeding Jolu ERP database...');

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      create: perm,
      update: {},
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [`${p.module}.${p.action}`, p.id]));

  const roles: { name: RoleName; displayName: string; description: string }[] = [
    { name: 'SUPER_ADMIN', displayName: 'Super Admin', description: 'Full system access' },
    { name: 'GROUP_ADMIN', displayName: 'Group Admin', description: 'Access all companies' },
    { name: 'COMPANY_ADMIN', displayName: 'Company Admin', description: 'Access assigned company' },
    { name: 'SALES_MANAGER', displayName: 'Sales Manager', description: 'Manage sales teams and pipelines' },
    { name: 'SALES_REPRESENTATIVE', displayName: 'Sales Representative', description: 'Manage leads and customers' },
    { name: 'TECHNICIAN', displayName: 'Technician', description: 'After-sales service access' },
    { name: 'FINANCE_TEAM', displayName: 'Finance Team', description: 'Accounting and finance' },
    { name: 'INVENTORY_MANAGER', displayName: 'Inventory Manager', description: 'Manage inventory' },
    { name: 'BRANCH_ADMIN_NAIROBI', displayName: 'Branch Admin (Nairobi)', description: 'Nairobi operations' },
    { name: 'BRANCH_ADMIN_NAKURU', displayName: 'Branch Admin (Nakuru)', description: 'Nakuru operations' },
    { name: 'AUDITOR', displayName: 'Auditor', description: 'Read-only access' },
  ];

  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      create: role,
      update: { displayName: role.displayName, description: role.description },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: created.id } });

    for (const permKey of ROLE_PERMISSIONS[role.name]) {
      const permId = permMap.get(permKey);
      if (permId) {
        await prisma.rolePermission.create({
          data: { roleId: created.id, permissionId: permId },
        });
      }
    }
  }

  const companies = [
    { 
      code: CompanyCode.MACHINERIES, 
      name: 'Jolu Agricultural Machineries Ltd', 
      legalName: 'Jolu Agricultural Machineries Ltd', 
      kraPin: 'P051234567A', 
      logoUrl: '/backend/uploads/logos/machineries.png',
      email: 'info@jolumachineries.com',
      ccEmail: 'jolumachineries@gmail.com',
      website: 'www.jolumachineries.com'
    },
    { 
      code: CompanyCode.SECURITY, 
      name: 'Jolu Group Security Ltd', 
      legalName: 'Jolu Group Security Ltd', 
      kraPin: 'P051234568B', 
      logoUrl: '/uploads/logos/security.png',
      email: 'info@jolusecurity.com',
      ccEmail: 'jolugroup@gmail.com',
      website: 'www.jolusecurity.com'
    },
    { 
      code: CompanyCode.AUTOMOBILE, 
      name: 'Jolu Automobile Limited', 
      legalName: 'Jolu Automobile Limited', 
      kraPin: 'P051234569C', 
      logoUrl: '/uploads/logos/automobile.png',
      email: 'info@joluautomobile.com',
      ccEmail: 'jolugroup@gmail.com',
      website: 'www.joluautomobile.com'
    },
  ];

  const createdCompanies = [];
  for (const co of companies) {
    const company = await prisma.company.upsert({
      where: { code: co.code },
      create: {
        ...co,
        address: 'Nairobi, Kenya',
        phone: '+254 769 281 518',
      },
      update: {
        email: co.email,
        ccEmail: co.ccEmail,
        website: co.website,
        name: co.name,
        legalName: co.legalName,
      },
    });
    createdCompanies.push(company);

    for (const branch of [
      { code: BranchCode.HEAD_OFFICE, name: 'Head Office' },
      { code: BranchCode.NAIROBI, name: 'Nairobi Branch' },
      { code: BranchCode.NAKURU, name: 'Nakuru Branch' },
    ]) {
      await prisma.branch.upsert({
        where: { companyId_code: { companyId: company.id, code: branch.code } },
        create: { companyId: company.id, ...branch, address: `${branch.name}, Kenya` },
        update: {},
      });
    }

    await initializeChartOfAccounts(company.id);
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const companyAdminRole = await prisma.role.findUnique({ where: { name: 'COMPANY_ADMIN' } });
  const salesRepRole = await prisma.role.findUnique({ where: { name: 'SALES_REPRESENTATIVE' } });
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // Default system admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jolugroup.co.ke' },
    create: {
      email: 'admin@jolugroup.co.ke',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+254700000001',
      roleId: superAdminRole!.id,
      companies: {
        create: createdCompanies.map((c, i) => ({ companyId: c.id, isPrimary: i === 0 })),
      },
    },
    update: {},
  });

  // User definitions to seed as requested
  const usersToSeed = [
    {
      email: 'john@jolugroup.com',
      firstName: 'John',
      lastName: 'CEO',
      roleId: superAdminRole!.id,
      companyCodes: [CompanyCode.MACHINERIES, CompanyCode.SECURITY, CompanyCode.AUTOMOBILE],
      isPrimaryCode: CompanyCode.MACHINERIES
    },
    {
      email: 'kelvin@jolugroup.com',
      firstName: 'Kelvin',
      lastName: 'Finance',
      roleId: superAdminRole!.id,
      companyCodes: [CompanyCode.MACHINERIES, CompanyCode.SECURITY, CompanyCode.AUTOMOBILE],
      isPrimaryCode: CompanyCode.MACHINERIES
    },
    {
      email: 'lucy@jolugroup.com',
      firstName: 'Lucy',
      lastName: 'MD',
      roleId: superAdminRole!.id,
      companyCodes: [CompanyCode.MACHINERIES, CompanyCode.SECURITY, CompanyCode.AUTOMOBILE],
      isPrimaryCode: CompanyCode.MACHINERIES
    },
    {
      email: 'walter@jolugroup.com',
      firstName: 'Walter',
      lastName: 'Machineries',
      roleId: companyAdminRole!.id,
      companyCodes: [CompanyCode.MACHINERIES],
      isPrimaryCode: CompanyCode.MACHINERIES
    },
    {
      email: 'dennis@jolugroup.com',
      firstName: 'Dennis',
      lastName: 'Machineries',
      roleId: salesRepRole!.id,
      companyCodes: [CompanyCode.MACHINERIES],
      isPrimaryCode: CompanyCode.MACHINERIES
    },
    {
      email: 'musyoka@jolugroup.com',
      firstName: 'Musyoka',
      lastName: 'Machineries',
      roleId: salesRepRole!.id,
      companyCodes: [CompanyCode.MACHINERIES],
      isPrimaryCode: CompanyCode.MACHINERIES
    },
    {
      email: 'mercy@jolugroup.com',
      firstName: 'Mercy',
      lastName: 'Machineries',
      roleId: salesRepRole!.id,
      companyCodes: [CompanyCode.MACHINERIES],
      isPrimaryCode: CompanyCode.MACHINERIES
    },
    {
      email: 'cate@jolugroup.com',
      firstName: 'Cate',
      lastName: 'Security',
      roleId: companyAdminRole!.id,
      companyCodes: [CompanyCode.SECURITY],
      isPrimaryCode: CompanyCode.SECURITY
    },
    {
      email: 'malika@jolugroup.com',
      firstName: 'Malika',
      lastName: 'Security',
      roleId: companyAdminRole!.id,
      companyCodes: [CompanyCode.SECURITY],
      isPrimaryCode: CompanyCode.SECURITY
    },
    {
      email: 'diana@jolugroup.com',
      firstName: 'Diana',
      lastName: 'Automobile',
      roleId: companyAdminRole!.id,
      companyCodes: [CompanyCode.AUTOMOBILE],
      isPrimaryCode: CompanyCode.AUTOMOBILE
    }
  ];

  for (const u of usersToSeed) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.userCompany.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: '+254700000000',
        roleId: u.roleId,
        companies: {
          create: createdCompanies
            .filter(c => u.companyCodes.includes(c.code))
            .map(c => ({
              companyId: c.id,
              isPrimary: c.code === u.isPrimaryCode
            }))
        }
      }
    });
  }

  // Sample data for Machineries
  const machineriesCo = createdCompanies.find((c) => c.code === CompanyCode.MACHINERIES)!;

  await prisma.machineryUnit.createMany({
    data: [
      { companyId: machineriesCo.id, productName: 'Massey Ferguson 375', category: 'TRACTOR', brand: 'Massey Ferguson', model: 'MF 375', serialNumber: 'MF375-001', costPrice: 2500000, sellingPrice: 3200000, stockStatus: 'IN_STOCK' },
      { companyId: machineriesCo.id, productName: 'New Holland TC590', category: 'HARVESTER', brand: 'New Holland', model: 'TC590', serialNumber: 'NH590-001', costPrice: 8500000, sellingPrice: 10500000, stockStatus: 'IN_STOCK' },
      { companyId: machineriesCo.id, productName: 'Disc Plough 3-Furrow', category: 'FARM_IMPLEMENT', brand: 'King Kutter', model: 'DP-3F', serialNumber: 'DP3F-001', costPrice: 180000, sellingPrice: 250000, stockStatus: 'IN_STOCK' },
    ],
    skipDuplicates: true,
  });

  await prisma.sparePart.createMany({
    data: [
      { companyId: machineriesCo.id, partNumber: 'SP-001', partName: 'Oil Filter', category: 'Filters', quantity: 50, costPrice: 1500, sellingPrice: 2500, reorderLevel: 10 },
      { companyId: machineriesCo.id, partNumber: 'SP-002', partName: 'Air Filter', category: 'Filters', quantity: 8, costPrice: 2000, sellingPrice: 3500, reorderLevel: 10 },
      { companyId: machineriesCo.id, partNumber: 'SP-003', partName: 'Hydraulic Hose', category: 'Hydraulics', quantity: 25, costPrice: 5000, sellingPrice: 8000, reorderLevel: 5 },
      { companyId: machineriesCo.id, partNumber: 'SP-004', partName: 'Tractor Fan Belt', category: 'Tractor Spares', quantity: 15, costPrice: 1200, sellingPrice: 2200, reorderLevel: 5 },
      { companyId: machineriesCo.id, partNumber: 'SP-005', partName: 'Tractor Clutch Plate', category: 'Tractor Spares', quantity: 10, costPrice: 8500, sellingPrice: 13500, reorderLevel: 3 },
    ],
    skipDuplicates: true,
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: machineriesCo.id,
      name: 'Peter Kamau',
      idNumber: '12345678',
      kraPin: 'A001234567B',
      phone: '+254712345678',
      email: 'peter.kamau@email.com',
      county: 'Nairobi',
      physicalAddress: 'Westlands, Nairobi',
      financingBank: 'KCB Bank',
      loanAmount: 2800000,
      depositPaid: 500000,
      approvalStatus: 'PENDING',
    },
  });

  await prisma.lead.create({
    data: {
      companyId: machineriesCo.id,
      customerId: customer.id,
      title: 'MF 375 Tractor Purchase',
      stage: 'QUOTATION_SENT',
      pipelineStage: 'PROPOSAL_SENT',
      estimatedValue: 3200000,
      source: 'Referral',
    },
  });

  const nairobiBranch = await prisma.branch.findFirst({
    where: { companyId: machineriesCo.id, code: BranchCode.NAIROBI },
  });
  const nakuruBranch = await prisma.branch.findFirst({
    where: { companyId: machineriesCo.id, code: BranchCode.NAKURU },
  });

  if (nairobiBranch) {
    await prisma.pettyCashAccount.create({
      data: { companyId: machineriesCo.id, branchId: nairobiBranch.id, name: 'Nairobi Petty Cash', balance: 50000, limit: 100000 },
    });
  }
  if (nakuruBranch) {
    await prisma.pettyCashAccount.create({
      data: { companyId: machineriesCo.id, branchId: nakuruBranch.id, name: 'Nakuru Petty Cash', balance: 30000, limit: 75000 },
    });
  }

  console.log('Seed completed successfully!');
  console.log('Default login: admin@jolugroup.co.ke / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
