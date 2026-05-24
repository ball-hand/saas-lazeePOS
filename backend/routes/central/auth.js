// backend/routes/central/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'LAZEE_POS_SUPER_SECRET_KEY';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

/* ═══════════════════════════════════════════════════════
   POST /api/central/login  — central login
═══════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, isActive: true, tenantId: true, passwordHash: true },
    });

    if (!user || user.role !== 'central' || !user.isActive) {
      return res.status(401).json({ message: 'Kredensial tidak valid.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Kredensial tidak valid.' });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (err) {
    console.error('Central login error:', err);
    res.status(500).json({ message: 'Login gagal.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET  /api/central/auth/me  — central profile
═══════════════════════════════════════════════════════ */
router.get('/auth/me', verifyToken, requireRole('central'), async (req, res) => {
  try {
    const uid = req.user.userId || req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ user });
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(500).json({ message: 'Gagal memuat profil.' });
  }
});

export default router;
