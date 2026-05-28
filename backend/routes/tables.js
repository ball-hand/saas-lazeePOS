import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// TABLE ZONES
// ==========================================

// GET all zones with their tables
router.get('/zones', authenticate, async (req, res) => {
  try {
    const zones = await prisma.tableZone.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        tables: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ zones });
  } catch (error) {
    console.error('Fetch table zones error:', error);
    res.status(500).json({ message: 'Gagal memuat zona meja' });
  }
});

// POST create zone
router.post('/zones', authenticate, requireRole('admin', 'kasir'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama zona wajib diisi' });

    const zone = await prisma.tableZone.create({
      data: {
        name,
        tenantId: req.user.tenantId
      }
    });
    res.status(201).json({ zone });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat zona meja' });
  }
});

// DELETE zone
router.delete('/zones/:id', authenticate, requireRole('admin', 'kasir'), async (req, res) => {
  try {
    await prisma.tableZone.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Zona berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus zona' });
  }
});

// PUT update zone layout
router.put('/zones/:id/layout', authenticate, requireRole('admin', 'kasir'), async (req, res) => {
  try {
    const { layoutData } = req.body;
    const zone = await prisma.tableZone.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { layoutData }
    });
    res.json({ message: 'Layout berhasil disimpan', zone });
  } catch (error) {
    console.error('Update zone layout error:', error);
    res.status(500).json({ message: 'Gagal menyimpan tata letak ruang' });
  }
});


// ==========================================
// TABLES
// ==========================================

// POST create table
router.post('/', authenticate, requireRole('admin', 'kasir'), async (req, res) => {
  try {
    const { name, zoneId, x, y, capacity } = req.body;
    if (!name || !zoneId) return res.status(400).json({ message: 'Nama dan Zona wajib diisi' });

    const table = await prisma.table.create({
      data: {
        name,
        zoneId,
        x: x || 0,
        y: y || 0,
        capacity: capacity || 4,
        tenantId: req.user.tenantId
      }
    });
    res.status(201).json({ table });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat meja' });
  }
});

// PUT update table (position, name, capacity, etc)
router.put('/:id', authenticate, requireRole('admin', 'kasir'), async (req, res) => {
  try {
    const { name, x, y, capacity, status } = req.body;
    
    const table = await prisma.table.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(x !== undefined && { x: parseFloat(x) }),
        ...(y !== undefined && { y: parseFloat(y) }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(status !== undefined && { status })
      }
    });
    res.json({ table });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate meja' });
  }
});

// DELETE table
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.table.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Meja berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus meja' });
  }
});

// ==========================================
// PENDING ORDERS (TABLE ORDERS)
// ==========================================

// GET ALL active (PENDING) orders across all tables for the tenant
router.get('/orders/active', authenticate, async (req, res) => {
  try {
    const orders = await prisma.tableOrder.findMany({
      where: { 
        tenantId: req.user.tenantId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    // Fetch related tables to get the table name
    const tableIds = [...new Set(orders.map(o => o.tableId))];
    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds } },
      select: { id: true, name: true, zone: { select: { name: true } } }
    });

    const enrichedOrders = orders.map(order => {
      const table = tables.find(t => t.id === order.tableId);
      return {
        ...order,
        tableName: table ? table.name : 'Unknown',
        zoneName: table?.zone?.name || ''
      };
    });

    res.json({ orders: enrichedOrders });
  } catch (error) {
    console.error('Fetch active table orders error:', error);
    res.status(500).json({ message: 'Gagal memuat pesanan aktif' });
  }
});

// GET active orders for a specific table
router.get('/:tableId/orders', authenticate, async (req, res) => {
  try {
    const orders = await prisma.tableOrder.findMany({
      where: { 
        tableId: req.params.tableId, 
        tenantId: req.user.tenantId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat pesanan meja' });
  }
});

// GET specific table order detail
router.get('/orders/detail/:orderId', authenticate, async (req, res) => {
  try {
    const order = await prisma.tableOrder.findUnique({
      where: { id: req.params.orderId, tenantId: req.user.tenantId }
    });
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    const table = await prisma.table.findUnique({
      where: { id: order.tableId },
      select: { name: true }
    });

    res.json({ order: { ...order, tableName: table?.name || 'Unknown' } });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat detail pesanan' });
  }
});

// DELETE/CLEAR table order
router.delete('/orders/:orderId', authenticate, async (req, res) => {
  try {
    const order = await prisma.tableOrder.update({
      where: { id: req.params.orderId, tenantId: req.user.tenantId },
      data: { status: 'CANCELLED' }
    });
    // If table has no pending orders left, we could set it back to CLEANING or AVAILABLE
    // but typically that's done by cashier manually.
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus pesanan' });
  }
});

import { v4 as uuidv4 } from 'uuid';

// VERIFY table order payment
router.put('/orders/:orderId/verify', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Find the order
    const order = await prisma.tableOrder.findUnique({
      where: { id: req.params.orderId, tenantId }
    });

    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    // Format items for Transaction
    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    
    const receiptItems = orderItems.map((item) => {
      const lineTotal = (item.price || 0) * (item.qty || item.quantity || 1);
      return {
        productId: item.id || item.productId,
        productName: item.name || 'Produk Meja',
        sku: item.sku || null,
        quantity: item.qty || item.quantity || 1,
        unitPrice: parseFloat(item.price || 0),
        discountApplied: 0,
        totalPrice: lineTotal
      };
    });

    // Generate receipt number
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const short = uuidv4().slice(0, 6).toUpperCase();
    const receiptNumber = `RCP-${date}-${short}`;

    // Start a transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Potong Stok Gudang
      for (const item of receiptItems) {
        if (!item.productId) continue;
        
        const warehouse = await tx.warehouse.findUnique({
          where: { productId: item.productId }
        });
        
        if (warehouse && warehouse.quantity >= item.quantity) {
          await tx.warehouse.update({
            where: { productId: item.productId },
            data: { quantity: warehouse.quantity - item.quantity }
          });
        }
      }

      // 2. Buat Receipt (Struk)
      const receipt = await tx.receipt.create({
        data: {
          tenantId,
          receiptNumber,
          customerName: order.customerName,
          subtotalAmount: order.totalAmount,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: order.totalAmount,
          paidAmount: order.totalAmount,
          changeGiven: 0,
          paymentMethod: 'qris',
          items: { create: receiptItems }
        }
      });

      // 3. Mark TableOrder as COMPLETED and PAID
      const updatedOrder = await tx.tableOrder.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', status: 'COMPLETED' }
      });

      // 4. Update Table activeOrderId (clear it)
      await tx.table.update({
        where: { id: order.tableId },
        data: { activeOrderId: null }
      });

      return updatedOrder;
    });

    res.json({ order: result });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Gagal memverifikasi pembayaran dan membuat resi' });
  }
});

export default router;
