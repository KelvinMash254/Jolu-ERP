import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financingApi } from '../services/api';
import { PageHeader, LoadingSpinner, StatusBadge, formatCurrency } from '../components/ui/Shared';
import { useState } from 'react';
import FinancingModal from '../components/FinancingModal';
import toast from 'react-hot-toast';

export default function FinancingPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: apps, isLoading } = useQuery({ queryKey: ['financing'], queryFn: () => financingApi.getAll() });
  const { data: dashboard } = useQuery({ queryKey: ['financing-dashboard'], queryFn: () => financingApi.getDashboard() });

  const createMutation = useMutation({
    mutationFn: (data: any) => financingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financing'] });
      queryClient.invalidateQueries({ queryKey: ['financing-dashboard'] });
      setIsModalOpen(false);
      toast.success('Application created');
    },
    onError: () => toast.error('Failed to create application'),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string, stage: string }) => financingApi.updateStage(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financing'] });
      queryClient.invalidateQueries({ queryKey: ['financing-dashboard'] });
      toast.success('Stage updated');
    },
  });

  const dash = dashboard?.data?.data;

  return (
    <div>
      <PageHeader
        title="Bank Financing"
        subtitle="Track financing applications and approval workflow"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">New Application</button>
        }
      />

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
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Bank</th><th className="px-6 py-3">Loan Amount</th><th className="px-6 py-3">Deposit</th><th className="px-6 py-3">Stage</th><th className="px-6 py-3">Actions</th></tr></thead>
              <tbody>
                {(apps?.data?.data || []).map((a: { id: string; customer: { name: string }; bankName: string; loanAmount: number; depositAmount: number; stage: string }) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-6 py-4">{a.customer.name}</td>
                    <td className="px-6 py-4">{a.bankName}</td>
                    <td className="px-6 py-4">{formatCurrency(Number(a.loanAmount))}</td>
                    <td className="px-6 py-4">{formatCurrency(Number(a.depositAmount))}</td>
                    <td className="px-6 py-4"><StatusBadge status={a.stage} /></td>
                    <td className="px-6 py-4">
                      <select
                        className="text-xs rounded border-gray-300"
                        value={a.stage}
                        onChange={(e) => updateStageMutation.mutate({ id: a.id, stage: e.target.value })}
                      >
                        <option value="DOCUMENTS_SUBMITTED">Documents Submitted</option>
                        <option value="BANK_RECEIVED">Bank Received</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="DEPOSIT_RECEIVED">Deposit Received</option>
                        <option value="UNIT_ALLOCATED">Unit Allocated</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FinancingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
