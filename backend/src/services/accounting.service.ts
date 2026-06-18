import prisma from '../config/database';
import { AccountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const DEFAULT_ACCOUNTS = [
  { code: '1000', name: 'Cash', type: AccountType.ASSET },
  { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET },
  { code: '1200', name: 'Inventory', type: AccountType.ASSET },
  { code: '1300', name: 'Bank Account', type: AccountType.ASSET },
  { code: '1400', name: 'M-Pesa Account', type: AccountType.ASSET },
  { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
  { code: '2100', name: 'VAT Payable', type: AccountType.LIABILITY },
  { code: '3000', name: 'Owner Equity', type: AccountType.EQUITY },
  { code: '4000', name: 'Sales Revenue', type: AccountType.REVENUE },
  { code: '4100', name: 'Service Revenue', type: AccountType.REVENUE },
  { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
  { code: '5100', name: 'Operating Expenses', type: AccountType.EXPENSE },
  { code: '5200', name: 'Petty Cash Expenses', type: AccountType.EXPENSE },
];

export async function initializeChartOfAccounts(companyId: string) {
  for (const account of DEFAULT_ACCOUNTS) {
    await prisma.chartOfAccount.upsert({
      where: { companyId_code: { companyId, code: account.code } },
      create: { companyId, ...account },
      update: {},
    });
  }
}

interface JournalLineInput {
  accountCode: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export async function createJournalEntry(
  companyId: string,
  description: string,
  lines: JournalLineInput[],
  options?: { 
    reference?: string; 
    sourceType?: string; 
    sourceId?: string; 
    createdBy?: string; 
    autoPost?: boolean;
    tx?: any;
  }
) {
  const db = options?.tx || prisma;
  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal entry not balanced: debit=${totalDebit}, credit=${totalCredit}`);
  }

  const count = await db.journalEntry.count({ where: { companyId } });
  const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

  const accounts = await db.chartOfAccount.findMany({
    where: { companyId, code: { in: lines.map((l) => l.accountCode) } },
  });

  const accountMap = new Map(accounts.map((a: any) => [a.code, a]));

  const entry = await db.journalEntry.create({
    data: {
      companyId,
      entryNumber,
      description,
      reference: options?.reference,
      sourceType: options?.sourceType,
      sourceId: options?.sourceId,
      createdBy: options?.createdBy,
      isPosted: options?.autoPost ?? true,
      lines: {
        create: lines.map((line) => {
          const account = accountMap.get(line.accountCode);
          if (!account) throw new Error(`Account ${line.accountCode} not found`);
          return {
            accountId: account.id,
            debit: line.debit || 0,
            credit: line.credit || 0,
            description: line.description,
          };
        }),
      },
    },
    include: { lines: { include: { account: true } } },
  });

  if (options?.autoPost !== false) {
    for (const line of entry.lines) {
      const delta = new Decimal(line.debit).minus(line.credit);
      await db.chartOfAccount.update({
        where: { id: line.accountId },
        data: { balance: { increment: delta } },
      });
    }
  }

  return entry;
}

export async function postPaymentJournal(
  companyId: string,
  amount: number,
  paymentMethod: string,
  createdBy?: string,
  reference?: string
) {
  const cashAccount = paymentMethod === 'MPESA' ? '1400' : paymentMethod === 'BANK' ? '1300' : '1000';

  return createJournalEntry(
    companyId,
    `Payment received via ${paymentMethod}`,
    [
      { accountCode: cashAccount, debit: amount, description: 'Payment received' },
      { accountCode: '1100', credit: amount, description: 'Accounts receivable reduction' },
    ],
    { reference, sourceType: 'PAYMENT', createdBy, autoPost: true }
  );
}

export async function getTrialBalance(companyId: string) {
  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId, isActive: true },
    orderBy: { code: 'asc' },
  });

  return accounts.map((a) => ({
    code: a.code,
    name: a.name,
    type: a.type,
    debit: Number(a.balance) > 0 ? Number(a.balance) : 0,
    credit: Number(a.balance) < 0 ? Math.abs(Number(a.balance)) : 0,
  }));
}

export async function getIncomeStatement(companyId: string, startDate: Date, endDate: Date) {
  const revenueAccounts = await prisma.chartOfAccount.findMany({
    where: { companyId, type: AccountType.REVENUE },
  });
  const expenseAccounts = await prisma.chartOfAccount.findMany({
    where: { companyId, type: AccountType.EXPENSE },
  });

  const totalRevenue = revenueAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalExpenses = expenseAccounts.reduce((s, a) => s + Number(a.balance), 0);

  return {
    period: { startDate, endDate },
    revenue: revenueAccounts.map((a) => ({ code: a.code, name: a.name, amount: Number(a.balance) })),
    expenses: expenseAccounts.map((a) => ({ code: a.code, name: a.name, amount: Number(a.balance) })),
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

export async function getBalanceSheet(companyId: string) {
  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId, isActive: true, type: { in: [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY] } },
    orderBy: { code: 'asc' },
  });

  const assets = accounts.filter((a) => a.type === AccountType.ASSET);
  const liabilities = accounts.filter((a) => a.type === AccountType.LIABILITY);
  const equity = accounts.filter((a) => a.type === AccountType.EQUITY);

  return {
    assets: assets.map((a) => ({ code: a.code, name: a.name, balance: Number(a.balance) })),
    liabilities: liabilities.map((a) => ({ code: a.code, name: a.name, balance: Number(a.balance) })),
    equity: equity.map((a) => ({ code: a.code, name: a.name, balance: Number(a.balance) })),
    totalAssets: assets.reduce((s, a) => s + Number(a.balance), 0),
    totalLiabilities: liabilities.reduce((s, a) => s + Number(a.balance), 0),
    totalEquity: equity.reduce((s, a) => s + Number(a.balance), 0),
  };
}
