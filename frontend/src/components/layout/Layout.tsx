import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Kanban, Package, FileText, Calculator,
  Wrench, Shield, Landmark, Building2, Bell, LogOut, ChevronDown,
  Settings, ClipboardList, Wallet, BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import clsx from 'clsx';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/group', icon: BarChart3, label: 'Group Overview', roles: ['SUPER_ADMIN', 'GROUP_ADMIN'] },
  { to: '/customers', icon: Users, label: 'CRM / Customers' },
  { to: '/pipeline', icon: Kanban, label: 'Sales Pipeline' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/accounting', icon: Calculator, label: 'Accounting' },
  { to: '/financing', icon: Landmark, label: 'Bank Financing', companies: ['MACHINERIES', 'AUTOMOBILE'] },
  { to: '/service', icon: Wrench, label: 'After Sales', companies: ['MACHINERIES', 'AUTOMOBILE'] },
  { to: '/security', icon: Shield, label: 'Security Module', companies: ['SECURITY'] },
  { to: '/car-hire', icon: Car, label: 'Car Hire', companies: ['AUTOMOBILE'] },
  { to: '/petty-cash', icon: Wallet, label: 'Petty Cash' },
  { to: '/users', icon: Users, label: 'User Management', roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'] },
  { to: '/audit', icon: ClipboardList, label: 'Audit Trail', roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'AUDITOR'] },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, currentCompany, setCurrentCompany, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ unread: 'true', limit: '5' }),
    refetchInterval: 60000,
  });

  const unreadCount = notifications?.data?.data?.length || 0;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => {
    if (item.roles && !item.roles.includes(user?.role || '')) return false;
    if (item.companies && currentCompany && !item.companies.includes(currentCompany.code)) return false;
    // Special case for inventory label if needed, but keeping it simple for now
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-sidebar text-white flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-jolu-400" />
            <div>
              <h1 className="font-bold text-lg">Jolu ERP</h1>
              <p className="text-xs text-slate-400">Group Management</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-700 relative">
          <button
            onClick={() => setShowCompanyMenu(!showCompanyMenu)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-hover hover:bg-sidebar-active text-sm"
          >
            <span className="truncate">{currentCompany?.name || 'Select Company'}</span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>
          {showCompanyMenu && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-slate-800 rounded-lg shadow-xl z-50 border border-slate-600">
              {user?.companies.map((co) => (
                <button
                  key={co.id}
                  onClick={() => { 
                    setCurrentCompany(co); 
                    setShowCompanyMenu(false);
                    // Refresh the page and redirect to dashboard to ensure all company-specific data is reloaded
                    window.location.href = '/';
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-sm hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg',
                    currentCompany?.id === co.id && 'bg-jolu-800 text-jolu-200'
                  )}
                >
                  {co.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-jolu-600 text-white' : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                )
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-jolu-600 flex items-center justify-center text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.roleDisplayName || user?.role}</p>
            </div>
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-2 py-1">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
