import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  warehouse: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
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
  verifyToken: (req, res, next) => {
    req.user = { tenantId: 'tnt-1', role: 'admin' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
  requireTenant: (req, res, next) => next(),
}));

const { default: warehouseRoutes } = await import('../routes/warehouse.js');

const app = express();
app.use(express.json());
app.use('/warehouse', warehouseRoutes);

describe('Warehouse Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /warehouse', () => {
    it('Harus merespons daftar stok (200)', async () => {
      mockPrisma.warehouse.findMany.mockResolvedValue([
        { id: '1', quantity: 100, product: { name: 'Gula' } }
      ]);
      mockPrisma.product.findMany.mockResolvedValue([
        { category: 'Kebutuhan' }
      ]);
      const res = await request(app).get('/warehouse');
      expect(res.status).toBe(200);
      expect(res.body.inventory).toHaveLength(1);
    });
  });

  describe('POST /warehouse/adjust', () => {
    it('Harus bisa menambah stok barang (200)', async () => {
      mockPrisma.warehouse.findUnique.mockResolvedValue({ id: '1', quantity: 10, product: { tenantId: 'tnt-1' } });
      mockPrisma.warehouse.update.mockResolvedValue({ id: '1', quantity: 15 });
      
      const res = await request(app).post('/warehouse/adjust').send({ productId: '1', adjustment: 5 });
      expect(res.status).toBe(200);
      expect(res.body.warehouse.quantity).toBe(15);
    });
  });
});
