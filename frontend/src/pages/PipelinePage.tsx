import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi, invoiceApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency } from '../components/ui/Shared';
import type { Lead } from '../types';
import toast from 'react-hot-toast';
import { useState } from 'react';
import InvoiceModal from '../components/InvoiceModal';

const STAGES = ['NEW_LEAD', 'QUALIFIED', 'PROPOSAL_SENT', 'APPLICATION_SUBMITTED', 'BANK_APPROVAL', 'WON', 'LOST'];

const stageLabels: Record<string, string> = {
  NEW_LEAD: 'New Lead',
  QUALIFIED: 'Qualified',
  PROPOSAL_SENT: 'Proposal Sent',
  APPLICATION_SUBMITTED: 'Application Submitted',
  BANK_APPROVAL: 'Bank Approval',
  WON: 'Won',
  LOST: 'Lost',
};

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: kanbanData, isLoading } = useQuery({
    queryKey: ['kanban'],
    queryFn: () => crmApi.getKanban(),
  });

  const { data: kpiData } = useQuery({
    queryKey: ['pipeline-kpis'],
    queryFn: () => crmApi.getKpis(),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => crmApi.convertLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-kpis'] });
      toast.success('Lead converted to WON');
    },
    onError: () => toast.error('Failed to convert lead'),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => invoiceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsInvoiceModalOpen(false);
      toast.success('Quotation/Invoice created');
    },
    onError: () => toast.error('Failed to create quotation/invoice'),
  });

  const kanban = kanbanData?.data?.data || [];
  const kpis = kpiData?.data?.data;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Sales Pipeline" subtitle="Kanban board and sales KPIs" />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center"><p className="text-sm text-gray-500">Monthly Sales</p><p className="text-2xl font-bold text-jolu-600">{kpis?.monthlySales || 0}</p></div>
          <div className="card text-center"><p className="text-sm text-gray-500">Quarterly Sales</p><p className="text-2xl font-bold text-jolu-600">{kpis?.quarterlySales || 0}</p></div>
          <div className="card text-center"><p className="text-sm text-gray-500">Annual Sales</p><p className="text-2xl font-bold text-jolu-600">{kpis?.annualSales || 0}</p></div>
          <div className="card text-center"><p className="text-sm text-gray-500">Conversion Rate</p><p className="text-2xl font-bold text-jolu-600">{kpis?.conversionRate || 0}%</p></div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => {
              const column = kanban.find((k: { stage: string }) => k.stage === stage);
              const leads = (column?.leads || []) as Lead[];
              return (
                <div key={stage} className="w-72 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{stageLabels[stage]}</h3>
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{leads.length}</span>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {leads.map((lead) => (
                      <div key={lead.id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow group relative">
                        <p className="font-medium text-sm">{lead.title}</p>
                        {lead.customer && <p className="text-xs text-gray-500 mt-1">{lead.customer.name}</p>}
                        {lead.estimatedValue && <p className="text-sm text-jolu-600 font-semibold mt-2">{formatCurrency(Number(lead.estimatedValue))}</p>}
                        <div className="flex justify-between items-center mt-2">
                          {lead.salesperson && <p className="text-xs text-gray-400">{lead.salesperson.firstName} {lead.salesperson.lastName}</p>}
                          <div className="flex gap-1">
                            {lead.customer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLead(lead);
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Quote
                              </button>
                            )}
                            {lead.pipelineStage !== 'WON' && lead.pipelineStage !== 'LOST' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); convertMutation.mutate(lead.id); }}
                                className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Mark Won
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {kpis?.teamPerformance?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4">Team Performance</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Salesperson</th><th className="pb-2">Deals Won</th><th className="pb-2">Revenue</th></tr></thead>
              <tbody>
                {kpis.teamPerformance.map((rep: { salesperson: string; dealsWon: number; revenue: number }, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-3">{rep.salesperson}</td>
                    <td className="py-3">{rep.dealsWon}</td>
                    <td className="py-3 font-semibold">{formatCurrency(rep.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isInvoiceModalOpen && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => { setIsInvoiceModalOpen(false); setSelectedLead(null); }}
          onSubmit={(data) => createInvoiceMutation.mutate(data)}
          initialData={selectedLead ? {
            customerId: selectedLead.customer?.id,
            type: 'QUOTATION',
            lines: [{
              description: selectedLead.title,
              quantity: 1,
              unitPrice: Number(selectedLead.estimatedValue || 0),
              taxRate: 16,
              total: Number(selectedLead.estimatedValue || 0)
            }]
          } : undefined}
        />
      )}
    </div>
  );
}
