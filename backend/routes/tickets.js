import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireTenant } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ───────────────────────────────────────────────────────
   GET /api/tickets
   List all tickets for the current tenant
──────────────────────────────────────────────────────── */
router.get('/', verifyToken, requireTenant, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } },
        _count: { select: { replies: true } },
      },
    });
    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Gagal memuat tiket bantuan.' });
  }
});

/* ───────────────────────────────────────────────────────
   GET /api/tickets/:id
   Get single ticket with all replies
──────────────────────────────────────────────────────── */
router.get('/:id', verifyToken, requireTenant, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        user: { select: { name: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { name: true, role: true } },
          },
        },
      },
    });

    if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan.' });
    res.json({ ticket });
  } catch (error) {
    console.error('Get single ticket error:', error);
    res.status(500).json({ message: 'Gagal memuat detail tiket.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/tickets
   Create a new ticket
──────────────────────────────────────────────────────── */
router.post('/', verifyToken, requireTenant, async (req, res) => {
  try {
    const { subject, description, priority, userAgent } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: 'Subjek dan deskripsi wajib diisi.' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority: priority || 'MEDIUM',
        userAgent: userAgent || req.headers['user-agent'],
        tenantId: req.user.tenantId,
        userId: req.user.userId,
      },
    });

    res.status(201).json({ message: 'Tiket berhasil dikirim.', ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Gagal mengirim tiket.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/tickets/:id/reply
   Add a reply to an existing ticket
──────────────────────────────────────────────────────── */
router.post('/:id/reply', verifyToken, requireTenant, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });

    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
    });

    if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan.' });

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: ticket.id,
        userId: req.user.userId,
        message,
        isCentral: false,
      },
    });

    // Automatically change status back to OPEN if it was resolved/closed
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'OPEN' },
      });
    } else {
       // Just update the updatedAt timestamp
       await prisma.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
    }

    res.status(201).json({ message: 'Balasan terkirim.', reply });
  } catch (error) {
    console.error('Reply ticket error:', error);
    res.status(500).json({ message: 'Gagal mengirim balasan.' });
  }
});

export default router;
