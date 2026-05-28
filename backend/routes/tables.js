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
router.delete('/zones/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.tableZone.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ message: 'Zona berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus zona' });
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

export default router;
