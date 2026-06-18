import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import { dashboardApi } from '../services/api';
import { PageHeader, StatCard, LoadingSpinner, formatCurrency } from '../components/ui/Shared';
import { Building2 } from 'lucide-react';

export default function GroupDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['group-dashboard'],
    queryFn: () => dashboardApi.consolidated(),
  });

  const group = data?.data?.data;

  if (isLoading) return <LoadingSpinner />;

  const chartData = {
    labels: group?.companyBreakdown?.map((c: { companyName: string }) => c.companyName) || [],
    datasets: [{
      label: 'Revenue (KES)',
      data: group?.companyBreakdown?.map((c: { revenue: number }) => c.revenue) || [],
      backgroundColor: ['#16a34a', '#2563eb', '#9333ea'],
    }],
  };

  return (
    <div>
      <PageHeader title="Group Overview" subtitle="Consolidated view across all Jolu Group companies" />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={formatCurrency(group?.totalRevenue || 0)} color="green" />
          <StatCard title="Total Customers" value={group?.totalCustomers || 0} color="blue" />
          <StatCard title="Active Leads" value={group?.activeLeads || 0} color="purple" />
          <StatCard title="Outstanding Invoices" value={group?.outstandingInvoices || 0} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Revenue by Company</h3>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Company Breakdown</h3>
            <div className="space-y-4">
              {group?.companyBreakdown?.map((co: { companyId: string; companyName: string; revenue: number; customers: number; openLeads: number }) => (
                <div key={co.companyId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-jolu-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-jolu-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{co.companyName}</p>
                    <p className="text-sm text-gray-500">{co.customers} customers · {co.openLeads} open leads</p>
                  </div>
                  <p className="font-bold text-jolu-700">{formatCurrency(co.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
