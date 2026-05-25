import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════
   GET  /api/v1/public/tenant/:subdomain
   Return public tenant info & catalog
═══════════════════════════════════════════════════════ */
router.get('/tenant/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    if (!subdomain) return res.status(400).json({ message: 'Subdomain diperlukan.' });

    const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: cleanSub, isActive: true },
      select: {
        id: true,
        name: true,
        subdomain: true,
        themeMode: true,
        primaryColor: true,
        logoUrl: true,
        logoShape: true,
        landingPageConfig: true,
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Toko tidak ditemukan atau tidak aktif.' });
    }

    // Fetch active products to show on the public landing page catalog
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
      },
      take: 20 // Limit to 20 for the public landing page preview
    });

    res.json({
      status: 'success',
      data: {
        ...tenant,
        products
      }
    });
  } catch (error) {
    console.error('Fetch public tenant error:', error);
    res.status(500).json({ message: 'Gagal memuat halaman toko.' });
  }
});

export default router;
