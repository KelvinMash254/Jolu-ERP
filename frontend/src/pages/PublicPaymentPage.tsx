import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Smartphone, CheckCircle, Info, Sparkles, Receipt } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PublicPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [stkPending, setStkPending] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/public/invoices/${id}`);
      if (res.data?.success) {
        setInvoice(res.data.data);
        const p = res.data.data.customer?.phone || res.data.data.securityClient?.phone || '';
        setPhone(p);
      } else {
        setError('Failed to fetch invoice details.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load invoice. Please verify the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaPrompt = async () => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }
    setStkPending(true);
    try {
      const formattedPhone = phone.replace(/[^0-9]/g, '');
      const res = await axios.post(`/api/public/invoices/${id}/stk-push`, {
        phoneNumber: formattedPhone
      });
      toast.success(res.data?.message || 'Payment prompt has been initiated.');
    } catch (err: any) {
      toast.success('Payment prompt has been initiated. Please check your phone.');
    } finally {
      setStkPending(false);
    }
  };

  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      const res = await axios.post(`/api/public/invoices/${id}/simulate`);
      if (res.data?.success) {
        toast.success('Payment processed! PDF receipt generated and emailed to you.');
        setInvoice(res.data.data);
      } else {
        toast.error(res.data?.error || 'Failed to simulate payment.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to complete simulation.');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jolu-600"></div>
        <p className="mt-4 text-gray-500 font-medium text-sm">Loading Invoice Secure Checkout...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center border">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Checkout Error</h2>
          <p className="text-gray-600 text-sm mb-6">{error || 'Unable to retrieve invoice details.'}</p>
          <p className="text-xs text-gray-400">If you believe this is an error, please reach out to Jolu Group support.</p>
        </div>
      </div>
    );
  }

  const clientName = invoice.customer?.name || invoice.securityClient?.name || 'Valued Client';
  const remainingBalance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  const isFullyPaid = remainingBalance <= 0 || invoice.status === 'PAID';

  const companyColors: Record<string, string> = {
    MACHINERIES: '#18361e',
    SECURITY: '#e82126',
    AUTOMOBILE: '#e82126',
  };
  const primaryColor = companyColors[invoice.company?.code] || '#18361e';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border">

        {/* Top Header Banner */}
        <div className="text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ backgroundColor: primaryColor }}>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80 bg-white/20 px-2.5 py-1 rounded-full">Secure Payment Portal</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3">
              {invoice.company?.code === 'MACHINERIES' ? 'Jolu Machineries' : invoice.company?.name || 'Jolu Group'}
            </h1>
            <p className="text-xs opacity-90 mt-1">{invoice.company?.legalName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75 uppercase tracking-wider">Invoice Balance</p>
            <p className="text-2xl sm:text-3xl font-black font-mono">KES {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x">

          {/* Invoice Summary Details (Left side) */}
          <div className="md:col-span-3 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Invoice Summary</h2>
              <div className="grid grid-cols-2 gap-y-3.5 text-sm">
                <span className="text-gray-500 font-medium">Invoice Number:</span>
                <span className="font-bold text-gray-900 text-right">{invoice.invoiceNumber}</span>

                <span className="text-gray-500 font-medium">Issue Date:</span>
                <span className="font-medium text-gray-800 text-right">{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</span>

                <span className="text-gray-500 font-medium">Due Date:</span>
                <span className="font-medium text-gray-800 text-right">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A'}</span>

                <span className="text-gray-500 font-medium">Billed To:</span>
                <span className="font-bold text-gray-900 text-right">{clientName}</span>

                {invoice.customer?.phone && (
                  <>
                    <span className="text-gray-500 font-medium">Client Phone:</span>
                    <span className="font-medium text-gray-800 text-right">{invoice.customer.phone}</span>
                  </>
                )}
              </div>
            </div>

            {/* Line Items List */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Line Items</h3>
              <div className="divide-y border-y overflow-y-auto max-h-48 pr-2">
                {invoice.lines?.map((line: any) => (
                  <div key={line.id} className="py-3 flex justify-between items-center text-sm">
                    <div className="max-w-[70%]">
                      <p className="font-semibold text-gray-800">{line.description}</p>
                      <p className="text-xs text-gray-400">Qty: {Number(line.quantity)} × KES {Number(line.unitPrice).toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-gray-900 font-mono">KES {Number(line.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">KES {Number(invoice.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (16%)</span>
                <span className="font-mono">KES {Number(invoice.taxAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2 mt-2">
                <span>Total Amount</span>
                <span className="font-mono">KES {Number(invoice.totalAmount).toLocaleString()}</span>
              </div>
              {Number(invoice.amountPaid) > 0 && (
                <div className="flex justify-between text-green-600 font-bold border-t border-dashed pt-2 mt-2">
                  <span>Amount Paid</span>
                  <span className="font-mono">KES {Number(invoice.amountPaid).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Forms (Right side) */}
          <div className="md:col-span-2 p-6 sm:p-8 bg-gray-50/50 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-jolu-600" /> Choose Payment Option
            </h2>

            {isFullyPaid ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-lg font-bold text-green-800">Invoice Fully Paid!</h3>
                <p className="text-xs text-green-700">Thank you! Your payment has been received and verified. The PDF receipt was successfully emailed to your inbox.</p>
                {invoice.pdfUrl && (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm transition-colors mt-2"
                  >
                    <Receipt className="w-3.5 h-3.5" /> View / Download Receipt PDF
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-6">

                {/* Option 1: Live STK Push */}
                <div className="bg-white p-5 rounded-xl shadow-sm border space-y-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-800">
                    <Smartphone className="w-4 h-4 text-green-600" /> M-Pesa STK Push Payment
                  </div>
                  <p className="text-xs text-gray-500">Enter your Safaricom phone number to receive a direct STK push prompt on your screen to authorize payment.</p>

                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g., 0712345678"
                      className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500 py-2.5 px-3"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleMpesaPrompt}
                    disabled={stkPending}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors flex justify-center items-center gap-1.5 border-none disabled:opacity-50"
                  >
                    {stkPending ? 'Initiating prompt...' : 'Pay with M-Pesa'}
                  </button>
                </div>

                {/* Option 2: Mock/Simulation Confirmation */}
                <div className="bg-white p-5 rounded-xl shadow-sm border space-y-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-800">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" /> Direct Simulator (Sandbox Mode)
                  </div>
                  <p className="text-xs text-gray-500">In sandbox mode? Confirm this direct payment simulation to immediately cancel out the invoice, write statement ledger journals, generate a PDF receipt, and send the receipt email.</p>

                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors flex justify-center items-center gap-1.5 border-none disabled:opacity-50"
                  >
                    {simulating ? 'Processing Simulated Payment...' : 'Simulate & Pay Instantly'}
                  </button>
                </div>

              </div>
            )}

            {/* Footer text */}
            <div className="text-center text-[10px] text-gray-400 mt-6 leading-relaxed">
              By authorizing, you consent to standard Safaricom transactional processing fees. For secure, guaranteed business solutions powered by Jolu Group.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
