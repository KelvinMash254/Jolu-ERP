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
  convertLead: (id: string) => api.post(`/crm/leads/${id}/convert`),
  getKanban: () => api.get('/crm/pipeline/kanban'),
  getKpis: () => api.get('/crm/pipeline/kpis'),
};

export const inventoryApi = {
  getMachinery: (params?: Record<string, string>) => api.get('/inventory/machinery', { params }),
  createMachinery: (data: object) => api.post('/inventory/machinery', data),
  getSpareParts: () => api.get('/inventory/spare-parts'),
  createSparePart: (data: object) => api.post('/inventory/spare-parts', data),
  getLowStock: () => api.get('/inventory/spare-parts/low-stock'),
  getVehicles: () => api.get('/inventory/vehicles'),
  createVehicle: (data: object) => api.post('/inventory/vehicles', data),
};

export const invoiceApi = {
  getAll: (params?: Record<string, string>) => api.get('/invoices', { params }),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  create: (data: object) => api.post('/invoices', data),
  generatePdf: (id: string, options?: object) => api.post(`/invoices/${id}/pdf`, options),
  send: (id: string) => api.post(`/invoices/${id}/send`),
};

export const accountingApi = {
  getChartOfAccounts: () => api.get('/accounting/chart-of-accounts'),
  getJournals: () => api.get('/accounting/journals'),
  getTrialBalance: () => api.get('/accounting/reports/trial-balance'),
  getIncomeStatement: (params?: Record<string, string>) => api.get('/accounting/reports/income-statement', { params }),
  getBalanceSheet: () => api.get('/accounting/reports/balance-sheet'),
  getReceivables: () => api.get('/accounting/receivables'),
  getStatementClients: () => api.get('/accounting/statements/clients'),
  getClientStatement: (clientId: string) => api.get(`/accounting/statements/${clientId}`),

  // PDF download links
  downloadTrialBalancePdf: () => api.get('/accounting/reports/trial-balance/pdf'),
  downloadIncomeStatementPdf: (params?: Record<string, string>) => api.get('/accounting/reports/income-statement/pdf', { params }),
  downloadBalanceSheetPdf: () => api.get('/accounting/reports/balance-sheet/pdf'),
  downloadReceivablesPdf: () => api.get('/accounting/receivables/pdf'),
  downloadClientStatementPdf: (clientId: string) => api.get(`/accounting/statements/${clientId}/pdf`),
};

export const serviceApi = {
  getTickets: (params?: Record<string, string>) => api.get('/service', { params }),
  createTicket: (data: object) => api.post('/service', data),
  assignTicket: (id: string, data: object) => api.patch(`/service/${id}/assign`, data),
  updateStatus: (id: string, data: object) => api.patch(`/service/${id}/status`, data),
};

export const securityApi = {
  getClients: () => api.get('/security/clients'),
  createClient: (data: object) => api.post('/security/clients', data),
  getContracts: () => api.get('/security/contracts'),
  createContract: (data: object) => api.post('/security/contracts', data),
  getGuards: () => api.get('/security/guards'),
  createGuard: (data: object) => api.post('/security/guards', data),
  getSites: () => api.get('/security/sites'),
  createSite: (data: object) => api.post('/security/sites', data),
};

export const financingApi = {
  getAll: (params?: Record<string, string>) => api.get('/financing', { params }),
  getDashboard: () => api.get('/financing/dashboard'),
  create: (data: object) => api.post('/financing', data),
  updateStage: (id: string, data: object) => api.patch(`/financing/${id}/stage`, data),
};

export const companiesApi = {
  getAll: () => api.get('/companies'),
};

export const importExportApi = {
  import: (data: FormData) => api.post('/import-export/import', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  export: (entity: string, format: string) => api.get(`/import-export/export?entity=${entity}&format=${format}`),
  getJobs: () => api.get('/import-export/jobs'),
};

export const notificationsApi = {
  getAll: (params?: Record<string, string>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  getAuditLogs: (params?: Record<string, string>) => api.get('/notifications/audit', { params }),
};

export const pettyCashApi = {
  getAccounts: () => api.get('/pettycash/accounts'),
  createRequest: (data: object) => api.post('/pettycash/requests', data),
  approveRequest: (id: string, status: string) => api.patch(`/pettycash/requests/${id}/approve`, { status }),
  recordExpense: (data: object) => api.post('/pettycash/expenses', data),
};

export const mpesaApi = {
  getTransactions: () => api.get('/mpesa/transactions'),
  stkPush: (data: object) => api.post('/mpesa/stk-push', data),
};

export const carHireApi = {
  getAll: () => api.get('/car-hire'),
  create: (data: object) => api.post('/car-hire', data),
  update: (id: string, data: object) => api.patch(`/car-hire/${id}`, data),
};

export const machineryDocsApi = {
  getContracts: () => api.get('/machinery-docs/sales-contracts'),
  createContract: (data: object) => api.post('/machinery-docs/sales-contracts', data),
  getContractPdf: (id: string) => api.get(`/machinery-docs/sales-contracts/${id}/pdf`),

  getDeliveries: () => api.get('/machinery-docs/delivery-notes'),
  createDelivery: (data: object) => api.post('/machinery-docs/delivery-notes', data),
  getDeliveryPdf: (id: string) => api.get(`/machinery-docs/delivery-notes/${id}/pdf`),

  getGatePasses: () => api.get('/machinery-docs/gate-passes'),
  createGatePass: (data: object) => api.post('/machinery-docs/gate-passes', data),
  getGatePassPdf: (id: string) => api.get(`/machinery-docs/gate-passes/${id}/pdf`),
};
