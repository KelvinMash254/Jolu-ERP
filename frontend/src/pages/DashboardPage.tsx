import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DollarSign, Users, AlertTriangle, Wrench, TrendingUp, Wallet } from 'lucide-react';
import { dashboardApi } from '../services/api';
import { PageHeader, StatCard, LoadingSpinner, formatCurrency, StatusBadge } from '../components/ui/Shared';
import type { DashboardData } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
  });

  const dashboard = data?.data?.data as DashboardData | undefined;

  if (isLoading) return <LoadingSpinner />;

  const salesChartData = {
    labels: dashboard?.salesTrend?.map((t) => t.month) || [],
    datasets: [{
      label: 'Revenue (KES)',
      data: dashboard?.salesTrend?.map((t) => t.revenue) || [],
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time business overview" />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Monthly Revenue" value={formatCurrency(dashboard?.kpis?.monthlyRevenue || 0)} icon={<DollarSign className="w-6 h-6" />} color="green" />
          <StatCard title="Outstanding" value={formatCurrency(dashboard?.kpis?.outstandingAmount || 0)} icon={<TrendingUp className="w-6 h-6" />} color="amber" />
          <StatCard title="Active Leads" value={dashboard?.kpis?.activeLeads || 0} icon={<Users className="w-6 h-6" />} color="blue" />
          <StatCard title="Open Tickets" value={dashboard?.kpis?.openTickets || 0} icon={<Wrench className="w-6 h-6" />} color="purple" />
          <StatCard title="Low Stock Alerts" value={dashboard?.kpis?.lowStockCount || 0} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
          <StatCard title="Cash Position" value={formatCurrency(dashboard?.kpis?.cashPosition || 0)} icon={<Wallet className="w-6 h-6" />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Revenue Trend (6 Months)</h3>
            <Line data={salesChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Low Stock Parts</h3>
            {dashboard?.lowStockParts?.length ? (
              <div className="space-y-3">
                {dashboard.lowStockParts.map((part) => (
                  <div key={part.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{part.partName}</p>
                      <p className="text-sm text-gray-500">{part.partNumber}</p>
                    </div>
                    <span className="text-red-600 font-semibold">{part.quantity} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">All stock levels healthy</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Outstanding Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.outstandingInvoices?.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50">
                    <td className="py-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="py-3">{inv.customer?.name}</td>
                    <td className="py-3">{formatCurrency(Number(inv.totalAmount) - Number(inv.amountPaid))}</td>
                    <td className="py-3"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
