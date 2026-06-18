import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui/Shared';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and system preferences" />
      <div className="p-8 space-y-6 max-w-2xl">
        <div className="card">
          <h3 className="font-semibold mb-4">Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-medium">{user?.firstName} {user?.lastName}</p></div>
            <div><p className="text-gray-500">Email</p><p className="font-medium">{user?.email}</p></div>
            <div><p className="text-gray-500">Role</p><p className="font-medium">{user?.roleDisplayName || user?.role}</p></div>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Security</h3>
          <button className="btn-secondary mr-3">Change Password</button>
          <button className="btn-secondary">Enable 2FA</button>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Import / Export</h3>
          <p className="text-sm text-gray-500 mb-4">Import customers, inventory, leads from Excel/CSV. Export data to Excel, CSV, or PDF.</p>
          <div className="flex gap-3">
            <button className="btn-secondary">Import Data</button>
            <button className="btn-secondary">Export Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
