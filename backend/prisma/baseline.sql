-- CreateEnum
CREATE TYPE "CompanyCode" AS ENUM ('MACHINERIES', 'SECURITY', 'AUTOMOBILE');

-- CreateEnum
CREATE TYPE "BranchCode" AS ENUM ('HEAD_OFFICE', 'NAIROBI', 'NAKURU');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'SALES_MANAGER', 'SALES_REPRESENTATIVE', 'TECHNICIAN', 'FINANCE_TEAM', 'INVENTORY_MANAGER', 'BRANCH_ADMIN_NAIROBI', 'BRANCH_ADMIN_NAKURU', 'AUDITOR');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('LEAD', 'FIRST_CONTACT', 'NEEDS_ASSESSMENT', 'QUOTATION_SENT', 'APPLICATION_SUBMITTED', 'BANK_REVIEW', 'BANK_APPROVED', 'BANK_REJECTED', 'CUSTOMER_DEPOSIT_RECEIVED', 'UNIT_ALLOCATED', 'DOCUMENTATION_COMPLETE', 'REGISTRATION_COMPLETE', 'DELIVERED', 'AFTER_SALES_ACTIVE');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NEW_LEAD', 'QUALIFIED', 'PROPOSAL_SENT', 'APPLICATION_SUBMITTED', 'BANK_APPROVAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'MEETING', 'NOTE', 'DOCUMENT', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "MachineryCategory" AS ENUM ('TRACTOR', 'HARVESTER', 'FARM_IMPLEMENT');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'RESERVED', 'SOLD', 'DELIVERED');

-- CreateEnum
CREATE TYPE "FinancingStage" AS ENUM ('DOCUMENTS_SUBMITTED', 'BANK_RECEIVED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DEPOSIT_RECEIVED', 'UNIT_ALLOCATED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SERVICE_DEDUCTION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID_IN_FULL');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'OUT_ON_HIRE', 'RETURNED', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PROFORMA', 'INVOICE', 'RECEIPT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'PURCHASE_ORDER', 'DELIVERY_NOTE', 'QUOTATION');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PettyCashStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "code" "CompanyCode" NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "kraPin" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "ccEmail" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" "BranchCode" NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompany" (
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserCompany_pkey" PRIMARY KEY ("userId","companyId")
);

-- CreateTable
CREATE TABLE "UserBranch" (
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "UserBranch_pkey" PRIMARY KEY ("userId","branchId")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idNumber" TEXT,
    "kraPin" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "county" TEXT,
    "physicalAddress" TEXT,
    "financingBank" TEXT,
    "loanAmount" DECIMAL(15,2),
    "depositPaid" DECIMAL(15,2) DEFAULT 0,
    "approvalStatus" TEXT,
    "salespersonId" TEXT,
    "technicianId" TEXT,
    "administratorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "title" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL DEFAULT 'LEAD',
    "pipelineStage" "PipelineStage" NOT NULL DEFAULT 'NEW_LEAD',
    "source" TEXT,
    "estimatedValue" DECIMAL(15,2),
    "notes" TEXT,
    "salespersonId" TEXT,
    "lostReason" TEXT,
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "customerId" TEXT,
    "leadId" TEXT,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT,
    "leadId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "customerId" TEXT,
    "leadId" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineryUnit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" "MachineryCategory" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "registrationNumber" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "supplier" TEXT,
    "costPrice" DECIMAL(15,2) NOT NULL,
    "sellingPrice" DECIMAL(15,2) NOT NULL,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "reservedForId" TEXT,
    "soldAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineryUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineryLifecycleEvent" (
    "id" TEXT NOT NULL,
    "machineryUnitId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "performedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineryLifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankFinancingApplication" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "loanAmount" DECIMAL(15,2) NOT NULL,
    "depositAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL(15,2),
    "stage" "FinancingStage" NOT NULL DEFAULT 'DOCUMENTS_SUBMITTED',
    "approvalDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "allocatedUnitId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankFinancingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "machineryUnitId" TEXT,
    "vehicleId" TEXT,
    "problem" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "technicianId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "labourHours" DECIMAL(8,2),
    "technicianNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicketPart" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "ServiceTicketPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "supplier" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(15,2) NOT NULL,
    "sellingPrice" DECIMAL(15,2) NOT NULL,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "barcode" TEXT,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePartMovement" (
    "id" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SparePartMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityClient" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "kraPin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityContract" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "customerId" TEXT,
    "contractNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "monthlyFee" DECIMAL(15,2) NOT NULL,
    "guardsCount" INTEGER NOT NULL DEFAULT 1,
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guard" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idNumber" TEXT,
    "licenseNo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardDeployment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "shift" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GuardDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardAttendance" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "GuardAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" DECIMAL(15,2) NOT NULL,
    "sellingPrice" DECIMAL(15,2) NOT NULL,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarHireBooking" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "phoneNumber" TEXT,
    "idNumber" TEXT,
    "driverAssigned" TEXT,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "destination" TEXT,
    "dailyRate" DECIMAL(15,2) NOT NULL,
    "totalCharges" DECIMAL(15,2) NOT NULL,
    "depositPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(15,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "vehicleStatus" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientIdCardUrl" TEXT,
    "clientPhotoUrl" TEXT,
    "location" TEXT,
    "signedContractUrl" TEXT,

    CONSTRAINT "CarHireBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "securityClientId" TEXT,
    "contractId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(15,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "amountPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "journalEntryId" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 16,
    "total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpesaTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "transactionCode" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "invoiceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "rawPayload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpesaTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "limit" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCashAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "PettyCashStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCashRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashExpense" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "receiptUrl" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCashExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "content" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesContract" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "machineryUnitId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "salePrice" DECIMAL(15,2) NOT NULL,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "machineryUnitId" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destination" TEXT,
    "receivedBy" TEXT,
    "driverName" TEXT,
    "driverIdNumber" TEXT,
    "driverPhone" TEXT,
    "truckNumberPlate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatePass" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "machineryUnitId" TEXT NOT NULL,
    "gatePassNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeOut" TEXT,
    "destination" TEXT,
    "driverName" TEXT,
    "driverIdNumber" TEXT,
    "driverPhone" TEXT,
    "truckNumberPlate" TEXT,
    "equipmentDetails" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "supplier" TEXT DEFAULT 'JOLU AGRICULTURAL MACHINERIES LTD',
    "comments" TEXT,
    "securityOfficer" TEXT,
    "staffPresent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportExportJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "entity" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "recordCount" INTEGER,
    "errorLog" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_code_key" ON "Branch"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_module_action_key" ON "Permission"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshToken_key" ON "UserSession"("refreshToken");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_module_action_idx" ON "AuditLog"("module", "action");

-- CreateIndex
CREATE INDEX "Customer_companyId_phone_idx" ON "Customer"("companyId", "phone");

-- CreateIndex
CREATE INDEX "Customer_salespersonId_idx" ON "Customer"("salespersonId");

-- CreateIndex
CREATE INDEX "Lead_companyId_stage_idx" ON "Lead"("companyId", "stage");

-- CreateIndex
CREATE INDEX "Lead_salespersonId_pipelineStage_idx" ON "Lead"("salespersonId", "pipelineStage");

-- CreateIndex
CREATE UNIQUE INDEX "MachineryUnit_serialNumber_key" ON "MachineryUnit"("serialNumber");

-- CreateIndex
CREATE INDEX "MachineryUnit_companyId_stockStatus_idx" ON "MachineryUnit"("companyId", "stockStatus");

-- CreateIndex
CREATE INDEX "MachineryUnit_category_idx" ON "MachineryUnit"("category");

-- CreateIndex
CREATE INDEX "BankFinancingApplication_companyId_stage_idx" ON "BankFinancingApplication"("companyId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTicket_ticketNumber_key" ON "ServiceTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "ServiceTicket_companyId_status_idx" ON "ServiceTicket"("companyId", "status");

-- CreateIndex
CREATE INDEX "ServiceTicket_technicianId_idx" ON "ServiceTicket"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_barcode_key" ON "SparePart"("barcode");

-- CreateIndex
CREATE INDEX "SparePart_companyId_quantity_idx" ON "SparePart"("companyId", "quantity");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_companyId_partNumber_key" ON "SparePart"("companyId", "partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityContract_contractNumber_key" ON "SecurityContract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Guard_companyId_employeeNo_key" ON "Guard"("companyId", "employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_companyId_registrationNumber_key" ON "Vehicle"("companyId", "registrationNumber");

-- CreateIndex
CREATE INDEX "CarHireBooking_companyId_pickupDate_idx" ON "CarHireBooking"("companyId", "pickupDate");

-- CreateIndex
CREATE UNIQUE INDEX "CarHireBooking_companyId_bookingNumber_key" ON "CarHireBooking"("companyId", "bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_companyId_code_key" ON "ChartOfAccount"("companyId", "code");

-- CreateIndex
CREATE INDEX "JournalEntry_companyId_date_idx" ON "JournalEntry"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_companyId_entryNumber_key" ON "JournalEntry"("companyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_journalEntryId_key" ON "Invoice"("journalEntryId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_status_idx" ON "Invoice"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON "Invoice"("companyId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MpesaTransaction_transactionCode_key" ON "MpesaTransaction"("transactionCode");

-- CreateIndex
CREATE UNIQUE INDEX "SalesContract_contractNumber_key" ON "SalesContract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_deliveryNumber_key" ON "DeliveryNote"("deliveryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GatePass_gatePassNumber_key" ON "GatePass"("gatePassNumber");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineryUnit" ADD CONSTRAINT "MachineryUnit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineryLifecycleEvent" ADD CONSTRAINT "MachineryLifecycleEvent_machineryUnitId_fkey" FOREIGN KEY ("machineryUnitId") REFERENCES "MachineryUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinancingApplication" ADD CONSTRAINT "BankFinancingApplication_allocatedUnitId_fkey" FOREIGN KEY ("allocatedUnitId") REFERENCES "MachineryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinancingApplication" ADD CONSTRAINT "BankFinancingApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankFinancingApplication" ADD CONSTRAINT "BankFinancingApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_machineryUnitId_fkey" FOREIGN KEY ("machineryUnitId") REFERENCES "MachineryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketPart" ADD CONSTRAINT "ServiceTicketPart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketPart" ADD CONSTRAINT "ServiceTicketPart_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePartMovement" ADD CONSTRAINT "SparePartMovement_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityClient" ADD CONSTRAINT "SecurityClient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityContract" ADD CONSTRAINT "SecurityContract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "SecurityClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityContract" ADD CONSTRAINT "SecurityContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityContract" ADD CONSTRAINT "SecurityContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guard" ADD CONSTRAINT "Guard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "SecurityClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardDeployment" ADD CONSTRAINT "GuardDeployment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "SecurityContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardDeployment" ADD CONSTRAINT "GuardDeployment_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "Guard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardDeployment" ADD CONSTRAINT "GuardDeployment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardAttendance" ADD CONSTRAINT "GuardAttendance_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "GuardDeployment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardAttendance" ADD CONSTRAINT "GuardAttendance_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "Guard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarHireBooking" ADD CONSTRAINT "CarHireBooking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarHireBooking" ADD CONSTRAINT "CarHireBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarHireBooking" ADD CONSTRAINT "CarHireBooking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "SecurityContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_securityClientId_fkey" FOREIGN KEY ("securityClientId") REFERENCES "SecurityClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaTransaction" ADD CONSTRAINT "MpesaTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaTransaction" ADD CONSTRAINT "MpesaTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaTransaction" ADD CONSTRAINT "MpesaTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashAccount" ADD CONSTRAINT "PettyCashAccount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashAccount" ADD CONSTRAINT "PettyCashAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashRequest" ADD CONSTRAINT "PettyCashRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PettyCashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashRequest" ADD CONSTRAINT "PettyCashRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashRequest" ADD CONSTRAINT "PettyCashRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashExpense" ADD CONSTRAINT "PettyCashExpense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PettyCashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesContract" ADD CONSTRAINT "SalesContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesContract" ADD CONSTRAINT "SalesContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesContract" ADD CONSTRAINT "SalesContract_machineryUnitId_fkey" FOREIGN KEY ("machineryUnitId") REFERENCES "MachineryUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_machineryUnitId_fkey" FOREIGN KEY ("machineryUnitId") REFERENCES "MachineryUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_machineryUnitId_fkey" FOREIGN KEY ("machineryUnitId") REFERENCES "MachineryUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportExportJob" ADD CONSTRAINT "ImportExportJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

