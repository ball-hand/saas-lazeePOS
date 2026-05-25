import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const protect = [verifyToken, requireRole('central')];

/* ───────────────────────────────────────────────────────
   GET /api/central/billing/invoices
   List all payment transactions across all tenants
──────────────────────────────────────────────────────── */
router.get('/invoices', ...protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status; // pending, settlement, cancel, expire
    }
    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        { tenant: { name: { contains: search } } },
      ];
    }

    const [transactions, total, stats] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        include: {
          tenant: { select: { name: true, subdomain: true, status: true } },
          plan: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.paymentTransaction.count({ where }),
      // Calculate total successful revenue
      prisma.paymentTransaction.aggregate({
        where: { status: 'settlement' },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalRevenue: stats._sum.amount || 0,
    });
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({ message: 'Gagal memuat daftar tagihan.' });
  }
});

export default router;
