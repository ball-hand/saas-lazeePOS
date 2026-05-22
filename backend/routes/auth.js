// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole, requireTenant } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════ */
function issueToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

/* ═══════════════════════════════════════════════════════
   TENANT — REGISTER (PUBLIC)
   Creates a new tenant + admin user in one transaction.
   Called from the landing / register page (central domain).
═══════════════════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, storeName, subdomain, planId } = req.body;

    if (!email || !password || !storeName || !subdomain) {
      return res.status(400).json({
        message: 'Email, password, store name, and subdomain are required'
      });
    }

    // Validate subdomain format
    const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSub || cleanSub.length < 3) {
      return res.status(400).json({ message: 'Subdomain minimal 3 huruf/angka.' });
    }

    if (cleanSub === 'www' || cleanSub === 'api' || cleanSub === 'central' || cleanSub === 'admin') {
      return res.status(400).json({ message: 'Subdomain ini tidak tersedia.' });
    }

    // Check existing subdomain
    const existingSub = await prisma.tenant.findUnique({ where: { subdomain: cleanSub } });
    if (existingSub) {
      return res.status(400).json({ message: 'Subdomain sudah dipakai oleh toko lain.' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Lookup the plan if planId is provided
      let plan = null;
      if (planId) {
        plan = await tx.plan.findUnique({ where: { id: parseInt(planId) } });
      }

      // Subscription dates
      const now = new Date();
      const trialEnds = new Date(now);
      trialEnds.setDate(trialEnds.getDate() + 14); // 14-day trial

      const tenant = await tx.tenant.create({
        data: {
          name: storeName,
          subdomain: cleanSub,
          planId: planId ? parseInt(planId) : null,
          themeMode: 'dark',
          primaryColor: '#8B5CF6',
          status: 'trial',
          trialEndsAt: trialEnds,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || email.split('@')[0],
          role: 'admin',
          tenantId: tenant.id,
        },
        select: { id: true, email: true, name: true, role: true, tenantId: true },
      });

      // Create subscription record
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan ? plan.id : (planId ? parseInt(planId) : 1),
          billingCycle: 'monthly',
          status: 'trial',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
          trialEndsAt: trialEnds,
        },
      });

      return { user, tenant };
    });

    const token = issueToken({ userId: result.user.id, role: 'admin', tenantId: result.user.tenantId });

    res.status(201).json({
      user: { ...result.user, tenant: result.tenant },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Pendaftaran gagal. Silakan coba lagi.' });
  }
});

/* ═══════════════════════════════════════════════════════
   TENANT — LOGIN (via tenant subdomain)
   Rejects access from the central domain.
═══════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    // ── Central domain: reject tenant login, point to /api/central/login ──
    if (req.isCentral) {
      return res.status(400).json({
        message: 'Gunakan endpoint /api/central/login untuk akses panel pusat.'
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    // Exclude superadmin users from tenant login
    if (!user || user.role === 'superadmin' || !user.tenantId) {
      return res.status(401).json({ message: 'Kredensial tidak valid.' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Kredensial tidak valid.' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = issueToken({ userId: user.id, role: user.role, tenantId: user.tenantId });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
      },
      token,
    });
  } catch (error) {
    console.error('Tenant login error:', error);
    res.status(500).json({ message: 'Login gagal.' });
  }
});

/* ═══════════════════════════════════════════════════════
   TENANT — GET CURRENT USER (protected, tenant)
═══════════════════════════════════════════════════════ */
router.get('/me', verifyToken, requireTenant, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId || req.user.id },
      include: { tenant: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            themeMode: true,
            primaryColor: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Gagal mengambil data pengguna.' });
  }
});

/* ═══════════════════════════════════════════════════════
   TENANT — CHANGE PASSWORD
═══════════════════════════════════════════════════════ */
router.put('/password', verifyToken, requireTenant, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi.' });
    }

    const userId = req.user.userId || req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Password lama salah.' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Gagal mengubah password.' });
  }
});

export default router;
