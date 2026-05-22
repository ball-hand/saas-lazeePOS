// backend/routes/central/plans.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const protect = [verifyToken, requireRole('superadmin')];

/* ───────────────────────────────────────────────────────
   GET /api/central/plans
   List all subscription plans
──────────────────────────────────────────────────────── */
router.get('/', ...protect, async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPrice: 'asc' },
      include: {
        _count: { select: { subscriptions: { where: { status: 'active' } } } },
      },
    });
    res.json({ plans });
  } catch (error) {
    console.error('List plans error:', error);
    res.status(500).json({ message: 'Gagal memuat paket langganan.' });
  }
});

/* ───────────────────────────────────────────────────────
   GET /api/central/plans/:id
──────────────────────────────────────────────────────── */
router.get('/:id', ...protect, async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        _count: { select: { subscriptions: true, tenants: true } },
      },
    });
    if (!plan) return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    res.json({ plan });
  } catch (error) {
    console.error('Plan detail error:', error);
    res.status(500).json({ message: 'Gagal memuat detail paket.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/central/plans
   Create a new plan
──────────────────────────────────────────────────────── */
router.post('/', ...protect, async (req, res) => {
  try {
    const { name, description, maxProducts, maxUsers, maxBranches, monthlyPrice, features, isActive } = req.body;

    if (!name || monthlyPrice === undefined) {
      return res.status(400).json({ message: 'Nama paket dan harga wajib diisi.' });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description || null,
        maxProducts: maxProducts ?? 100,
        maxUsers: maxUsers ?? 3,
        maxBranches: maxBranches ?? 1,
        monthlyPrice: parseFloat(monthlyPrice),
        features: features || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ plan });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Gagal membuat paket.' });
  }
});

/* ───────────────────────────────────────────────────────
   PUT /api/central/plans/:id
──────────────────────────────────────────────────────── */
router.put('/:id', ...protect, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const { name, description, maxProducts, maxUsers, maxBranches, monthlyPrice, features, isActive } = req.body;

    const existing = await prisma.plan.findUnique({ where: { id: planId } });
    if (!existing) return res.status(404).json({ message: 'Paket tidak ditemukan.' });

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(maxProducts !== undefined && { maxProducts: parseInt(maxProducts) }),
        ...(maxUsers !== undefined && { maxUsers: parseInt(maxUsers) }),
        ...(maxBranches !== undefined && { maxBranches: parseInt(maxBranches) }),
        ...(monthlyPrice !== undefined && { monthlyPrice: parseFloat(monthlyPrice) }),
        ...(features !== undefined && { features: features || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ plan });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Gagal memperbarui paket.' });
  }
});

/* ───────────────────────────────────────────────────────
   DELETE /api/central/plans/:id
   Soft-delete: set isActive = false
──────────────────────────────────────────────────────── */
router.delete('/:id', ...protect, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const active = await prisma.plan.findUnique({ where: { id: planId } });
    if (!active) return res.status(404).json({ message: 'Paket tidak ditemukan.' });

    await prisma.plan.update({ where: { id: planId }, data: { isActive: false } });
    res.json({ message: 'Paket berhasil dinonaktifkan.' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Gagal menghapus paket.' });
  }
});

export default router;
