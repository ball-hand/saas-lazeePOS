import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  product: { findMany: jest.fn(), update: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { tenantId: 'tnt-1' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
  requireTenant: (req, res, next) => next(),
  verifyToken: (req, res, next) => {
    req.user = { tenantId: 'tnt-1', role: 'admin' };
    next();
  },
}));

const { default: productRoutes } = await import('../routes/products.js');

const app = express();
app.use(express.json());
app.use('/products', productRoutes);

describe('Products Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products', () => {
    it('Harus merespons dengan daftar produk yang diurutkan berdasarkan isPinned terlebih dahulu (200)', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: '1', name: 'Kopi', isPinned: true },
        { id: '2', name: 'Gula', isPinned: false },
      ]);
      mockPrisma.product.count.mockResolvedValueOnce(2);

      const res = await request(app).get('/products');
      
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(2);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
        })
      );
    });
  });

  describe('PUT /products/:id', () => {
    it('Harus bisa melakukan PIN / UNPIN pada sebuah produk', async () => {
      mockPrisma.product.findFirst.mockResolvedValueOnce({ id: '1', tenantId: 'tnt-1' });
      mockPrisma.product.update.mockResolvedValueOnce({
        id: '1', name: 'Kopi', isPinned: true
      });

      const res = await request(app).put('/products/1').send({ isPinned: true });
      
      expect(res.status).toBe(200);
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ isPinned: true })
        })
      );
    });
  });
});
