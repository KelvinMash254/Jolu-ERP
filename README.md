# Jolu Group ERP System

A production-ready, cloud-based Enterprise Resource Planning (ERP) platform customized for Jolu Group — supporting **Jolu Machineries Ltd**, **Jolu Group Security Ltd**, and **Jolu Automobile Ltd** under one unified group dashboard.

## Features

- **Multi-Company Management** — Independent operations per company with consolidated group reporting
- **RBAC** — 11 roles with granular permissions and full audit trail
- **CRM** — 15-stage lead pipeline with Kanban boards and KPIs
- **Inventory** — Machinery units, spare parts, vehicles with lifecycle tracking
- **Bank Financing** — End-to-end financing workflow with approval dashboards
- **After Sales** — Service ticketing with technician assignment and performance reports
- **Security Module** — Clients, contracts, guards, sites, deployments, attendance
- **Accounting** — Double-entry bookkeeping, trial balance, P&L, balance sheet
- **Invoicing** — Proforma, tax invoices, receipts, credit/debit notes, PDF generation
- **M-PESA Integration** — Safaricom Daraja API with auto journal entries and receipts
- **Petty Cash** — Nairobi and Nakuru branch petty cash management
- **Import/Export** — Excel and CSV for customers, inventory, leads, invoices
- **Notifications** — Email, SMS, in-app alerts
- **2FA** — Two-factor authentication support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Chart.js |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + RBAC |
| Cache | Redis |
| Search | Elasticsearch |
| Storage | AWS S3 |
| Payments | Safaricom Daraja API |
| Email | SendGrid |
| PDF | PDFKit |
| Deployment | Docker, AWS, GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Development Setup

```bash
# Clone and enter project
cd jolu-erp

# Start infrastructure
docker compose up -d postgres redis elasticsearch

# Backend setup
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Default login:** `admin@jolugroup.co.ke` / `Admin@123`

### Docker Production

```bash
docker compose up -d --build
```

## Project Structure

```
jolu-erp/
├── backend/           # Express API + Prisma
│   ├── prisma/        # Database schema & seed
│   ├── src/
│   │   ├── config/    # App, DB, Redis config
│   │   ├── middleware/ # Auth, RBAC, Audit
│   │   ├── routes/    # API route handlers
│   │   └── services/  # Business logic
│   └── tests/
├── frontend/          # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── store/
├── docs/              # Architecture, API, deployment guides
└── docker-compose.yml
```

## API Overview

All authenticated endpoints require:
- `Authorization: Bearer <token>`
- `X-Company-Id: <company-uuid>` (multi-company context)

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Companies | `/api/companies` |
| CRM | `/api/crm` |
| Inventory | `/api/inventory` |
| Invoices | `/api/invoices` |
| Accounting | `/api/accounting` |
| Service | `/api/service` |
| Security | `/api/security` |
| Financing | `/api/financing` |
| M-PESA | `/api/mpesa` |
| Petty Cash | `/api/pettycash` |
| Dashboard | `/api/dashboard` |

See [docs/api-documentation.md](docs/api-documentation.md) for full API reference.

## Documentation

- [System Architecture](docs/architecture.md)
- [Database Schema & ER Diagram](docs/database-schema.md)
- [API Documentation](docs/api-documentation.md)
- [Deployment Guide](docs/deployment-guide.md)
- [User Manual](docs/user-manual.md)
- [User Flows](docs/user-flows.md)

## License

Proprietary — Jolu Group. All rights reserved.
# Jolu-ERP
