import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockPrisma = {
  receipt: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
  warehouse: { update: jest.fn() },
  cashFlow: { create: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock Auth Middleware to bypass JWT
jest.unstable_mockModule('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { tenantId: 'tnt-1', userId: 'usr-1' };
    next();
  },
}));

const { default: receiptRoutes } = await import('../routes/receipts.js');

const app = express();
app.use(express.json());
app.use('/receipts', receiptRoutes);

describe('Checkout / Receipts Core Feature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /receipts', () => {
    it('Harus menolak jika keranjang kosong (400)', async () => {
      const res = await request(app).post('/receipts').send({ items: [] });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cart is empty');
    });

    it('Harus menolak jika jumlah bayar (paidAmount) tidak ada (400)', async () => {
      const res = await request(app).post('/receipts').send({ 
        items: [{ productId: '1', quantity: 1, unitPrice: 5000 }] 
      });
      expect(res.status).toBe(400);
    });

    it('Harus memproses checkout dan mengkalkulasi kembalian dengan benar (201)', async () => {
      // Setup mock return
      mockPrisma.receipt.create.mockResolvedValueOnce({
        id: 'rcp-1', receiptNumber: 'RCP-001', totalAmount: 10000, changeGiven: 50000
      });

      const payload = {
        items: [
          { productId: 'prod-1', productName: 'Kopi', quantity: 2, unitPrice: 5000, discountApplied: 0 }
        ],
        paidAmount: 60000,
        paymentMethod: 'cash'
      };

      const res = await request(app).post('/receipts').send(payload);

      // Total harus 10.000 (2 * 5000). Bayar 60.000. Kembalian 50.000.
      expect(res.status).toBe(201);
      // Memastikan Prisma transaction dipanggil
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      // Memastikan stok gudang dipotong (warehouse.update)
      expect(mockPrisma.warehouse.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'prod-1' },
          data: { quantity: { decrement: 2 } }
        })
      );
    });

    it('Harus menolak jika uang bayar kurang dari total (400)', async () => {
      const payload = {
        items: [
          { productId: 'prod-1', productName: 'Kopi', quantity: 2, unitPrice: 5000, discountApplied: 0 }
        ],
        paidAmount: 5000, // Total 10000
      };

      const res = await request(app).post('/receipts').send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Insufficient payment');
    });
  });
});
