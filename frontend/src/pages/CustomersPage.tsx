import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { crmApi } from '../services/api';
import { PageHeader, LoadingSpinner, formatCurrency } from '../components/ui/Shared';
import type { Customer } from '../types';
import { KENYA_COUNTIES } from '../constants/counties';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    county: '',
    idNumber: '',
    kraPin: '',
    physicalAddress: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => crmApi.getCustomers(search ? { search } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => crmApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      setShowForm(false);

      setForm({
        name: '',
        phone: '',
        email: '',
        county: '',
        idNumber: '',
        kraPin: '',
        physicalAddress: '',
      });

      toast.success('Customer created');
    },
    onError: () => toast.error('Failed to create customer'),
  });

  const customers = (data?.data?.data || []) as Customer[];

  return (
    <div>
      <PageHeader
        title="CRM / Customers"
        subtitle="Manage customer profiles and relationships"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        }
      />

      <div className="p-8">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            className="input pl-10"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">New Customer</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Name */}
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              {/* County Dropdown */}
              <div>
                <label className="label">County</label>

                <select
                  className="input"
                  value={form.county}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      county: e.target.value,
                    })
                  }
                >
                  <option value="">Select County</option>

                  {KENYA_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="label">ID Number</label>
                <input
                  className="input"
                  value={form.idNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      idNumber: e.target.value,
                    })
                  }
                />
              </div>

              {/* KRA PIN */}
              <div>
                <label className="label">KRA PIN</label>
                <input
                  className="input"
                  value={form.kraPin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kraPin: e.target.value,
                    })
                  }
                />
              </div>

              {/* Physical Address */}
              <div className="md:col-span-2">
                <label className="label">Physical Address</label>
                <input
                  className="input"
                  value={form.physicalAddress}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      physicalAddress: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => createMutation.mutate(form)}
                className="btn-primary"
              >
                Save Customer
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">County</th>
                  <th className="px-6 py-3 font-medium">KRA PIN</th>
                  <th className="px-6 py-3 font-medium">Financing</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium">{c.name}</td>

                    <td className="px-6 py-4">{c.phone}</td>

                    <td className="px-6 py-4">
                      {c.county || '-'}
                    </td>

                    <td className="px-6 py-4">
                      {c.kraPin || '-'}
                    </td>

                    <td className="px-6 py-4">
                      {c.financingBank
                        ? `${c.financingBank} - ${formatCurrency(
                            Number(c.loanAmount || 0)
                          )}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}