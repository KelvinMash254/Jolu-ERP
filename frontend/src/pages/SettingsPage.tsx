import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui/Shared';
import { useState } from 'react';
import { importExportApi } from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [importEntity, setImportEntity] = useState('customers');
  const [file, setFile] = useState<File | null>(null);

  const handleImport = async () => {
    if (!file) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity', importEntity);
    try {
      await importExportApi.import(formData);
      toast.success('Import job started');
    } catch (e) {
      toast.error('Import failed');
    }
  };

  const handleExport = async (entity: string, format: string) => {
    try {
      const res = await importExportApi.export(entity, format);
      window.open(res.data.data, '_blank');
      toast.success('Export completed');
    } catch (e) {
      toast.error('Export failed');
    }
  };

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
          <h3 className="font-semibold mb-4">Import Data</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Entity</label>
                <select className="input" value={importEntity} onChange={e => setImportEntity(e.target.value)}>
                  <option value="customers">Customers</option>
                  <option value="leads">Leads</option>
                  <option value="inventory">Inventory</option>
                  <option value="spare-parts">Spare Parts</option>
                </select>
              </div>
              <div>
                <label className="label">File (CSV/XLSX)</label>
                <input type="file" className="input" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <button onClick={handleImport} className="btn-primary">Start Import</button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Export Data</h3>
          <div className="space-y-4">
            {['customers', 'leads', 'inventory', 'spare-parts', 'invoices'].map(entity => (
              <div key={entity} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="capitalize">{entity.replace('-', ' ')}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleExport(entity, 'csv')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">CSV</button>
                  <button onClick={() => handleExport(entity, 'xlsx')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">XLSX</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
