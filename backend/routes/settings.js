// backend/routes/settings.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, requireTenant } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

const router = express.Router();
const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════
   GET  /api/settings/tenant  –  tenant branding config
═══════════════════════════════════════════════════════ */
router.get('/tenant', authenticate, requireTenant, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: {
        id: true, name: true, subdomain: true,
        themeMode: true, primaryColor: true, logoUrl: true,
        status: true, planId: true,
        subscription: { select: { status: true, billingCycle: true, nextBillingAt: true, plan: { select: { name: true, monthlyPrice: true } } } },
        plan: { select: { name: true, monthlyPrice: true } },
      },
    });
    res.json({ tenant });
  } catch (error) {
    console.error('Fetch tenant settings:', error);
    res.status(500).json({ message: 'Gagal memuat pengaturan.' });
  }
});

/* ═══════════════════════════════════════════════════════
   PUT  /api/settings/tenant  –  update tenant branding
═══════════════════════════════════════════════════════ */
router.put('/tenant', authenticate, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const { name, logoUrl, themeMode, primaryColor } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(themeMode !== undefined && { themeMode }),
        ...(primaryColor !== undefined && { primaryColor }),
      },
      select: { id: true, name: true, subdomain: true, themeMode: true, primaryColor: true, logoUrl: true },
    });
    res.json({ tenant });
  } catch (error) {
    console.error('Update tenant settings:', error);
    res.status(500).json({ message: 'Gagal memperbarui pengaturan.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET  /api/settings/staff  –  list staff
═══════════════════════════════════════════════════════ */
router.get('/staff', authenticate, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { tenantId: req.user.tenantId },
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ staff });
  } catch (error) {
    console.error('Fetch staff:', error);
    res.status(500).json({ message: 'Gagal memuat daftar staf.' });
  }
});

/* ═══════════════════════════════════════════════════════
   POST  /api/settings/staff  –  add staff
═══════════════════════════════════════════════════════ */
router.post('/staff', authenticate, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email sudah terdaftar di toko ini.' });

    // Enforce user-seat limit from subscription
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        subscription: { include: { plan: { select: { maxUsers: true } } } },
      },
    });

    const maxUsers = tenant?.subscription?.plan?.maxUsers ?? 3;
    const currentCount = await prisma.user.count({ where: { tenantId: req.user.tenantId, isActive: true } });
    if (currentCount >= maxUsers) {
      return res.status(403).json({ message: `Batas maksimal ${maxUsers} pengguna untuk paket ini. Upgrade paket untuk menambah staf.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        role: role || 'cashier',
        tenantId: req.user.tenantId,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json({ user });
  } catch (error) {
    console.error('Create staff:', error);
    res.status(500).json({ message: 'Gagal menambah staf.' });
  }
});

/* ═══════════════════════════════════════════════════════
   DELETE  /api/settings/staff/:id
═══════════════════════════════════════════════════════ */
router.delete('/staff/:id', authenticate, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.userId || userId === req.user.id) {
      return res.status(400).json({ message: 'Tidak bisa menghapus akun diri sendiri.' });
    }

    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId: req.user.tenantId },
    });
    if (!existing) return res.status(404).json({ message: 'Staf tidak ditemukan.' });

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Staf berhasil dihapus.' });
  } catch (error) {
    console.error('Delete staff:', error);
    res.status(500).json({ message: 'Gagal menghapus staf.' });
  }
});

export default router;
