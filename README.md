# 🛒 LazeePOS — SaaS Point of Sale System

A modern, multi-tenant SaaS POS system for Indonesian SMBs. Each store gets its own subdomain, theme, and fully isolated data.

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Prisma-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### Core POS & Operations
- 🏪 **Multi-tenant** — each store on its own subdomain (`toko.lazeepos.com`)
- 🧾 **POS Terminal** — product catalog, cart, discount engine, receipt printing
- 📦 **Inventory / Warehouse** — stock tracking, low-stock alerts, adjustments
- 💳 **Midtrans Payment Gateway** — subscription billing via Snap (GoPay, QRIS, Bank Transfer, Cards)
- 🏷️ **Discount Engine** — percentage, fixed amount, BOGO, time-based, min-qty
- 📊 **Dashboard** — real-time sales, revenue, popular products
- 💰 **Cash Flow** — income/expense tracking, daily/monthly summaries
- 👥 **Staff Management** — multi-role (admin / cashier) with per-plan seat limits
- ⚙️ **Tenant Settings** — custom theme color, logo, store name
- 🌙 **Dark/Light theme** — per-tenant glassmorphism UI

### SuperAdmin / Central Panel
- 🏢 **Tenant Management** — view, create, suspend/restore, and close tenant stores
- 🔑 **Impersonation (Login as Tenant)** — instant tenant-scoped login for support/debugging without sharing passwords
- 🔴 **Kill Switch** — one-click suspend or restore a tenant; suspended tenants are auto-logged out
- 💳 **Per-Tenant Billing Detail** — plan, revenue, active users, product count, payment history
- 📈 **SaaS Analytics** — MRR, MRR-by-plan breakdown, MTD revenue, MoM growth %, active outlets, churn rate
- 📋 **System Logs** — tail application / nginx / mysql logs filtered by level (error/warn/info) directly from the dashboard
- 💻 **System Info** — Node memory, disk usage, OS uptime — no SSH needed
- 💾 **Manual DB Backup** — one-click mysqldump trigger to external storage
- ⚙️ **Platform Settings** — branded name, theme colour, logo for the central portal
- 📦 **Plan Management** — CRUD plans with per-plan limits (max products, max users, max branches)

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express 5 + Prisma ORM |
| Database | MySQL 8.0 |
| Auth | JWT + bcrypt |
| Payments | Midtrans (Snap + Core API) |
| Deployment | Docker + Nginx |

---

## 🗂 Project Structure

```
saas-lazeePOS/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT, requireRole, requireTenant
│   │   ├── planLimits.js    # per-plan product/user seat limits
│   │   └── tenant.js        # subdomain → tenant resolution
│   ├── routes/
│   │   ├── central/
│   │   │   ├── auth.js          # /analytics, /dashboard, /auth/me
│   │   │   ├── tenants.js       # CRUD tenant stores
│   │   │   ├── tenant-actions.js# /impersonate /kill-switch /billing
│   │   │   ├── plans.js         # CRUD subscription plans
│   │   │   ├── platform.js      # portal name/theme/logo
│   │   │   └── system.js        # /system/logs /system/info /backup
│   │   ├── auth.js              # tenant login/register
│   │   ├── products.js          # product CRUD + plan-limit guard
│   │   ├── warehouse.js         # inventory + low-stock
│   │   ├── receipts.js          # POS sales + cashflow automation
│   │   ├── discounts.js         # conditional discount rules
│   │   ├── cashflow.js          # manual income/expense
│   │   ├── dashboard.js         # tenant KPI cards
│   │   ├── payment.js           # Midtrans subscription + webhook
│   │   ├── settings.js          # tenant branding + staff CRUD
│   │   └── settings.js          # staff mgmt with plan-limit guard
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/           # axios client + JWT interceptor
│       ├── context/       # AuthContext + ThemeContext
│       ├── components/    # Layout, Sidebar, Modal, ProtectedRoute
│       │   ├── central/   # SuperAdminLogin, SuperAdminDashboard
│       │   └── ...
│       └── pages/         # all screens
├── nginx/
└── docker-compose.yml
```

### Route map

```
PUBLIC
  GET  /api/health

CENTRAL / SUPERADMIN  (no subdomain → centralAuthRoutes first)
  POST /api/central/auth/login              — superadmin login
  GET  /api/central/auth/me                 — current superadmin profile
  GET  /api/central/dashboard               — tenant KPIs + top-tenants
  GET  /api/central/tenants                 — list all stores
  POST /api/central/tenants                 — create new store (+ admin user)
  GET  /api/central/tenants/:id             — store detail
  PUT  /api/central/tenants/:id             — update store config
  DELETE /api/central/tenants/:id           — close/destroy store
  POST /api/central/tenants/:id/impersonate — login as that store's admin
  POST /api/central/tenants/:id/kill-switch — suspend / restore instantly
  GET  /api/central/tenants/:id/billing     — billing detail for a specific store
  GET  /api/central/plans                   — all subscription tiers
  GET  /api/central/plans/:id               — single plan detail
  POST /api/central/plans                   — create plan
  PUT  /api/central/plans/:id               — update plan
  DELETE /api/central/plans/:id             — delete plan
  GET  /api/central/platform/settings       — read platform branding config
  PUT  /api/central/platform/settings       — write platform branding config
  GET  /api/central/analytics               — MRR, MTD, churn, active outlets
  GET  /api/central/system/logs             — filterable log tailer
  GET  /api/central/system/info             — server health / disk / memory
  POST /api/central/backup                  — trigger mysqldump backup

TENANT / TOKO  (subdomain.lazeepos.com + JWT)
  POST /api/auth/login
  POST /api/auth/register
  GET  /api/auth/me
  GET  /api/products
  POST /api/products              ← requires plan maxProducts guard
  PUT  /api/products/:id
  DELETE /api/products/:id
  GET  /api/warehouse
  PUT  /api/warehouse/:id
  GET  /api/warehouse/low-stock
  POST /api/warehouse/adjust
  POST /api/discounts/apply
  GET  /api/discounts
  CRUD /api/receipts
  CRUD /api/cashflow
  GET  /api/dashboard
  GET  /api/payment/plans
  GET  /api/payment/subscription
  POST /api/payment/create-transaction
  GET  /api/payment/status/:orderId
  POST /api/payment/cancel/:orderId
  POST /api/payment/notification          ← Midtrans webhook (no JWT)
  GET  /api/settings/tenant
  PUT  /api/settings/tenant
  GET  /api/settings/staff
  POST /api/settings/staff        ← requires plan maxUsers guard
  DELETE /api/settings/staff/:id
```

Middleware chain for tenant routes:
```
tenantIdentificator → verifyToken → requireTenant → requireRole (optional) → handler
```

### Role matrix

| Capability | superadmin | admin | cashier |
|---|---|---|---|
| Access `/central-login` | ✅ | ❌ | ❌ |
| Access `/api/central/*` | ✅ | ❌ | ❌ |
| Tenant login | ❌ | ✅ | ✅ |
| Tenant dashboard | ✅ (as any tenant via impersonate) | ✅ | ✅ |
| View products / warehouse | ❌ (tenant guards) | ✅ | ✅ (view only) |
| Create / edit products | ❌ | ✅ | ❌ |
| Manage staff | ❌ | ✅ | ❌ |
| Upgrade subscription | ❌ | ✅ | ❌ |
| Tenant impersonation | ✅ | — | — |
| Kill-switch tenants | ✅ | — | — |
| View SaaS analytics | ✅ | — | — |

---

## 🚀 Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/ball-hand/saas-lazeePOS.git
cd saas-lazeePOS

# 2. Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET, Midtrans keys

# 3. Start services
docker-compose up -d

# 4. Run migrations & seed
docker-compose exec backend npx prisma db push
docker-compose exec backend npm run db:seed

# 5. Open
# Frontend → http://localhost
# Backend  → http://localhost:5000/api/health
```

---

## 💻 Local Dev (without Docker)

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL=mysql://root:password@localhost:3306/lazeepos
npm install
npx prisma db push
node prisma/seed.js
npm run dev                 # runs on :5000 with nodemon

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # runs on :5173

# Add tenant subdomain to /etc/hosts for tenant dev:
#   127.0.0.1  demo.localhost
# Then open http://demo.localhost:5173
```

---

## 🔑 Access Points & Credentials

| Entry | URL | Role |
|---|---|---|
| Landing page | http://localhost:5173 | — |
| SuperAdmin login | http://localhost:5173/central-login | superadmin |
| Tenant login | http://localhost:5173/login | admin / cashier |
| Backend health | http://localhost:5000/api/health | — |
| Central API | http://localhost:5000/api/central/... requires superadmin JWT |
| Tenant API | `http://demo.localhost:5000/api/...` subdomain required |

**Demo superadmin credentials:**

| Email | Password | Portal |
|---|---|---|
| `admin@lazeepos.com` | `Admin123!` | `/central-login` |

**Demo tenant credentials (use `demo.localhost` subdomain or `/etc/hosts` entry):**

| Role | Email | Password |
|---|---|---|
| Admin | `demo@lazeepos.com` | `Demo123!` |
| Cashier | `kasir@lazeepos.com` | `Kasir123!` |

> **Local dev subdomain trick:** add `127.0.0.1 demo.localhost` to `/etc/hosts`, then open `http://demo.localhost:5173`. In development server mode on `localhost:PORT` (no subdomain), tenant APIs also work directly without subdomain — the middleware detects the port-only form as a dev host rather than a central domain.

---

## 💳 Midtrans Setup

1. Register at [dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Go to **Settings → Access Keys**
3. Add to `backend/.env`:
   ```
   MIDTRANS_ENV=sandbox
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
   ```
4. Add to `frontend/.env`:
   ```
   VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
   ```
5. Set webhook in Midtrans dashboard:
   `https://yourdomain.com/api/payment/notification`

**Supported payment methods:** GoPay, OVO, DANA, QRIS, BCA, Mandiri, BNI, Visa, Mastercard

---

## 💰 Pricing Tiers (Built-in)

| Plan | Price | Products | Users | Branches |
|------|-------|----------|-------|----------|
| Starter | Free | 100 | 3 | 1 |
| Pro | Rp 149.000/mo | 500 | 10 | 3 |
| Enterprise | Rp 490.000/mo | ∞ | ∞ | ∞ |

---

## 🔧 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_long_secret_key_here
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=mysql://root:password@localhost:3306/lazeepos

# SuperAdmin utilities
MYSQL_BACKUP_PATH=/var/backups/lazeepos
LOG_DIR=/var/log/lazeepos

# Midtrans
MIDTRANS_ENV=sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
FRONTEND_URL=http://localhost:5173
```

---

## 📄 License

MIT — free to use, modify, and sell.
