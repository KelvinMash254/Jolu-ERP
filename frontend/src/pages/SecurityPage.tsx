import { useQuery } from '@tanstack/react-query';
import { securityApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency } from '../components/ui/Shared';
import { useState } from 'react';

export default function SecurityPage() {
  const [tab, setTab] = useState<'clients' | 'contracts' | 'guards' | 'sites'>('clients');

  const { data: clients, isLoading: lc } = useQuery({ queryKey: ['sec-clients'], queryFn: () => securityApi.getClients(), enabled: tab === 'clients' });
  const { data: contracts, isLoading: lco } = useQuery({ queryKey: ['sec-contracts'], queryFn: () => securityApi.getContracts(), enabled: tab === 'contracts' });
  const { data: guards, isLoading: lg } = useQuery({ queryKey: ['sec-guards'], queryFn: () => securityApi.getGuards(), enabled: tab === 'guards' });
  const { data: sites, isLoading: ls } = useQuery({ queryKey: ['sec-sites'], queryFn: () => securityApi.getSites(), enabled: tab === 'sites' });

  const isLoading = lc || lco || lg || ls;

  return (
    <div>
      <PageHeader title="Jolu Security Module" subtitle="Clients, contracts, guards, and deployments" />

      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['clients', 'contracts', 'guards', 'sites'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-jolu-600 text-white' : 'bg-white border'}`}>{t}</button>
          ))}
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            {tab === 'clients' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Client</th><th className="px-6 py-3">Contact</th><th className="px-6 py-3">Phone</th><th className="px-6 py-3">Contracts</th></tr></thead>
                <tbody>
                  {(clients?.data?.data || []).map((c: { id: string; name: string; contactPerson?: string; phone: string; _count?: { contracts: number } }) => (
                    <tr key={c.id} className="border-t"><td className="px-6 py-4 font-medium">{c.name}</td><td className="px-6 py-4">{c.contactPerson || '-'}</td><td className="px-6 py-4">{c.phone}</td><td className="px-6 py-4">{c._count?.contracts || 0}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'contracts' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Contract</th><th className="px-6 py-3">Client</th><th className="px-6 py-3">Monthly Fee</th><th className="px-6 py-3">Guards</th><th className="px-6 py-3">Status</th></tr></thead>
                <tbody>
                  {(contracts?.data?.data || []).map((c: { id: string; contractNumber: string; client: { name: string }; monthlyFee: number; guardsCount: number; status: string }) => (
                    <tr key={c.id} className="border-t"><td className="px-6 py-4">{c.contractNumber}</td><td className="px-6 py-4">{c.client.name}</td><td className="px-6 py-4">{formatCurrency(Number(c.monthlyFee))}</td><td className="px-6 py-4">{c.guardsCount}</td><td className="px-6 py-4">{c.status}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'guards' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Employee No</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Phone</th><th className="px-6 py-3">License</th></tr></thead>
                <tbody>
                  {(guards?.data?.data || []).map((g: { id: string; employeeNo: string; firstName: string; lastName: string; phone: string; licenseNo?: string }) => (
                    <tr key={g.id} className="border-t"><td className="px-6 py-4">{g.employeeNo}</td><td className="px-6 py-4">{g.firstName} {g.lastName}</td><td className="px-6 py-4">{g.phone}</td><td className="px-6 py-4">{g.licenseNo || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'sites' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Site</th><th className="px-6 py-3">Client</th><th className="px-6 py-3">Address</th></tr></thead>
                <tbody>
                  {(sites?.data?.data || []).map((s: { id: string; name: string; client: { name: string }; address: string }) => (
                    <tr key={s.id} className="border-t"><td className="px-6 py-4 font-medium">{s.name}</td><td className="px-6 py-4">{s.client.name}</td><td className="px-6 py-4">{s.address}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
