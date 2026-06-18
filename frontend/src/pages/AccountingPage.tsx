import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency } from '../components/ui/Shared';

export default function AccountingPage() {
  const [tab, setTab] = useState<'accounts' | 'journals' | 'trial-balance' | 'income' | 'balance-sheet' | 'receivables'>('accounts');

  const { data: accounts, isLoading: la } = useQuery({ queryKey: ['coa'], queryFn: () => accountingApi.getChartOfAccounts(), enabled: tab === 'accounts' });
  const { data: journals, isLoading: lj } = useQuery({ queryKey: ['journals'], queryFn: () => accountingApi.getJournals(), enabled: tab === 'journals' });
  const { data: trialBalance, isLoading: lt } = useQuery({ queryKey: ['trial-balance'], queryFn: () => accountingApi.getTrialBalance(), enabled: tab === 'trial-balance' });
  const { data: income, isLoading: li } = useQuery({ queryKey: ['income'], queryFn: () => accountingApi.getIncomeStatement(), enabled: tab === 'income' });
  const { data: balanceSheet, isLoading: lb } = useQuery({ queryKey: ['balance-sheet'], queryFn: () => accountingApi.getBalanceSheet(), enabled: tab === 'balance-sheet' });
  const { data: receivables, isLoading: lr } = useQuery({ queryKey: ['receivables'], queryFn: () => accountingApi.getReceivables(), enabled: tab === 'receivables' });

  const tabs = [
    { id: 'accounts', label: 'Chart of Accounts' },
    { id: 'journals', label: 'Journals' },
    { id: 'trial-balance', label: 'Trial Balance' },
    { id: 'income', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'receivables', label: 'Receivables' },
  ] as const;

  const isLoading = la || lj || lt || li || lb || lr;

  return (
    <div>
      <PageHeader title="Accounting" subtitle="Double-entry accounting, reports, and financial statements" />

      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-jolu-600 text-white' : 'bg-white border text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <>
            {tab === 'accounts' && (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Code</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Balance</th></tr></thead>
                  <tbody>
                    {(accounts?.data?.data || []).map((a: { id: string; code: string; name: string; type: string; balance: number }) => (
                      <tr key={a.id} className="border-t"><td className="px-6 py-3 font-mono">{a.code}</td><td className="px-6 py-3">{a.name}</td><td className="px-6 py-3">{a.type}</td><td className="px-6 py-3 font-semibold">{formatCurrency(Number(a.balance))}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'trial-balance' && (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Code</th><th className="px-6 py-3">Account</th><th className="px-6 py-3">Debit</th><th className="px-6 py-3">Credit</th></tr></thead>
                  <tbody>
                    {(trialBalance?.data?.data || []).map((a: { code: string; name: string; debit: number; credit: number }, i: number) => (
                      <tr key={i} className="border-t"><td className="px-6 py-3 font-mono">{a.code}</td><td className="px-6 py-3">{a.name}</td><td className="px-6 py-3">{a.debit ? formatCurrency(a.debit) : '-'}</td><td className="px-6 py-3">{a.credit ? formatCurrency(a.credit) : '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'income' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold mb-4 text-green-700">Revenue</h3>
                  {(income?.data?.data?.revenue || []).map((r: { name: string; amount: number }, i: number) => (
                    <div key={i} className="flex justify-between py-2 border-b"><span>{r.name}</span><span className="font-semibold">{formatCurrency(r.amount)}</span></div>
                  ))}
                  <div className="flex justify-between pt-4 font-bold"><span>Total Revenue</span><span className="text-green-700">{formatCurrency(income?.data?.data?.totalRevenue || 0)}</span></div>
                </div>
                <div className="card">
                  <h3 className="font-semibold mb-4 text-red-700">Expenses</h3>
                  {(income?.data?.data?.expenses || []).map((e: { name: string; amount: number }, i: number) => (
                    <div key={i} className="flex justify-between py-2 border-b"><span>{e.name}</span><span className="font-semibold">{formatCurrency(e.amount)}</span></div>
                  ))}
                  <div className="flex justify-between pt-4 font-bold border-t mt-4"><span>Net Income</span><span className={income?.data?.data?.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}>{formatCurrency(income?.data?.data?.netIncome || 0)}</span></div>
                </div>
              </div>
            )}

            {tab === 'balance-sheet' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['assets', 'liabilities', 'equity'].map((section) => (
                  <div key={section} className="card">
                    <h3 className="font-semibold mb-4 capitalize">{section}</h3>
                    {(balanceSheet?.data?.data?.[section] || []).map((a: { name: string; balance: number }, i: number) => (
                      <div key={i} className="flex justify-between py-2 border-b text-sm"><span>{a.name}</span><span>{formatCurrency(a.balance)}</span></div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {tab === 'journals' && (
              <div className="space-y-4">
                {(journals?.data?.data || []).map((j: { id: string; entryNumber: string; description: string; date: string; lines: { account: { name: string }; debit: number; credit: number }[] }) => (
                  <div key={j.id} className="card">
                    <div className="flex justify-between mb-3"><span className="font-semibold">{j.entryNumber}</span><span className="text-sm text-gray-500">{new Date(j.date).toLocaleDateString()}</span></div>
                    <p className="text-sm text-gray-600 mb-3">{j.description}</p>
                    {j.lines?.map((l, i) => (
                      <div key={i} className="flex justify-between text-sm py-1"><span>{l.account.name}</span><span>{Number(l.debit) > 0 ? `Dr ${formatCurrency(Number(l.debit))}` : `Cr ${formatCurrency(Number(l.credit))}`}</span></div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {tab === 'receivables' && (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Invoice</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Due</th><th className="px-6 py-3">Balance</th></tr></thead>
                  <tbody>
                    {(receivables?.data?.data || []).map((inv: { id: string; invoiceNumber: string; customer?: { name: string }; dueDate?: string; totalAmount: number; amountPaid: number }) => (
                      <tr key={inv.id} className="border-t"><td className="px-6 py-3">{inv.invoiceNumber}</td><td className="px-6 py-3">{inv.customer?.name}</td><td className="px-6 py-3">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td><td className="px-6 py-3 font-semibold">{formatCurrency(Number(inv.totalAmount) - Number(inv.amountPaid))}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
