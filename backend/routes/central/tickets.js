import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const protect = [verifyToken, requireRole('central')];

/* ───────────────────────────────────────────────────────
   GET /api/central/tickets
   List all tickets from all tenants
──────────────────────────────────────────────────────── */
router.get('/', ...protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { tenant: { name: { contains: search } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          tenant: { select: { name: true, subdomain: true } },
          user: { select: { name: true, role: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      tickets,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('List central tickets error:', error);
    res.status(500).json({ message: 'Gagal memuat daftar tiket.' });
  }
});

/* ───────────────────────────────────────────────────────
   GET /api/central/tickets/:id
   Get single ticket with all replies
──────────────────────────────────────────────────────── */
router.get('/:id', ...protect, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: { select: { id: true, name: true, subdomain: true, status: true } },
        user: { select: { id: true, name: true, role: true, email: true } },
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
    console.error('Get central ticket error:', error);
    res.status(500).json({ message: 'Gagal memuat detail tiket.' });
  }
});

/* ───────────────────────────────────────────────────────
   PUT /api/central/tickets/:id/status
   Update ticket status
──────────────────────────────────────────────────────── */
router.put('/:id/status', ...protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid.' });
    }

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ message: `Status tiket diubah menjadi ${status}.`, ticket });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Gagal mengubah status tiket.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/central/tickets/:id/reply
   Central admin replies to a ticket
──────────────────────────────────────────────────────── */
router.post('/:id/reply', ...protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });

    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan.' });

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: ticket.id,
        message,
        isCentral: true,
      },
    });
    
    // Update ticket to IN_PROGRESS if it was OPEN
    const updateData = { updatedAt: new Date() };
    if (ticket.status === 'OPEN') {
      updateData.status = 'IN_PROGRESS';
    }
    
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    res.status(201).json({ message: 'Balasan terkirim.', reply });
  } catch (error) {
    console.error('Reply central ticket error:', error);
    res.status(500).json({ message: 'Gagal mengirim balasan.' });
  }
});

export default router;
