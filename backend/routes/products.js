import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole, requireTenant } from '../middleware/auth.js';
import { requireProductLimit } from '../middleware/planLimits.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/products — list with search & category filter
router.get('/', verifyToken, requireTenant, async (req, res) => {
  try {
    const { search, category, active } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const { skip, take, page, limit } = req.pagination || { skip: 0, take: 50 };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: { warehouse: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Get unique categories
    const categories = await prisma.product.findMany({
      where: { tenantId: req.user.tenantId },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      products,
      categories: categories.map((c) => c.category).filter(Boolean),
      pagination: req.pagination ? {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      } : undefined
    });
  } catch (error) {
    console.error('Products list error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// POST /api/products — create product
router.post('/', verifyToken, requireTenant, requireProductLimit, requireRole('admin'), async (req, res) => {
  try {
    const { sku, name, description, price, costPrice, category, imageUrl, initialStock, reorderLevel } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const product = await prisma.product.create({
      data: {
        tenantId: req.user.tenantId,
        sku: sku || null,
        name,
        description: description || null,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        category: category || null,
        imageUrl: imageUrl || null,
        warehouse: {
          create: {
            quantity: parseInt(initialStock) || 0,
            reorderLevel: parseInt(reorderLevel) || 5,
            location: 'Main Storage',
          },
        },
      },
      include: { warehouse: true },
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Product create error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// PUT /api/products/:id — update product
router.put('/:id', verifyToken, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, description, price, costPrice, category, imageUrl, isActive } = req.body;

    const existing = await prisma.product.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(sku !== undefined && { sku: sku || null }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(costPrice !== undefined && { costPrice: costPrice ? parseFloat(costPrice) : null }),
        ...(category !== undefined && { category: category || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { warehouse: true },
    });

    res.json({ product });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — soft delete (set isActive = false)
router.delete('/:id', verifyToken, requireTenant, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        warehouse: { update: { quantity: 0 } },
      },
    });

    res.json({ message: 'Product deactivated' });
  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;
