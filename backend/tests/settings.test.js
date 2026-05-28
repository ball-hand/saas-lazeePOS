import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  tenant: { findUnique: jest.fn(), update: jest.fn() },
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
  requireTenant: (req, res, next) => next(),
}));

const { default: settingsRoutes } = await import('../routes/settings.js');

const app = express();
app.use(express.json());
app.use('/settings', settingsRoutes);

describe('Settings Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /settings', () => {
    it('Harus mengembalikan pengaturan tenant (200)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tnt-1', name: 'Toko Budi' });
      const res = await request(app).get('/settings/tenant');
      expect(res.status).toBe(200);
      expect(res.body.tenant.name).toBe('Toko Budi');
    });
  });

  describe('PUT /settings', () => {
    it('Harus bisa menyimpan pengaturan (200)', async () => {
      mockPrisma.tenant.update.mockResolvedValue({ id: 'tnt-1', name: 'Toko Budi Maju' });
      const res = await request(app).put('/settings/tenant').send({ name: 'Toko Budi Maju' });
      expect(res.status).toBe(200);
      expect(res.body.tenant.name).toBe('Toko Budi Maju');
    });
  });
});
