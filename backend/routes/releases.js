import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/* ───────────────────────────────────────────────────────
   GET /api/releases/latest
   Get the latest system release (Public/Polling route)
──────────────────────────────────────────────────────── */
router.get('/latest', async (req, res) => {
  try {
    const latest = await prisma.systemRelease.findFirst({
      orderBy: { publishedAt: 'desc' },
    });

    if (!latest) {
      return res.json({ release: null });
    }

    res.json({ release: latest });
  } catch (error) {
    console.error('Get latest release error:', error);
    res.status(500).json({ message: 'Gagal memuat info rilis terbaru.' });
  }
});

export default router;
