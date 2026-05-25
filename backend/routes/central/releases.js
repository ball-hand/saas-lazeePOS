import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const protect = [verifyToken, requireRole('central')];

/* ───────────────────────────────────────────────────────
   GET /api/central/releases
   List all system releases
──────────────────────────────────────────────────────── */
router.get('/', ...protect, async (req, res) => {
  try {
    const releases = await prisma.systemRelease.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    res.json({ releases });
  } catch (error) {
    console.error('List releases error:', error);
    res.status(500).json({ message: 'Gagal memuat daftar rilis.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/central/releases
   Publish a new system release
──────────────────────────────────────────────────────── */
router.post('/', ...protect, async (req, res) => {
  try {
    const { version, releaseNotes, isMandatory } = req.body;

    if (!version || !releaseNotes) {
      return res.status(400).json({ message: 'Versi dan catatan rilis wajib diisi.' });
    }

    const existing = await prisma.systemRelease.findUnique({ where: { version } });
    if (existing) {
      return res.status(400).json({ message: 'Versi ini sudah pernah dirilis.' });
    }

    const release = await prisma.systemRelease.create({
      data: {
        version,
        releaseNotes,
        isMandatory: Boolean(isMandatory),
      },
    });

    res.status(201).json({ message: 'Rilis berhasil dipublikasikan.', release });
  } catch (error) {
    console.error('Publish release error:', error);
    res.status(500).json({ message: 'Gagal mempublikasikan rilis.' });
  }
});

export default router;
