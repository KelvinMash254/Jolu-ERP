import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { invoiceApi } from '../services/api';
import { PageHeader, LoadingSpinner, StatusBadge, formatCurrency } from '../components/ui/Shared';
import InvoiceModal from '../components/InvoiceModal';
import type { Invoice } from '../types';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => invoiceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsModalOpen(false);
    },
  });

  const invoices = (data?.data?.data || []) as Invoice[];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Proforma, tax invoices, receipts, and quotations"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            Create Invoice
          </button>
        }
      />

      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Number</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Paid</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{inv.type.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">{inv.customer?.name || '-'}</td>
                    <td className="px-6 py-4">{formatCurrency(Number(inv.totalAmount))}</td>
                    <td className="px-6 py-4">{formatCurrency(Number(inv.amountPaid))}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
                {!invoices.length && <tr><td colSpan={6} className="text-center py-12 text-gray-500">No invoices yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
