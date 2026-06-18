import { useQuery } from '@tanstack/react-query';
import { pettyCashApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency } from '../components/ui/Shared';

export default function PettyCashPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['petty-cash'],
    queryFn: () => pettyCashApi.getAccounts(),
  });

  const accounts = data?.data?.data || [];

  return (
    <div>
      <PageHeader title="Petty Cash Management" subtitle="Nairobi and Nakuru branch petty cash" actions={<button className="btn-primary">New Request</button>} />
      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((acc: { id: string; name: string; balance: number; limit: number; branch: { name: string } }) => (
              <div key={acc.id} className="card">
                <h3 className="font-semibold text-lg">{acc.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{acc.branch.name}</p>
                <div className="flex justify-between items-end">
                  <div><p className="text-sm text-gray-500">Balance</p><p className="text-3xl font-bold text-jolu-600">{formatCurrency(Number(acc.balance))}</p></div>
                  <div className="text-right"><p className="text-sm text-gray-500">Limit</p><p className="font-semibold">{formatCurrency(Number(acc.limit))}</p></div>
                </div>
                <div className="mt-4 bg-gray-100 rounded-full h-2"><div className="bg-jolu-500 h-2 rounded-full" style={{ width: `${Math.min(100, (Number(acc.balance) / Number(acc.limit)) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
