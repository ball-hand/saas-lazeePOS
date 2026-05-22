// backend/routes/central/tenants.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole, requireTenant } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ALL routes here are restricted to superadmin */
const protect = [verifyToken, requireRole('superadmin')];

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
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (plan) where.plan = { name: { contains: plan, mode: 'insensitive' } };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { users: true, products: true, receipts: true } },
          subscription: {
            select: { status: true, billingCycle: true, nextBillingAt: true, plan: { select: { name: true, monthlyPrice: true } } },
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
    const tenantId = parseInt(req.params.id);
    if (isNaN(tenantId)) return res.status(400).json({ message: 'ID tidak valid.' });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { users: true, products: true, receipts: true, cashFlow: true },
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
        status: 'trial',
        trialEndsAt: trialEnds,
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
    const tenantId = parseInt(req.params.id);
    const { name, logoUrl, themeMode, primaryColor, status, suspendedReason } = req.body;

    const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (themeMode !== undefined) updateData.themeMode = themeMode;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'suspended') {
        updateData.suspendedAt = new Date();
        updateData.suspendedReason = suspendedReason || 'Suspended by superadmin';
      } else {
        updateData.suspendedAt = null;
        updateData.suspendedReason = null;
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    res.json({ tenant });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Gagal memperbarui tenant.' });
  }
});

/* ───────────────────────────────────────────────────────
   DELETE  /api/central/tenants/:id
   Soft-remove a tenant (set status = 'suspended' + reason)
──────────────────────────────────────────────────────── */
router.delete('/:id', ...protect, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);
    const { reason } = req.body;

    const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existing) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedReason: reason || 'Deleted by superadmin',
      },
    });

    res.json({ message: 'Tenant berhasil di-suspend.' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Gagal menghapus tenant.' });
  }
});

export default router;
