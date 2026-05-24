// backend/routes/transactions.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════
   GET /api/transactions — List semua transaksi toko
═══════════════════════════════════════════════════════ */
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const where = { tenantId: req.user.tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Jika ingin mencari berdasarkan nama Kasir atau ID Transaksi
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { kasir: { name: { contains: search } } }
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { 
        items: {
          include: { product: { select: { name: true, sku: true } } }
        },
        kasir: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Transactions list error:', error);
    res.status(500).json({ message: 'Gagal memuat daftar transaksi.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET /api/transactions/:id — Detail satu transaksi
═══════════════════════════════════════════════════════ */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { 
        items: { include: { product: { select: { name: true } } } },
        kasir: { select: { name: true } }
      },
    });

    if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });

    res.json({ transaction });
  } catch (error) {
    console.error('Transaction detail error:', error);
    res.status(500).json({ message: 'Gagal memuat detail transaksi.' });
  }
});

/* ═══════════════════════════════════════════════════════
   POST /api/transactions — Buat Transaksi (Checkout POS)
═══════════════════════════════════════════════════════ */
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, paidAmount, shiftId } = req.body;
    const tenantId = req.user.tenantId;
    // Mendukung baik userId dari Admin maupun Kasir
    const kasirId = req.user.userId || req.user.id; 

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Keranjang belanja kosong.' });
    }
    if (paidAmount === undefined) {
      return res.status(400).json({ message: 'Jumlah pembayaran (paidAmount) wajib diisi.' });
    }
    if (!shiftId) {
      return res.status(400).json({ message: 'Shift ID wajib diisi untuk melakukan transaksi.' });
    }

    // Kalkulasi total
    let totalAmount = 0;
    const transactionItems = items.map(item => {
      const lineTotal = (item.unitPrice * item.quantity) - (item.discountApplied || 0);
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountApplied: item.discountApplied || 0
      };
    });

    const change = paidAmount - totalAmount;

    // Prisma Transaction untuk memastikan Atomic Operation (Rollback jika error)
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Potong Stok Gudang (Lakukan pertama agar langsung gagal jika stok habis)
      for (const item of items) {
        const warehouse = await tx.warehouse.findUnique({
          where: { productId: item.productId }
        });
        
        if (!warehouse || warehouse.quantity < item.quantity) {
          // Melemparkan error ini akan membatalkan seluruh blok $transaction
          throw new Error(`Stok tidak mencukupi untuk produk ID: ${item.productId}`);
        }

        await tx.warehouse.update({
          where: { productId: item.productId },
          data: { quantity: warehouse.quantity - item.quantity }
        });
      }

      // 2. Buat Record Transaksi Utama
      const transaction = await tx.transaction.create({
        data: {
          tenantId, 
          shiftId, 
          kasirId, 
          totalAmount, 
          paidAmount, 
          change,
          status: 'COMPLETED',
          isVoided: false,
          items: { create: transactionItems }
        },
        include: { items: true }
      });

      // 3. Catat Pemasukan di Cash Flow
      await tx.cashFlow.create({
        data: {
          tenantId,
          shiftId,
          userId: kasirId,
          type: 'sale',
          amount: totalAmount,
          description: `Penjualan POS (ID: ${transaction.id.substring(0, 8)})`
        }
      });

      return transaction;
    });

    res.status(201).json({ message: 'Transaksi berhasil disimpan.', transaction: result });
  } catch (error) {
    console.error('Checkout error:', error);
    // Tangkap error kustom dari blok pemotongan stok
    res.status(400).json({ message: error.message || 'Gagal memproses transaksi.' });
  }
});

/* ═══════════════════════════════════════════════════════
   PUT /api/transactions/:id/void — SOFT DELETE (Pembatalan)
═══════════════════════════════════════════════════════ */
router.put('/:id/void', authenticate, requireRole(['kasir', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Cari transaksi yang dimaksud
    const existingTx = await prisma.transaction.findFirst({
      where: { id, tenantId },
      include: { items: true }
    });

    if (!existingTx) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }
    if (existingTx.isVoided) {
      return res.status(400).json({ message: 'Transaksi ini sudah dibatalkan sebelumnya.' });
    }

    // Eksekusi pembatalan secara atomic
    await prisma.$transaction(async (tx) => {
      // 1. Tandai transaksi sebagai VOID (Soft Delete)
      await tx.transaction.update({
        where: { id },
        data: { isVoided: true, status: 'VOID' }
      });

      // 2. Kembalikan stok ke warehouse (Gudang)
      for (const item of existingTx.items) {
        await tx.warehouse.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } }
        });
      }

      // 3. Catat pengeluaran (Refund) di Cashflow
      await tx.cashFlow.create({
        data: {
          tenantId,
          shiftId: existingTx.shiftId,
          userId: req.user.userId || req.user.id, // Siapa yang melakukan void
          type: 'expense',
          amount: existingTx.totalAmount,
          description: `Pembatalan/Refund Transaksi (ID: ${id.substring(0, 8)})`
        }
      });
    });

    res.json({ message: 'Transaksi berhasil dibatalkan dan stok telah dikembalikan.' });
  } catch (error) {
    console.error('Void error:', error);
    res.status(500).json({ message: 'Gagal membatalkan transaksi.' });
  }
});

export default router;