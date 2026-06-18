import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple';
}

const colorMap = {
  green: 'bg-jolu-50 text-jolu-700 border-jolu-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function StatCard({ title, value, subtitle, icon, color = 'green' }: StatCardProps) {
  return (
    <div className={clsx('card border', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
        </div>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    SENT: 'bg-blue-100 text-blue-800',
    OVERDUE: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    IN_STOCK: 'bg-green-100 text-green-800',
    RESERVED: 'bg-amber-100 text-amber-800',
    SOLD: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-purple-100 text-purple-800',
    PENDING: 'bg-amber-100 text-amber-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-green-100 text-green-800',
    WON: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={clsx('badge', colors[status] || 'bg-gray-100 text-gray-800')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-jolu-200 border-t-jolu-600 rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-12 text-gray-500">{message}</div>;
}

export function formatCurrency(amount: number) {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}
