import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency } from '../components/ui/Shared';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountingPage() {
  const [tab, setTab] = useState<'accounts' | 'journals' | 'trial-balance' | 'income' | 'balance-sheet' | 'receivables' | 'statements'>('accounts');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data: accounts, isLoading: la } = useQuery({ queryKey: ['coa'], queryFn: () => accountingApi.getChartOfAccounts(), enabled: tab === 'accounts' });
  const { data: journals, isLoading: lj } = useQuery({ queryKey: ['journals'], queryFn: () => accountingApi.getJournals(), enabled: tab === 'journals' });
  const { data: trialBalance, isLoading: lt } = useQuery({ queryKey: ['trial-balance'], queryFn: () => accountingApi.getTrialBalance(), enabled: tab === 'trial-balance' });
  const { data: income, isLoading: li } = useQuery({ queryKey: ['income'], queryFn: () => accountingApi.getIncomeStatement({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    endDate: new Date().toISOString(),
  }), enabled: tab === 'income' });
  const { data: balanceSheet, isLoading: lb } = useQuery({ queryKey: ['balance-sheet'], queryFn: () => accountingApi.getBalanceSheet(), enabled: tab === 'balance-sheet' });
  const { data: receivables, isLoading: lr } = useQuery({ queryKey: ['receivables'], queryFn: () => accountingApi.getReceivables(), enabled: tab === 'receivables' });

  // Load clients list for statement of accounts dropdown selector
  const { data: clientsData, isLoading: lc } = useQuery({
    queryKey: ['statement-clients'],
    queryFn: () => accountingApi.getStatementClients(),
    enabled: tab === 'statements',
  });

  // Load client statement ledger details
  const { data: statementDetails, isLoading: ls } = useQuery({
    queryKey: ['client-statement', selectedClientId],
    queryFn: () => accountingApi.getClientStatement(selectedClientId),
    enabled: tab === 'statements' && !!selectedClientId,
  });

  const tabs = [
    { id: 'accounts', label: 'Chart of Accounts' },
    { id: 'journals', label: 'Journals' },
    { id: 'trial-balance', label: 'Trial Balance' },
    { id: 'income', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'receivables', label: 'Receivables' },
    { id: 'statements', label: 'Client Statements' },
  ] as const;

  const isLoading = la || lj || lt || li || lb || lr || lc || (ls && !!selectedClientId);

  const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
    const content = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const cleanVal = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
        return cleanVal.includes(',') || cleanVal.includes('\n') || cleanVal.includes('"') ? `"${cleanVal}"` : cleanVal;
      }).join(','))
    ].join('\r\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTBCSV = () => {
    const headers = ['Account Code', 'Account Name', 'Debit (KES)', 'Credit (KES)'];
    const rows = (trialBalance?.data?.data || []).map((a: any) => [
      a.code,
      a.name,
      a.debit || 0,
      a.credit || 0
    ]);
    downloadCSV(headers, rows, 'Trial_Balance');
  };

  const handleExportIncomeCSV = () => {
    const headers = ['Type', 'Category/Name', 'Amount (KES)'];
    const rows: any[] = [];
    const revenue = income?.data?.data?.revenue || [];
    const expenses = income?.data?.data?.expenses || [];

    revenue.forEach((r: any) => rows.push(['Revenue', r.name, r.amount]));
    rows.push(['Revenue Total', 'Total Revenue', income?.data?.data?.totalRevenue || 0]);

    expenses.forEach((e: any) => rows.push(['Expense', e.name, e.amount]));
    rows.push(['Net Income', 'Net Income', income?.data?.data?.netIncome || 0]);

    downloadCSV(headers, rows, 'Income_Statement');
  };

  const handleExportBSCSV = () => {
    const headers = ['Section', 'Account/Category Name', 'Balance (KES)'];
    const rows: any[] = [];
    ['assets', 'liabilities', 'equity'].forEach(section => {
      const list = balanceSheet?.data?.data?.[section] || [];
      list.forEach((item: any) => {
        rows.push([section.toUpperCase(), item.name, item.balance]);
      });
    });
    downloadCSV(headers, rows, 'Balance_Sheet');
  };

  // PDF Download Trigger Functions
  const triggerPdfDownload = async (apiCall: () => Promise<any>, toastName: string) => {
    setDownloadingPdf(true);
    try {
      const res = await apiCall();
      if (res.data?.success && res.data?.pdfUrl) {
        window.open(res.data.pdfUrl, '_blank');
        toast.success(`${toastName} downloaded successfully`);
      } else {
        toast.error(`Failed to generate ${toastName} PDF`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Error downloading ${toastName} PDF`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadTB = () => triggerPdfDownload(() => accountingApi.downloadTrialBalancePdf(), 'Trial Balance');
  const handleDownloadIncome = () => triggerPdfDownload(() => accountingApi.downloadIncomeStatementPdf({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    endDate: new Date().toISOString(),
  }), 'Income Statement');
  const handleDownloadBS = () => triggerPdfDownload(() => accountingApi.downloadBalanceSheetPdf(), 'Balance Sheet');
  const handleDownloadReceivables = () => triggerPdfDownload(() => accountingApi.downloadReceivablesPdf(), 'Receivables');
  const handleDownloadStatement = () => {
    if (!selectedClientId) {
      toast.error('Please select a client to download statement');
      return;
    }
    triggerPdfDownload(() => accountingApi.downloadClientStatementPdf(selectedClientId), 'Statement of Account');
  };

  return (
    <div>
      <PageHeader title="Accounting" subtitle="Double-entry accounting, reports, and financial statements" />

      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-jolu-600 text-white' : 'bg-white border text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <>
            {tab === 'accounts' && (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Code</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Balance</th></tr></thead>
                  <tbody>
                    {(accounts?.data?.data || []).map((a: { id: string; code: string; name: string; type: string; balance: number }) => (
                      <tr key={a.id} className="border-t"><td className="px-6 py-3 font-mono">{a.code}</td><td className="px-6 py-3">{a.name}</td><td className="px-6 py-3">{a.type}</td><td className="px-6 py-3 font-semibold">{formatCurrency(Number(a.balance))}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'trial-balance' && (
              <div className="space-y-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleExportTBCSV}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button
                    onClick={handleDownloadTB}
                    disabled={downloadingPdf}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
                <div className="card overflow-hidden p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Code</th><th className="px-6 py-3">Account</th><th className="px-6 py-3">Debit</th><th className="px-6 py-3">Credit</th></tr></thead>
                    <tbody>
                      {(trialBalance?.data?.data || []).map((a: { code: string; name: string; debit: number; credit: number }, i: number) => (
                        <tr key={i} className="border-t"><td className="px-6 py-3 font-mono">{a.code}</td><td className="px-6 py-3">{a.name}</td><td className="px-6 py-3">{a.debit ? formatCurrency(a.debit) : '-'}</td><td className="px-6 py-3">{a.credit ? formatCurrency(a.credit) : '-'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'income' && (
              <div className="space-y-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleExportIncomeCSV}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button
                    onClick={handleDownloadIncome}
                    disabled={downloadingPdf}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="font-semibold mb-4 text-green-700">Revenue</h3>
                    {(income?.data?.data?.revenue || []).map((r: { name: string; amount: number }, i: number) => (
                      <div key={i} className="flex justify-between py-2 border-b"><span>{r.name}</span><span className="font-semibold">{formatCurrency(r.amount)}</span></div>
                    ))}
                    <div className="flex justify-between pt-4 font-bold"><span>Total Revenue</span><span className="text-green-700">{formatCurrency(income?.data?.data?.totalRevenue || 0)}</span></div>
                  </div>
                  <div className="card">
                    <h3 className="font-semibold mb-4 text-red-700">Expenses</h3>
                    {(income?.data?.data?.expenses || []).map((e: { name: string; amount: number }, i: number) => (
                      <div key={i} className="flex justify-between py-2 border-b"><span>{e.name}</span><span className="font-semibold">{formatCurrency(e.amount)}</span></div>
                    ))}
                    <div className="flex justify-between pt-4 font-bold border-t mt-4"><span>Net Income</span><span className={income?.data?.data?.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}>{formatCurrency(income?.data?.data?.netIncome || 0)}</span></div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'balance-sheet' && (
              <div className="space-y-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleExportBSCSV}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button
                    onClick={handleDownloadBS}
                    disabled={downloadingPdf}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['assets', 'liabilities', 'equity'].map((section) => (
                    <div key={section} className="card">
                      <h3 className="font-semibold mb-4 capitalize">{section}</h3>
                      {(balanceSheet?.data?.data?.[section] || []).map((a: { name: string; balance: number }, i: number) => (
                        <div key={i} className="flex justify-between py-2 border-b text-sm"><span>{a.name}</span><span>{formatCurrency(a.balance)}</span></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'journals' && (
              <div className="space-y-4">
                {(journals?.data?.data || []).map((j: { id: string; entryNumber: string; description: string; date: string; lines: { account: { name: string }; debit: number; credit: number }[] }) => (
                  <div key={j.id} className="card">
                    <div className="flex justify-between mb-3"><span className="font-semibold">{j.entryNumber}</span><span className="text-sm text-gray-500">{new Date(j.date).toLocaleDateString()}</span></div>
                    <p className="text-sm text-gray-600 mb-3">{j.description}</p>
                    {j.lines?.map((l, i) => (
                      <div key={i} className="flex justify-between text-sm py-1"><span>{l.account.name}</span><span>{Number(l.debit) > 0 ? `Dr ${formatCurrency(Number(l.debit))}` : `Cr ${formatCurrency(Number(l.credit))}`}</span></div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {tab === 'receivables' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleDownloadReceivables}
                    disabled={downloadingPdf}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
                <div className="card overflow-hidden p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Invoice</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Due</th><th className="px-6 py-3">Balance</th></tr></thead>
                    <tbody>
                      {(receivables?.data?.data || []).map((inv: { id: string; invoiceNumber: string; customer?: { name: string }; securityClient?: { name: string }; dueDate?: string; totalAmount: number; amountPaid: number }) => (
                        <tr key={inv.id} className="border-t"><td className="px-6 py-3">{inv.invoiceNumber}</td><td className="px-6 py-3">{inv.customer?.name || inv.securityClient?.name || 'N/A'}</td><td className="px-6 py-3">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td><td className="px-6 py-3 font-semibold">{formatCurrency(Number(inv.totalAmount) - Number(inv.amountPaid))}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'statements' && (
              <div className="space-y-6">
                <div className="card flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <label className="label">Select Client</label>
                    <select
                      className="input"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="">-- Choose Customer or Security Client --</option>
                      {(clientsData?.data?.data || []).map((client: { id: string; name: string }) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedClientId && (
                    <button
                      onClick={handleDownloadStatement}
                      disabled={downloadingPdf}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingPdf ? 'Downloading...' : 'Download Statement PDF'}
                    </button>
                  )}
                </div>

                {selectedClientId && statementDetails?.data?.data && (
                  <div className="space-y-6">
                    {/* Summary Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="card bg-green-50 border-green-200">
                        <span className="text-xs font-bold text-green-700 uppercase">Total Invoiced</span>
                        <h4 className="text-xl font-bold text-green-900 mt-1">
                          {formatCurrency(statementDetails.data.data.summary.totalInvoiced)}
                        </h4>
                      </div>
                      <div className="card bg-blue-50 border-blue-200">
                        <span className="text-xs font-bold text-blue-700 uppercase">Total Payments</span>
                        <h4 className="text-xl font-bold text-blue-900 mt-1">
                          {formatCurrency(statementDetails.data.data.summary.totalPaid)}
                        </h4>
                      </div>
                      <div className="card bg-red-50 border-red-200">
                        <span className="text-xs font-bold text-red-700 uppercase">Outstanding Balance</span>
                        <h4 className="text-xl font-bold text-red-900 mt-1">
                          {formatCurrency(statementDetails.data.data.summary.outstandingBalance)}
                        </h4>
                      </div>
                    </div>

                    {/* Statement Ledger Table */}
                    <div className="card overflow-hidden p-0">
                      <div className="p-4 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-800 text-sm">Chronological Statement Ledger</h3>
                      </div>
                      <table className="w-full text-sm text-left">
                        <thead className="bg-jolu-800 text-white uppercase text-xs">
                          <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Transaction Type</th>
                            <th className="px-6 py-3">Reference No</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Debit (Dr)</th>
                            <th className="px-6 py-3 text-right">Credit (Cr)</th>
                            <th className="px-6 py-3 text-right">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(statementDetails.data.data.ledger || []).map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-xs text-gray-600">
                                {new Date(row.date).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-6 py-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.type === 'INVOICE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {row.type}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-xs font-semibold text-gray-700">{row.reference}</td>
                              <td className="px-6 py-3 text-xs text-gray-600">{row.description}</td>
                              <td className="px-6 py-3 text-xs text-right font-mono text-red-600 font-semibold">
                                {row.debit ? formatCurrency(row.debit) : '-'}
                              </td>
                              <td className="px-6 py-3 text-xs text-right font-mono text-green-600 font-semibold">
                                {row.credit ? formatCurrency(row.credit) : '-'}
                              </td>
                              <td className="px-6 py-3 text-xs text-right font-mono font-bold text-gray-900">
                                {formatCurrency(row.balance)}
                              </td>
                            </tr>
                          ))}
                          {(statementDetails.data.data.ledger || []).length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-xs">
                                No transactions found on this client's statement ledger.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
