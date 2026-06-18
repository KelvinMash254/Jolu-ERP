import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../services/api';
import { PageHeader, LoadingSpinner, StatusBadge, formatCurrency } from '../components/ui/Shared';
import type { MachineryUnit, SparePart } from '../types';

export default function InventoryPage() {
  const [tab, setTab] = useState<'machinery' | 'spare-parts' | 'vehicles'>('machinery');

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

  const machinery = (machineryData?.data?.data || []) as MachineryUnit[];
  const parts = (partsData?.data?.data || []) as SparePart[];
  const vehicles = vehiclesData?.data?.data || [];

  return (
    <div>
      <PageHeader title="Inventory Management" subtitle="Machinery, spare parts, and vehicles" />

      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['machinery', 'spare-parts', 'vehicles'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-jolu-600 text-white' : 'bg-white border text-gray-600'}`}>
              {t.replace('-', ' ')}
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
          loadingP ? <LoadingSpinner /> : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3">Part Number</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Qty</th><th className="px-6 py-3">Reorder Level</th><th className="px-6 py-3">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.id} className={`border-t hover:bg-gray-50 ${p.quantity <= p.reorderLevel ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 font-medium">{p.partNumber}</td>
                      <td className="px-6 py-4">{p.partName}</td>
                      <td className="px-6 py-4">{p.category || '-'}</td>
                      <td className="px-6 py-4 font-semibold">{p.quantity}</td>
                      <td className="px-6 py-4">{p.reorderLevel}</td>
                      <td className="px-6 py-4">{formatCurrency(Number(p.sellingPrice || 0))}</td>
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
      </div>
    </div>
  );
}
