import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  transaction: { findMany: jest.fn() },
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

const { default: transactionsRoutes } = await import('../routes/transactions.js');

const app = express();
app.use(express.json());
app.use('/transactions', transactionsRoutes);

describe('Transactions Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /transactions', () => {
    it('Harus mengembalikan riwayat transaksi (200)', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { id: '1', receiptNumber: 'INV-1' }
      ]);
      const res = await request(app).get('/transactions');
      expect(res.status).toBe(200);
    });
  });
});
