// backend/routes/central/platform.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const protect = [verifyToken, requireRole('superadmin')];

/* ───────────────────────────────────────────────────────
   GET /api/central/platform/settings
   Returns the latest platform-wide settings row (singleton).
   Row is automatically created on first call via seed.
──────────────────────────────────────────────────────── */
router.get('/settings', ...protect, async (_req, res) => {
  try {
    // We use the Tenant table as a key-value store singleton for platform settings.
    // Row id = 0 is reserved for platform config; we store as JSON in themeMode.
    const settings = await prisma.tenant.findFirst({
      where: { id: 0 },
      select: {
        name: true,
        themeMode: true,
        primaryColor: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!settings) {
      // Seed a default platform settings row
      const created = await prisma.tenant.create({
        data: {
          id: 0,
          name: 'Lazee POS Platform',
          subdomain: '__platform_settings__',
          themeMode: 'dark',
          primaryColor: '#8B5CF6',
          status: 'active',
        },
        select: { name: true, themeMode: true, primaryColor: true, logoUrl: true },
      });
      return res.json({ settings: created });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Platform settings error:', error);
    res.status(500).json({ message: 'Gagal memuat pengaturan platform.' });
  }
});

/* ───────────────────────────────────────────────────────
   PUT /api/central/platform/settings
──────────────────────────────────────────────────────── */
router.put('/settings', ...protect, async (req, res) => {
  try {
    const { name, themeMode, primaryColor, logoUrl } = req.body;

    // Upsert with id = 0
    const settings = await prisma.tenant.upsert({
      where: { id: 0 },
      create: {
        id: 0,
        name: name || 'Lazee POS Platform',
        subdomain: '__platform_settings__',
        themeMode: themeMode || 'dark',
        primaryColor: primaryColor || '#8B5CF6',
        logoUrl: logoUrl || null,
        status: 'active',
      },
      update: {
        ...(name !== undefined && { name }),
        ...(themeMode !== undefined && { themeMode }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
      select: { name: true, themeMode: true, primaryColor: true, logoUrl: true },
    });

    res.json({ settings });
  } catch (error) {
    console.error('Update platform settings error:', error);
    res.status(500).json({ message: 'Gagal memperbarui pengaturan platform.' });
  }
});

export default router;
