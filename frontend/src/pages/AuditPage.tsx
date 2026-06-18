import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/ui/Shared';

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => notificationsApi.getAuditLogs({ limit: '50' }),
  });

  const logs = data?.data?.data || [];

  return (
    <div>
      <PageHeader title="Audit Trail" subtitle="Complete activity log for compliance and security" />
      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Timestamp</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Module</th><th className="px-6 py-3">Action</th><th className="px-6 py-3">IP Address</th></tr></thead>
              <tbody>
                {logs.map((log: { id: string; createdAt: string; user?: { firstName: string; lastName: string }; module: string; action: string; ipAddress?: string }) => (
                  <tr key={log.id} className="border-t"><td className="px-6 py-3">{new Date(log.createdAt).toLocaleString()}</td><td className="px-6 py-3">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td><td className="px-6 py-3">{log.module}</td><td className="px-6 py-3 font-mono text-xs">{log.action}</td><td className="px-6 py-3">{log.ipAddress || '-'}</td></tr>
                ))}
                {!logs.length && <tr><td colSpan={5} className="text-center py-12 text-gray-500">No audit logs yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
