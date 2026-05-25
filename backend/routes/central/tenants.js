// backend/routes/central/tenants.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';
import redis from '../../utils/redis.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ALL routes here are restricted to central */
const protect = [verifyToken, requireRole('central')];

/* ───────────────────────────────────────────────────────
   GET  /api/central/tenants
   List all tenants with optional search / status filter
──────────────────────────────────────────────────────── */
router.get('/', ...protect, async (req, res) => {
  try {
    const { search, status, plan, page = 1, limit = 25 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subdomain: { contains: search } },
      ];
    }
    // Prisma enum case-sensitivity handling
    if (status) where.status = status.toUpperCase(); 
    if (plan) where.plan = { name: { contains: plan } };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          // PERBAIKAN: receipts diubah menjadi transactions
          _count: { select: { users: true, products: true, transactions: true } },
          subscription: {
            select: { status: true, billingCycle: true, currentPeriodEnd: true, plan: { select: { name: true, monthlyPrice: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      tenants,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('List tenants error:', error);
    res.status(500).json({ message: 'Gagal memuat daftar tenant.' });
  }
});

/* ───────────────────────────────────────────────────────
   GET  /api/central/tenants/:id
   Single tenant detail + subscription + user count
──────────────────────────────────────────────────────── */
router.get('/:id', ...protect, async (req, res) => {
  try {
    const tenantId = req.params.id; // PERBAIKAN: Hapus parseInt karena ID adalah UUID String
    if (!tenantId) return res.status(400).json({ message: 'ID tidak valid.' });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { users: true, products: true, transactions: true, cashflows: true },
        },
        subscription: {
          include: { plan: true },
        },
        users: {
          select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    res.json({ tenant });
  } catch (error) {
    console.error('Tenant detail error:', error);
    res.status(500).json({ message: 'Gagal memuat detail tenant.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/central/tenants/:id/impersonate
   Generate a JWT token for the tenant's primary admin
──────────────────────────────────────────────────────── */
router.post('/:id/impersonate', ...protect, async (req, res) => {
  try {
    const tenantId = req.params.id;
    if (!tenantId) return res.status(400).json({ message: 'ID tidak valid.' });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { where: { role: 'admin' }, take: 1 } },
    });

    if (!tenant) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });
    if (tenant.users.length === 0) return res.status(404).json({ message: 'Tenant tidak memiliki akun admin aktif.' });

    const adminUser = tenant.users[0];

    // Generate token
    const token = jwt.sign(
      { userId: adminUser.id, role: adminUser.role, tenantId: tenant.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({ token, subdomain: tenant.subdomain });
  } catch (error) {
    console.error('Impersonate error:', error);
    res.status(500).json({ message: 'Gagal melakukan impersonasi.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST  /api/central/tenants
   Create a new tenant (used by internal / admin portal)
──────────────────────────────────────────────────────── */
router.post('/', ...protect, async (req, res) => {
  try {
    const { name, subdomain, planId, themeMode, primaryColor } = req.body;

    if (!name || !subdomain) {
      return res.status(400).json({ message: 'Nama toko dan subdomain wajib diisi.' });
    }

    const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanSub.length < 3) return res.status(400).json({ message: 'Subdomain minimal 3 karakter.' });

    const existing = await prisma.tenant.findUnique({ where: { subdomain: cleanSub } });
    if (existing) return res.status(409).json({ message: 'Subdomain sudah dipakai.' });

    const now = new Date();
    const trialEnds = new Date(now);
    trialEnds.setDate(trialEnds.getDate() + 14);

    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain: cleanSub,
        planId: planId || null,
        themeMode: themeMode || 'dark',
        primaryColor: primaryColor || '#8B5CF6',
        status: 'TRIAL',
        trialEndsAt: trialEnds,
        isActive: true,
      },
    });

    res.status(201).json({ tenant });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Gagal membuat tenant.' });
  }
});

/* ───────────────────────────────────────────────────────
   PUT  /api/central/tenants/:id
   Update tenant config (branding, status, etc.)
──────────────────────────────────────────────────────── */
router.put('/:id', ...protect, async (req, res) => {
  try {
    const tenantId = req.params.id; // UUID String
    const { name, logoUrl, themeMode, primaryColor, status } = req.body;

    const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (themeMode !== undefined) updateData.themeMode = themeMode;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;

    if (status !== undefined) {
      updateData.status = status.toUpperCase();
      // PERBAIKAN: Sesuaikan dengan schema.prisma, gunakan isActive alih-alih kolom fiktif
      if (updateData.status === 'SUSPENDED') {
        updateData.isActive = false;
      } else {
        updateData.isActive = true;
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    // Hapus cache Redis agar perubahan status/detail tenant langsung terasa di middleware
    await redis.del(`tenant:${tenant.subdomain}`);

    res.json({ tenant });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Gagal memperbarui tenant.' });
  }
});

/* ───────────────────────────────────────────────────────
   DELETE  /api/central/tenants/:id
   Soft-remove a tenant (set status = 'SUSPENDED' + isActive = false)
──────────────────────────────────────────────────────── */
router.delete('/:id', ...protect, async (req, res) => {
  try {
    const tenantId = req.params.id; // UUID String

    const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'SUSPENDED',
        isActive: false,
      },
    });

    await redis.del(`tenant:${existing.subdomain}`);

    res.json({ message: 'Tenant berhasil di-suspend.' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Gagal menghapus tenant.' });
  }
});

export default router;