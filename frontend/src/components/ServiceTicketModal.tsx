import { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { crmApi, inventoryApi } from '../services/api';

interface ServiceTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function ServiceTicketModal({ isOpen, onClose, onSubmit }: ServiceTicketModalProps) {
  const [customerId, setCustomerId] = useState('');
  const [machineryUnitId, setMachineryUnitId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [problem, setProblem] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
    enabled: isOpen,
  });

  const { data: machineryData } = useQuery({
    queryKey: ['machinery'],
    queryFn: () => inventoryApi.getMachinery(),
    enabled: isOpen,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => inventoryApi.getVehicles(),
    enabled: isOpen,
  });

  const customers = customersData?.data?.data || [];
  const machinery = machineryData?.data?.data || [];
  const vehicles = vehiclesData?.data?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerId,
      machineryUnitId: machineryUnitId || undefined,
      vehicleId: vehicleId || undefined,
      problem,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">New Service Ticket</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select 
              value={customerId} 
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              required
            >
              <option value="">Select Customer</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Machinery Unit (Optional)</label>
            <select 
              value={machineryUnitId} 
              onChange={(e) => { setMachineryUnitId(e.target.value); if (e.target.value) setVehicleId(''); }}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
            >
              <option value="">Select Unit</option>
              {machinery.map((m: any) => (
                <option key={m.id} value={m.id}>{m.productName} ({m.serialNumber || m.chassisNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle (Optional)</label>
            <select 
              value={vehicleId} 
              onChange={(e) => { setVehicleId(e.target.value); if (e.target.value) setMachineryUnitId(''); }}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} ({v.registrationNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Problem Description</label>
            <textarea 
              value={problem} 
              onChange={(e) => setProblem(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              placeholder="Describe the issue reported by the customer..."
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
