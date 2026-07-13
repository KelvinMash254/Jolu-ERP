import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GroupDashboardPage from './pages/GroupDashboardPage';
import CustomersPage from './pages/CustomersPage';
import PipelinePage from './pages/PipelinePage';
import InventoryPage from './pages/InventoryPage';
import InvoicesPage from './pages/InvoicesPage';
import AccountingPage from './pages/AccountingPage';
import ServicePage from './pages/ServicePage';
import SecurityPage from './pages/SecurityPage';
import FinancingPage from './pages/FinancingPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import PettyCashPage from './pages/PettyCashPage';
import CarHirePage from './pages/CarHirePage';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  return accessToken ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="group" element={<GroupDashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="accounting" element={<AccountingPage />} />
          <Route path="service" element={<ServicePage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="financing" element={<FinancingPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="petty-cash" element={<PettyCashPage />} />
          <Route path="car-hire" element={<CarHirePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
