import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  cashFlow: { findMany: jest.fn(), create: jest.fn() },
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

const { default: cashflowRoutes } = await import('../routes/cashflow.js');

const app = express();
app.use(express.json());
app.use('/cashflow', cashflowRoutes);

describe('Cashflow Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /cashflow', () => {
    it('Harus mengembalikan daftar arus kas (200)', async () => {
      mockPrisma.cashFlow.findMany.mockResolvedValue([
        { id: '1', amount: 50000, type: 'IN' }
      ]);
      const res = await request(app).get('/cashflow');
      expect(res.status).toBe(200);
    });
  });
});
