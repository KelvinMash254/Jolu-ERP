import { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function UserModal({ isOpen, onClose, onSubmit }: UserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [companyIds, setCompanyIds] = useState<string[]>([]);

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/users/roles'),
    enabled: isOpen,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies'),
    enabled: isOpen,
  });

  const roles = rolesData?.data?.data || [];
  const companies = companiesData?.data?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, firstName, lastName, roleId, companyIds });
  };

  const toggleCompany = (id: string) => {
    setCompanyIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Add New User</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              value={roleId} 
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              required
            >
              <option value="">Select Role</option>
              {roles.map((r: any) => (
                <option key={r.id} value={r.id}>{r.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Companies</label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
              {companies.map((c: any) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={companyIds.includes(c.id)}
                    onChange={() => toggleCompany(c.id)}
                    className="rounded text-jolu-600 focus:ring-jolu-500"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
