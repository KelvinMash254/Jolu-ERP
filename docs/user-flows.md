# User Flows

## 1. Sales Lead to Delivery Flow

```mermaid
flowchart TD
    A[New Lead Created] --> B[First Contact]
    B --> C[Needs Assessment]
    C --> D[Quotation Sent]
    D --> E{Customer Accepts?}
    E -->|No| F[Lost]
    E -->|Yes| G[Application Submitted]
    G --> H[Bank Review]
    H --> I{Bank Decision}
    I -->|Rejected| J[Bank Rejected]
    I -->|Approved| K[Bank Approved]
    K --> L[Customer Deposit Received]
    L --> M[Unit Allocated from Inventory]
    M --> N[Documentation Complete]
    N --> O[Registration Complete]
    O --> P[Delivered]
    P --> Q[After Sales Active]
```

## 2. M-PESA Payment Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant M as M-PESA/Daraja
    participant API as Jolu ERP API
    participant DB as PostgreSQL
    participant ACC as Accounting
    participant E as Email/SMS

    C->>M: STK Push Payment
    M->>API: Callback (transaction code, amount, phone)
    API->>DB: Match customer by phone
    API->>DB: Match outstanding invoice
    API->>DB: Record MpesaTransaction
    API->>DB: Create InvoicePayment
    API->>DB: Update invoice status
    API->>ACC: Post journal entry (Dr M-Pesa, Cr AR)
    API->>API: Generate receipt PDF
    API->>E: Email receipt to customer
    API->>E: SMS confirmation
```

## 3. Service Ticket Flow

```mermaid
flowchart LR
    A[Customer Reports Issue] --> B[Ticket Created - PENDING]
    B --> C[Technician Assigned - ASSIGNED]
    C --> D[Visit Scheduled]
    D --> E[Work In Progress - IN_PROGRESS]
    E --> F{Resolved?}
    F -->|No| G[Escalated]
    G --> E
    F -->|Yes| H[Parts Used - Auto Deducted]
    H --> I[Completed - COMPLETED]
    I --> J[Closed - CLOSED]
```

## 4. Petty Cash Request Flow

```mermaid
flowchart TD
    A[Branch Admin Creates Request] --> B[PENDING]
    B --> C{Head Office Review}
    C -->|Rejected| D[REJECTED]
    C -->|Approved| E[APPROVED - Funds Added]
    E --> F[Expenses Recorded]
    F --> G[Receipts Uploaded]
    G --> H[Monthly Reconciliation]
```

## 5. User Authentication Flow

```mermaid
flowchart TD
    A[Enter Email + Password] --> B{Valid Credentials?}
    B -->|No| C[Error Message]
    B -->|Yes| D{2FA Enabled?}
    D -->|Yes| E[Enter TOTP Code]
    E --> F{Valid Code?}
    F -->|No| C
    F -->|Yes| G[Generate JWT Tokens]
    D -->|No| G
    G --> H[Create Session Record]
    H --> I[Return Tokens + User Profile]
    I --> J[Select Company Context]
    J --> K[Dashboard]
```

## 6. Security Guard Deployment Flow

```mermaid
flowchart TD
    A[Security Client Onboarded] --> B[Contract Created]
    B --> C[Sites Registered]
    C --> D[Guards Hired/Registered]
    D --> E[Deployment Created]
    E --> F[Guard Assigned to Site]
    F --> G[Daily Attendance Check-in/out]
    G --> H[Monthly Invoice Generated]
    H --> I[Client Payment Received]
    I --> J[Receipt Generated]
```

## 7. Invoice Lifecycle

```mermaid
flowchart LR
    A[DRAFT] --> B[SENT]
    B --> C{Payment Received}
    C -->|Partial| D[PARTIALLY_PAID]
    C -->|Full| E[PAID]
    C -->|Past Due| F[OVERDUE]
    D --> C
    F --> C
    B --> G[CANCELLED]
```

## 8. Import Data Flow

```mermaid
flowchart TD
    A[Upload Excel/CSV File] --> B[Create Import Job]
    B --> C[Parse File]
    C --> D{Valid Data?}
    D -->|No| E[Job FAILED - Error Log]
    D -->|Yes| F[Insert Records]
    F --> G[Job COMPLETED]
    G --> H[Record Count Reported]
```
