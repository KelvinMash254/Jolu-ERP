import { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../services/api';

interface FinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function FinancingModal({ isOpen, onClose, onSubmit }: FinancingModalProps) {
  const [customerId, setCustomerId] = useState('');
  const [bankName, setBankName] = useState('');
  const [loanAmount, setLoanAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
    enabled: isOpen,
  });

  const customers = customersData?.data?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerId,
      bankName,
      loanAmount,
      depositAmount,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">New Financing Application</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input 
              type="text" 
              value={bankName} 
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              placeholder="e.g. KCB, Equity, Kingdom Bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (KES)</label>
            <input 
              type="number" 
              value={loanAmount} 
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (KES)</label>
            <input 
              type="number" 
              value={depositAmount} 
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
            />
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
              Create Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
