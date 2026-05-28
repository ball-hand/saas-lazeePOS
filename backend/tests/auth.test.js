import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test_secret';

// 1. Setup Mock Prisma
const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  tenant: { findUnique: jest.fn(), create: jest.fn() },
  subscription: { create: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// 2. Setup Mock Middleware Rate Limiter (to avoid blocking tests)
jest.unstable_mockModule('../middleware/rateLimiter.js', () => ({
  authLimiter: (req, res, next) => next(),
  globalLimiter: (req, res, next) => next(),
}));

// 3. Dynamic Import Routes after mocking
const { default: authRoutes } = await import('../routes/auth.js');

const app = express();
app.use(express.json());
// Inject fake req.isCentral = false for tenant auth testing
app.use((req, res, next) => {
  req.isCentral = false;
  next();
});
app.use('/auth', authRoutes);

describe('Auth Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('Harus menolak jika email atau password kosong (400)', async () => {
      const res = await request(app).post('/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email dan password wajib diisi.');
    });

    it('Harus menolak kredensial yang salah / user tidak ditemukan (401)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      const res = await request(app).post('/auth/login').send({ email: 'wrong@mail.com', password: '123' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Kredensial tidak valid.');
    });

    it('Harus berhasil login jika kredensial benar (200)', async () => {
      // Mock Hash
      const password = 'mypassword';
      const hash = await bcrypt.hash(password, 10);
      
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'usr-1',
        email: 'test@test.com',
        role: 'admin',
        tenantId: 'tnt-1',
        passwordHash: hash,
        tenant: { id: 'tnt-1', status: 'ACTIVE' }
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const res = await request(app).post('/auth/login').send({ email: 'test@test.com', password });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@test.com');
    });
  });

  describe('POST /auth/register', () => {
    it('Harus menolak jika subdomain "www" atau "api" (400)', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'new@mail.com', password: '123', storeName: 'Toko Baru', subdomain: 'www'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Subdomain ini tidak tersedia.');
    });
  });
});
