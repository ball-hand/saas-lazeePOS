// backend/routes/central/analytics.js
// Superadmin-only SaaS analytics, system logs, and DB backup utilities
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();
const protect = [verifyToken, requireRole('central')];

/* ═══════════════════════════════════════════════════════
   GET /api/central/analytics
   Returns SaaS-level KPIs: MRR, MRR-by-plan, churn rate, active outlets
═══════════════════════════════════════════════════ */
router.get('/', ...protect, async (req, res) => {
  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth       = new Date(firstDayThisMonth);
    endLastMonth.setMilliseconds(-1);

    // ── Parallel metric queries ──────────────────────
    const [
      // Tenant counts
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,

      // MRR-by-plan: Plan × active monthly subscriber count
      mrrByPlan,

      // Revenue (all time + this month for context)
      allTimeRevenueAgg,
      thisMonthRevenueAgg,

      // Outlets = transactions in the last 30 days
      activeOutletsAgg,        // distinct tenantIds with transactions in last 30 days
      lastMonthRevenueAgg,
    ] = await Promise.all([
      prisma.tenant.count(),

      prisma.tenant.count({ where: { status: 'ACTIVE' } }),

      prisma.tenant.count({ where: { status: 'TRIAL' } }),

      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),

      // MRR breakdown — computed later from plan price × subscriber count
      prisma.plan.findMany({
        select: {
          id: true,
          name: true,
          monthlyPrice: true,
          _count: {
            select: { subscriptions: { where: { status: 'active', billingCycle: 'monthly' } } },
          },
        },
        orderBy: { monthlyPrice: 'asc' },
      }),

      // PERBAIKAN: Menggunakan prisma.transaction dan mengabaikan transaksi batal
      prisma.transaction.aggregate({ 
        where: { isVoided: false }, 
        _sum: { totalAmount: true } 
      }),

      prisma.transaction.aggregate({ 
        where: { isVoided: false, createdAt: { gte: firstDayThisMonth } }, 
        _sum: { totalAmount: true } 
      }),

      prisma.transaction.findMany({
        where: { isVoided: false, createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } },
        distinct: ['tenantId'],
        select: { id: true },
      }),

      prisma.transaction.aggregate({ 
        where: { isVoided: false, createdAt: { gte: firstDayLastMonth, lte: endLastMonth } }, 
        _sum: { totalAmount: true } 
      }),
    ]);

    // ── MRR computation ──────────────────────────────
    let mrr = 0;
    const mrrByPlanData = mrrByPlan.map(p => ({
      planName: p.name,
      monthlyPrice: p.monthlyPrice,
      subscriberCount: p._count.subscriptions,
      revenue: p.monthlyPrice * p._count.subscriptions,
    }));
    mrrByPlanData.forEach(seg => { mrr += seg.revenue; });

    // ── Active Outlets (tenants with ≥1 transaction last 30 days) ──
    const activeOutletCount = activeOutletsAgg.length;

    // ── Churn Rate ───────────────────────────────────
    // Simplified: (tenants inactive at end of month vs start of month proxy)
    // We use: tenants that went from active → suspended this month as proxy
    const churnedThisMonth = await prisma.tenant.count({
      where: {
        suspendedAt: { gte: firstDayThisMonth },
        status: 'SUSPENDED',
      },
    });

    const churnRate = activeTenants + churnedThisMonth > 0
      ? (churnedThisMonth / (activeTenants + churnedThisMonth))
      : 0;

    // ── All-time revenue — use last query result ─────
    const thisMonthRevenue = thisMonthRevenueAgg._sum.totalAmount || 0;
    const lastMonthRevenue  = lastMonthRevenueAgg._sum.totalAmount  || 0;
    const allTimeRevenue    = allTimeRevenueAgg._sum.totalAmount    || 0;

    // ── Revenue growth ───────────────────────────────
    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : (thisMonthRevenue > 0 ? 100 : 0);

    res.json({
      dateGenerated: now.toISOString(),

      // Revenue KPIs
      metrics: {
        mrr: {
          value: Math.round(mrr),
          currency: 'IDR',
          byPlan: mrrByPlanData,
        },
        mtdRevenue: {
          value: thisMonthRevenue,
          currency: 'IDR',
          momGrowth: Math.round(revenueGrowth * 100) / 100,
        },
        lastMonthRevenue: {
          value: lastMonthRevenue,
          currency: 'IDR',
        },
        lifetimeRevenue: {
          value: allTimeRevenue,
          currency: 'IDR',
        },
      },

      // Tenant KPIs
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
        suspended: suspendedTenants,
      },

      // Operational KPIs
      activeOutlets: activeOutletCount,
      churnRate: {
        value: Math.round(churnRate * 10000) / 100,  // 2 decimal places
        churned: churnedThisMonth,
      },

      // Context
      periodStart: firstDayThisMonth.toISOString().slice(0, 10),
      periodEnd:   now.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Gagal memuat data analitik.' });
  }
});

export default router;