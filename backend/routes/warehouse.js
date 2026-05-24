// backend/routes/warehouse.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole, requireTenant } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ───────────────────────────────────────────────────────
   GET /api/warehouse  — list inventory (tenant-scoped)
──────────────────────────────────────────────────────── */
router.get('/', verifyToken, requireTenant, async (req, res) => {
  try {
    const { lowStock, search, category } = req.query;
    const tenantId = req.user.tenantId;

    const where = { product: { tenantId } };

    // Prisma cannot compare two fields in a single `where` for MySQL;
    // we do two queries: fetch relevant product IDs then filter JS-side
    // for the lowStock case and apply search/category in DB query base.
    if (search) {
      where.product.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (category) {
      where.product.category = category;
    }

    const inventory = await prisma.warehouse.findMany({
      where,
      include: {
        product: {
          select: {
            id: true, name: true, sku: true, category: true, price: true, isActive: true,
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    let result = inventory;
    if (lowStock === 'true') {
      result = inventory.filter((w) => w.quantity <= w.reorderLevel);
    }

    // Category quick-list from current tenant only
    const categories = await prisma.product.findMany({
      where: { tenantId },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      inventory: result,
      categories: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error('Warehouse list error:', error);
    res.status(500).json({ message: 'Gagal memuat inventori.' });
  }
});

/* ───────────────────────────────────────────────────────
   GET /api/warehouse/low-stock
──────────────────────────────────────────────────────── */
router.get('/low-stock', verifyToken, requireTenant, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const inventory = await prisma.warehouse.findMany({
      where: { product: { tenantId } },
      include: {
        product: { select: { id: true, name: true, sku: true, category: true } },
      },
    });

    const lowStock = inventory.filter((w) => w.quantity <= w.reorderLevel);
    res.json({ lowStock, count: lowStock.length });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ message: 'Gagal memuat stok menipis.' });
  }
});

/* ───────────────────────────────────────────────────────
   GET /api/warehouse/:productId  — single entry
──────────────────────────────────────────────────────── */
router.get('/:productId', verifyToken, requireTenant, async (req, res) => {
  try {
    const productId = req.params.productId;
    const wh = await prisma.warehouse.findUnique({
      where: { productId },
      include: { product: { select: { id: true, name: true, sku: true, category: true, tenantId: true } } },
    });

    if (!wh || wh.product.tenantId !== req.user.tenantId) {
      return res.status(404).json({ message: 'Entry tidak ditemukan.' });
    }

    res.json({ warehouse: wh });
  } catch (error) {
    console.error('Warehouse fetch error:', error);
    res.status(500).json({ message: 'Gagal memuat data gudang.' });
  }
});

/* ───────────────────────────────────────────────────────
   PUT /api/warehouse/:productId  — update stock
──────────────────────────────────────────────────────── */
router.put('/:productId', verifyToken, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const productId = req.params.productId;
    const { quantity, reorderLevel, location } = req.body;

    // Verify ownership before update
    const wh = await prisma.warehouse.findUnique({
      where: { productId },
      include: { product: { select: { tenantId: true } } },
    });
    if (!wh || wh.product.tenantId !== req.user.tenantId) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const updated = await prisma.warehouse.update({
      where: { productId },
      data: {
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(reorderLevel !== undefined && { reorderLevel: parseInt(reorderLevel) }),
        ...(location !== undefined && { location }),
        lastRestocked: quantity !== undefined ? new Date() : undefined,
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });

    res.json({ warehouse: updated });
  } catch (error) {
    console.error('Warehouse update error:', error);
    res.status(500).json({ message: 'Gagal memperbarui stok.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/warehouse/adjust  — stock adjustment
──────────────────────────────────────────────────────── */
router.post('/adjust', verifyToken, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const { productId, adjustment, reason } = req.body;

    if (!productId || adjustment === undefined) {
      return res.status(400).json({ message: 'Product ID dan jumlah penyesuaian wajib diisi.' });
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { productId },
      include: { product: { select: { tenantId: true, name: true } } },
    });

    if (!warehouse || warehouse.product.tenantId !== req.user.tenantId) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const newQty = warehouse.quantity + parseInt(adjustment);
    if (newQty < 0) {
      return res.status(400).json({ message: 'Stok tidak mencukupi.' });
    }

    const updated = await prisma.warehouse.update({
      where: { productId },
      data: {
        quantity: newQty,
        lastRestocked: parseInt(adjustment) > 0 ? new Date() : undefined,
      },
      include: { product: { select: { id: true, name: true } } },
    });

    if (parseInt(adjustment) < 0 && reason) {
      await prisma.cashFlow.create({
        data: {
          tenantId: req.user.tenantId,
          type: 'expense',
          amount: 0,
          description: `Penyesuaian stok: ${reason} (${adjustment} unit ${updated.product.name})`,
        },
      });
    }

    res.json({ warehouse: updated, newQuantity: newQty });
  } catch (error) {
    console.error('Stock adjust error:', error);
    res.status(500).json({ message: 'Gagal menyesuaikan stok.' });
  }
});

export default router;
