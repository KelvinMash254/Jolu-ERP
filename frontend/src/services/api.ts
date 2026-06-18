import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const { accessToken, currentCompany } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (currentCompany) config.headers['X-Company-Id'] = currentCompany.id;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string, twoFactorToken?: string) =>
    api.post('/auth/login', { email, password, twoFactorToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
  consolidated: () => api.get('/companies/consolidated/dashboard'),
};

export const crmApi = {
  getCustomers: (params?: Record<string, string>) => api.get('/crm/customers', { params }),
  getCustomer: (id: string) => api.get(`/crm/customers/${id}`),
  createCustomer: (data: object) => api.post('/crm/customers', data),
  getLeads: (params?: Record<string, string>) => api.get('/crm/leads', { params }),
  createLead: (data: object) => api.post('/crm/leads', data),
  updateLeadStage: (id: string, data: object) => api.patch(`/crm/leads/${id}/stage`, data),
  getKanban: () => api.get('/crm/pipeline/kanban'),
  getKpis: () => api.get('/crm/pipeline/kpis'),
};

export const inventoryApi = {
  getMachinery: (params?: Record<string, string>) => api.get('/inventory/machinery', { params }),
  createMachinery: (data: object) => api.post('/inventory/machinery', data),
  getSpareParts: () => api.get('/inventory/spare-parts'),
  getLowStock: () => api.get('/inventory/spare-parts/low-stock'),
  getVehicles: () => api.get('/inventory/vehicles'),
};

export const invoiceApi = {
  getAll: (params?: Record<string, string>) => api.get('/invoices', { params }),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  create: (data: object) => api.post('/invoices', data),
  generatePdf: (id: string, options?: object) => api.post(`/invoices/${id}/pdf`, options),
  send: (id: string, options?: object) => api.post(`/invoices/${id}/send`, options),
};

export const accountingApi = {
  getChartOfAccounts: () => api.get('/accounting/chart-of-accounts'),
  getJournals: () => api.get('/accounting/journals'),
  getTrialBalance: () => api.get('/accounting/reports/trial-balance'),
  getIncomeStatement: (params?: Record<string, string>) => api.get('/accounting/reports/income-statement', { params }),
  getBalanceSheet: () => api.get('/accounting/reports/balance-sheet'),
  getReceivables: () => api.get('/accounting/receivables'),
};

export const serviceApi = {
  getTickets: (params?: Record<string, string>) => api.get('/service', { params }),
  createTicket: (data: object) => api.post('/service', data),
  assignTicket: (id: string, data: object) => api.patch(`/service/${id}/assign`, data),
  updateStatus: (id: string, data: object) => api.patch(`/service/${id}/status`, data),
};

export const securityApi = {
  getClients: () => api.get('/security/clients'),
  getContracts: () => api.get('/security/contracts'),
  getGuards: () => api.get('/security/guards'),
  getSites: () => api.get('/security/sites'),
};

export const financingApi = {
  getAll: () => api.get('/financing'),
  getDashboard: () => api.get('/financing/dashboard'),
};

export const companiesApi = {
  getAll: () => api.get('/companies'),
};

export const notificationsApi = {
  getAll: (params?: Record<string, string>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  getAuditLogs: (params?: Record<string, string>) => api.get('/notifications/audit', { params }),
};

export const pettyCashApi = {
  getAccounts: () => api.get('/pettycash/accounts'),
};

export const mpesaApi = {
  getTransactions: () => api.get('/mpesa/transactions'),
  stkPush: (data: object) => api.post('/mpesa/stk-push', data),
};
