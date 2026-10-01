# University of Karachi — Student Issue Management & Document Application System

> ⚠️ **Disclaimer**: This is a demo/FYP project. It is not an official University of Karachi system. Fee amounts shown are configurable demo values and do not represent official university fees.

---

## Overview

A full-stack web application for University of Karachi students to:

- Submit complaints/issues to any department
- Track complaint status in real-time
- Apply for Proforma or Transcript documents
- Generate and download fee vouchers (PDF)
- Upload payment receipts
- Track application status through the complete workflow

Department staff can process tickets and applications assigned to their department. Administrators have full system access with dashboards, reports, and configuration.

---

## Features

| Module | Features |
|---|---|
| **Authentication** | Student (Seat Number), Staff/Admin (Email), JWT with refresh tokens, RBAC |
| **Tickets** | Create, track, status transitions, attachments (images), remarks, history timeline |
| **Applications** | Proforma & Transcript, fee calculation, PDF voucher, receipt upload, workflow |
| **Student Portal** | Dashboard, tickets, applications, profile |
| **Staff Portal** | Department-scoped tickets & applications, status updates, remarks |
| **Admin Panel** | Full system management, charts, reports (CSV), audit logs, fee config |
| **API Docs** | Swagger UI at `/api/docs`, OpenAPI 3.x spec at `/api/docs.json` |
| **Security** | Argon2 hashing, rate limiting, Helmet, CORS, input validation, audit logging |

---

## Technology Stack

**Frontend**
- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS · Radix UI primitives · Lucide icons
- TanStack Query · React Hook Form · Zod · Recharts

**Backend**
- Node.js · Express.js · TypeScript
- Prisma ORM · PostgreSQL
- JWT (jsonwebtoken) · Argon2 · Multer · PDFKit
- Swagger UI Express · Zod · Helmet · express-rate-limit

**Infrastructure**
- Docker & Docker Compose
- npm workspaces (monorepo)

---

## Demo Credentials

> ⚠️ Development/demo only — change before any real deployment.

| Role | Login | Password |
|---|---|---|
| Admin | `admin@portal.edu` | `ChangeMe123!` |
| Staff (IT) | `it.staff@portal.edu` | `Staff123!` |
| Staff (Finance) | `finance.staff@portal.edu` | `Staff123!` |
| Staff (Registrar) | `registrar.staff@portal.edu` | `Staff123!` |
| Staff (Semester) | `semester.staff@portal.edu` | `Staff123!` |
| Student | Seat: `CS-2026-001` | `Student123!` |
| Student | Seat: `CS-2026-002` | `Student123!` |
| Student | Seat: `BBA-2026-001` | `Student123!` |

---

## Requirements

- Node.js 20+
- PostgreSQL 15+
- npm 10+

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone <repo-url>
cd university-student-portal
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT secrets
```

### 3. Set up database

Make sure PostgreSQL is running, then:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed
```

### 4. Start development servers

```bash
npm run dev
```

This starts:
- **API**: http://localhost:4000
- **Web**: http://localhost:3000
- **Swagger**: http://localhost:4000/api/docs

---

## Docker (Recommended)

```bash
# Start everything (PostgreSQL + API + Web)
docker compose up --build

# Run in background
docker compose up --build -d

# Run migrations inside container
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed

# With pgAdmin (optional)
docker compose --profile tools up -d
# pgAdmin: http://localhost:5050 (admin@portal.edu / pgadmin)
```

Services:
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger | http://localhost:4000/api/docs |
| pgAdmin | http://localhost:5050 (tools profile) |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `JWT_SECRET` | Access token signing key (min 16 chars) | required |
| `JWT_REFRESH_SECRET` | Refresh token signing key | required |
| `ACCESS_TOKEN_TTL_MINUTES` | Access token lifespan | `15` |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifespan | `7` |
| `API_PORT` | Express server port | `4000` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `UPLOAD_DIR` | Local file upload path | `./uploads` |
| `MAX_UPLOAD_MB` | Max upload file size | `5` |
| `NEXT_PUBLIC_API_URL` | API base URL (browser) | `http://localhost:4000` |

---

## Available Scripts

```bash
# Development
npm run dev                  # Start API + Web together
npm run dev -w @portal/api   # API only
npm run dev -w @portal/web   # Web only

# Build
npm run build                # Build all packages

# Database
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Create and apply migration
npx prisma migrate deploy    # Apply migrations (production)
npx prisma db seed           # Seed demo data
npx prisma studio            # Open Prisma Studio GUI

# Code quality
npm run typecheck            # TypeScript check across all packages
npm run lint                 # ESLint
npm run format               # Prettier format
```

---

## Project Structure

```
university-student-portal/
├── apps/
│   ├── api/                    # Express backend
│   │   └── src/
│   │       ├── config/         # env.ts
│   │       ├── docs/           # Swagger setup
│   │       ├── lib/            # prisma, jwt, errors
│   │       ├── middleware/     # auth, validate, errorHandler
│   │       ├── modules/        # auth, departments, issues, tickets,
│   │       │                   # applications, students, staff, admin
│   │       ├── storage/        # LocalStorageService
│   │       └── utils/          # response, auditLogger, ticketNumber
│   └── web/                    # Next.js 14 frontend
│       ├── app/
│       │   ├── login/
│       │   ├── student/        # dashboard, tickets, applications, profile
│       │   ├── staff/          # dashboard, tickets, applications
│       │   └── admin/          # dashboard, depts, issues, staff, students,
│       │                       # tickets, apps, reports, audit-logs, fees
│       ├── components/
│       │   ├── layout/         # AppShell (sidebar + topbar)
│       │   ├── shared/         # StatusBadge, StatCard, Timeline, etc.
│       │   └── ui/             # Radix-based primitives
│       ├── hooks/              # useAuth, useToast
│       └── lib/                # api, auth, utils
├── packages/
│   ├── types/                  # Shared enums, types, transitions
│   └── validation/             # Shared Zod schemas
├── prisma/
│   ├── schema.prisma           # All 14 models
│   └── seed.ts                 # Demo data
├── docs/                       # Architecture & database docs
├── docker-compose.yml
├── .env.example
└── package.json                # npm workspaces root
```

---

## API Documentation

Full Swagger UI: **http://localhost:4000/api/docs**

OpenAPI JSON spec: **http://localhost:4000/api/docs.json**

### Key Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/auth/student/login` | — | Student login |
| POST | `/api/auth/staff/login` | — | Staff/Admin login |
| POST | `/api/auth/refresh` | — | Refresh token |
| GET | `/api/departments` | All | List departments |
| GET | `/api/departments/:id/issues` | All | Issues per department |
| POST | `/api/tickets` | Student | Submit ticket |
| GET | `/api/tickets` | All | List tickets (scoped) |
| PATCH | `/api/tickets/:id/status` | Staff/Admin | Update ticket status |
| POST | `/api/applications` | Student | Create application |
| GET | `/api/applications/:id/voucher` | Student | Download PDF voucher |
| POST | `/api/applications/:id/receipt` | Student | Upload payment receipt |
| GET | `/api/admin/dashboard` | Admin | System dashboard |
| GET | `/api/admin/reports/tickets?format=csv` | Admin | Export ticket CSV |
| GET | `/api/admin/audit-logs` | Admin | Audit trail |

---

## Security

- Passwords hashed with **Argon2** (never stored in plaintext)
- JWT access tokens (15 min) + rotating refresh tokens (7 days)
- Refresh tokens stored as SHA-256 hashes, never raw
- Department-level isolation enforced server-side (staff cannot see other departments)
- Student isolation enforced server-side (students cannot see other students' data)
- Rate limiting on all routes (stricter on auth endpoints)
- Helmet security headers
- CORS restricted to configured origin
- Input validation with Zod on all endpoints
- File type validation by MIME type (not just extension)
- Path traversal prevention in file storage
- Audit logging for all sensitive operations
- No secrets in source code; environment variables only

---

## Ticket Status Workflow

```
OPEN → IN_PROGRESS → WAITING_FOR_STUDENT → IN_PROGRESS → RESOLVED → CLOSED
OPEN → REJECTED
IN_PROGRESS → REJECTED
```

## Application Status Workflow

```
APPLICATION_SUBMITTED → WAITING_FOR_PAYMENT → PAYMENT_RECEIVED
  → UNDER_PROCESS → READY_FOR_COLLECTION → COMPLETED
Any stage → REJECTED
```

---

## Future Improvements

- Online payment integration (JazzCash / EasyPaisa)
- Email notifications (SMTP already stubbed)
- Mobile application (React Native)
- S3-compatible file storage (interface already defined)
- Student self-registration portal
- SMS notifications
- Multi-language support (English / Urdu)
- Advanced analytics and reporting
