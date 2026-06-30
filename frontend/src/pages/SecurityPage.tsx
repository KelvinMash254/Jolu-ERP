import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency } from '../components/ui/Shared';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Receipt } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';
import { invoiceApi } from '../services/api';

export default function SecurityPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'clients' | 'contracts' | 'guards' | 'sites'>('clients');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const { data: clients, isLoading: lc } = useQuery({ queryKey: ['sec-clients'], queryFn: () => securityApi.getClients(), enabled: tab === 'clients' });
  const { data: contracts, isLoading: lco } = useQuery({ queryKey: ['sec-contracts'], queryFn: () => securityApi.getContracts(), enabled: tab === 'contracts' });
  const { data: guards, isLoading: lg } = useQuery({ queryKey: ['sec-guards'], queryFn: () => securityApi.getGuards(), enabled: tab === 'guards' });
  const { data: sites, isLoading: ls } = useQuery({ queryKey: ['sec-sites'], queryFn: () => securityApi.getSites(), enabled: tab === 'sites' });

  const createClientMutation = useMutation({
    mutationFn: (data: any) => securityApi.createClient(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sec-clients'] }); setShowForm(false); toast.success('Client added'); },
  });

  const createContractMutation = useMutation({
    mutationFn: (data: any) => securityApi.createContract(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sec-contracts'] }); setShowForm(false); toast.success('Contract added'); },
  });

  const createGuardMutation = useMutation({
    mutationFn: (data: any) => securityApi.createGuard(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sec-guards'] }); setShowForm(false); toast.success('Guard added'); },
  });

  const createSiteMutation = useMutation({
    mutationFn: (data: any) => securityApi.createSite(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sec-sites'] }); setShowForm(false); toast.success('Site added'); },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => invoiceApi.create(data),
    onSuccess: () => { 
      toast.success('Invoice created');
      setSelectedContract(null);
    },
  });

  const isLoading = lc || lco || lg || ls;

  const handleAdd = () => {
    if (tab === 'clients') createClientMutation.mutate(formData);
    if (tab === 'contracts') createContractMutation.mutate(formData);
    if (tab === 'guards') createGuardMutation.mutate(formData);
    if (tab === 'sites') createSiteMutation.mutate(formData);
  };

  return (
    <div>
      <PageHeader 
        title="Jolu Security Module" 
        subtitle="Clients, contracts, guards, and deployments" 
        actions={
          <button onClick={() => { setShowForm(true); setFormData({}); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add {tab.slice(0, -1)}
          </button>
        }
      />

      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['clients', 'contracts', 'guards', 'sites'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setShowForm(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-jolu-600 text-white' : 'bg-white border'}`}>{t}</button>
          ))}
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4 capitalize">New {tab.slice(0, -1)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tab === 'clients' && (
                <>
                  <div><label className="label">Name</label><input className="input" onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div><label className="label">Phone</label><input className="input" onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                </>
              )}
              {tab === 'contracts' && (
                <>
                  <div><label className="label">Client ID</label><input className="input" onChange={e => setFormData({...formData, clientId: e.target.value})} /></div>
                  <div><label className="label">Monthly Fee</label><input className="input" type="number" onChange={e => setFormData({...formData, monthlyFee: Number(e.target.value)})} /></div>
                  <div><label className="label">Start Date</label><input className="input" type="date" onChange={e => setFormData({...formData, startDate: new Date(e.target.value)})} /></div>
                </>
              )}
              {tab === 'guards' && (
                <>
                  <div><label className="label">First Name</label><input className="input" onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                  <div><label className="label">Last Name</label><input className="input" onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                  <div><label className="label">Employee No</label><input className="input" onChange={e => setFormData({...formData, employeeNo: e.target.value})} /></div>
                  <div><label className="label">Phone</label><input className="input" onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                </>
              )}
              {tab === 'sites' && (
                <>
                  <div><label className="label">Name</label><input className="input" onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div>
                    <label className="label">Security Client</label>
                    <select className="input" onChange={e => setFormData({...formData, clientId: e.target.value})}>
                      <option value="">Select Client</option>
                      {(clients?.data?.data || []).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div><label className="label">Address</label><input className="input" onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAdd} className="btn-primary">Save</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

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
                <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Contract</th><th className="px-6 py-3">Client</th><th className="px-6 py-3">Monthly Fee</th><th className="px-6 py-3">Guards</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr></thead>
                <tbody>
                  {(contracts?.data?.data || []).map((c: any) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-6 py-4">{c.contractNumber}</td>
                      <td className="px-6 py-4">{c.client.name}</td>
                      <td className="px-6 py-4">{formatCurrency(Number(c.monthlyFee))}</td>
                      <td className="px-6 py-4">{c.guardsCount}</td>
                      <td className="px-6 py-4">{c.status}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedContract(c)}
                          className="p-1 hover:bg-gray-100 rounded text-jolu-600"
                          title="Generate Invoice"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
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

      {selectedContract && (
        <InvoiceModal
          isOpen={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          onSubmit={(data) => createInvoiceMutation.mutate(data)}
          initialData={{
            type: 'INVOICE',
            securityClientId: selectedContract.clientId,
            contractId: selectedContract.id,
            lines: [{
              description: `Security Services for ${selectedContract.contractNumber}`,
              quantity: 1,
              unitPrice: selectedContract.monthlyFee,
              taxRate: 16,
              total: selectedContract.monthlyFee
            }]
          }}
        />
      )}
    </div>
  );
}
