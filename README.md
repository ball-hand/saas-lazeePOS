# 🛒 LazeePOS — SaaS Point of Sale System

<div align="center">
  
A modern, multi-tenant SaaS POS system for Indonesian SMBs. Each store gets its own subdomain, theme, public storefront, and fully isolated data.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge)](https://github.com/ball-hand/saas-lazeePOS)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](#)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](#)
[![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Features

### Core POS & Operations
- 🏪 **Multi-Tenant Architecture** — Each store gets a unique subdomain (`<namatoko>.lazeepos.com`) with 100% data isolation.
- 🛍️ **Public Storefront (Landing Page)** — Every tenant gets an auto-generated, highly customizable public landing page. Add Jargon, Store Introductions, Google Maps Location, Announcement Banners, and Photo Galleries.
- 🧾 **POS Terminal** — Intuitive product catalog, cart management, automatic tax (PPN) calculation, and receipt generation.
- 📦 **Inventory & Warehouse** — Real-time stock tracking, automatic deduction on sale, low-stock alerts, and manual adjustments.
- 💳 **Midtrans Payment Gateway** — Built-in subscription billing via Snap (GoPay, QRIS, Bank Transfer, E-Wallets).
- 🏷️ **Smart Discount Engine** — Conditional rules: percentage off, fixed amount off, BOGO (Buy 1 Get 1), minimum spend criteria.
- 📊 **Analytics Dashboard** — Real-time sales, total revenue, most popular products, and recent transactions.
- 💰 **Ledger / Cash Flow** — Automated tracking of sales income and manual entry for operational expenses.
- ⚙️ **White-Label Branding** — Tenant admins can customize their primary theme color, Light/Dark mode, store logo (Square/Circle shapes), and custom receipt footers.
- 👥 **Role-Based Access Control** — Multi-role system (Central Admin, Tenant Admin, Tenant Cashier) with per-plan seat limits.

### SuperAdmin / Central Platform
- 🏢 **Tenant Management** — Monitor, create, suspend, restore, or destroy tenant stores.
- 🔑 **Instant Impersonation** — One-click login as any tenant for debugging and support, without needing passwords.
- 🔴 **Kill Switch** — Suspend a store instantly; suspended stores block public access and auto-logout all staff.
- 💳 **Per-Tenant Billing CRM** — Detailed views of a tenant's subscription plan, active staff count, active products, and payment history.
- 📈 **SaaS Analytics** — Track MRR (Monthly Recurring Revenue), MTD (Month-To-Date), churn rates, active outlets, and growth %.
- 📋 **System Logs Tailer** — View application, nginx, and mysql logs directly from the Central Dashboard.
- 💻 **System Health** — Real-time Node.js memory footprint, disk usage, and OS uptime.
- 💾 **Database Backups** — Trigger manual `mysqldump` backups directly from the web interface.
- 📦 **Plan & Tiers Management** — Manage subscription plans (Starter, Pro, Enterprise) and enforce limits on products, staff users, and branch counts.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express 5, Prisma ORM |
| **Database** | MySQL 8.0 |
| **Authentication** | JWT (JSON Web Tokens), bcrypt |
| **Payments** | Midtrans (Snap + Core API) |
| **Deployment** | Docker, Nginx, PM2 |

---

## 🗂 Project Structure

```text
saas-lazeePOS/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT verification, Role & Tenant guards
│   │   ├── planLimits.js    # Subscription enforcement guards
│   │   └── tenant.js        # Subdomain → Tenant resolution
│   ├── routes/
│   │   ├── central/         # SaaS platform owner routes
│   │   ├── public.js        # Public unauthenticated routes (Storefronts)
│   │   ├── auth.js          # Tenant staff authentication
│   │   ├── products.js      # Product CRUD + Stock integration
│   │   ├── warehouse.js     # Inventory & Adjustments
│   │   ├── receipts.js      # POS checkout & transaction creation
│   │   ├── discounts.js     # Rules engine
│   │   ├── cashflow.js      # Ledger operations
│   │   ├── dashboard.js     # Tenant metrics
│   │   ├── payment.js       # Midtrans integration & Webhooks
│   │   ├── settings.js      # Store configurations & Branding
│   │   └── upload.js        # Image & Media uploads
│   ├── prisma/
│   │   ├── schema.prisma    # Database structure
│   │   └── seed.js          # Default Plans, Central Admin & Demo Store
│   └── server.js            # Express app entry point
├── frontend/
│   └── src/
│       ├── api/             # Axios client with intelligent response unwrapping
│       ├── context/         # AuthContext & ThemeContext
│       ├── components/      # Reusable UI (Sidebar, Modals, Badges)
│       └── pages/           # Application views (Central, Admin, POS)
├── nginx/                   # Reverse proxy configurations
└── docker-compose.yml       # Container orchestration
```

---

## 🚀 Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/ball-hand/saas-lazeePOS.git
cd saas-lazeePOS

# 2. Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET, Midtrans keys

# 3. Start services via Docker Compose
docker-compose up -d

# 4. Run database migrations & seed initial data
docker-compose exec backend npx prisma db push
docker-compose exec backend npm run db:seed

# 5. Access the application
# Frontend → http://localhost
# Backend  → http://localhost:5000/api/health
```

---

## 💻 Local Development (Without Docker)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL=mysql://root:password@localhost:3306/lazeepos
npm install
npx prisma db push
npm run db:seed
npm run dev                 # Starts on port 5000 using nodemon
```

### Frontend Setup
```bash
# In a separate terminal
cd frontend
cp .env.example .env
npm install
npm run dev                 # Starts on port 5173 using Vite
```

### Subdomain Routing for Local Development
To test the tenant architecture locally, add a tenant subdomain to your local `/etc/hosts` file:
```text
127.0.0.1  demo.localhost
```
You can now access the tenant's public landing page and cashier portal via `http://demo.localhost:5173`.

---

## 🔑 Access Points & Credentials

| Entry Point | URL | Required Role |
|---|---|---|
| **SaaS Landing Page** | `http://localhost:5173` | — |
| **SuperAdmin Login** | `http://localhost:5173/central-login` | `central` |
| **Tenant Storefront** | `http://demo.localhost:5173` | — |
| **Tenant Login** | `http://demo.localhost:5173/login` | `admin` / `kasir` |

### Default Seeded Credentials

**Central Owner (SaaS Admin):**
- Email: `admin@lazeepos.com`
- Password: `Admin123!`

**Demo Tenant ("demo" Subdomain):**
- Admin Email: `demo@lazeepos.com` | Password: `Demo123!`
- Cashier Email: `kasir@lazeepos.com` | Password: `Kasir123!`

---

## 💳 Midtrans Payment Gateway Setup

1. Register at [dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Navigate to **Settings → Access Keys**
3. Add the following to your `backend/.env`:
   ```env
   MIDTRANS_ENV=sandbox
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
   ```
4. Add the following to your `frontend/.env`:
   ```env
   VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
   ```
5. Configure the Webhook/Notification URL in the Midtrans Dashboard:
   `https://yourdomain.com/api/v1/payment/notification`

---

## 💰 Built-in Subscription Tiers

| Plan | Price | Max Products | Max Users | Branches | Features |
|------|-------|----------|-------|----------|----------|
| **Starter** | Free | 100 | 3 | 1 | POS, Basic Reports, Inventory |
| **Pro** | Rp 149.000/mo | 500 | 10 | 3 | Starter + Multi-Branch |
| **Enterprise** | Rp 490.000/mo | Unlimited | Unlimited | Unlimited | Pro + API Access + Priority Support |

---

## 📄 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.
