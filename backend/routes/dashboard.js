import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard — aggregated stats
router.get('/', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Today's Sales
    const todaySales = await prisma.receipt.aggregate({
      where: {
        tenantId: req.user.tenantId,
        createdAt: { gte: today },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // 2. This Month's Sales
    const monthSales = await prisma.receipt.aggregate({
      where: {
        tenantId: req.user.tenantId,
        createdAt: { gte: firstDayOfMonth },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // 3. Low Stock Count (JS-side filter since MySQL can't compare two columns in Prisma where)
    const warehouses = await prisma.warehouse.findMany({
      where: { product: { tenantId: req.user.tenantId } },
      select: { quantity: true, reorderLevel: true },
    });
    const actualLowStockCount = warehouses.filter(w => w.quantity <= w.reorderLevel).length;


    // 4. Recent Transactions
    const recentTransactions = await prisma.cashFlow.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { transactionDate: 'desc' },
      take: 5,
    });

    // 5. Popular Products (by quantity sold this month)
    const popularProducts = await prisma.receiptItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        receipt: {
          tenantId: req.user.tenantId,
          createdAt: { gte: firstDayOfMonth },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    res.json({
      todaySalesAmount: todaySales._sum.totalAmount || 0,
      todaySalesCount: todaySales._count || 0,
      monthSalesAmount: monthSales._sum.totalAmount || 0,
      lowStockCount: actualLowStockCount,
      recentTransactions,
      popularProducts: popularProducts.map(p => ({
        id: p.productId,
        name: p.productName,
        quantitySold: p._sum.quantity,
        revenue: p._sum.totalPrice,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

export default router;
