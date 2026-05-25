// backend/server.js - reload force v2
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { tenantIdentificator } from './middleware/tenant.js';
import { verifyToken } from './middleware/auth.js';
import { pagination } from './middleware/pagination.js';
import { idempotency } from './middleware/idempotency.js';
import { responseHandler } from './middleware/responseHandler.js';

import authRoutes           from './routes/auth.js';
import productRoutes        from './routes/products.js';
import warehouseRoutes      from './routes/warehouse.js';
import discountRoutes       from './routes/discounts.js';
import cashflowRoutes       from './routes/cashflow.js';
import dashboardRoutes      from './routes/dashboard.js';
import settingsRoutes       from './routes/settings.js';
import centralAuthRoutes    from './routes/central/auth.js';
import centralDashboardRoutes from './routes/central/dashboard.js';
import centralTenantRoutes        from './routes/central/tenants.js';
import centralPlanRoutes          from './routes/central/plans.js';
import centralPlatformRoutes      from './routes/central/platform.js';
import centralTenantActionsRoutes from './routes/central/tenant-actions.js';
import centralAnalyticsRoutes     from './routes/central/analytics.js';
import centralSystemRoutes        from './routes/central/system.js';
import paymentRoutes          from './routes/payment.js';
import transactionRoutes    from './routes/transactions.js';
import accountsPayableRoutes from './routes/accountsPayable.js';
import receiptRoutes         from './routes/receipts.js';
import uploadRoutes          from './routes/upload.js';
import publicRoutes          from './routes/public.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve public static files (for image uploads)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Setup request logging to logs/app.log and console
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const accessLogStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// Global API Standard Middlewares
app.use(responseHandler);
app.use(pagination);
app.use(idempotency);

// tenant subdomain detection — must run BEFORE any route handlers
app.use(tenantIdentificator);

/* ─────────────────────────────────────────────────────────
   PUBLIC
───────────────────────────────────────────────────────── */
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'success', data: { env: process.env.NODE_ENV || 'development' } });
});
app.use('/api/v1/public', publicRoutes);

/* ─────────────────────────────────────────────────────────
   CENTRAL / SUPERADMIN  — /api/v1/central/*
   Order matters: login must come BEFORE verifyToken guard
───────────────────────────────────────────────────────── */
// 1. Central login (no auth required)
app.use('/api/v1/central', centralAuthRoutes);

// 2. All other /api/v1/central/* routes require a valid JWT
app.use('/api/v1/central', verifyToken);
app.use('/api/v1/central/dashboard', centralDashboardRoutes);
app.use('/api/v1/central/tenants',   centralTenantRoutes);
app.use('/api/v1/central',           centralTenantActionsRoutes); 
app.use('/api/v1/central/plans',     centralPlanRoutes);
app.use('/api/v1/central/platform',  centralPlatformRoutes);

// Analytics, system logs, backup
app.use('/api/v1/central/analytics', centralAnalyticsRoutes);
app.use('/api/v1/central', centralSystemRoutes);

/* ─────────────────────────────────────────────────────────
   TENANT / TOKO  — /api/v1/*
   Individual routers use requireTenant / requireRole internally
───────────────────────────────────────────────────────── */
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/products',   productRoutes);
app.use('/api/v1/warehouse',  warehouseRoutes);
app.use('/api/v1/discounts',  discountRoutes);
app.use('/api/v1/transactions',     transactionRoutes);
app.use('/api/v1/accounts-payable', accountsPayableRoutes);
app.use('/api/v1/cashflow',   cashflowRoutes);
app.use('/api/v1/dashboard',  dashboardRoutes);
app.use('/api/v1/settings',   settingsRoutes);
app.use('/api/v1/payment',    paymentRoutes);
app.use('/api/v1/receipts',   receiptRoutes);
app.use('/api/v1/upload',     uploadRoutes);

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
  console.log(`    Central  →  http://localhost:${PORT}/api/v1/central/...`);
  console.log(`    Tenant   →  http://<subdomain>.lazeepos.local/api/v1/...\n`);
});
