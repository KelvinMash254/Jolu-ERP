export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleDisplayName?: string;
  companies: Company[];
  branches: Branch[];
}

export interface Company {
  id: string;
  code: string;
  name: string;
  isPrimary?: boolean;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface DashboardData {
  kpis: {
    monthlyRevenue: number;
    outstandingAmount: number;
    lowStockCount: number;
    openTickets: number;
    activeLeads: number;
    cashPosition: number;
  };
  salesTrend: { month: string; revenue: number }[];
  outstandingInvoices: Invoice[];
  lowStockParts: SparePart[];
  recentPayments: Payment[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  county?: string;
  idNumber?: string;
  kraPin?: string;
  financingBank?: string;
  loanAmount?: number;
  depositPaid?: number;
  approvalStatus?: string;
}

export interface Lead {
  id: string;
  title: string;
  stage: string;
  pipelineStage: string;
  estimatedValue?: number;
  customer?: Customer;
  salesperson?: { firstName: string; lastName: string };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  customer?: { name: string };
  dueDate?: string;
}

export interface SparePart {
  id: string;
  partNumber: string;
  partName: string;
  category?: string;
  quantity: number;
  reorderLevel: number;
  sellingPrice?: number;
}

export interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  invoice?: { invoiceNumber: string };
}

export interface MachineryUnit {
  id: string;
  productName: string;
  category: string;
  brand: string;
  model: string;
  serialNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  registrationNumber?: string;
  stockStatus: string;
  costPrice: number;
  sellingPrice: number;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  problem: string;
  status: string;
  customer?: { name: string; phone: string };
  technician?: { firstName: string; lastName: string };
  machineryUnit?: { productName: string; serialNumber: string };
  vehicle?: { make: string; model: string; registrationNumber: string };
}
