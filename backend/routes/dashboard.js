// backend/routes/dashboard.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard — aggregated stats (HANYA ADMIN)
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Today's Sales (Abaikan transaksi yang dibatalkan / di-void)
    const todaySales = await prisma.transaction.aggregate({
      where: {
        tenantId: req.user.tenantId,
        createdAt: { gte: today },
        isVoided: false,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // 2. This Month's Sales (Abaikan transaksi yang dibatalkan)
    const monthSales = await prisma.transaction.aggregate({
      where: {
        tenantId: req.user.tenantId,
        createdAt: { gte: firstDayOfMonth },
        isVoided: false,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // 3. Low Stock Count
    // Hitung secara presisi menggunakan JavaScript filter karena MySQL/Prisma
    // tidak bisa langsung membandingkan 2 kolom secara native di kondisi 'where'
    const warehouses = await prisma.warehouse.findMany({
      where: { product: { tenantId: req.user.tenantId } },
      select: { quantity: true, reorderLevel: true },
    });
    const actualLowStockCount = warehouses.filter(w => w.quantity <= w.reorderLevel).length;

    // 4. Recent Transactions (Cashflow)
    const recentTransactions = await prisma.cashFlow.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { transactionDate: 'desc' },
      take: 5,
    });

    // 5. Popular Products (Berdasarkan jumlah terjual bulan ini)
    const popularProductsAggr = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: {
          tenantId: req.user.tenantId,
          createdAt: { gte: firstDayOfMonth },
          isVoided: false,
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const productIds = popularProductsAggr.map(p => p.productId);

    // Ambil detail nama produk untuk mapping
    const productsInfo = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    // Ambil data item aktual untuk menghitung total pendapatan per produk secara presisi
    const topProductItems = await prisma.transactionItem.findMany({
      where: {
        productId: { in: productIds },
        transaction: { 
          tenantId: req.user.tenantId, 
          createdAt: { gte: firstDayOfMonth }, 
          isVoided: false 
        }
      },
      select: { productId: true, quantity: true, unitPrice: true, discountApplied: true }
    });

    // Kalkulasi manual pendapatan karena unit price bisa berubah sewaktu-waktu
    const revenueMap = {};
    topProductItems.forEach(item => {
      const lineTotal = (item.unitPrice * item.quantity) - (item.discountApplied || 0);
      if (!revenueMap[item.productId]) revenueMap[item.productId] = 0;
      revenueMap[item.productId] += lineTotal;
    });

    res.json({
      todaySalesAmount: todaySales._sum.totalAmount || 0,
      todaySalesCount: todaySales._count || 0,
      monthSalesAmount: monthSales._sum.totalAmount || 0,
      lowStockCount: actualLowStockCount,
      recentTransactions,
      popularProducts: popularProductsAggr.map(p => {
        const info = productsInfo.find(prod => prod.id === p.productId);
        return {
          id: p.productId,
          name: info ? info.name : 'Unknown Product',
          quantitySold: p._sum.quantity,
          revenue: revenueMap[p.productId] || 0,
        };
      }),
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ message: 'Gagal memuat dashboard.' });
  }
});

export default router;