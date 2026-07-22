import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carHireApi, crmApi, mpesaApi } from '../services/api';
import {
  Plus,
  Search,
  Upload,
  Smartphone,
  Calendar,
  Key,
  User,
  AlertTriangle,
  Check,
  DollarSign,
  Activity,
  Briefcase,
  FileText,
  Clock,
  Wrench,
  ChevronRight,
  TrendingUp,
  Percent,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { StatusBadge, LoadingSpinner } from '../components/ui/Shared';
import toast from 'react-hot-toast';

export default function CarHirePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'bookings' | 'fleet' | 'drivers' | 'maintenance' | 'reports'>('dashboard');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['carHireBookings'],
    queryFn: carHireApi.getAll,
  });

  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ['fleetVehicles'],
    queryFn: carHireApi.getVehicles,
  });

  const { data: driversData, isLoading: loadingDrivers } = useQuery({
    queryKey: ['fleetDrivers'],
    queryFn: carHireApi.getDrivers,
  });

  const { data: maintenanceData, isLoading: loadingMaintenance } = useQuery({
    queryKey: ['fleetMaintenance'],
    queryFn: carHireApi.getMaintenance,
  });

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['carHireDashboard'],
    queryFn: carHireApi.getDashboard,
  });

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['carHireReports'],
    queryFn: carHireApi.getReports,
  });

  const bookings = bookingsData?.data?.data || [];
  const vehicles = vehiclesData?.data?.data || [];
  const drivers = driversData?.data?.data || [];
  const maintenanceRecords = maintenanceData?.data?.data || [];
  const dashboardKpis = dashboardData?.data?.data?.kpis || {
    available: 0,
    onHire: 0,
    reserved: 0,
    maintenance: 0,
    todayPickups: 0,
    todayReturns: 0,
    revenueToday: 0,
    revenueMonth: 0,
    utilization: 0,
    avgDuration: 0,
    outstandingPayments: 0
  };
  const dashboardDetails = dashboardData?.data?.data || {};
  const reports = reportsData?.data?.data || {
    bookingsCount: 0,
    totalRevenue: 0,
    totalMaintenanceCost: 0,
    lateReturnsCount: 0,
    damageReportsCount: 0,
    maintenanceList: [],
    lateReturnsList: [],
    damageReportsList: []
  };

  // Mutations
  const createVehicleMutation = useMutation({
    mutationFn: carHireApi.createVehicle,
    onSuccess: () => {
      toast.success('Vehicle added to rental fleet');
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      setIsVehicleModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add vehicle')
  });

  const createDriverMutation = useMutation({
    mutationFn: carHireApi.createDriver,
    onSuccess: () => {
      toast.success('Driver registered successfully');
      queryClient.invalidateQueries({ queryKey: ['fleetDrivers'] });
      setIsDriverModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to register driver')
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: carHireApi.createMaintenance,
    onSuccess: () => {
      toast.success('Maintenance record logged successfully');
      queryClient.invalidateQueries({ queryKey: ['fleetMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      setIsMaintenanceModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to log maintenance')
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Car Hire Management</h1>
          <p className="text-gray-500 text-sm mt-1">Enterprise-grade live fleet scheduling, flexible pricing, and rental bookings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setIsVehicleModalOpen(true)} className="btn-secondary flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
          <button onClick={() => setIsDriverModalOpen(true)} className="btn-secondary flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
          <button onClick={() => setIsBookingModalOpen(true)} className="btn-primary flex items-center gap-1.5 py-2 px-5 rounded-xl text-sm font-bold shadow-md transition-all">
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 rounded-2xl border max-w-full">
        {([
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'calendar', label: 'Live Calendar', icon: Calendar },
          { id: 'bookings', label: 'Rental Bookings', icon: FileText },
          { id: 'fleet', label: 'Fleet Asset List', icon: Key },
          { id: 'drivers', label: 'Chauffeur Management', icon: User },
          { id: 'maintenance', label: 'Maintenance Log', icon: Wrench },
          { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet }
        ] as const).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive ? 'bg-jolu-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="space-y-6">
        {activeTab === 'dashboard' && (
          <DashboardTabKpis
            kpis={dashboardKpis}
            details={dashboardDetails}
            loading={loadingDashboard}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarTabVisual
            vehicles={vehicles}
            bookings={bookings}
            loading={loadingVehicles || loadingBookings}
          />
        )}
        {activeTab === 'bookings' && (
          <BookingsTabList
            bookings={bookings}
            loading={loadingBookings}
            onOpenWizard={() => setIsBookingModalOpen(true)}
          />
        )}
        {activeTab === 'fleet' && (
          <FleetTabGrid
            vehicles={vehicles}
            loading={loadingVehicles}
            onUpdateStatus={(vid, status) => {
              carHireApi.updateVehicle(vid, { status }).then(() => {
                toast.success('Vehicle status updated');
                queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
              });
            }}
          />
        )}
        {activeTab === 'drivers' && (
          <DriversTabList
            drivers={drivers}
            loading={loadingDrivers}
            onUpdateStatus={(did, status) => {
              carHireApi.updateDriver(did, { status }).then(() => {
                toast.success('Driver status updated');
                queryClient.invalidateQueries({ queryKey: ['fleetDrivers'] });
              });
            }}
          />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceTabLog
            records={maintenanceRecords}
            loading={loadingMaintenance}
            onOpenAdd={() => setIsMaintenanceModalOpen(true)}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsTabVisual
            reports={reports}
            loading={loadingReports}
          />
        )}
      </div>

      {/* MODALS */}
      {isBookingModalOpen && (
        <BookingWizardModal
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['carHireBookings'] });
            queryClient.invalidateQueries({ queryKey: ['carHireDashboard'] });
            queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
            queryClient.invalidateQueries({ queryKey: ['fleetDrivers'] });
            setIsBookingModalOpen(false);
          }}
        />
      )}

      {isVehicleModalOpen && (
        <VehicleAddModal
          onClose={() => setIsVehicleModalOpen(false)}
          onSubmit={(data) => createVehicleMutation.mutate(data)}
          isPending={createVehicleMutation.isPending}
        />
      )}

      {isDriverModalOpen && (
        <DriverAddModal
          onClose={() => setIsDriverModalOpen(false)}
          onSubmit={(data) => createDriverMutation.mutate(data)}
          isPending={createDriverMutation.isPending}
        />
      )}

      {isMaintenanceModalOpen && (
        <MaintenanceAddModal
          onClose={() => setIsMaintenanceModalOpen(false)}
          onSubmit={(data) => createMaintenanceMutation.mutate(data)}
          vehicles={vehicles}
          isPending={createMaintenanceMutation.isPending}
        />
      )}
    </div>
  );
}

// ============================================================================
// TAB 1: DASHBOARD VIEW
// ============================================================================
function DashboardTabKpis({ kpis, details, loading }: { kpis: any; details: any; loading: boolean }) {
  if (loading) return <LoadingSpinner />;

  const statCards = [
    { title: 'Vehicles Available', val: kpis.available, desc: 'Ready for hire', icon: Check, color: 'text-green-600 bg-green-50' },
    { title: 'Vehicles On Hire', val: kpis.onHire, desc: 'Out on active rental', icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
    { title: 'Reserved/Booked', val: kpis.reserved, desc: 'Confirmed bookings', icon: Calendar, color: 'text-yellow-600 bg-yellow-50' },
    { title: 'Under Maintenance', val: kpis.maintenance, desc: 'Offline for service/repairs', icon: Wrench, color: 'text-red-600 bg-red-50' },
    { title: 'Revenue Today', val: `KES ${Number(kpis.revenueToday || 0).toLocaleString()}`, desc: 'Rentals started today', icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
    { title: 'Revenue This Month', val: `KES ${Number(kpis.revenueMonth || 0).toLocaleString()}`, desc: 'Aggregated rental value', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Fleet Utilization', val: `${kpis.utilization}%`, desc: 'Active vs total fleet', icon: Percent, color: 'text-indigo-600 bg-indigo-50' },
    { title: 'Outstanding Payments', val: `KES ${Number(kpis.outstandingPayments || 0).toLocaleString()}`, desc: 'Remaining rental balances', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md">
              <div className="space-y-2">
                <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">{c.title}</span>
                <div className="text-2xl font-black text-gray-900">{c.val}</div>
                <span className="text-[11px] text-gray-400 block">{c.desc}</span>
              </div>
              <div className={`p-4 rounded-xl ${c.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TODAY'S PICKUPS */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-jolu-600" /> Today's Scheduled Pickups
            </h3>
            <span className="text-xs bg-jolu-50 text-jolu-700 px-2 py-1 rounded-lg font-bold">{details.todayPickupsList?.length || 0} Pickups</span>
          </div>
          <div className="divide-y overflow-y-auto max-h-[300px]">
            {(details.todayPickupsList || []).map((b: any) => (
              <div key={b.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition-all">
                <div>
                  <div className="font-bold text-sm text-gray-800">{b.customerName || b.customer?.name}</div>
                  <div className="text-xs text-gray-500">{b.vehicle?.make} {b.vehicle?.model} ({b.vehicle?.registrationNumber})</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-700">{b.pickupTime}</div>
                  <span className="text-[10px] uppercase font-extrabold text-jolu-600 bg-jolu-50 px-1.5 py-0.5 rounded">{b.status}</span>
                </div>
              </div>
            ))}
            {(!details.todayPickupsList || details.todayPickupsList.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-12">No scheduled pickups for today</p>
            )}
          </div>
        </div>

        {/* TODAY'S RETURNS */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" /> Today's Scheduled Returns
            </h3>
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-bold">{details.todayReturnsList?.length || 0} Returns</span>
          </div>
          <div className="divide-y overflow-y-auto max-h-[300px]">
            {(details.todayReturnsList || []).map((b: any) => (
              <div key={b.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition-all">
                <div>
                  <div className="font-bold text-sm text-gray-800">{b.customerName || b.customer?.name}</div>
                  <div className="text-xs text-gray-500">{b.vehicle?.make} {b.vehicle?.model} ({b.vehicle?.registrationNumber})</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-700">{b.returnTime}</div>
                  <span className="text-[10px] uppercase font-extrabold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{b.status}</span>
                </div>
              </div>
            ))}
            {(!details.todayReturnsList || details.todayReturnsList.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-12">No scheduled returns for today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 2: VISUAL BOOKING CALENDAR
// ============================================================================
function CalendarTabVisual({ vehicles, bookings, loading }: { vehicles: any[]; bookings: any[]; loading: boolean }) {
  if (loading) return <LoadingSpinner />;

  const daysInMonth = 30;
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Generate simple horizontal calendar grid rows per vehicle
  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
      <div>
        <h3 className="font-extrabold text-lg text-gray-800">Visual Rental Scheduling Grid</h3>
        <p className="text-gray-500 text-xs mt-1">Live active timeline per vehicle for the upcoming 30 days. Block status color codes:</p>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-gray-600"><span className="w-3.5 h-3.5 rounded bg-green-500 block"></span> Available</span>
          <span className="flex items-center gap-1.5 font-semibold text-gray-600"><span className="w-3.5 h-3.5 rounded bg-blue-500 block"></span> Booked / On Hire</span>
          <span className="flex items-center gap-1.5 font-semibold text-gray-600"><span className="w-3.5 h-3.5 rounded bg-yellow-500 block"></span> Reserved</span>
          <span className="flex items-center gap-1.5 font-semibold text-gray-600"><span className="w-3.5 h-3.5 rounded bg-red-500 block"></span> Maintenance</span>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-gray-100 text-xs font-bold text-gray-700">
            <tr>
              <th className="px-4 py-3 border-r min-w-[180px]">Vehicle Asset Details</th>
              {currentMonthDays.map((d) => (
                <th key={d} className="px-1 text-center py-3 border-r text-[10px] w-8">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {vehicles.map((v) => {
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-r font-semibold text-gray-800">
                    <div className="font-bold">{v.registrationNumber}</div>
                    <div className="text-[10px] text-gray-500">{v.make} {v.model}</div>
                  </td>
                  {currentMonthDays.map((d) => {
                    // Check if vehicle has booking overlapping with fake day 'd' of current month
                    const dayDate = new Date();
                    dayDate.setDate(d);
                    dayDate.setHours(12, 0, 0, 0);

                    let dayColor = 'bg-green-500'; // Default available

                    if (v.status === 'Maintenance') {
                      dayColor = 'bg-red-500';
                    } else {
                      const dayBooking = bookings.find((b) => {
                        if (b.vehicleId !== v.id) return false;
                        if (b.status === 'Cancelled' || b.status === 'NoShow') return false;
                        const pickup = new Date(b.pickupDate);
                        const rDate = b.returnDate ? new Date(b.returnDate) : pickup;
                        return dayDate >= pickup && dayDate <= rDate;
                      });

                      if (dayBooking) {
                        dayColor = dayBooking.status === 'Reserved' ? 'bg-yellow-500' : 'bg-blue-500';
                      }
                    }

                    return (
                      <td key={d} className="p-1 border-r text-center">
                        <div className={`h-6 rounded transition-all ${dayColor}`} title={`${v.registrationNumber} - Day ${d}`} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 3: BOOKINGS LIST VIEW
// ============================================================================
function BookingsTabList({ bookings, loading, onOpenWizard }: { bookings: any[]; loading: boolean; onOpenWizard: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) return <LoadingSpinner />;

  const filtered = bookings.filter((b) => {
    const term = searchTerm.toLowerCase();
    const num = b.bookingNumber?.toLowerCase() || '';
    const cust = (b.customerName || b.customer?.name || '').toLowerCase();
    const reg = b.vehicle?.registrationNumber?.toLowerCase() || '';
    return num.includes(term) || cust.includes(term) || reg.includes(term);
  });

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden space-y-4">
      {/* Search Header */}
      <div className="p-4 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center border-b">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search booking ID, customer, license plate..."
            className="input pl-10 py-2.5 rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={onOpenWizard} className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Book Vehicle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-jolu-800 text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">S/N</th>
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Vehicle Details</th>
              <th className="px-4 py-3">Driver Assigned</th>
              <th className="px-4 py-3">Date Taken</th>
              <th className="px-4 py-3">Return Date</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3 text-right">Daily Rate</th>
              <th className="px-4 py-3 text-right">Total Charges</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Actual Balance</th>
              <th className="px-4 py-3">Payment Status</th>
              <th className="px-4 py-3">Vehicle Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {filtered.map((b, idx) => {
              const isExpanded = expandedId === b.id;
              return (
                <Fragment key={b.id}>
                  <tr className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-3 font-semibold text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-jolu-600">{b.bookingNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{b.customerName || b.customer?.name}</div>
                      <div className="text-[10px] text-gray-500">{b.phoneNumber || b.customer?.phone} | ID: {b.idNumber || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{b.vehicle?.registrationNumber}</div>
                      <div className="text-[10px] text-gray-500">{b.vehicle?.make} {b.vehicle?.model}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{b.driver?.name || 'Self Drive'}</td>
                    <td className="px-4 py-3">
                      <div>{new Date(b.pickupDate).toLocaleDateString('en-GB')}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{b.pickupTime}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{b.returnDate ? new Date(b.returnDate).toLocaleDateString('en-GB') : '-'}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{b.returnTime}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-semibold">{b.destination || b.location || 'N/A'}</td>
                    <td className="px-4 py-3 text-right font-mono">KES {Number(b.dailyRate || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">KES {Number(b.totalCharges || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-600">KES {Number(b.commission || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-jolu-700">KES {Number(b.actualBalance || b.totalCharges || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.status === 'Completed' ? 'bg-purple-100 text-purple-700' :
                        b.status === 'Active' || b.status === 'PickedUp' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'Reserved' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status === 'Completed' ? 'Returned' : b.status === 'PickedUp' || b.status === 'Active' ? 'Out on Hire' : b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                        className="text-jolu-600 hover:underline font-bold text-xs"
                      >
                        {isExpanded ? 'Hide Details' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-6 border-t border-b">
                        <BookingInspectionPaymentsRow booking={b} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-16 text-gray-500">
                  No active rental bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// INSPECTION & PAYMENTS EXPANSION ROW
// ============================================================================
function BookingInspectionPaymentsRow({ booking }: { booking: any }) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(booking.phoneNumber || booking.customer?.phone || '');
  const [stkPending, setStkPending] = useState(false);

  // Inspection states
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  // Pickup values
  const [fuelLevel, setFuelLevel] = useState('Full');
  const [mileageOut, setMileageOut] = useState(booking.vehicle?.mileage || 0);
  const [bodyCondition, setBodyCondition] = useState('Good');
  const [tyreCondition, setTyreCondition] = useState('Excellent');
  const [notes, setNotes] = useState('');

  // Return values
  const [fuelReturned, setFuelReturned] = useState('Full');
  const [mileageIn, setMileageIn] = useState(booking.vehicle?.mileage || 0);
  const [lateFees, setLateFees] = useState(0);
  const [cleaningCharges, setCleaningCharges] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);

  const handleMpesaPrompt = async () => {
    if (!phone) {
      toast.error('Please enter phone number');
      return;
    }
    setStkPending(true);
    try {
      const res = await mpesaApi.stkPush({
        phoneNumber: phone.startsWith('0') ? '254' + phone.slice(1) : phone,
        amount: booking.balanceDue,
        accountReference: booking.bookingNumber,
        invoiceId: booking.id
      });
      if (res.data?.ResponseCode === '0') {
        toast.success('Mpesa STK Push initiated');
      } else {
        toast.error(res.data?.CustomerMessage || 'Prompt failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Direct Mpesa prompt failure');
    } finally {
      setStkPending(false);
    }
  };

  const submitPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await carHireApi.submitPickup(booking.id, {
        fuelLevel,
        mileageOut,
        bodyCondition,
        tyreCondition,
        notes
      });
      toast.success('Pickup Checklist Submitted. Vehicle Out on Hire!');
      queryClient.invalidateQueries({ queryKey: ['carHireBookings'] });
      setShowPickupForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit checklist');
    }
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await carHireApi.submitReturn(booking.id, {
        fuelReturned,
        mileageIn,
        bodyCondition,
        tyreCondition,
        lateFees,
        cleaningCharges,
        additionalCharges,
        notes
      });
      toast.success('Return inspection saved. Asset returned successfully!');
      queryClient.invalidateQueries({ queryKey: ['carHireBookings'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      setShowReturnForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit return inspection');
    }
  };

  const [contractFile, setContractFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const handleUploadDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractFile && !idCardFile && !photoFile) {
      toast.error('Please select at least one document to upload');
      return;
    }
    setUploadingDocs(true);
    try {
      const fd = new FormData();
      if (contractFile) fd.append('signedContract', contractFile);
      if (idCardFile) fd.append('clientIdCard', idCardFile);
      if (photoFile) fd.append('clientPhoto', photoFile);

      await carHireApi.uploadDocs(booking.id, fd);
      toast.success('Documents uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['carHireBookings'] });
      setContractFile(null);
      setIdCardFile(null);
      setPhotoFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploadingDocs(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SUMMARY */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
        <h4 className="font-extrabold text-sm text-gray-800 border-b pb-2 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-jolu-600" /> Booking Details
        </h4>
        <div className="text-xs space-y-2 text-gray-600">
          <p><span className="font-bold">Rental Type:</span> {booking.rentalType}</p>
          <p><span className="font-bold">Duration:</span> {booking.rentalDuration} Days</p>
          <p><span className="font-bold">Driver Allocated:</span> {booking.driver?.name || 'Self Drive'}</p>
          <p><span className="font-bold">Pickup/Dropoff Branches:</span> {booking.pickupBranch} ➜ {booking.dropoffBranch}</p>
          {booking.remarks && <p><span className="font-bold">Remarks:</span> {booking.remarks}</p>}
        </div>

        {/* Action Toggles */}
        <div className="flex gap-2 pt-3">
          {booking.status === 'Confirmed' && (
            <button onClick={() => setShowPickupForm(!showPickupForm)} className="btn-primary w-full text-xs py-2 rounded-xl font-bold flex justify-center items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Start Pickup Inspection
            </button>
          )}
          {booking.status === 'PickedUp' && (
            <button onClick={() => setShowReturnForm(!showReturnForm)} className="btn-secondary w-full text-xs py-2 rounded-xl font-bold flex justify-center items-center gap-1">
              <Wrench className="w-3.5 h-3.5" /> Start Return Inspection
            </button>
          )}
        </div>

        {/* Customer Documents Upload Panel */}
        <div className="border-t pt-4 space-y-3">
          <h5 className="font-bold text-xs text-gray-700">Customer Documents (ID, KRA PIN, Agreement)</h5>

          <div className="space-y-1.5 text-xs text-gray-600">
            <div>
              <span className="font-bold">National ID/Passport: </span>
              {booking.clientIdCardUrl ? (
                <a href={booking.clientIdCardUrl} target="_blank" rel="noreferrer" className="text-jolu-600 hover:underline font-bold">Download File</a>
              ) : <span className="text-red-500">Not uploaded</span>}
            </div>
            <div>
              <span className="font-bold">KRA PIN Document: </span>
              {booking.clientPhotoUrl ? (
                <a href={booking.clientPhotoUrl} target="_blank" rel="noreferrer" className="text-jolu-600 hover:underline font-bold">Download File</a>
              ) : <span className="text-red-500">Not uploaded</span>}
            </div>
            <div>
              <span className="font-bold">Hire Agreement: </span>
              {booking.signedContractUrl ? (
                <a href={booking.signedContractUrl} target="_blank" rel="noreferrer" className="text-jolu-600 hover:underline font-bold">Download File</a>
              ) : <span className="text-red-500">Not uploaded</span>}
            </div>
          </div>

          <form onSubmit={handleUploadDocs} className="space-y-3 bg-gray-50 p-3 rounded-lg border text-[11px]">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Upload ID/Passport</label>
              <input type="file" className="w-full text-xs" onChange={e => setIdCardFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Upload KRA PIN</label>
              <input type="file" className="w-full text-xs" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Upload Hire Agreement</label>
              <input type="file" className="w-full text-xs" onChange={e => setContractFile(e.target.files?.[0] || null)} />
            </div>
            <button
              type="submit"
              disabled={uploadingDocs}
              className="w-full bg-jolu-600 hover:bg-jolu-700 text-white font-bold py-1.5 rounded text-xs transition-colors"
            >
              {uploadingDocs ? 'Uploading...' : 'Upload Selected Files'}
            </button>
          </form>
        </div>
      </div>

      {/* INSPECTION ACTIONS FORMS */}
      <div className="lg:col-span-2">
        {showPickupForm && (
          <form onSubmit={submitPickup} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-gray-800 border-b pb-2">Pre-Rental Vehicle Checklist</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-[10px] font-bold uppercase">Fuel Level Out</label>
                <select className="input text-xs" value={fuelLevel} onChange={e => setFuelLevel(e.target.value)}>
                  <option value="Full">Full Tank</option>
                  <option value="3/4">3/4 Tank</option>
                  <option value="Half">1/2 Tank</option>
                  <option value="1/4">1/4 Tank</option>
                </select>
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Current Mileage Out</label>
                <input type="number" className="input text-xs" value={mileageOut} onChange={e => setMileageOut(Number(e.target.value))} required />
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Body Condition (Scratches/Dents)</label>
                <input type="text" className="input text-xs" value={bodyCondition} onChange={e => setBodyCondition(e.target.value)} required />
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Tyres Condition</label>
                <select className="input text-xs" value={tyreCondition} onChange={e => setTyreCondition(e.target.value)}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair / Worn</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label text-[10px] font-bold uppercase">Pickup Notes</label>
              <textarea className="input text-xs h-16" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note any pre-existing damages or notes..." />
            </div>
            <button type="submit" className="btn-primary text-xs w-full py-2 rounded-xl font-bold">
              Submit Checklist & Dispatch Vehicle
            </button>
          </form>
        )}

        {showReturnForm && (
          <form onSubmit={submitReturn} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-gray-800 border-b pb-2">Return Inspection & Billing Reconciliation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-[10px] font-bold uppercase">Fuel Returned</label>
                <select className="input text-xs" value={fuelReturned} onChange={e => setFuelReturned(e.target.value)}>
                  <option value="Full">Full Tank</option>
                  <option value="Half">1/2 Tank</option>
                  <option value="Empty">Empty</option>
                </select>
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Mileage In</label>
                <input type="number" className="input text-xs" value={mileageIn} onChange={e => setMileageIn(Number(e.target.value))} required />
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Late Return Fee (KES)</label>
                <input type="number" className="input text-xs" value={lateFees} onChange={e => setLateFees(Number(e.target.value))} />
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Cleaning Charges (KES)</label>
                <input type="number" className="input text-xs" value={cleaningCharges} onChange={e => setCleaningCharges(Number(e.target.value))} />
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Damage Fees (KES)</label>
                <input type="number" className="input text-xs" value={additionalCharges} onChange={e => setAdditionalCharges(Number(e.target.value))} />
              </div>
            </div>
            <button type="submit" className="btn-primary text-xs w-full py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-700">
              Submit Inspection & Close Rental
            </button>
          </form>
        )}

        {!showPickupForm && !showReturnForm && (
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-gray-800 border-b pb-2">Direct Payments Terminal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-[10px] font-bold uppercase">Customer Telephone</label>
                <input type="text" className="input text-xs" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label text-[10px] font-bold uppercase">Outstanding balance</label>
                <div className="input text-xs bg-gray-50 font-bold font-mono">KES {Number(booking.balanceDue).toLocaleString()}</div>
              </div>
            </div>
            <button
              onClick={handleMpesaPrompt}
              disabled={stkPending || Number(booking.balanceDue) <= 0}
              className="btn-primary w-full text-xs flex justify-center items-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 font-bold"
            >
              <Smartphone className="w-3.5 h-3.5" /> Prompt M-Pesa Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 4: FLEET LIST VIEW
// ============================================================================
function FleetTabGrid({ vehicles, loading, onUpdateStatus }: { vehicles: any[]; loading: boolean; onUpdateStatus: (vid: string, status: string) => void }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((v) => (
        <div key={v.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-black text-jolu-600 bg-jolu-50 px-2 py-1 rounded-md">{v.category}</span>
                <h3 className="font-extrabold text-lg text-gray-800 mt-2">{v.make} {v.model}</h3>
                <span className="text-xs text-gray-400 font-bold">{v.registrationNumber}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                v.status === 'Available' ? 'bg-green-100 text-green-700' :
                v.status === 'On Hire' ? 'bg-blue-100 text-blue-700' :
                v.status === 'Maintenance' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {v.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3">
              <p className="text-gray-500"><span className="font-bold text-gray-700">Seating:</span> {v.seatingCapacity}</p>
              <p className="text-gray-500"><span className="font-bold text-gray-700">Mileage:</span> {v.mileage.toLocaleString()} KM</p>
              <p className="text-gray-500"><span className="font-bold text-gray-700">Transmission:</span> {v.transmission}</p>
              <p className="text-gray-500"><span className="font-bold text-gray-700">Fuel:</span> {v.fuelType}</p>
            </div>

            <div className="border-t pt-3 space-y-1.5">
              <p className="text-xs text-gray-500 flex justify-between"><span>Daily Rate:</span> <span className="font-bold text-gray-800">KES {Number(v.dailyRate).toLocaleString()}</span></p>
              <p className="text-xs text-gray-500 flex justify-between"><span>Weekly Rate:</span> <span className="font-bold text-gray-800">KES {Number(v.weeklyRate).toLocaleString()}</span></p>
              <p className="text-xs text-gray-500 flex justify-between"><span>Monthly Rate:</span> <span className="font-bold text-gray-800">KES {Number(v.monthlyRate).toLocaleString()}</span></p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border-t flex justify-between gap-2">
            <select
              className="input text-xs py-1 px-2 h-8"
              value={v.status}
              onChange={(e) => onUpdateStatus(v.id, e.target.value)}
            >
              <option value="Available">Available</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
            <span className="text-[11px] text-gray-400 font-semibold self-center">Branch: {v.currentBranch}</span>
          </div>
        </div>
      ))}
      {vehicles.length === 0 && (
        <p className="col-span-full text-center py-16 text-gray-400 text-sm">No vehicles added to fleet inventory.</p>
      )}
    </div>
  );
}

// ============================================================================
// TAB 5: DRIVERS LIST VIEW
// ============================================================================
function DriversTabList({ drivers, loading, onUpdateStatus }: { drivers: any[]; loading: boolean; onUpdateStatus: (did: string, status: string) => void }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-jolu-800 text-white text-xs uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">Driver Name</th>
            <th className="px-6 py-4">Phone</th>
            <th className="px-6 py-4">License Class / No</th>
            <th className="px-6 py-4">Expiries</th>
            <th className="px-6 py-4 text-right">Daily Cost</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Toggle Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {drivers.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-bold text-gray-900">{d.name}</td>
              <td className="px-6 py-4">{d.phone}</td>
              <td className="px-6 py-4">
                <span className="font-semibold text-gray-700">[{d.licenseClass}]</span> {d.licenseNumber}
              </td>
              <td className="px-6 py-4 text-xs space-y-1">
                <p><span className="font-bold text-gray-500">License:</span> {new Date(d.licenseExpiry).toLocaleDateString()}</p>
                {d.medicalExpiry && <p><span className="font-bold text-gray-500">Medical:</span> {new Date(d.medicalExpiry).toLocaleDateString()}</p>}
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold">
                KES {Number(d.salary || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  d.status === 'Available' ? 'bg-green-100 text-green-700' :
                  d.status === 'Assigned' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                }`}>
                  {d.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <select
                  className="input text-xs py-1 px-2 h-8 w-32"
                  value={d.status}
                  onChange={(e) => onUpdateStatus(d.id, e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="OffDuty">OffDuty</option>
                  <option value="Leave">On Leave</option>
                </select>
              </td>
            </tr>
          ))}
          {drivers.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-16 text-gray-400">No chauffeurs registered</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// TAB 6: MAINTENANCE RECORD LOG
// ============================================================================
function MaintenanceTabLog({ records, loading, onOpenAdd }: { records: any[]; loading: boolean; onOpenAdd: () => void }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-lg text-gray-800">Fleet Maintenance History</h3>
        <button onClick={onOpenAdd} className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Log Maintenance Work
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-jolu-800 text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Service Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Service Mileage</th>
              <th className="px-6 py-4 text-right">Cost</th>
              <th className="px-6 py-4">Notes</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{r.vehicle?.registrationNumber}</div>
                  <div className="text-xs text-gray-500">{r.vehicle?.make} {r.vehicle?.model}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-700">{r.type}</td>
                <td className="px-6 py-4">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-mono">{r.mileageAtService.toLocaleString()} KM</td>
                <td className="px-6 py-4 text-right font-mono font-bold">KES {Number(r.cost).toLocaleString()}</td>
                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{r.notes}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400">No maintenance records logged yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 7: REPORTS VIEW
// ============================================================================
function ReportsTabVisual({ reports, loading }: { reports: any; loading: boolean }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Late Returns Rate</h4>
          <p className="text-3xl font-black text-purple-600 mt-2">{reports.lateReturnsCount} Events</p>
          <span className="text-[11px] text-gray-400">Reconciled with late fees</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Damage Incident Reports</h4>
          <p className="text-3xl font-black text-red-600 mt-2">{reports.damageReportsCount} Claims</p>
          <span className="text-[11px] text-gray-400">Triggered body repairs / costs</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Maintenance Aggregated Expense</h4>
          <p className="text-3xl font-black text-emerald-600 mt-2">KES {Number(reports.totalMaintenanceCost).toLocaleString()}</p>
          <span className="text-[11px] text-gray-400">Total spent across rental fleet</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
        <h3 className="font-extrabold text-lg text-gray-800">Damage Claims Logs</h3>
        <table className="w-full text-left text-sm divide-y">
          <thead className="bg-gray-100 text-xs font-bold text-gray-700">
            <tr>
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3 text-right">Claim Amount</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(reports.damageReportsList || []).map((b: any) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-bold text-jolu-600">{b.bookingNumber}</td>
                <td className="px-4 py-3 font-medium">{b.customerName || b.customer?.name}</td>
                <td className="px-4 py-3">{b.vehicle?.registrationNumber}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-red-600">KES {Number(b.returns?.[0]?.additionalCharges || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{b.returns?.[0]?.notes}</td>
              </tr>
            ))}
            {(!reports.damageReportsList || reports.damageReportsList.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">No damage claims reported</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: STEP-BY-STEP BOOKING WIZARD
// ============================================================================
function BookingWizardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [pDate, setPDate] = useState(new Date().toISOString().split('T')[0]);
  const [rDate, setRDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // Available lists based on live checker
  const { data: availData, isLoading: loadingAvail } = useQuery({
    queryKey: ['availableAssets', pDate, rDate],
    queryFn: () => carHireApi.getAvailability(pDate, rDate),
    enabled: !!pDate && !!rDate
  });

  const availableVehicles = availData?.data?.data?.vehicles || [];
  const availableDrivers = availData?.data?.data?.drivers || [];

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
  });
  const customers = customersData?.data?.data || [];

  // Form values
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [pickupBranch, setPickupBranch] = useState('Head Office');
  const [dropoffBranch, setDropoffBranch] = useState('Head Office');
  const [rentalType, setRentalType] = useState('SelfDrive');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [depositPaid, setDepositPaid] = useState(0);
  const [commission, setCommission] = useState(0);

  // Extras
  const [extras, setExtras] = useState<Record<string, boolean>>({
    gps: false,
    babySeat: false,
    wifi: false,
    driver: false,
    additionalDriver: false,
    airportPickup: false,
    insuranceUpgrade: false,
    cleaningFee: false
  });

  // Dynamic pricing breakdown query
  const { data: priceData } = useQuery({
    queryKey: ['pricingCalc', vehicleId, pDate, rDate, rentalType, extras, promoCode],
    queryFn: () => carHireApi.calculatePrice({
      vehicleId,
      pickupDate: pDate,
      returnDate: rDate,
      rentalType,
      extras,
      promoCode
    }),
    enabled: !!vehicleId && !!pDate && !!rDate
  });

  const pricing = priceData?.data?.data || {
    durationDays: 1,
    baseRate: 0,
    rateApplied: 'daily',
    subtotal: 0,
    extrasTotal: 0,
    discountAmount: 0,
    totalCharges: 0,
    depositRequired: 0
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await carHireApi.create({
        customerId,
        vehicleId,
        driverId,
        customerName,
        phoneNumber,
        idNumber,
        pickupBranch,
        dropoffBranch,
        pickupDate: pDate,
        returnDate: rDate,
        rentalType,
        remarks,
        extras,
        promoCode,
        commission,
        depositPaid
      });
      toast.success('Rental Booking Confirmed & Accounting Invoice Generated Successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Rental Booking creation failure');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-65 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-jolu-800 text-white">
          <div>
            <h2 className="text-xl font-extrabold">Confirm New Rental Booking</h2>
            <p className="text-xs text-jolu-200 mt-1">Overlapping dates check, live fleet routing & flexible pricing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-jolu-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: DATE RANGE */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Step 1: Dates & Branch Logistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Pickup Branch</label>
                  <select className="input" value={pickupBranch} onChange={e => setPickupBranch(e.target.value)}>
                    <option value="Head Office">Head Office</option>
                    <option value="Nairobi">Nairobi Branch</option>
                    <option value="Nakuru">Nakuru Branch</option>
                  </select>
                </div>
                <div>
                  <label className="label">Dropoff Branch</label>
                  <select className="input" value={dropoffBranch} onChange={e => setDropoffBranch(e.target.value)}>
                    <option value="Head Office">Head Office</option>
                    <option value="Nairobi">Nairobi Branch</option>
                    <option value="Nakuru">Nakuru Branch</option>
                  </select>
                </div>
                <div>
                  <label className="label">Pickup Date</label>
                  <input type="date" className="input" value={pDate} onChange={e => setPDate(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Return Date</label>
                  <input type="date" className="input" value={rDate} onChange={e => setRDate(e.target.value)} required />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary w-full py-3 rounded-xl font-bold flex justify-center items-center gap-1 mt-4"
              >
                Find Available Fleet <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: CHOOSE FLEET & DRIVER */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Step 2: Assign Available Vehicle & Chauffeur</h3>

              {loadingAvail ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Select Vehicle (Only Available Shown)</label>
                    <select className="input" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
                      <option value="">-- Choose Vehicle --</option>
                      {availableVehicles.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} - {v.make} {v.model} ({v.category}) - KES {Number(v.dailyRate).toLocaleString()}/day
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Rental Category / Type</label>
                    <select className="input" value={rentalType} onChange={e => setRentalType(e.target.value)}>
                      <option value="SelfDrive">Self Drive</option>
                      <option value="Chauffeur">Chauffeur Driven</option>
                      <option value="Corporate">Corporate Account Rental</option>
                      <option value="AirportTransfer">Airport Transfer</option>
                      <option value="LongTermLease">Long Term Lease</option>
                    </select>
                  </div>

                  {rentalType === 'Chauffeur' && (
                    <div>
                      <label className="label">Assign Chauffeur (Only Available Shown)</label>
                      <select className="input" value={driverId} onChange={e => setDriverId(e.target.value)}>
                        <option value="">-- No Chauffeur / Self-Drive --</option>
                        {availableDrivers.map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.licenseClass}) - KES {Number(d.salary).toLocaleString()}/day
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary w-1/2 py-2.5 rounded-xl font-bold">Back</button>
                    <button type="button" onClick={() => setStep(3)} disabled={!vehicleId} className="btn-primary w-1/2 py-2.5 rounded-xl font-bold flex justify-center items-center gap-1">
                      Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CUSTOMER SELECTION & PREFERRED OPTIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Step 3: Customer Information & Optional Extras</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Link Registered Customer</label>
                  <select
                    className="input"
                    value={customerId}
                    onChange={(e) => {
                      const c = customers.find((cust: any) => cust.id === e.target.value);
                      setCustomerId(e.target.value);
                      if (c) {
                        setCustomerName(c.name);
                        setPhoneNumber(c.phone);
                        setIdNumber(c.idNumber || '');
                      }
                    }}
                  >
                    <option value="">-- Manual/Walk-in Client --</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                    ))}
                  </select>
                </div>

                {!customerId && (
                  <>
                    <div>
                      <label className="label">Full Name</label>
                      <input type="text" className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">Phone Number</label>
                      <input type="text" className="input" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">National ID / Passport</label>
                      <input type="text" className="input" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
                    </div>
                  </>
                )}
              </div>

              {/* Optional Extras Checklist */}
              <div>
                <label className="label font-bold text-gray-700">Select Optional Rental Extras</label>
                <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                  {Object.keys(extras).map((key) => (
                    <label key={key} className="flex items-center gap-2 border p-2.5 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={extras[key]}
                        onChange={(e) => setExtras({ ...extras, [key]: e.target.checked })}
                      />
                      <span className="capitalize font-semibold text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary w-1/2 py-2.5 rounded-xl font-bold">Back</button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary w-1/2 py-2.5 rounded-xl font-bold flex justify-center items-center gap-1">
                  Pricing & Finish <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FINANCIAL BILLING & SUBMIT */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Step 4: Final Billing Breakdown</h3>

              <div className="bg-gray-50 p-5 rounded-2xl border space-y-3">
                <p className="text-xs text-gray-500 flex justify-between"><span>Base Rental Duration:</span> <span className="font-bold text-gray-800">{pricing.durationDays} Days</span></p>
                <p className="text-xs text-gray-500 flex justify-between"><span>Pro-rated Subtotal:</span> <span className="font-bold text-gray-800">KES {Number(pricing.subtotal).toLocaleString()}</span></p>
                <p className="text-xs text-gray-500 flex justify-between"><span>Extras Total:</span> <span className="font-bold text-gray-800">KES {Number(pricing.extrasTotal).toLocaleString()}</span></p>
                {pricing.discountAmount > 0 && (
                  <p className="text-xs text-red-500 flex justify-between"><span>Discount Applied:</span> <span className="font-bold">- KES {Number(pricing.discountAmount).toLocaleString()}</span></p>
                )}
                <div className="border-t pt-2 text-xs text-gray-500 flex justify-between font-bold">
                  <span>Gross Rental Charges:</span>
                  <span>KES {Number(pricing.totalCharges).toLocaleString()}</span>
                </div>
                <div className="text-xs text-amber-600 flex justify-between font-semibold">
                  <span>Commission:</span>
                  <span>- KES {Number(commission).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-extrabold text-jolu-700 text-sm">
                  <span>Actual Balance Payout:</span>
                  <span>KES {Number(pricing.totalCharges - commission).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Promo / Coupon Code</label>
                  <input type="text" className="input" placeholder="e.g. JOLU10" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
                </div>
                <div>
                  <label className="label">Commission (KES)</label>
                  <input type="number" className="input" placeholder="e.g. 1500" value={commission} onChange={e => setCommission(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Deposit Amount Paid (KES)</label>
                  <input type="number" className="input" value={depositPaid} onChange={e => setDepositPaid(Number(e.target.value))} />
                </div>
              </div>

              <div>
                <label className="label">Internal Booking Notes / Remarks</label>
                <textarea className="input h-16 text-xs" value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setStep(3)} className="btn-secondary w-1/2 py-2.5 rounded-xl font-bold">Back</button>
                <button type="submit" className="btn-primary w-1/2 py-2.5 rounded-xl font-bold">
                  Confirm Booking & Issue Invoice
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: ADD VEHICLE TO RENTAL FLEET
// ============================================================================
function VehicleAddModal({ onClose, onSubmit, isPending }: { onClose: () => void; onSubmit: (data: any) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Sedan',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seatingCapacity: 5,
    color: 'White',
    chassisNumber: '',
    engineNumber: '',
    mileage: 0,
    dailyRate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    depositRequired: 0,
    currentBranch: 'Head Office',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-jolu-800 text-white">
          <h2 className="text-lg font-bold">Add Fleet Vehicle</h2>
          <button onClick={onClose} className="p-2 hover:bg-jolu-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Registration Number</label>
              <input type="text" className="input" value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} required />
            </div>
            <div>
              <label className="label">Make</label>
              <input type="text" className="input" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} required />
            </div>
            <div>
              <label className="label">Model</label>
              <input type="text" className="input" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required />
            </div>
            <div>
              <label className="label">Year</label>
              <input type="number" className="input" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Pickup">Pickup</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="label">Transmission</label>
              <select className="input" value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })}>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="label">Fuel Type</label>
              <select className="input" value={formData.fuelType} onChange={e => setFormData({ ...formData, fuelType: e.target.value })}>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="label">Seating Capacity</label>
              <input type="number" className="input" value={formData.seatingCapacity} onChange={e => setFormData({ ...formData, seatingCapacity: Number(e.target.value) })} />
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Daily Rate (KES)</label>
              <input type="number" className="input" value={formData.dailyRate} onChange={e => setFormData({ ...formData, dailyRate: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Weekly Rate (KES)</label>
              <input type="number" className="input" value={formData.weeklyRate} onChange={e => setFormData({ ...formData, weeklyRate: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Monthly Rate (KES)</label>
              <input type="number" className="input" value={formData.monthlyRate} onChange={e => setFormData({ ...formData, monthlyRate: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Refundable Deposit (KES)</label>
              <input type="number" className="input" value={formData.depositRequired} onChange={e => setFormData({ ...formData, depositRequired: Number(e.target.value) })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary py-2 px-5 rounded-xl font-bold">
              {isPending ? 'Saving...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: ADD DRIVER PROFILE
// ============================================================================
function DriverAddModal({ onClose, onSubmit, isPending }: { onClose: () => void; onSubmit: (data: any) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    licenseClass: 'Class B',
    licenseExpiry: new Date().toISOString().split('T')[0],
    emergencyContact: '',
    salary: 2000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-jolu-800 text-white">
          <h2 className="text-lg font-bold">Register Chauffeur</h2>
          <button onClick={onClose} className="p-2 hover:bg-jolu-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Telephone Contact</label>
            <input type="text" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">License Number</label>
              <input type="text" className="input" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} required />
            </div>
            <div>
              <label className="label">License Class</label>
              <input type="text" className="input" value={formData.licenseClass} onChange={e => setFormData({ ...formData, licenseClass: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">License Expiry</label>
              <input type="date" className="input" value={formData.licenseExpiry} onChange={e => setFormData({ ...formData, licenseExpiry: e.target.value })} required />
            </div>
            <div>
              <label className="label">Daily Chauffeur Fee (KES)</label>
              <input type="number" className="input" value={formData.salary} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary py-2 px-5 rounded-xl font-bold">
              {isPending ? 'Saving...' : 'Register Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: LOG FLEET MAINTENANCE record
// ============================================================================
function MaintenanceAddModal({ onClose, onSubmit, vehicles, isPending }: { onClose: () => void; onSubmit: (data: any) => void; vehicles: any[]; isPending: boolean }) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'ScheduledService',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    mileageAtService: 0,
    status: 'Completed',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-jolu-800 text-white">
          <h2 className="text-lg font-bold">Log Maintenance Work</h2>
          <button onClick={onClose} className="p-2 hover:bg-jolu-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Select Vehicle</label>
            <select className="input" value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })} required>
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.registrationNumber} - {v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Service Type</label>
            <select className="input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="ScheduledService">Scheduled Service</option>
              <option value="Tyres">Tyre Change</option>
              <option value="OilChange">Oil Change</option>
              <option value="Repair">General Repair</option>
              <option value="Accident">Accident Repair</option>
              <option value="Insurance">Insurance Renewal</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Service Cost (KES)</label>
              <input type="number" className="input" value={formData.cost} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Current Mileage</label>
              <input type="number" className="input" value={formData.mileageAtService} onChange={e => setFormData({ ...formData, mileageAtService: Number(e.target.value) })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Service Date</label>
              <input type="date" className="input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="Completed">Completed</option>
                <option value="InProgress">In Progress</option>
                <option value="Scheduled">Scheduled / Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Mechanic / Service Notes</label>
            <textarea className="input h-16 text-xs" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} required placeholder="Enter parts replaced, mechanic names..." />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary py-2 px-5 rounded-xl font-bold">
              {isPending ? 'Logging...' : 'Log Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
