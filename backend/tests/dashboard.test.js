import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  receipt: { aggregate: jest.fn() },
  warehouse: { findMany: jest.fn() },
  cashFlow: { findMany: jest.fn() },
  receiptItem: { groupBy: jest.fn(), findMany: jest.fn() },
  product: { findMany: jest.fn() },
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { tenantId: 'tnt-1', role: 'admin' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

const { default: dashboardRoutes } = await import('../routes/dashboard.js');

const app = express();
app.use(express.json());
app.use('/dashboard', dashboardRoutes);

describe('Dashboard Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /dashboard', () => {
    it('Harus merender data agregasi dengan benar (200)', async () => {
      // 1. & 2. Sales Aggregate
      mockPrisma.receipt.aggregate.mockResolvedValue({ _sum: { totalAmount: 100000 }, _count: 5 });
      
      // 3. Low Stock Count
      mockPrisma.warehouse.findMany.mockResolvedValue([
        { quantity: 5, reorderLevel: 10 }, // Low
        { quantity: 20, reorderLevel: 10 }, // Safe
      ]);

      // 4. Recent Transactions
      mockPrisma.cashFlow.findMany.mockResolvedValue([
        { id: '1', amount: 50000 }
      ]);

      // 5. Popular Products
      mockPrisma.receiptItem.groupBy.mockResolvedValue([
        { productId: 'prod-1', _sum: { quantity: 10 } }
      ]);
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', name: 'Nasi Goreng' }
      ]);
      mockPrisma.receiptItem.findMany.mockResolvedValue([
        { productId: 'prod-1', quantity: 10, unitPrice: 20000, discountApplied: 0 }
      ]);

      const res = await request(app).get('/dashboard');
      
      expect(res.status).toBe(200);
      expect(res.body.todaySalesAmount).toBe(100000);
      expect(res.body.lowStockCount).toBe(1);
      expect(res.body.popularProducts[0].name).toBe('Nasi Goreng');
      expect(res.body.popularProducts[0].revenue).toBe(200000);
    });
  });
});
