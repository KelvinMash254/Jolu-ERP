import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pettyCashApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency, StatusBadge } from '../components/ui/Shared';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PettyCashPage() {
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({ accountId: '', amount: 0, purpose: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['petty-cash'],
    queryFn: () => pettyCashApi.getAccounts(),
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: any) => pettyCashApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
      setShowRequestForm(false);
      toast.success('Request submitted');
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => pettyCashApi.approveRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
      toast.success('Request updated');
    },
  });

  const accounts = data?.data?.data || [];

  return (
    <div>
      <PageHeader 
        title="Petty Cash Management" 
        subtitle="Nairobi and Nakuru branch petty cash" 
        actions={
          <button onClick={() => setShowRequestForm(true)} className="btn-primary">New Request</button>
        } 
      />
      <div className="p-8 space-y-8">
        {showRequestForm && (
          <div className="card max-w-md">
            <h3 className="font-semibold mb-4">New Petty Cash Request</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Account</label>
                <select className="input" onChange={e => setFormData({...formData, accountId: e.target.value})}>
                  <option value="">Select Account</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div><label className="label">Amount</label><input type="number" className="input" onChange={e => setFormData({...formData, amount: Number(e.target.value)})} /></div>
              <div><label className="label">Purpose</label><textarea className="input" onChange={e => setFormData({...formData, purpose: e.target.value})} /></div>
              <div className="flex gap-3">
                <button onClick={() => createRequestMutation.mutate(formData)} className="btn-primary">Submit</button>
                <button onClick={() => setShowRequestForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((acc: { id: string; name: string; balance: number; limit: number; branch: { name: string }; requests: any[] }) => (
              <div key={acc.id} className="card">
                <h3 className="font-semibold text-lg">{acc.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{acc.branch.name}</p>
                <div className="flex justify-between items-end">
                  <div><p className="text-sm text-gray-500">Balance</p><p className="text-3xl font-bold text-jolu-600">{formatCurrency(Number(acc.balance))}</p></div>
                  <div className="text-right"><p className="text-sm text-gray-500">Limit</p><p className="font-semibold">{formatCurrency(Number(acc.limit))}</p></div>
                </div>
                <div className="mt-4 bg-gray-100 rounded-full h-2 mb-6">
                  <div className="bg-jolu-500 h-2 rounded-full" style={{ width: `${Math.min(100, (Number(acc.balance) / Number(acc.limit)) * 100)}%` }} />
                </div>

                <h4 className="font-medium text-sm mb-3">Recent Requests</h4>
                <div className="space-y-2">
                  {acc.requests?.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div>
                        <p className="font-medium">{req.purpose}</p>
                        <p className="text-gray-500">{formatCurrency(Number(req.amount))}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} />
                        {req.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button onClick={() => approveRequestMutation.mutate({ id: req.id, status: 'APPROVED' })} className="text-green-600 font-bold hover:underline">Approve</button>
                            <button onClick={() => approveRequestMutation.mutate({ id: req.id, status: 'REJECTED' })} className="text-red-600 font-bold hover:underline">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!acc.requests?.length && <p className="text-gray-400 text-xs italic">No recent requests</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
