# System Architecture

## Overview

```mermaid
flowchart TD
    Browser["Browser\n(Next.js 14)"]
    API["Express API\n:4000"]
    PG["PostgreSQL\n:5432"]
    FS["File Storage\n(Local / S3)"]

    Browser -->|"REST + JWT"| API
    API --> PG
    API --> FS
```

## Monorepo Layout

```
university-student-portal/
├── apps/api          Express REST API
├── apps/web          Next.js 14 frontend
├── packages/types    Shared TypeScript types + enums
└── packages/validation  Shared Zod schemas
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant DB as PostgreSQL

    C->>A: POST /api/auth/student/login {seatNumber, password}
    A->>DB: Find student by seatNumber
    DB-->>A: Student + User record
    A->>A: argon2.verify(hash, password)
    A->>DB: Create RefreshToken record (hashed)
    A-->>C: {accessToken, refreshToken, user}

    Note over C,A: Subsequent requests
    C->>A: GET /api/tickets (Authorization: Bearer <accessToken>)
    A->>A: verifyAccessToken(token)
    A->>DB: Query tickets WHERE studentId = token.studentId
    A-->>C: {data: [...]}
```

## Authorization Layers

| Role | Scope |
|---|---|
| STUDENT | Own tickets, own applications only |
| STAFF | Department tickets + office applications only |
| ADMIN | Full system access |

## Module Structure (Backend)

```
src/modules/
├── auth/          Login, refresh, logout, /me
├── departments/   List, create, update
├── issues/        List by dept, create, update
├── tickets/       Full CRUD + attachments + remarks + status history
├── applications/  Full workflow + PDF voucher + receipt upload
├── students/      Profile, dashboard stats
├── staff/         Department dashboard
└── admin/         System-wide stats, CRUD, reports, audit logs
```
