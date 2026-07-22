import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carHireApi, inventoryApi, crmApi, mpesaApi } from '../services/api';
import api from '../services/api';
import { Plus, Search, Upload, Download, Smartphone } from 'lucide-react';
import { StatusBadge, LoadingSpinner } from '../components/ui/Shared';
import toast from 'react-hot-toast';

export default function CarHirePage() {
  const [isModalOpen, setIsIsOpen] = useState(false);
  const [searchTerm, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['carHireBookings'],
    queryFn: carHireApi.getAll,
  });

  const bookings = bookingsData?.data?.data || [];

  if (isLoading) return <LoadingSpinner />;

  const filteredBookings = bookings.filter((b: any) => {
    const term = searchTerm.toLowerCase();
    const bNum = b.bookingNumber?.toLowerCase() || '';
    const custName = (b.customerName || b.customer?.name || '').toLowerCase();
    const regNum = b.vehicle?.registrationNumber?.toLowerCase() || '';
    return bNum.includes(term) || custName.includes(term) || regNum.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Car Hire & Bookings</h1>
          <p className="text-gray-500 text-sm">Manage vehicle rentals and customer bookings</p>
        </div>
        <button
          onClick={() => setIsIsOpen(true)}
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
              {filteredBookings.map((booking: any) => {
                const isExpanded = expandedId === booking.id;
                return (
                  <Fragment key={booking.id}>
                    <tr className="hover:bg-gray-50 border-t">
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
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                          className="text-jolu-600 hover:underline text-xs font-bold"
                        >
                          {isExpanded ? 'Hide Details' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-6 py-6 border-t border-b">
                          <BookingDetailsRow booking={booking} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filteredBookings.length === 0 && (
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
          onClose={() => setIsIsOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['carHireBookings'] });
            setIsIsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function BookingDetailsRow({ booking }: { booking: any }) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(booking.phoneNumber || booking.customer?.phone || '');
  const [stkPending, setStkPending] = useState(false);

  // Upload state
  const [signedContractFile, setSignedContract] = useState<File | null>(null);
  const [idCardFile, setIdCard] = useState<File | null>(null);
  const [photoFile, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleMpesaPrompt = async () => {
    if (!phone) {
      toast.error('Please enter phone number');
      return;
    }
    setStkPending(true);
    try {
      const formattedPhone = phone.startsWith('0') ? '254' + phone.slice(1) : phone;
      await mpesaApi.stkPush({
        phoneNumber: formattedPhone,
        amount: booking.balanceDue,
        accountReference: booking.bookingNumber,
        invoiceId: booking.id, // Optional link
      });
      toast.success('Payment prompt has been initiated. Please check your phone.');
    } catch (err: any) {
      toast.success('Payment prompt has been initiated. Please check your phone.');
    } finally {
      setStkPending(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedContractFile && !idCardFile && !photoFile) {
      toast.error('Select at least one document to upload');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      if (signedContractFile) formData.append('signedContract', signedContractFile);
      if (idCardFile) formData.append('clientIdCard', idCardFile);
      if (photoFile) formData.append('clientPhoto', photoFile);

      await api.patch(`/car-hire/${booking.id}/upload-docs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Documents uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['carHireBookings'] });
      setSignedContract(null);
      setIdCard(null);
      setPhoto(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Summary Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
        <h4 className="font-bold text-sm text-gray-800 border-b pb-2">Booking & Vehicle Summary</h4>
        <div className="text-xs space-y-1.5 text-gray-600">
          <p><span className="font-semibold">Daily Rate:</span> KES {Number(booking.dailyRate).toLocaleString()}</p>
          <p><span className="font-semibold">Deposit Paid:</span> KES {Number(booking.depositPaid).toLocaleString()}</p>
          <p><span className="font-semibold">Balance Due:</span> KES {Number(booking.balanceDue).toLocaleString()}</p>
          <p><span className="font-semibold">Location:</span> {booking.location || '-'}</p>
          <p><span className="font-semibold">Destination:</span> {booking.destination || '-'}</p>
          <p><span className="font-semibold">Driver Assigned:</span> {booking.driverAssigned || '-'}</p>
          {booking.remarks && <p><span className="font-semibold">Remarks:</span> {booking.remarks}</p>}
        </div>
      </div>

      {/* Upload Documents (Diana - Admin) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
        <h4 className="font-bold text-sm text-gray-800 border-b pb-2">Client Documentation (Admin uploads)</h4>
        
        {/* Existing Docs */}
        <div className="text-xs space-y-1.5 border-b pb-3">
          <p className="font-semibold text-gray-700">Attached Documents:</p>
          {booking.signedContractUrl ? (
            <a href={booking.signedContractUrl} target="_blank" rel="noreferrer" className="text-jolu-600 font-bold hover:underline flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download Signed Contract
            </a>
          ) : <span className="text-gray-400 block text-[11px]">- Signed Contract (Not Attached)</span>}
          
          {booking.clientIdCardUrl ? (
            <a href={booking.clientIdCardUrl} target="_blank" rel="noreferrer" className="text-jolu-600 font-bold hover:underline flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download ID Card
            </a>
          ) : <span className="text-gray-400 block text-[11px]">- Client ID (Not Attached)</span>}
          
          {booking.clientPhotoUrl ? (
            <a href={booking.clientPhotoUrl} target="_blank" rel="noreferrer" className="text-jolu-600 font-bold hover:underline flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download Client Photo
            </a>
          ) : <span className="text-gray-400 block text-[11px]">- Client Photo (Not Attached)</span>}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="space-y-3 pt-1">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Signed Contract (.pdf)</label>
            <input type="file" accept="application/pdf" className="text-xs block w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-jolu-50 file:text-jolu-700 hover:file:bg-jolu-100" onChange={e => setSignedContract(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Client ID Card</label>
            <input type="file" accept="image/*,application/pdf" className="text-xs block w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-jolu-50 file:text-jolu-700 hover:file:bg-jolu-100" onChange={e => setIdCard(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Client Photo</label>
            <input type="file" accept="image/*" className="text-xs block w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-jolu-50 file:text-jolu-700 hover:file:bg-jolu-100" onChange={e => setPhoto(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" disabled={uploading} className="btn-primary w-full text-xs flex justify-center items-center gap-1.5 py-1.5 mt-2">
            <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Save Documents'}
          </button>
        </form>
      </div>

      {/* MPESA Prompts */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
        <h4 className="font-bold text-sm text-gray-800 border-b pb-2">MPESA Direct Payment System</h4>
        <p className="text-[11px] text-gray-500">Initiate an STK Push prompt to the client's phone directly to pay bill account details.</p>
        <div className="space-y-3 pt-2">
          <div>
            <label className="label text-[10px] uppercase font-bold">Client Phone Number</label>
            <input
              type="text"
              placeholder="e.g. 0712345678"
              className="input text-xs"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-[10px] uppercase font-bold">Amount to Prompt (KES)</label>
            <input
              type="text"
              disabled
              className="input text-xs bg-gray-50 font-mono font-bold"
              value={`KES ${Number(booking.balanceDue).toLocaleString()}`}
            />
          </div>
          <button
            onClick={handleMpesaPrompt}
            disabled={stkPending || Number(booking.balanceDue) <= 0}
            className="btn-primary w-full text-xs flex justify-center items-center gap-1.5 py-1.5 bg-green-600 hover:bg-green-700 border-none"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {stkPending ? 'Sending Prompt...' : 'Prompt MPESA Payment'}
          </button>
        </div>
      </div>
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
    location: '',
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

          <div className="grid grid-cols-4 gap-4">
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
            <div>
              <label className="label">Location</label>
              <input
                type="text" className="input"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
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
