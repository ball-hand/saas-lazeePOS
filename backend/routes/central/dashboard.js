// backend/routes/central/dashboard.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════
   GET  /api/v1/central/dashboard  — Platform Aggregate
   Purely focused on SaaS Platform Owner metrics (Tenants, MRR, Subscriptions)
   Does NOT look at internal tenant data like Products or Low Stock.
═══════════════════════════════════════════════════════ */
router.get('/', verifyToken, requireRole('central'), async (req, res) => {
  try {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      newTenantsMonth,
      tenantUsers,
      superAdmins,
      activeSubsCount
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'TRIAL' } }),
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.tenant.count({ where: { createdAt: { gte: firstDay } } }),
      prisma.user.count({ where: { tenantId: { not: null }, isActive: true } }),
      prisma.user.count({ where: { role: 'central', isActive: true } }),
      prisma.subscription.count({ 
        where: { status: 'active' } 
      })
    ]);

    // Accurate MRR calculation
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'active', billingCycle: 'monthly' },
      include: { plan: true }
    });
    
    let mrr = 0;
    activeSubs.forEach(sub => {
      mrr += (sub.plan?.monthlyPrice || 0);
    });

    // Top tenants this month by active users (as proxy for engagement, since we shouldn't query their transactions directly on a massive scale without sharding, but for small scale we can)
    const topTenants = await prisma.tenant.findMany({
      take: 5,
      select: {
        id: true, name: true, subdomain: true, status: true,
        _count: { select: { users: true } },
        subscription: { select: { plan: { select: { name: true, monthlyPrice: true } } } },
      },
      orderBy: {
        users: { _count: 'desc' }
      },
    });

    res.json({
      status: 'success',
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          trial: trialTenants,
          suspended: suspendedTenants,
          newThisMonth: newTenantsMonth
        },
        users: {
          totalTenantUsers: tenantUsers,
          totalSuperAdmins: superAdmins
        },
        financials: {
          mrr: { value: mrr, currency: 'IDR' }
        },
        topTenants,
      }
    });
  } catch (err) {
    console.error('Central dashboard error:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memuat dasbor pusat.' });
  }
});

export default router;
