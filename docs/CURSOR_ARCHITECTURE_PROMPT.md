# Construction SaaS — Full Architecture Prompt for Cursor IDE

**Copy or reference this document when working in Cursor to keep architecture consistent.**

---

## System overview

Build and maintain a **multi-tenant Construction Project Management SaaS** using:

- **Next.js** (App Router)
- **Prisma** ORM
- **PostgreSQL**
- **JWT or cookie-based auth** with tenant + role in session
- **Subdomain-based tenancy** (e.g. `company1.yourapp.com`)
- **Role-Based Access Control (RBAC)**

The system must strictly separate:

1. **Platform Admin** (SaaS owner) — no `tenantId`
2. **Tenant** (construction company) — all data scoped by `tenantId`

Architecture must be **scalable**, **production-ready**, and **optimized** with proper database indexing.

---

## Multi-tenant strategy

- **Shared database**
- **Shared schema**
- **`tenantId` column** on every tenant-owned table

Rules:

- Every tenant-scoped table MUST include `tenantId String` and relation to `Tenant`.
- Every Prisma query for tenant data MUST filter by `tenantId` from the authenticated session (or request context).
- **Never trust frontend** for tenant scoping; always resolve `tenantId` server-side (middleware, auth, or route handler).

---

## Platform admin modules (SaaS owner)

Platform models MUST NOT include `tenantId`. Routes live under `(platform)/` or main domain with an admin path.

### 1. Tenant management

- Create / suspend / activate / soft-delete tenant
- Assign subscription plan
- Track status: `TRIAL` | `ACTIVE` | `SUSPENDED` | `EXPIRED`
- Track trial end and subscription expiry
- Optional: usage stats, storage

### 2. Subscription & plans

- **Plan**: name, slug, `maxProjects`, `maxUsers`, `maxStorageMB`, `priceMonthly`, `priceYearly`
- **Subscription**: links tenant to plan; status; Stripe IDs if used
- Platform-level invoices and payments (separate from tenant project invoices)

### 3. Platform analytics

- Total tenants, active tenants
- MRR, churn, new signups
- Total projects across platform, system usage

### 4. Feature flags

- **Feature**: key (e.g. `EQUIPMENT_MODULE`), name, description
- **PlanFeature**: which plan has which feature enabled
- **TenantFeatureOverride**: per-tenant override for a feature

### 5. Admin logs & impersonation

- Login logs (success/fail, IP, user agent)
- Activity / audit logs (platform-level)
- **Impersonate tenant**: log in as a tenant user for support/debug (with clear UI indicator)

---

## Tenant modules (construction company)

Each tenant operates in isolation. All tenant data MUST be filtered by `tenantId`. Routes live under subdomain + e.g. `/dashboard`, `/projects`, etc.

### 1. Company settings

- Company profile, logo, address, tax number, currency, fiscal year

### 2. Users & roles (RBAC)

- **Roles**: `COMPANY_ADMIN`, `PROJECT_MANAGER`, `SITE_ENGINEER`, `ACCOUNTANT`, `STORE_MANAGER`
- Invite users, assign roles, deactivate users
- **Role-based route protection** and **server-side action checks** for every mutation

### 3. Projects

- Fields: name, location, startDate, endDate, status, budget (Decimal), clientId, tenantId
- Statuses: `PLANNING` | `ACTIVE` | `ON_HOLD` | `COMPLETED` | `CANCELLED`
- Project dashboard, timeline, documents, assign PM

### 4. Budget / BOQ

- Structure: **Project → Phases → CostItems**
- CostItem: name, estimatedCost (Decimal), category (MATERIAL, LABOR, EQUIPMENT, SUBCONTRACT, OTHER)
- Actual cost derived from linked expenses/invoices; budget warning when actual > estimated

### 5. Expenses

- title, amount (Decimal 15,2), category, projectId, approved, createdBy, expenseDate, tenantId
- All list/mutation queries filter by `tenantId`

### 6. Clients

- name, email, phone, address, tenantId
- Projects can link to a client via `clientId`

### 7. Invoices (tenant level)

- projectId, amount (Decimal), status (DRAFT | SENT | PARTIAL | PAID | OVERDUE), dueDate, paidAt, tenantId
- **Do not confuse with platform billing invoices** (separate system)

### 8. Procurement & materials

- **Supplier**, **MaterialCatalog** (tenant-level), **PurchaseOrder**, **PurchaseOrderItem**, **StockMovement**
- Stock tracking; issue materials to project via movements or PO items linked to project

### 9. Labor & payroll

- **Worker**, **Attendance**, **Payroll**, **PayrollItem**
- Labor cost per project derived from attendance/payroll allocation where applicable

### 10. Equipment

- **Equipment**, **MaintenanceLog**, **EquipmentUsage**
- Rental vs owned; usage per project

### 11. Reports & analytics

- Profit per project (paid invoices − approved expenses)
- Budget variance, cash flow, expense breakdown, labor and material analysis

---

## Financial precision (critical)

- **Never use `Float` for money.**
- Use **`Decimal @db.Decimal(15,2)`** for: amount, budget, cost, price, totalPrice, etc.
- Construction systems break when money precision is wrong.

---

## Database indexing strategy

- **Every tenant-scoped table** must have:
  - `@@index([tenantId])`
- Add **composite indexes** for common filters:
  - **Project**: `@@index([tenantId, status])`, `@@index([tenantId, startDate])`, `@@index([tenantId, name])`
  - **Expense**: `@@index([tenantId, projectId])`, `@@index([tenantId, createdAt])`, `@@index([tenantId, category])`
  - **Invoice**: `@@index([tenantId, status])`, `@@index([tenantId, dueDate])`
  - **User**: `@@index([tenantId, role])`
  - **PurchaseOrder**: `@@index([tenantId, supplierId])`, `@@index([tenantId, createdAt])`
  - **Attendance**: `@@index([tenantId, workerId, date])`
  - **AuditLog**: `@@index([tenantId, createdAt])`
- **Unique constraints**: Tenant.subdomain, User (tenantId + email), MaterialCatalog (tenantId + name) where applicable.

---

## Authentication

- **Platform admin**: separate Admin model and session (e.g. cookie or JWT); no tenantId.
- **Tenant users**: User model with `tenantId` and `role`; session must include `userId`, `tenantId`, `role`.
- Middleware must:
  1. Resolve subdomain from host
  2. Load tenant by subdomain
  3. Validate subscription status (active / trial not expired)
  4. Attach tenantId (and optionally user) to request context
- Tenant login: resolve tenant from subdomain first, then authenticate User by email/password within that tenant.

---

## Subscription enforcement

Before creating:

- **Project** → check plan `maxProjects` (count existing projects for tenant).
- **User** → check plan `maxUsers` (count active users for tenant).
- **Storage** → check total upload size vs plan `maxStorageMB`.

Reject creation with a clear error if limit exceeded.

---

## Folder structure (Next.js App Router)

```
app/
├── (platform)/
│   ├── layout.tsx          # Platform admin layout
│   ├── page.tsx            # Platform dashboard
│   ├── tenants/
│   ├── plans/
│   ├── subscriptions/
│   └── analytics/
├── (tenant)/
│   ├── layout.tsx          # Tenant layout (subdomain)
│   └── (app)/
│       ├── dashboard/
│       ├── projects/
│       ├── expenses/
│       ├── invoices/
│       ├── procurement/
│       ├── labor/
│       └── equipment/
├── (auth)/
│   └── login/
├── api/
│   ├── auth/
│   ├── projects/
│   ├── expenses/
│   └── ...
└── middleware.ts           # Subdomain + tenant detection, redirects
```

---

## Performance

- Use **pagination** for all list endpoints (default page size e.g. 20).
- Prefer **cursor-based pagination** for large datasets.
- Avoid **N+1** queries; use Prisma `include`/`select` wisely.
- Use **transactions** for financial operations (e.g. invoice + payment, expense approval).
- Use **select** to limit returned fields where full objects are not needed.

---

## Core business rules

1. **Profit (per project)** = Total paid invoice amount − total approved expenses.
2. **Budget warning**: show when (actual expenses or cost items) > estimated budget.
3. **Cannot delete project** with linked invoices (or enforce soft delete and keep referential integrity).
4. **Cannot delete tenant** if subscription is active (or follow defined cancellation flow).
5. **All financial actions** should be audited (AuditLog with entity, entityId, action, userId, tenantId).

---

## Audit logging

- **AuditLog**: userId, adminId (optional), tenantId (nullable for platform), action (CREATE | UPDATE | DELETE), entity, entityId, metadata (JSON), timestamp.
- Index: `@@index([tenantId, createdAt])`, `@@index([entity, entityId])`.

---

## Security

- All tenant queries MUST filter by `tenantId` from server context.
- Never allow cross-tenant data access (no raw tenantId from client without validation).
- Validate **role permissions** server-side for every protected action.
- Use **soft deletes** (deletedAt) for critical models (Tenant, User, Project, Client, etc.) where appropriate.

---

## MVP priority order

- **Phase 1**: Auth, tenant system, projects, expenses, basic dashboard.
- **Phase 2**: Invoices, budget tracking, subscription enforcement, reports.
- **Phase 3**: Procurement, labor, equipment, advanced analytics, feature flags.

---

## When adding or changing code

1. **Prisma**: Use Decimal for money; add tenantId + indexes for new tenant tables; keep platform models without tenantId.
2. **API / Server Actions**: Always resolve tenantId from session/context and pass to Prisma `where`.
3. **Middleware**: Keep subdomain → tenant resolution and subscription check in one place.
4. **UI**: Respect RBAC (hide/disable by role) and enforce the same rules on the server.

Use this document as the single source of truth for architecture decisions in this repo.
