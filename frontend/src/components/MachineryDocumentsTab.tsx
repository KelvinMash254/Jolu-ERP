import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineryDocsApi, crmApi, inventoryApi } from '../services/api';
import { LoadingSpinner, formatCurrency } from './ui/Shared';
import { Plus, Download, FileText, FileCheck, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MachineryDocumentsTab() {
  const [subTab, setSubTab] = useState<'contracts' | 'deliveries' | 'gate-passes'>('contracts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: contractsData, isLoading: loadingC } = useQuery({
    queryKey: ['machineryContracts'],
    queryFn: machineryDocsApi.getContracts,
    enabled: subTab === 'contracts',
  });

  const { data: deliveriesData, isLoading: loadingD } = useQuery({
    queryKey: ['machineryDeliveries'],
    queryFn: machineryDocsApi.getDeliveries,
    enabled: subTab === 'deliveries',
  });

  const { data: gatePassesData, isLoading: loadingG } = useQuery({
    queryKey: ['machineryGatePasses'],
    queryFn: machineryDocsApi.getGatePasses,
    enabled: subTab === 'gate-passes',
  });

  const contracts = contractsData?.data?.data || [];
  const deliveries = deliveriesData?.data?.data || [];
  const gatePasses = gatePassesData?.data?.data || [];

  const handleDownload = async (id: string, type: 'contract' | 'delivery' | 'gate-pass') => {
    try {
      let res;
      if (type === 'contract') res = await machineryDocsApi.getContractPdf(id);
      else if (type === 'delivery') res = await machineryDocsApi.getDeliveryPdf(id);
      else res = await machineryDocsApi.getGatePassPdf(id);

      if (res.data?.success && res.data?.pdfUrl) {
        window.open(res.data.pdfUrl, '_blank');
      } else {
        toast.error('Failed to generate PDF path');
      }
    } catch (err: any) {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('contracts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${subTab === 'contracts' ? 'bg-jolu-700 text-white' : 'bg-white border text-gray-700'}`}
          >
            <FileText className="w-3.5 h-3.5" /> Sales Contracts
          </button>
          <button
            onClick={() => setSubTab('deliveries')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${subTab === 'deliveries' ? 'bg-jolu-700 text-white' : 'bg-white border text-gray-700'}`}
          >
            <FileCheck className="w-3.5 h-3.5" /> Delivery Notes
          </button>
          <button
            onClick={() => setSubTab('gate-passes')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${subTab === 'gate-passes' ? 'bg-jolu-700 text-white' : 'bg-white border text-gray-700'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Gate Passes
          </button>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs flex items-center gap-1.5 py-2"
        >
          <Plus className="w-3.5 h-3.5" /> Create Document
        </button>
      </div>

      {subTab === 'contracts' && (
        loadingC ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Contract No</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Machinery Unit</th>
                  <th className="px-6 py-3 text-right">Sale Price</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c: any) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-jolu-700">{c.contractNumber}</td>
                    <td className="px-6 py-4">{c.customer.name}</td>
                    <td className="px-6 py-4">{c.machineryUnit.productName} ({c.machineryUnit.brand})</td>
                    <td className="px-6 py-4 text-right font-mono font-bold">{formatCurrency(Number(c.salePrice))}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDownload(c.id, 'contract')} className="text-jolu-600 hover:text-jolu-800 font-semibold flex items-center gap-1.5 mx-auto">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No Sales Contracts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {subTab === 'deliveries' && (
        loadingD ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Delivery No</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Machinery Unit</th>
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d: any) => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-jolu-700">{d.deliveryNumber}</td>
                    <td className="px-6 py-4">{d.customer.name}</td>
                    <td className="px-6 py-4">{d.machineryUnit.productName}</td>
                    <td className="px-6 py-4">{d.destination || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDownload(d.id, 'delivery')} className="text-jolu-600 hover:text-jolu-800 font-semibold flex items-center gap-1.5 mx-auto">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No Delivery Notes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {subTab === 'gate-passes' && (
        loadingG ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Gate Pass No</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Machinery Unit</th>
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gatePasses.map((g: any) => (
                  <tr key={g.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-jolu-700">{g.gatePassNumber}</td>
                    <td className="px-6 py-4">{g.customer.name}</td>
                    <td className="px-6 py-4">{g.machineryUnit.productName}</td>
                    <td className="px-6 py-4">{g.destination || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDownload(g.id, 'gate-pass')} className="text-jolu-600 hover:text-jolu-800 font-semibold flex items-center gap-1.5 mx-auto">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {gatePasses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No Gate Passes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {isModalOpen && (
        <CreateDocumentModal
          type={subTab}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (subTab === 'contracts') queryClient.invalidateQueries({ queryKey: ['machineryContracts'] });
            if (subTab === 'deliveries') queryClient.invalidateQueries({ queryKey: ['machineryDeliveries'] });
            if (subTab === 'gate-passes') queryClient.invalidateQueries({ queryKey: ['machineryGatePasses'] });
          }}
        />
      )}
    </div>
  );
}

function CreateDocumentModal({ type, onClose, onSuccess }: { type: 'contracts' | 'deliveries' | 'gate-passes'; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<any>({
    customerId: '',
    machineryUnitId: '',
    salePrice: '',
    terms: '',
    destination: '',
    receivedBy: '',
    driverName: '',
    driverIdNumber: '',
    driverPhone: '',
    truckNumberPlate: '',
    timeOut: '',
    equipmentDetails: '',
    quantity: '1',
    supplier: 'JOLU AGRICULTURAL MACHINERIES LTD',
    comments: '',
    securityOfficer: '',
    staffPresent: '',
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => crmApi.getCustomers({ limit: '100' }),
  });

  const { data: machineryData } = useQuery({
    queryKey: ['machinery-all'],
    queryFn: () => inventoryApi.getMachinery({ limit: '100' }),
  });

  const customers = customersData?.data?.data || [];
  const machineryUnits = machineryData?.data?.data || [];

  const handleUnitChange = (unitId: string) => {
    const unit = machineryUnits.find((m: any) => m.id === unitId);
    if (unit) {
      setFormData((prev: any) => ({
        ...prev,
        machineryUnitId: unitId,
        salePrice: Number(unit.sellingPrice),
        equipmentDetails: `${unit.productName.toUpperCase()}\nBRAND: ${unit.brand.toUpperCase()} MODEL: ${unit.model.toUpperCase()}`,
        comments: `REG NO: ${unit.registrationNumber || '-'}\nCHASSIS: ${unit.chassisNumber || '-'}\nENGINE: ${unit.engineNumber || '-'}`,
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, machineryUnitId: unitId }));
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (type === 'contracts') return machineryDocsApi.createContract(data);
      if (type === 'deliveries') return machineryDocsApi.createDelivery(data);
      return machineryDocsApi.createGatePass(data);
    },
    onSuccess: () => {
      toast.success('Document created successfully');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create document');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold capitalize">Create {type === 'contracts' ? 'Sales Contract' : type === 'deliveries' ? 'Delivery Note' : 'Gate Pass'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer</label>
              <select
                className="input"
                value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                required
              >
                <option value="">Select Customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Machinery Unit</label>
              <select
                className="input"
                value={formData.machineryUnitId}
                onChange={e => handleUnitChange(e.target.value)}
                required
              >
                <option value="">Select Unit</option>
                {machineryUnits.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.productName} ({m.brand} {m.model})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contracts Specific Fields */}
          {type === 'contracts' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Sale Price (KES)</label>
                <input
                  type="number" className="input"
                  value={formData.salePrice}
                  onChange={e => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="label">Terms & Conditions</label>
                <textarea
                  className="input h-20"
                  value={formData.terms}
                  onChange={e => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Leave empty for system defaults..."
                />
              </div>
            </div>
          )}

          {/* Deliveries & Gate Pass Shared Fields */}
          {(type === 'deliveries' || type === 'gate-passes') && (
            <>
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="label">Destination / Location</label>
                  <input
                    type="text" className="input"
                    value={formData.destination}
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                    required
                  />
                </div>
                {type === 'deliveries' && (
                  <div>
                    <label className="label">Received By (Name)</label>
                    <input
                      type="text" className="input"
                      value={formData.receivedBy}
                      onChange={e => setFormData({ ...formData, receivedBy: e.target.value })}
                    />
                  </div>
                )}
                {type === 'gate-passes' && (
                  <div>
                    <label className="label">Time Out</label>
                    <input
                      type="text" className="input" placeholder="e.g. 10:30 AM"
                      value={formData.timeOut}
                      onChange={e => setFormData({ ...formData, timeOut: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Driver & Truck Information</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="label">Driver Name</label>
                    <input
                      type="text" className="input"
                      value={formData.driverName}
                      onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Driver ID</label>
                    <input
                      type="text" className="input"
                      value={formData.driverIdNumber}
                      onChange={e => setFormData({ ...formData, driverIdNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Driver Phone</label>
                    <input
                      type="text" className="input"
                      value={formData.driverPhone}
                      onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Truck Plate</label>
                    <input
                      type="text" className="input"
                      value={formData.truckNumberPlate}
                      onChange={e => setFormData({ ...formData, truckNumberPlate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Gate Pass Specific Fields */}
          {type === 'gate-passes' && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Equipment details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Equipments</label>
                    <textarea
                      className="input h-20 text-xs"
                      value={formData.equipmentDetails}
                      onChange={e => setFormData({ ...formData, equipmentDetails: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Comments / Chassis / Engine</label>
                    <textarea
                      className="input h-20 text-xs"
                      value={formData.comments}
                      onChange={e => setFormData({ ...formData, comments: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="label">Quantity</label>
                    <input
                      type="number" className="input"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Supplier</label>
                    <input
                      type="text" className="input"
                      value={formData.supplier}
                      onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Sign Off</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Security/Gate Officer</label>
                    <input
                      type="text" className="input" placeholder="e.g. Officer Kamau"
                      value={formData.securityOfficer}
                      onChange={e => setFormData({ ...formData, securityOfficer: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Jolu Staff Present</label>
                    <input
                      type="text" className="input" placeholder="e.g. Walter Head of Business"
                      value={formData.staffPresent}
                      onChange={e => setFormData({ ...formData, staffPresent: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
