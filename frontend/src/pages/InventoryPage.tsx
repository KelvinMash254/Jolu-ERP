import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api, { inventoryApi } from '../services/api';
import { PageHeader, LoadingSpinner, StatusBadge, formatCurrency } from '../components/ui/Shared';
import type { MachineryUnit, SparePart } from '../types';
import InventoryModal from '../components/InventoryModal';
import MachineryDocumentsTab from '../components/MachineryDocumentsTab';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';


export default function InventoryPage() {
  const { currentCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'machinery' | 'spare-parts' | 'vehicles' | 'documents'>(
    currentCompany?.code === 'SECURITY' ? 'spare-parts' : 'machinery'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: machineryData, isLoading: loadingM } = useQuery({
    queryKey: ['machinery'],
    queryFn: () => inventoryApi.getMachinery(),
    enabled: tab === 'machinery',
  });

  const { data: partsData, isLoading: loadingP } = useQuery({
    queryKey: ['spare-parts'],
    queryFn: () => inventoryApi.getSpareParts(),
    enabled: tab === 'spare-parts',
  });

  const { data: vehiclesData, isLoading: loadingV } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => inventoryApi.getVehicles(),
    enabled: tab === 'vehicles',
  });

  const createMutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: any }) => {
      if (type === 'machinery') return inventoryApi.createMachinery(data);
      if (type === 'spare-parts') return inventoryApi.createSparePart(data);
      return inventoryApi.createVehicle(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type] });
      setIsModalOpen(false);
      toast.success(`${variables.type} added successfully`);
    },
    onError: () => toast.error('Failed to add item'),
  });

  const stockOutMutation = useMutation({
    mutationFn: ({ partId, quantity }: { partId: string; quantity: number }) => {
      return api.post(`/inventory/spare-parts/${partId}/stock-out`, { quantity, notes: 'Sale' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      toast.success('Sale recorded successfully. Stock updated.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to record sale');
    }
  });

  const machinery = (machineryData?.data?.data || []) as MachineryUnit[];
  const parts = (partsData?.data?.data || []) as SparePart[];
  const vehicles = vehiclesData?.data?.data || [];

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        subtitle={
          currentCompany?.code === "SECURITY"
            ? "Security uniforms and equipment inventory"
            : "Machinery, spare parts, and vehicles"
        }
        actions={
          tab !== 'documents' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {currentCompany?.code === "SECURITY"
                ? "Add Security Item"
                : `Add ${tab.replace("-", " ")}`}
            </button>
          )
        }
      />

      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['machinery', 'spare-parts', 'vehicles', 'documents'] as const)
            .filter(t => {
              if (currentCompany?.code === 'SECURITY') return t === 'spare-parts';
              if (currentCompany?.code === 'MACHINERIES') return t !== 'vehicles';
              if (currentCompany?.code === 'AUTOMOBILE') return t === 'vehicles' || t === 'spare-parts';
              return true;
            })
            .map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-jolu-600 text-white' : 'bg-white border text-gray-600'}`}>
                {currentCompany?.code === 'SECURITY' && t === 'spare-parts' ? 'Security Items' : t.replace('-', ' ')}
              </button>
            ))}
        </div>

        {tab === 'machinery' && (
          loadingM ? <LoadingSpinner /> : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3">Product</th><th className="px-6 py-3">Model</th><th className="px-6 py-3">Chassis No.</th><th className="px-6 py-3">Engine No.</th><th className="px-6 py-3">Registration No.</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Selling Price</th>
                  </tr>
                </thead>
                <tbody>
                  {machinery.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{m.productName}</td>
                      <td className="px-6 py-4">{m.brand} {m.model}</td>
                      <td className="px-6 py-4">{m.chassisNumber || '-'}</td>
                      <td className="px-6 py-4">{m.engineNumber || '-'}</td>
                      <td className="px-6 py-4">{m.registrationNumber || '-'}</td>
                      <td className="px-6 py-4"><StatusBadge status={m.stockStatus} /></td>
                      <td className="px-6 py-4 font-semibold">{formatCurrency(Number(m.sellingPrice))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'spare-parts' && (
          loadingP ? (
            <LoadingSpinner />
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3">
                      {currentCompany?.code === 'SECURITY' ? 'Item Code' : 'Part Number'}
                    </th>
                    <th className="px-6 py-3">
                      {currentCompany?.code === 'SECURITY' ? 'Item Name' : 'Name'}
                    </th>
                    <th className="px-6 py-3">Category</th>
                    {currentCompany?.code === 'SECURITY' && (
                      <th className="px-6 py-3">Unit</th>
                    )}
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Reorder Level</th>
                    {currentCompany?.code !== 'SECURITY' && (
                      <th className="px-6 py-3">Price</th>
                    )}
                    {currentCompany?.code !== 'SECURITY' && (
                      <th className="px-6 py-3 text-center">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-t hover:bg-gray-50 ${
                        p.quantity <= p.reorderLevel ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">
                        {p.partNumber}
                      </td>
                      <td className="px-6 py-4">
                        {p.partName}
                      </td>
                      <td className="px-6 py-4">
                        {p.category || '-'}
                      </td>
                      {currentCompany?.code === 'SECURITY' && (
                        <td className="px-6 py-4">
                          {(p as any).unit || 'Pieces'}
                        </td>
                      )}
                      <td className="px-6 py-4 font-semibold">
                        {p.quantity}
                      </td>
                      <td className="px-6 py-4">
                        {p.reorderLevel}
                      </td>
                      {currentCompany?.code !== 'SECURITY' && (
                        <td className="px-6 py-4">
                          {formatCurrency(Number(p.sellingPrice || 0))}
                        </td>
                      )}
                      {currentCompany?.code !== 'SECURITY' && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              const qtyStr = prompt(`Enter quantity of ${p.partName} sold:`);
                              if (qtyStr === null) return;
                              const qty = parseInt(qtyStr, 10);
                              if (isNaN(qty) || qty <= 0) {
                                toast.error("Please enter a valid quantity");
                                return;
                              }
                              if (qty > p.quantity) {
                                toast.error("Insufficient stock to record sale");
                                return;
                              }
                              stockOutMutation.mutate({ partId: p.id, quantity: qty });
                            }}
                            className="text-xs bg-red-50 text-red-700 font-bold px-2 py-1 rounded border border-red-200 hover:bg-red-100"
                          >
                            Record Sale
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'vehicles' && (
          loadingV ? <LoadingSpinner /> : vehicles.length ? (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3">Registration</th><th className="px-6 py-3">Make/Model</th><th className="px-6 py-3">Year</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v: { id: string; registrationNumber: string; make: string; model: string; year: number; stockStatus: string; sellingPrice: number }) => (
                    <tr key={v.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{v.registrationNumber}</td>
                      <td className="px-6 py-4">{v.make} {v.model}</td>
                      <td className="px-6 py-4">{v.year}</td>
                      <td className="px-6 py-4"><StatusBadge status={v.stockStatus} /></td>
                      <td className="px-6 py-4">{formatCurrency(Number(v.sellingPrice))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-500 text-center py-12">No vehicles in inventory</p>
        )}

        {tab === 'documents' && (
          <MachineryDocumentsTab />
        )}
      </div>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={tab as any}
        onSubmit={(type, data) => createMutation.mutate({ type, data })}
      />
    </div>
  );
}
