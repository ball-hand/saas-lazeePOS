// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { tenantIdentificator } from './middleware/tenant.js';
import { verifyToken } from './middleware/auth.js';

import authRoutes           from './routes/auth.js';
import productRoutes        from './routes/products.js';
import warehouseRoutes      from './routes/warehouse.js';
import discountRoutes       from './routes/discounts.js';
import receiptRoutes        from './routes/receipts.js';
import cashflowRoutes       from './routes/cashflow.js';
import dashboardRoutes      from './routes/dashboard.js';
import settingsRoutes       from './routes/settings.js';
import centralAuthRoutes    from './routes/central/auth.js';
import centralTenantRoutes  from './routes/central/tenants.js';
import centralPlanRoutes    from './routes/central/plans.js';
import centralPlatformRoutes from './routes/central/platform.js';
import paymentRoutes          from './routes/payment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// tenant subdomain detection — must run BEFORE any route handlers
app.use(tenantIdentificator);

/* ─────────────────────────────────────────────────────────
   PUBLIC
───────────────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

/* ─────────────────────────────────────────────────────────
   CENTRAL / SUPERADMIN  — /api/central/*
   Order matters: login must come BEFORE verifyToken guard
───────────────────────────────────────────────────────── */
// 1. Central login (no auth required)
app.use('/api/central', centralAuthRoutes);

// 2. All other /api/central/* routes require a valid JWT
app.use('/api/central', verifyToken);

// 3. Superadmin-only CRUD
app.use('/api/central/tenants',   centralTenantRoutes);
app.use('/api/central/plans',     centralPlanRoutes);
app.use('/api/central/platform',  centralPlatformRoutes);

/* ─────────────────────────────────────────────────────────
   TENANT / TOKO  — /api/*
   Individual routers use requireTenant / requireRole internally
───────────────────────────────────────────────────────── */
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/warehouse',  warehouseRoutes);
app.use('/api/discounts',  discountRoutes);
app.use('/api/receipts',   receiptRoutes);
app.use('/api/cashflow',   cashflowRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/payment',    paymentRoutes);

/* ─────────────────────────────────────────────────────────
   Global error handler
───────────────────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Terjadi kesalahan server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ─────────────────────────────────────────────────────────
   START
───────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  Lazee POS SaaS Backend running on port ${PORT}`);
  console.log(`    Central  →  http://localhost:${PORT}/api/central/...`);
  console.log(`    Tenant   →  http://<subdomain>.lazeepos.local/api/...\n`);
});
