// backend/routes/central/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'LAZEE_POS_SUPER_SECRET_KEY';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

/* ═══════════════════════════════════════════════════════
   POST /api/central/login  — superadmin login
═══════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, isActive: true, tenantId: true, passwordHash: true },
    });

    if (!user || user.role !== 'superadmin' || !user.isActive) {
      return res.status(401).json({ message: 'Kredensial tidak valid.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Kredensial tidak valid.' });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (err) {
    console.error('Central login error:', err);
    res.status(500).json({ message: 'Login gagal.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET  /api/central/auth/me  — superadmin profile
═══════════════════════════════════════════════════════ */
router.get('/auth/me', verifyToken, requireRole('superadmin'), async (req, res) => {
  try {
    const uid = req.user.userId || req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ user });
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(500).json({ message: 'Gagal memuat profil.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET  /api/central/dashboard  — platform aggregate
═══════════════════════════════════════════════════════ */
router.get('/dashboard', verifyToken, requireRole('superadmin'), async (req, res) => {
  try {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalTenants, activeTenants, tenantUsers, superAdmins, mrrSum, monthRev, monthTx, newTenants, trialTenants, suspendedTenants, lowStock] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { tenantId: { not: null }, isActive: true } }),
      prisma.user.count({ where: { role: 'superadmin', isActive: true } }),
      prisma.subscription.aggregate({ where: { status: 'active', billingCycle: 'monthly' }, _sum: { monthlyPrice: true } }),
      prisma.receipt.aggregate({ where: { createdAt: { gte: firstDay } }, _sum: { totalAmount: true } }),
      prisma.receipt.count({ where: { createdAt: { gte: firstDay } } }),
      prisma.tenant.count({ where: { createdAt: { gte: firstDay } } }),
      prisma.tenant.count({ where: { status: 'trial' } }),
      prisma.tenant.count({ where: { status: 'suspended' } }),
      prisma.warehouse.findMany({ select: { quantity: true, reorderLevel: true } }).then(ws => ws.filter(w => w.quantity <= w.reorderLevel).length),
    ]);

    // Top tenants this month by revenue
    const topTenants = await prisma.tenant.findMany({
      take: 5,
      select: {
        id: true, name: true, subdomain: true, status: true,
        _count: { select: { users: true, products: true } },
        subscription: { select: { plan: { select: { name: true, monthlyPrice: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalProducts = await prisma.product.count();

    res.json({
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalUserAccounts: tenantUsers + superAdmins,
      totalProducts,
      mrr: { value: (mrrSum._sum.monthlyPrice || 0).toString(), currency: 'IDR' },
      mtdRevenue: { value: (monthRev._sum.totalAmount || 0).toString(), currency: 'IDR' },
      mtdTransactions: monthTx,
      newTenantsMonth: newTenants,
      trialTenants,
      suspendedTenants,
      lowStockCount: lowStock,
      topTenants,
    });
  } catch (err) {
    console.error('Central dashboard error:', err);
    res.status(500).json({ message: 'Gagal memuat dasbor pusat.' });
  }
});

export default router;
