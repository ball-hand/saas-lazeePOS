# 🛒 LazeePOS — SaaS Point of Sale System

A modern, multi-tenant SaaS POS system for Indonesian SMBs. Each store gets its own subdomain, theme, and isolated data.

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Prisma-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 🏪 **Multi-tenant** — each store on its own subdomain (`toko.lazeepos.com`)
- 🧾 **POS Terminal** — product catalog, cart, discount engine, receipt printing
- 📦 **Inventory / Warehouse** — stock tracking, low-stock alerts, adjustments
- 💳 **Midtrans Payment Gateway** — subscription billing via Snap (GoPay, QRIS, Bank Transfer, Cards)
- 🏷️ **Discount Engine** — percentage, fixed amount, BOGO, time-based, min-qty
- 📊 **Dashboard** — real-time sales, revenue, popular products
- 💰 **Cash Flow** — income/expense tracking, daily/monthly summaries
- 👥 **Staff Management** — multi-role (admin / cashier) with seat limits per plan
- ⚙️ **Tenant Settings** — custom theme color, logo, store name
- 🛡️ **SuperAdmin Panel** — manage all tenants, plans, platform stats
- 🌙 **Dark/Light theme** — per-tenant glassmorphism UI

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express 5 + Prisma ORM |
| Database | MySQL 8.0 (prod) / SQLite (dev) |
| Auth | JWT + bcrypt |
| Payments | Midtrans (Snap + Core API) |
| Deployment | Docker + Nginx |

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
cp .env.example .env          # edit DATABASE_URL etc.
npm install
npx prisma db push
node prisma/seed.js
npm run dev                   # starts on :5000

# Frontend (new terminal)
cd frontend
cp .env.example .env          # edit VITE_API_URL if needed
npm install
npm run dev                   # starts on :5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | `admin@lazeepos.com` | `Admin123!` | `/central-login` |
| Demo Admin | `demo@lazeepos.com` | `Demo123!` | `/login` (via `demo.*` subdomain) |
| Demo Kasir | `kasir@lazeepos.com` | `Kasir123!` | `/login` (via `demo.*` subdomain) |

> **Local dev subdomain trick:** Add `127.0.0.1 demo.localhost` to `/etc/hosts`, then open `http://demo.localhost:5173`

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

**Supported payment methods:** GoPay, OVO, DANA, QRIS, BCA, Mandiri, BNI, BRI, Visa, Mastercard

---

## 📁 Project Structure

```
saas-lazeePOS/
├── backend/
│   ├── middleware/       # auth, tenant detection
│   ├── routes/           # all API endpoints
│   │   ├── central/      # superadmin routes
│   │   └── payment.js    # Midtrans integration
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/          # axios client
│       ├── components/   # Layout, Sidebar, Modal, etc.
│       ├── context/      # Auth, Theme
│       └── pages/        # all app pages + Billing
├── nginx/
└── docker-compose.yml
```

---

## 💰 Pricing Tiers (Built-in)

| Plan | Price | Products | Users | Branches |
|------|-------|----------|-------|----------|
| Starter | Free | 100 | 3 | 1 |
| Pro | Rp 149.000/mo | 500 | 10 | 3 |
| Enterprise | Rp 490.000/mo | ∞ | ∞ | ∞ |

---

## 📄 License

MIT — free to use, modify, and sell.
