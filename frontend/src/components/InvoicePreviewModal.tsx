import { useState } from 'react';
import { X, Download, Send, Palette } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { invoiceApi } from '../services/api';
import { formatCurrency, StatusBadge, LoadingSpinner } from './ui/Shared';
import toast from 'react-hot-toast';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
}

const COLORS = [
  { name: 'Jolu Blue', value: '#0ea5e9' },
  { name: 'Forest Green', value: '#15803d' },
  { name: 'Midnight', value: '#1e293b' },
  { name: 'Crimson', value: '#be123c' },
  { name: 'Royal Purple', value: '#7e22ce' },
];

export default function InvoicePreviewModal({ isOpen, onClose, invoiceId }: InvoicePreviewModalProps) {
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceApi.getOne(invoiceId),
    enabled: !!invoiceId && isOpen,
  });

  const generatePdfMutation = useMutation({
    mutationFn: (color: string) => invoiceApi.generatePdf(invoiceId, { primaryColor: color }),
    onSuccess: (res) => {
      window.open(res.data.data.pdfUrl, '_blank');
      toast.success('PDF generated successfully');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => invoiceApi.send(invoiceId),
    onSuccess: () => {
      toast.success('Invoice sent to customer');
      onClose();
    },
  });

  if (!isOpen) return null;

  const invoice = invoiceData?.data?.data;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Invoice Preview</h2>
            {invoice && <StatusBadge status={invoice.status} />}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Controls Panel */}
          <div className="w-80 border-r p-6 space-y-8 overflow-y-auto bg-gray-50">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Customization
              </h3>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setPrimaryColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 ${primaryColor === color.value ? 'border-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-10 p-1 rounded border bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t space-y-3">
              <button
                onClick={() => generatePdfMutation.mutate(primaryColor)}
                disabled={generatePdfMutation.isPending || !invoice}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                {generatePdfMutation.isPending ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={() => sendEmailMutation.mutate()}
                disabled={sendEmailMutation.isPending || !invoice?.customer?.email}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-jolu-600 text-white rounded-lg text-sm font-medium hover:bg-jolu-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendEmailMutation.isPending ? 'Sending...' : 'Send to Customer'}
              </button>
              {!invoice?.customer?.email && invoice && (
                <p className="text-[10px] text-amber-600 text-center">Customer email missing</p>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 bg-gray-200 p-8 overflow-y-auto flex justify-center">
            {isLoading || !invoice ? <LoadingSpinner /> : (
              <div className="bg-white w-full max-w-[210mm] shadow-lg p-[20mm] min-h-[297mm] flex flex-col">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>{invoice.company.name}</h1>
                    <p className="text-sm text-gray-600">{invoice.company.address}</p>
                    <p className="text-sm text-gray-600">PIN: {invoice.company.kraPin}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>
                      {invoice.type.replace(/_/g, ' ')}
                    </h2>
                    <p className="text-sm font-medium"># {invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
                    {invoice.dueDate && <p className="text-sm text-gray-600">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>}
                  </div>
                </div>

                <div className="mb-12">
                  <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 border-b pb-1">Bill To</h3>
                  <p className="font-bold">{invoice.customer?.name || invoice.securityClient?.name}</p>
                  {invoice.customer && (
                    <>
                      <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
                      <p className="text-sm text-gray-600">{invoice.customer.email}</p>
                      <p className="text-sm text-gray-600">{invoice.customer.physicalAddress}</p>
                    </>
                  )}
                </div>

                <div className="flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white" style={{ backgroundColor: primaryColor }}>
                        <th className="py-2 px-4 text-left rounded-l">Description</th>
                        <th className="py-2 px-4 text-center">Qty</th>
                        <th className="py-2 px-4 text-right">Unit Price</th>
                        <th className="py-2 px-4 text-right rounded-r">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(invoice.lines || []).map((line: any) => (
                        <tr key={line.id}>
                          <td className="py-4 px-4">{line.description}</td>
                          <td className="py-4 px-4 text-center">{Number(line.quantity)}</td>
                          <td className="py-4 px-4 text-right">{Number(line.unitPrice).toLocaleString()}</td>
                          <td className="py-4 px-4 text-right font-medium">{Number(line.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatCurrency(Number(invoice.subtotal))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">VAT (16%)</span>
                      <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2" style={{ color: primaryColor }}>
                      <span>Total</span>
                      <span>{formatCurrency(Number(invoice.totalAmount))}</span>
                    </div>
                    {Number(invoice.amountPaid) > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Amount Paid</span>
                          <span>{formatCurrency(Number(invoice.amountPaid))}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-1">
                          <span>Balance Due</span>
                          <span>{formatCurrency(Number(invoice.totalAmount) - Number(invoice.amountPaid))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {invoice.notes && (
                  <div className="mt-12 pt-12 border-t">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Notes & Terms</h4>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
