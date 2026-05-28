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

/* ═══════════════════════════════════════════════════════
   GET  /api/v1/public/table/:tenantId/:tableId
   Return table info & product catalog for QR ordering
═══════════════════════════════════════════════════════ */
router.get('/table/:tenantId/:tableId', async (req, res) => {
  try {
    const { tenantId, tableId } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        logoUrl: true,
        logoShape: true,
      }
    });

    if (!tenant) return res.status(404).json({ message: 'Toko tidak ditemukan' });

    const table = await prisma.table.findUnique({
      where: { id: tableId, tenantId },
      include: { zone: true }
    });

    if (!table) return res.status(404).json({ message: 'Meja tidak ditemukan' });

    // Fetch all active products
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' }
    });

    // Group categories
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    res.json({
      status: 'success',
      data: {
        tenant,
        table,
        products,
        categories
      }
    });
  } catch (error) {
    console.error('Fetch table catalog error:', error);
    res.status(500).json({ message: 'Gagal memuat katalog meja.' });
  }
});

/* ═══════════════════════════════════════════════════════
   POST /api/v1/public/order
   Submit an order from a customer's phone
═══════════════════════════════════════════════════════ */
router.post('/order', async (req, res) => {
  try {
    const { tenantId, tableId, customerName, items, totalAmount } = req.body;
    
    if (!tenantId || !tableId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Data pesanan tidak lengkap' });
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId, tenantId }
    });

    if (!table) return res.status(404).json({ message: 'Meja tidak valid' });

    // Create the pending order
    const order = await prisma.tableOrder.create({
      data: {
        tenantId,
        tableId,
        customerName: customerName || 'Tamu',
        totalAmount: parseFloat(totalAmount),
        items: items, // JSON
        status: 'PENDING'
      }
    });

    // Update table status to OCCUPIED and link active order
    await prisma.table.update({
      where: { id: tableId },
      data: { 
        status: 'OCCUPIED',
        activeOrderId: order.id
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Pesanan berhasil dikirim ke kasir',
      order
    });
  } catch (error) {
    console.error('Submit table order error:', error);
    res.status(500).json({ message: 'Gagal mengirim pesanan' });
  }
});

export default router;
