import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/queue — Get active order queue
router.get('/', authenticate, async (req, res) => {
  try {
    const queue = await prisma.receipt.findMany({
      where: {
        tenantId: req.user.tenantId,
        queueStatus: 'PROCESSING'
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    });

    res.json({ queue });
  } catch (error) {
    console.error('Fetch queue error:', error);
    res.status(500).json({ message: 'Gagal memuat antrean pesanan' });
  }
});

// PUT /api/queue/:id/complete — Mark an order as completed
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const receipt = await prisma.receipt.update({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId
      },
      data: {
        queueStatus: 'COMPLETED'
      }
    });

    res.json({ receipt });
  } catch (error) {
    console.error('Complete queue error:', error);
    res.status(500).json({ message: 'Gagal menyelesaikan pesanan' });
  }
});

export default router;
