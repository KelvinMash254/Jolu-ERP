# API Documentation

Base URL: `http://localhost:4000/api` (development)

## Authentication

### POST /auth/login
```json
{
  "email": "admin@jolugroup.co.ke",
  "password": "Admin@123",
  "twoFactorToken": "123456"  // optional, required if 2FA enabled
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "...", "email": "...", "role": "SUPER_ADMIN", "companies": [...] }
  }
}
```

### POST /auth/refresh
```json
{ "refreshToken": "eyJ..." }
```

### GET /auth/me
Returns current authenticated user profile.

### POST /auth/2fa/setup
Generates 2FA secret and QR code URL.

### POST /auth/logout
Invalidates current session.

---

## Headers (Authenticated Requests)

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <accessToken>` |
| X-Company-Id | Yes* | Company UUID for data context |
| X-Device-Info | No | Device identifier for audit |

*Auto-selected if user has single company assignment.

---

## Companies

### GET /companies
List accessible companies.

### GET /companies/consolidated/dashboard
Group-level consolidated KPIs (Group Admin+).

---

## CRM

### GET /crm/customers
Query params: `page`, `limit`, `search`

### POST /crm/customers
```json
{
  "name": "Peter Kamau",
  "phone": "+254712345678",
  "email": "peter@email.com",
  "idNumber": "12345678",
  "kraPin": "A001234567B",
  "county": "Nairobi",
  "physicalAddress": "Westlands"
}
```

### GET /crm/customers/:id
Full customer profile with activities, documents, invoices.

### GET /crm/leads
Query params: `stage`, `pipelineStage`

### POST /crm/leads
```json
{
  "title": "MF 375 Tractor Purchase",
  "customerId": "uuid",
  "estimatedValue": 3200000,
  "source": "Referral"
}
```

### PATCH /crm/leads/:id/stage
```json
{ "pipelineStage": "WON", "stage": "DELIVERED" }
```

### GET /crm/pipeline/kanban
Returns leads grouped by pipeline stage for Kanban board.

### GET /crm/pipeline/kpis
Sales KPIs: monthly/quarterly/annual sales, conversion rate, team performance.

### POST /crm/activities
```json
{
  "type": "CALL",
  "subject": "Follow-up call",
  "customerId": "uuid",
  "description": "Discussed financing options"
}
```

---

## Inventory

### GET /inventory/machinery
Query: `status`, `category`, `page`, `limit`

### POST /inventory/machinery
```json
{
  "productName": "Massey Ferguson 375",
  "category": "TRACTOR",
  "brand": "Massey Ferguson",
  "model": "MF 375",
  "serialNumber": "MF375-001",
  "costPrice": 2500000,
  "sellingPrice": 3200000
}
```

### PATCH /inventory/machinery/:id/status
```json
{ "stockStatus": "SOLD" }
```

### GET /inventory/spare-parts
### POST /inventory/spare-parts/:id/stock-in
```json
{ "quantity": 20, "notes": "Supplier delivery" }
```

### POST /inventory/spare-parts/:id/stock-out
```json
{ "quantity": 2, "reference": "SRV-2026-00001" }
```

### GET /inventory/spare-parts/low-stock

---

## Invoices

### GET /invoices
Query: `status`, `type`

### POST /invoices
```json
{
  "type": "INVOICE",
  "customerId": "uuid",
  "dueDate": "2026-07-01",
  "lines": [
    { "description": "MF 375 Tractor", "quantity": 1, "unitPrice": 3200000, "taxRate": 16, "total": 3200000 }
  ]
}
```

### POST /invoices/:id/pdf
Generate PDF and return URL.

### POST /invoices/:id/send
Email invoice to customer.

### POST /invoices/:id/payment
```json
{ "amount": 500000, "paymentMethod": "MPESA", "reference": "QHK7X8Y9Z0" }
```

---

## Accounting

### GET /accounting/chart-of-accounts
### POST /accounting/chart-of-accounts/init
Initialize default chart of accounts.

### POST /accounting/journals
```json
{
  "description": "Sales revenue recognition",
  "lines": [
    { "accountCode": "1100", "debit": 3200000 },
    { "accountCode": "4000", "credit": 3200000 }
  ]
}
```

### GET /accounting/reports/trial-balance
### GET /accounting/reports/income-statement?startDate=&endDate=
### GET /accounting/reports/balance-sheet
### GET /accounting/receivables

---

## M-PESA

### POST /mpesa/stk-push
```json
{
  "phoneNumber": "254712345678",
  "amount": 500000,
  "invoiceId": "uuid"
}
```

### POST /mpesa/callback
Safaricom Daraja callback endpoint (no auth).

### GET /mpesa/transactions

---

## Service Tickets

### GET /service
### POST /service
```json
{
  "customerId": "uuid",
  "machineryUnitId": "uuid",
  "problem": "Engine overheating"
}
```

### PATCH /service/:id/assign
```json
{ "technicianId": "uuid", "scheduledAt": "2026-06-20T09:00:00Z" }
```

### PATCH /service/:id/status
```json
{ "status": "COMPLETED", "labourHours": 4.5, "technicianNotes": "Replaced thermostat" }
```

---

## Import/Export

### POST /import-export/import/:entity
Upload file (multipart/form-data). Entities: `customers`, `leads`, `inventory`, `spare-parts`

### GET /import-export/export/:entity?format=xlsx
Entities: `customers`, `leads`, `inventory`, `spare-parts`, `invoices`

---

## Error Responses

```json
{
  "error": "Permission denied: crm.create"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / missing company context |
| 401 | Authentication required / expired |
| 403 | Permission denied |
| 404 | Resource not found |
| 500 | Internal server error |
