// backend/server.js - reload force v2
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import redis from './utils/redis.js';
import { PrismaClient } from '@prisma/client';
import { startDunningScheduler } from './utils/dunning.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { tenantIdentificator } from './middleware/tenant.js';
import { verifyToken } from './middleware/auth.js';
import { pagination } from './middleware/pagination.js';
import { idempotency } from './middleware/idempotency.js';
import { responseHandler } from './middleware/responseHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { responseTimeout } from './middleware/timeout.js';

import authRoutes           from './routes/auth.js';
import productRoutes        from './routes/products.js';
import warehouseRoutes      from './routes/warehouse.js';
import discountRoutes       from './routes/discounts.js';
import cashflowRoutes       from './routes/cashflow.js';
import dashboardRoutes      from './routes/dashboard.js';
import queueRoutes          from './routes/queue.js';
import settingsRoutes       from './routes/settings.js';
import tableRoutes          from './routes/tables.js';
import centralAuthRoutes    from './routes/central/auth.js';
import centralDashboardRoutes from './routes/central/dashboard.js';
import centralTenantRoutes        from './routes/central/tenants.js';
import centralPlanRoutes          from './routes/central/plans.js';
import centralPlatformRoutes      from './routes/central/platform.js';
import centralTenantActionsRoutes from './routes/central/tenant-actions.js';
import centralBillingRoutes       from './routes/central/billing.js';
import centralTicketsRoutes       from './routes/central/tickets.js';
import centralReleasesRoutes      from './routes/central/releases.js';
import centralAnalyticsRoutes     from './routes/central/analytics.js';
import centralSystemRoutes        from './routes/central/system.js';
import paymentRoutes          from './routes/payment.js';
import ticketsRoutes          from './routes/tickets.js';
import releasesRoutes         from './routes/releases.js';
import transactionRoutes    from './routes/transactions.js';
import accountsPayableRoutes from './routes/accountsPayable.js';
import receiptRoutes         from './routes/receipts.js';
import uploadRoutes          from './routes/upload.js';
import publicRoutes          from './routes/public.js';
import usersRoutes           from './routes/users.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));

// Parse cookies
app.use(cookieParser());

// Payload Size Limiting (2MB JSON & URL-encoded)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Global Response Timeout (30 seconds)
app.use(responseTimeout(30000));

// Global API Rate Limiter
app.use('/api', globalLimiter);

// Serve public static files (for image uploads)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Setup request logging to winston
const stream = {
  write: (message) => logger.info(message.trim())
};
app.use(morgan('combined', { stream }));
app.use(morgan('dev'));

// Global API Standard Middlewares
app.use(responseHandler);
app.use(pagination);
app.use(idempotency);

// API Version Tracking Middleware
app.use((req, res, next) => {
  const match = req.url.match(/^\/api\/(v\d+)\//);
  if (match) {
    const version = match[1];
    const dateStr = new Date().toISOString().split('T')[0];
    redis.hincrby(`api:usage:${dateStr}`, version, 1).catch(console.error);
  }
  next();
});

// tenant subdomain detection — must run BEFORE any route handlers
app.use(tenantIdentificator);

/* ─────────────────────────────────────────────────────────
   PUBLIC
───────────────────────────────────────────────────────── */
app.get('/api/v1/health', async (_req, res) => {
  const checks = { mysql: 'down', redis: 'down' };
  let overallStatus = 'healthy';

  // Check MySQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.mysql = 'up';
  } catch {
    overallStatus = 'degraded';
  }

  // Check Redis
  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'up' : 'down';
  } catch {
    overallStatus = 'degraded';
  }

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks,
  });
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
app.use('/api/v1/central/billing',   centralBillingRoutes);
app.use('/api/v1/central/tickets',   centralTicketsRoutes);
app.use('/api/v1/central/releases',  centralReleasesRoutes);

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
app.use('/api/v1/queue',      queueRoutes);
app.use('/api/v1/settings',   settingsRoutes);
app.use('/api/v1/tables',     tableRoutes);
app.use('/api/v1/payment',    paymentRoutes);
app.use('/api/v1/tickets',    ticketsRoutes);
app.use('/api/v1/releases',   releasesRoutes);
app.use('/api/v1/receipts',   receiptRoutes);
app.use('/api/v1/upload',     uploadRoutes);
app.use('/api/v1/users',      usersRoutes);

/* ─────────────────────────────────────────────────────────
   Global error handler
───────────────────────────────────────────────────────── */
app.use(async (err, req, res, _next) => {
  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}: %O`, err);
  const status = err.statusCode || 500;
  
  // Track error in database
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId || null;
    await prisma.systemErrorLog.create({
      data: {
        message: err.message || 'Unknown Error',
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        tenantId,
      }
    });
  } catch (logErr) {
    console.error('Failed to save error log:', logErr);
  }

  res.status(status).json({
    message: err.message || 'Terjadi kesalahan server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ─────────────────────────────────────────────────────────
   AUTO-CLEAR STALE TABLES (Every 5 Minutes)
───────────────────────────────────────────────────────── */
setInterval(async () => {
  try {
    // Find all OCCUPIED tables
    const occupiedTables = await prisma.table.findMany({
      where: { status: 'OCCUPIED' },
      include: { tenant: { select: { autoClearTableMinutes: true } } }
    });

    const now = new Date();
    for (const table of occupiedTables) {
      const timeoutMinutes = table.tenant?.autoClearTableMinutes || 45;
      const diffMs = now.getTime() - table.updatedAt.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes >= timeoutMinutes) {
        await prisma.table.update({
          where: { id: table.id },
          data: { status: 'CLEANING', activeOrderId: null }
        });
        console.log(`[Auto-Clear] Table ${table.name} (Tenant: ${table.tenantId}) cleared after ${diffMinutes}m`);
      }
    }
  } catch (err) {
    console.error('Auto-clear tables error:', err);
  }
}, 5 * 60 * 1000); // 5 minutes

/* ─────────────────────────────────────────────────────────
   START
───────────────────────────────────────────────────────── */
startDunningScheduler();

app.listen(PORT, () => {
  console.log(`\n🚀  Lazee POS SaaS Backend running on port ${PORT}`);
  console.log(`    Central  →  http://localhost:${PORT}/api/v1/central/...`);
  console.log(`    Tenant   →  http://<subdomain>.lazeepos.local/api/v1/...\n`);
});
