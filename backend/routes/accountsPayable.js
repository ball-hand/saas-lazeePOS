// backend/routes/accountsPayable.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/accounts-payable — Lihat utang toko
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const apList = await prisma.accountPayable.findMany({
      where: { tenantId: req.user.tenantId },
      include: { supplier: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ accountsPayable: apList });
  } catch (error) {
    console.error('Fetch AP error:', error);
    res.status(500).json({ message: 'Gagal memuat data utang.' });
  }
});

// POST /api/accounts-payable — Catat utang baru
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { supplierId, amount, dueDate, description } = req.body;
    
    if (!supplierId || !amount || !dueDate) {
      return res.status(400).json({ message: 'Supplier, nominal, dan tanggal jatuh tempo wajib diisi.' });
    }

    const utang = await prisma.accountPayable.create({
      data: {
        tenantId: req.user.tenantId,
        supplierId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description: description || null,
        status: 'PENDING'
      }
    });

    res.status(201).json({ message: 'Utang berhasil dicatat.', utang });
  } catch (error) {
    console.error('Create AP error:', error);
    res.status(500).json({ message: 'Gagal mencatat utang.' });
  }
});

export default router;