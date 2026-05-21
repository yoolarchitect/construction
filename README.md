# Construction SaaS – Project Investment Management

Multi-tenant SaaS for tracking construction project investments.

- **Platform admin:** `dhisme.so` (e.g. `https://dhisme.so/admin`)
- **Tenants:** `*.dhisme.so` (e.g. `https://acme.dhisme.so` for tenant slug `acme`)

## Stack

- **Next.js 14** (App Router)
- **Prisma** + **PostgreSQL** (Neon)
- **Tailwind CSS**
- Server Actions, middleware for tenant resolution

## Setup

1. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – Neon PostgreSQL (pooled URL with `?sslmode=require`)
   - `PLATFORM_DOMAIN` – production domain, e.g. `dhisme.so` (required for tenant subdomains; app is built for production, e.g. Vercel)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – used by seed for first admin

2. **Install and DB**

   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   ```

3. **Run**

   ```bash
   npm run dev
   ```

## Domains

- **Production (e.g. Vercel):** Set `PLATFORM_DOMAIN=dhisme.so`. Admin at `https://dhisme.so/admin`; tenants at `https://<slug>.dhisme.so` (e.g. `https://albayaan.dhisme.so`). Access without a valid tenant subdomain shows the contact page.

## Flow

1. **Admin** (dhisme.so): `/admin` → login → create/edit tenants, set subscription status and dates.
2. **Tenant** (*.dhisme.so): `/login` → dashboard, projects, materials, expenses, clients.
3. **Suspended:** Invalid or expired tenant → redirect to `https://dhisme.so/suspended`.

## Data isolation

All business data is scoped by `tenantId`. Queries filter by `tenantId`; no cross-tenant access.

## Scripts

- `npm run dev` – dev server
- `npm run build` – Prisma generate + Next build
- `npm run db:push` – push schema to DB
- `npm run db:seed` – create default admin (if missing)
- `npm run db:studio` – Prisma Studio
