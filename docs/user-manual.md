# User Manual — Jolu Group ERP

## Getting Started

### Logging In

1. Navigate to your ERP URL (e.g., `https://erp.jolugroup.co.ke`)
2. Enter your email and password
3. If 2FA is enabled, enter the 6-digit code from your authenticator app
4. Select your company from the sidebar dropdown if you have access to multiple companies

**Default admin credentials (change immediately in production):**
- Email: `admin@jolugroup.co.ke`
- Password: `Admin@123`

---

## Dashboard

The main dashboard shows real-time KPIs:
- Monthly revenue
- Outstanding invoices
- Active leads
- Open service tickets
- Low stock alerts
- Cash position

Interactive charts display 6-month revenue trends. Group administrators can access the **Group Overview** for consolidated cross-company metrics.

---

## CRM & Customers

### Adding a Customer

1. Go to **CRM / Customers**
2. Click **Add Customer**
3. Fill in personal details (name, phone required), KRA PIN, county, address
4. Save

### Customer Profile

Each customer profile includes:
- Personal and financial information
- Assigned salesperson, technician, administrator
- Activity history (calls, meetings, notes, documents)
- Linked invoices and service tickets
- Bank financing applications

### Sales Pipeline (Kanban)

Navigate to **Sales Pipeline** to view the Kanban board with stages:
New Lead → Qualified → Proposal Sent → Application Submitted → Bank Approval → Won/Lost

Drag leads between stages or update via the lead detail view. KPI cards show monthly, quarterly, and annual sales plus conversion rates.

---

## Inventory Management

### Machinery (Jolu Machineries)

Track tractors, harvesters, and farm implements with:
- Chassis/engine/serial numbers
- Purchase and selling prices
- Stock status: In Stock, Reserved, Sold, Delivered
- Full lifecycle event history

### Spare Parts

- Stock in/out operations
- Automatic deduction when used in service tickets
- Low stock alerts when quantity falls below reorder level
- Barcode/QR code support

### Vehicles (Jolu Automobile)

Manage vehicle inventory with registration, mileage, year, and pricing.

---

## Bank Financing

Track the complete financing workflow:
1. Customer submits documents
2. Bank receives application
3. Under review
4. Approved / Rejected
5. Customer deposit received
6. Unit allocated
7. Delivered

The financing dashboard shows applications by stage, total loan amounts, deposits, and approval rates.

---

## Invoicing

Create and manage:
- Proforma Invoices
- Tax Invoices (16% VAT)
- Receipts
- Credit/Debit Notes
- Purchase Orders
- Delivery Notes
- Quotations

**Workflow:**
1. Create invoice with line items
2. Generate PDF (company-branded)
3. Send via email directly from the system
4. Record payments (manual or via M-PESA)
5. System auto-updates status (Paid/Partially Paid/Overdue)

---

## M-PESA Payments

When a customer pays via M-PESA:
1. System identifies customer by phone number
2. Matches to outstanding invoice
3. Posts automatic journal entry
4. Marks invoice as paid
5. Generates and emails receipt
6. Sends SMS confirmation

Initiate STK Push from the invoice detail page for prompt payment.

---

## After Sales Service

1. Create service ticket with customer, machine, and problem description
2. Assign technician and schedule visit
3. Track status: Pending → Assigned → In Progress → Completed → Closed
4. Record spare parts used (auto-deducted from inventory)
5. Log labour hours and technician notes
6. View technician performance reports

---

## Security Module (Jolu Group Security)

Manage:
- **Clients** — Security service clients
- **Contracts** — Monthly billing contracts with guard counts
- **Guards** — Employee records with license numbers
- **Sites** — Client locations with GPS coordinates
- **Deployments** — Guard-to-site assignments
- **Attendance** — Check-in/check-out tracking

---

## Accounting

### Chart of Accounts
Pre-configured accounts for Kenyan businesses. Initialize via Accounting → Chart of Accounts.

### Journal Entries
Create manual journal entries. System validates double-entry balance (debits = credits).

### Reports
- **Trial Balance** — All account balances
- **Income Statement** — Revenue vs expenses, net income
- **Balance Sheet** — Assets, liabilities, equity
- **Accounts Receivable** — Outstanding customer invoices

---

## Petty Cash

Head Office allocates funds to branch petty cash accounts:
- **Nairobi Petty Cash**
- **Nakuru Petty Cash**

Workflow: Request → Approve → Disburse → Record Expenses → Monthly Reconciliation

Upload receipt images for each expense.

---

## Import & Export

**Import** (Excel/CSV): Customers, Leads, Inventory, Spare Parts
**Export** (Excel/CSV/PDF): All entity types

Go to Settings → Import/Export or use the API endpoints.

---

## User Roles

| Role | Access |
|------|--------|
| Super Admin | Full system access |
| Group Admin | All companies |
| Company Admin | Assigned company |
| Sales Manager | All pipelines, team management |
| Sales Representative | Own leads and customers |
| Technician | After-sales module only |
| Finance Team | Accounting, invoices, payments |
| Inventory Manager | Inventory management |
| Branch Admin (Nairobi/Nakuru) | Branch operations, petty cash |
| Auditor | Read-only access to all modules |

---

## Notifications

Receive alerts for:
- Task reminders
- Approval requests
- Payment confirmations
- Low stock warnings
- Overdue invoices
- Service schedule reminders

Via email, SMS, and in-app notifications.

---

## Security Best Practices

1. Enable 2FA on your account (Settings → Security)
2. Change your password regularly
3. Log out when leaving your workstation
4. Report suspicious activity to your administrator
5. Do not share login credentials

---

## Support

Contact your system administrator or Jolu Group IT support for assistance.
