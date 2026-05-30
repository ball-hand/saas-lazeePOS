// backend/routes/central/tenant-actions.js
// Superadmin-only tenant-level actions: impersonation, kill-switch, billing detail
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import redis from '../../utils/redis.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'LAZEE_POS_SUPER_SECRET_KEY';
const protect = [verifyToken, requireRole('central')];

/* ═══════════════════════════════════════════════════════
   POST /api/central/tenants/:id/impersonate
   Superadmin obtains a short-lived JWT scoped to the target tenant.
   Token carries { userId: <adminUserId>, role: 'admin', tenantId: <targetTenantId> }.
   Frontend stores this token and navigates to /dashboard as that tenant admin.
   Token expires in 1 hour.  Superadmin session token remains untouched.
═══════════════════════════════════════════════════ */
router.post('/tenants/:id/impersonate', ...protect, async (req, res) => {
  try {
    const targetTenantId = req.params.id;
    if (!targetTenantId) {
      return res.status(400).json({ message: 'ID tenant tidak valid.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: targetTenantId },
      include: { users: { where: { role: 'admin', isActive: true }, take: 1 } },
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    const adminUser = tenant.users[0];
    if (!adminUser) {
      return res.status(404).json({
        message: `Tenant "${tenant.name}" belum memiliki akun admin.`,
      });
    }

    // Issue a fresh tenant-scoped JWT
    const impersonateToken = jwt.sign(
      { userId: adminUser.id, role: 'admin', tenantId: targetTenantId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return impersonation context so the frontend can swap token + route to tenant dashboard
    res.json({
      impersonate: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        themeMode: tenant.themeMode,
        primaryColor: tenant.primaryColor,
      },
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'admin',
        tenantId: targetTenantId,
      },
      token: impersonateToken,
      expiresIn: '1h',
      message: `Sekarang login sebagai admin "${adminUser.name}" di toko "${tenant.name}".`,
    });
  } catch (err) {
    console.error('Impersonate error:', err);
    res.status(500).json({ message: 'Gagal masuk sebagai tenant.' });
  }
});

/* ═══════════════════════════════════════════════════════
   POST /api/central/tenants/:id/kill-switch
   Instantly suspend or restore a tenant.
   Body: { action: 'suspend' | 'restore', reason?: string }
═══════════════════════════════════════════════════ */
router.post('/tenants/:id/kill-switch', ...protect, async (req, res) => {
  try {
    const tenantId = req.params.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'ID tidak valid.' });
    }

    const { action, reason } = req.body;
    if (!['suspend', 'restore'].includes(action)) {
      return res.status(400).json({ message: 'Aksi harus "suspend" atau "restore".' });
    }

    const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    if (action === 'suspend') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date(),
          suspendedReason: reason || 'Suspended by central kill-switch',
        },
      });
      await redis.safeDel(`tenant:${existing.subdomain}`);
      return res.json({ message: `Toko "${existing.name}" berhasil di-suspend.` });
    }

    // restore
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
        suspendedReason: null,
      },
    });
    await redis.safeDel(`tenant:${existing.subdomain}`);
    return res.json({ message: `Toko "${existing.name}" berhasil diaktifkan kembali.` });
  } catch (err) {
    console.error('Kill switch error:', err);
    res.status(500).json({ message: 'Gagal mengeksekusi kill switch.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET /api/central/tenants/:id/billing
   Full billing detail for a specific tenant — only visible to central.
═══════════════════════════════════════════════════ */
router.get('/tenants/:id/billing', ...protect, async (req, res) => {
  try {
    const tenantId = req.params.id; // UUID matching model schema

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            plan: { select: { id: true, name: true, monthlyPrice: true, maxProducts: true, maxUsers: true, maxBranches: true } },
          },
        },
      },
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    // Active user count
    const activeUsers = await prisma.user.count({ where: { tenantId, isActive: true } });
    // Product count
    const productCount = await prisma.product.count({ where: { tenantId } });
    
    // PERBAIKAN: Mengubah prisma.receipt menjadi prisma.transaction dan mengabaikan transaksi batal (void)
    const revenueAgg = await prisma.transaction.aggregate({
      where: { 
        tenantId,
        isVoided: false 
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    res.json({
      tenant: {
        id: tenant.id, name: tenant.name, subdomain: tenant.subdomain,
        status: tenant.status, planId: tenant.planId,
        trialEndsAt: tenant.trialEndsAt, suspendedAt: tenant.suspendedAt, suspendedReason: tenant.suspendedReason,
      },
      subscription: tenant.subscription,
      activeUsers,
      productCount,
      lifetimeRevenue: revenueAgg._sum.totalAmount || 0,
      totalTransactions: revenueAgg._count,
      recentPayments: [],
    });
  } catch (err) {
    console.error('Tenant billing detail error:', err);
    res.status(500).json({ message: 'Gagal memuat detail billing tenant.' });
  }
});

export default router;