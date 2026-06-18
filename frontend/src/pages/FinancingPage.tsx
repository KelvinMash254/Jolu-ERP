import { useQuery } from '@tanstack/react-query';
import { financingApi } from '../services/api';
import { PageHeader, LoadingSpinner, StatusBadge, formatCurrency } from '../components/ui/Shared';

export default function FinancingPage() {
  const { data: apps, isLoading } = useQuery({ queryKey: ['financing'], queryFn: () => financingApi.getAll() });
  const { data: dashboard } = useQuery({ queryKey: ['financing-dashboard'], queryFn: () => financingApi.getDashboard() });

  const dash = dashboard?.data?.data;

  return (
    <div>
      <PageHeader title="Bank Financing" subtitle="Track financing applications and approval workflow" />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center"><p className="text-sm text-gray-500">Total Applications</p><p className="text-2xl font-bold">{dash?.totalApplications || 0}</p></div>
          <div className="card text-center"><p className="text-sm text-gray-500">Total Loan Amount</p><p className="text-2xl font-bold text-jolu-600">{formatCurrency(dash?.totalLoanAmount || 0)}</p></div>
          <div className="card text-center"><p className="text-sm text-gray-500">Total Deposits</p><p className="text-2xl font-bold">{formatCurrency(dash?.totalDeposits || 0)}</p></div>
          <div className="card text-center"><p className="text-sm text-gray-500">Approval Rate</p><p className="text-2xl font-bold text-green-600">{dash?.approvalRate || 0}%</p></div>
        </div>

        {dash?.byStage && (
          <div className="flex flex-wrap gap-3">
            {dash.byStage.map((s: { stage: string; count: number }) => (
              <div key={s.stage} className="card py-3 px-4 text-center min-w-[120px]">
                <p className="text-xs text-gray-500">{s.stage.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold">{s.count}</p>
              </div>
            ))}
          </div>
        )}

        {isLoading ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Bank</th><th className="px-6 py-3">Loan Amount</th><th className="px-6 py-3">Deposit</th><th className="px-6 py-3">Stage</th></tr></thead>
              <tbody>
                {(apps?.data?.data || []).map((a: { id: string; customer: { name: string }; bankName: string; loanAmount: number; depositAmount: number; stage: string }) => (
                  <tr key={a.id} className="border-t"><td className="px-6 py-4">{a.customer.name}</td><td className="px-6 py-4">{a.bankName}</td><td className="px-6 py-4">{formatCurrency(Number(a.loanAmount))}</td><td className="px-6 py-4">{formatCurrency(Number(a.depositAmount))}</td><td className="px-6 py-4"><StatusBadge status={a.stage} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
