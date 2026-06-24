import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { crmApi, securityApi } from '../services/api';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function InvoiceModal({ isOpen, onClose, onSubmit }: InvoiceModalProps) {
  const [type, setType] = useState('TAX_INVOICE');
  const [customerId, setCustomerId] = useState('');
  const [securityClientId, setSecurityClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ description: '', quantity: 1, unitPrice: 0, taxRate: 16, total: 0 }]);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
    enabled: isOpen,
  });

  const { data: securityClientsData } = useQuery({
    queryKey: ['security-clients'],
    queryFn: () => securityApi.getClients(),
    enabled: isOpen,
  });

  const customers = customersData?.data?.data || [];
  const securityClients = securityClientsData?.data?.data || [];

  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 16, total: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    const line = { ...newLines[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      line.total = Number(line.quantity) * Number(line.unitPrice);
    }
    
    newLines[index] = line;
    setLines(newLines);
  };

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const taxAmount = lines.reduce((sum, line) => sum + (line.total * (line.taxRate / 100)), 0);
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      customerId: customerId || undefined,
      securityClientId: securityClientId || undefined,
      dueDate,
      notes,
      lines,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Create New Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              >
                <option value="PROFORMA">Proforma Invoice</option>
                <option value="TAX_INVOICE">Invoice</option>
                <option value="QUOTATION">Quotation</option>
                <option value="DELIVERY_NOTE">Delivery Note</option>
                <option value="RECEIPT">Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer (Machineries/Auto)</label>
              <select 
                value={customerId} 
                onChange={(e) => { setCustomerId(e.target.value); setSecurityClientId(''); }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              >
                <option value="">Select Customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Client</label>
              <select 
                value={securityClientId} 
                onChange={(e) => { setSecurityClientId(e.target.value); setCustomerId(''); }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              >
                <option value="">Select Security Client</option>
                {securityClients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Line Items</h3>
              <button 
                type="button" 
                onClick={addLine}
                className="flex items-center gap-1 text-sm text-jolu-600 font-medium hover:text-jolu-700"
              >
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium w-20">Qty</th>
                    <th className="pb-2 font-medium w-32">Unit Price</th>
                    <th className="pb-2 font-medium w-24">Tax (%)</th>
                    <th className="pb-2 font-medium w-32 text-right">Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="py-3 pr-4">
                        <input 
                          type="text" 
                          value={line.description} 
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className="w-full border-none focus:ring-0 p-0 text-sm"
                          required
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input 
                          type="number" 
                          value={line.quantity} 
                          onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                          className="w-full border-none focus:ring-0 p-0 text-sm"
                          min="1"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input 
                          type="number" 
                          value={line.unitPrice} 
                          onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                          className="w-full border-none focus:ring-0 p-0 text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <select 
                          value={line.taxRate} 
                          onChange={(e) => updateLine(index, 'taxRate', Number(e.target.value))}
                          className="w-full border-none focus:ring-0 p-0 text-sm bg-transparent"
                        >
                          <option value="0">0%</option>
                          <option value="16">16%</option>
                        </select>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {line.total.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          type="button" 
                          onClick={() => removeLine(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2 border-t pt-4">
            <div className="flex justify-between w-64 text-sm">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-64 text-sm">
              <span className="text-gray-500">VAT (16%):</span>
              <span className="font-medium">KES {taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-64 text-lg font-bold">
              <span>Total:</span>
              <span className="text-jolu-700">KES {total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              placeholder="Payment terms, bank details, etc."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-6">
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
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
