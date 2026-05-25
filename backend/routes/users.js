import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireTenant, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Only authenticated tenant admin can manage users
router.use(verifyToken, requireTenant, requireRole('admin'));

// GET /api/v1/users - List all users in this tenant
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.tenant.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    status: 'success',
    data: { users }
  });
});

// POST /api/v1/users - Create new user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Check user limit based on subscription plan
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenant.id },
    include: { plan: true }
  });

  const maxUsers = tenant.plan?.maxUsers || 1;

  const currentUserCount = await prisma.user.count({
    where: { tenantId: req.tenant.id, isActive: true }
  });

  if (currentUserCount >= maxUsers) {
    return res.status(403).json({ 
      message: `Batas kuota staf tercapai (${maxUsers} pengguna). Silakan upgrade paket langganan Anda.` 
    });
  }

  // Check if email already exists globally
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: 'Email sudah terdaftar di sistem.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || 'kasir',
      tenantId: req.tenant.id,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});

// PUT /api/v1/users/:id - Update user
router.put('/:id', async (req, res) => {
  const { name, email, password, role, isActive } = req.body;
  const userId = req.params.id;

  // Make sure the user belongs to the tenant
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: req.tenant.id }
  });

  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }

  // Prevent disabling the last admin or changing their role
  if (user.role === 'admin' && (isActive === false || role !== 'admin')) {
    const adminCount = await prisma.user.count({
      where: { tenantId: req.tenant.id, role: 'admin', isActive: true }
    });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Toko harus memiliki setidaknya satu Admin yang aktif.' });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(password, salt);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }
    throw error;
  }
});

// DELETE /api/v1/users/:id - Soft delete user
router.delete('/:id', async (req, res) => {
  const userId = req.params.id;

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: req.tenant.id }
  });

  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }

  if (user.role === 'admin') {
    const adminCount = await prisma.user.count({
      where: { tenantId: req.tenant.id, role: 'admin', isActive: true }
    });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Toko harus memiliki setidaknya satu Admin.' });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  });

  res.json({
    status: 'success',
    message: 'User berhasil dinonaktifkan'
  });
});

export default router;
