import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carHireApi, inventoryApi, crmApi } from '../services/api';
import { Plus, Search, Calendar, Car, User, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { StatusBadge, LoadingSpinner } from '../components/ui/Shared';
import toast from 'react-hot-toast';

export default function CarHirePage() {
  const [isModalOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['carHireBookings'],
    queryFn: carHireApi.getAll,
  });

  const bookings = bookingsData?.data?.data || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Car Hire & Bookings</h1>
          <p className="text-gray-500 text-sm">Manage vehicle rentals and customer bookings</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search booking ID, customer or vehicle..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-jolu-800 text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Pickup</th>
                <th className="px-4 py-3">Return</th>
                <th className="px-4 py-3 text-right">Total Charges</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Vehicle Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-bold text-jolu-600">{booking.bookingNumber}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{booking.customerName || booking.customer?.name}</div>
                    <div className="text-xs text-gray-500">{booking.phoneNumber || booking.customer?.phone}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{booking.vehicle.registrationNumber}</div>
                    <div className="text-xs text-gray-500">{booking.vehicle.make} {booking.vehicle.model}</div>
                  </td>
                  <td className="px-4 py-4">{new Date(booking.pickupDate).toLocaleDateString()}</td>
                  <td className="px-4 py-4">{booking.returnDate ? new Date(booking.returnDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold">
                    KES {Number(booking.totalCharges).toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={booking.paymentStatus} />
                  </td>
                  <td className="px-4 py-4">
                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        booking.vehicleStatus === 'OUT_ON_HIRE' ? 'bg-blue-100 text-blue-700' :
                        booking.vehicleStatus === 'RETURNED' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {booking.vehicleStatus.replace(/_/g, ' ')}
                      </span>
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-jolu-600 hover:underline text-xs font-bold">Details</button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    No bookings found. Click 'New Booking' to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <BookingModal
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['carHireBookings'] });
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function BookingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    customerId: '',
    customerName: '',
    phoneNumber: '',
    idNumber: '',
    driverAssigned: '',
    pickupDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    destination: '',
    dailyRate: '',
    depositPaid: '',
    remarks: '',
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => inventoryApi.getVehicles(),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const mutation = useMutation({
    mutationFn: carHireApi.create,
    onSuccess: () => {
      toast.success('Booking created successfully');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create booking');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const vehicles = vehiclesData?.data?.data || [];
  const customers = customersData?.data?.data || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Create New Car Hire Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle</label>
              <select
                className="input"
                value={formData.vehicleId}
                onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                required
              >
                <option value="">Select Vehicle</option>
                {vehicles.filter((v:any) => v.stockStatus === 'IN_STOCK').map((v: any) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Link to Customer (Optional)</label>
              <select
                className="input"
                value={formData.customerId}
                onChange={e => {
                  const cust = customers.find((c:any) => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    customerId: e.target.value,
                    customerName: cust?.name || '',
                    phoneNumber: cust?.phone || '',
                  });
                }}
              >
                <option value="">New Customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {!formData.customerId && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Customer Name</label>
                <input
                  type="text" className="input"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="text" className="input"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label">ID Number</label>
                <input
                  type="text" className="input"
                  value={formData.idNumber}
                  onChange={e => setFormData({...formData, idNumber: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
             <div>
              <label className="label">Pickup Date</label>
              <input
                type="date" className="input"
                value={formData.pickupDate}
                onChange={e => setFormData({...formData, pickupDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Return Date</label>
              <input
                type="date" className="input"
                value={formData.returnDate}
                onChange={e => setFormData({...formData, returnDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Driver Assigned</label>
              <input
                type="text" className="input"
                value={formData.driverAssigned}
                onChange={e => setFormData({...formData, driverAssigned: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Daily Rate (KES)</label>
              <input
                type="number" className="input"
                value={formData.dailyRate}
                onChange={e => setFormData({...formData, dailyRate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Deposit Paid (KES)</label>
              <input
                type="number" className="input"
                value={formData.depositPaid}
                onChange={e => setFormData({...formData, depositPaid: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Destination</label>
              <input
                type="text" className="input"
                value={formData.destination}
                onChange={e => setFormData({...formData, destination: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="label">Remarks</label>
            <textarea
              className="input h-20"
              value={formData.remarks}
              onChange={e => setFormData({...formData, remarks: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? 'Saving...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
