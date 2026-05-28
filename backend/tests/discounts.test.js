import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  discount: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
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

const { default: discountRoutes } = await import('../routes/discounts.js');

const app = express();
app.use(express.json());
app.use('/discounts', discountRoutes);

describe('Discounts Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /discounts', () => {
    it('Harus mengembalikan daftar diskon (200)', async () => {
      mockPrisma.discount.findMany.mockResolvedValue([
        { id: '1', name: 'Promo Ramadhan', type: 'percentage', value: 10 }
      ]);
      const res = await request(app).get('/discounts');
      expect(res.status).toBe(200);
      expect(res.body.discounts).toHaveLength(1);
    });
  });

  describe('POST /discounts', () => {
    it('Harus bisa membuat diskon baru (201)', async () => {
      mockPrisma.discount.create.mockResolvedValue({
        id: '2', name: 'Promo Baru', discountType: 'fixed', discountValue: 5000
      });
      const res = await request(app).post('/discounts').send({
        name: 'Promo Baru', discountType: 'fixed', discountValue: 5000, isAutomatic: false
      });
      expect(res.status).toBe(201);
      expect(res.body.discount.name).toBe('Promo Baru');
    });
  });
});
