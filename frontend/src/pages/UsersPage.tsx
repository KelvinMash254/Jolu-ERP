import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/ui/Shared';

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
  });

  const users = data?.data?.data || [];

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage users, roles, and permissions" actions={<button className="btn-primary">Add User</button>} />
      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Companies</th><th className="px-6 py-3">Status</th></tr></thead>
              <tbody>
                {users.map((u: { id: string; firstName: string; lastName: string; email: string; role: { displayName: string }; companies: { company: { name: string } }[]; isActive: boolean }) => (
                  <tr key={u.id} className="border-t"><td className="px-6 py-4 font-medium">{u.firstName} {u.lastName}</td><td className="px-6 py-4">{u.email}</td><td className="px-6 py-4">{u.role.displayName}</td><td className="px-6 py-4">{u.companies.map((c) => c.company.name).join(', ')}</td><td className="px-6 py-4"><span className={`badge ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
