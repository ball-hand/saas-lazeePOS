// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, requireTenant } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import redis from '../utils/redis.js';
import { sendResetPasswordEmail } from '../utils/mailer.js';
import { sendVerificationLink, verifyEmailToken } from '../middleware/emailVerification.js';
const router = express.Router();
const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════ */
function issueToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function setAuthCookie(res, token) {
  // Parse JWT_EXPIRES_IN (e.g. "7d", "24h", "1d") to milliseconds for cookie maxAge
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  let maxAgeMs = 24 * 60 * 60 * 1000; // default 1 day
  const match = expiresIn.match(/^(\d+)(d|h|m)$/);
  if (match) {
    const val = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'd') maxAgeMs = val * 24 * 60 * 60 * 1000;
    else if (unit === 'h') maxAgeMs = val * 60 * 60 * 1000;
    else if (unit === 'm') maxAgeMs = val * 60 * 1000;
  }

  // Set HttpOnly cookie with secure flags
  // This prevents XSS attacks from stealing the token
  res.cookie('authToken', token, {
    httpOnly: true,           // Cannot be accessed by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'strict',       // CSRF protection
    maxAge: maxAgeMs,         // Synced with JWT expiry
    path: '/',
  });
}

/* ═══════════════════════════════════════════════════════
   TENANT — REGISTER (PUBLIC)
   Creates a new tenant + admin user in one transaction.
   Called from the landing / register page (central domain).
═══════════════════════════════════════════════════════ */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, storeName, subdomain, planId } = req.body;

    if (!email || !password || !storeName || !subdomain) {
      return res.status(400).json({
        message: 'Email, password, store name, and subdomain are required'
      });
    }

    // Validate subdomain format
    const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSub || cleanSub.length < 3) {
      return res.status(400).json({ message: 'Subdomain minimal 3 huruf/angka.' });
    }

    if (cleanSub === 'www' || cleanSub === 'api' || cleanSub === 'central' || cleanSub === 'admin') {
      return res.status(400).json({ message: 'Subdomain ini tidak tersedia.' });
    }

    // Check existing subdomain
    const existingSub = await prisma.tenant.findUnique({ where: { subdomain: cleanSub } });
    if (existingSub) {
      return res.status(400).json({ message: 'Subdomain sudah dipakai oleh toko lain.' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Lookup the plan if planId is provided
      let plan = null;
      if (planId) {
        plan = await tx.plan.findUnique({ where: { id: planId } });
      }

      // Subscription dates: 24 hours from now
      const now = new Date();
      const trialEnds = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const tenant = await tx.tenant.create({
        data: {
          name: storeName,
          subdomain: cleanSub,
          planId: planId || null,
          themeMode: 'dark',
          primaryColor: '#8B5CF6',
          status: 'TRIAL',
          trialEndsAt: trialEnds,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || email.split('@')[0],
          role: 'admin',
          tenantId: tenant.id,
        },
        select: { id: true, email: true, name: true, role: true, tenantId: true },
      });

      // Create subscription record
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan ? plan.id : (planId || null),
          billingCycle: 'monthly',
          status: 'TRIAL',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
        },
      });

      return { user, tenant };
    });

    const token = issueToken({ userId: result.user.id, role: 'admin', tenantId: result.user.tenantId });

    // Send email verification link (but don't auto-login yet)
    const verificationToken = await sendVerificationLink(result.user);

    // Still set auth cookie for convenience in development/trial
    // But user cannot access routes requiring emailVerified: true until they verify
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Pendaftaran Berhasil! Silakan verifikasi email Anda untuk mengakses semua fitur.',
      user: { ...result.user, tenant: result.tenant, emailVerified: false },
      token,  // Still return token for backward compatibility
      verificationEmailSent: !!verificationToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Pendaftaran gagal. Silakan coba lagi.' });
  }
});

/* ═══════════════════════════════════════════════════════
   TENANT — LOGIN (via tenant subdomain)
   Rejects access from the central domain.
═══════════════════════════════════════════════════════ */
router.post('/login', authLimiter, async (req, res) => {
  try {
    // ── Central domain: reject tenant login, point to /api/central/login ──
    if (req.isCentral) {
      return res.status(400).json({
        message: 'Gunakan endpoint /api/central/login untuk akses panel pusat.'
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    // Exclude central users from tenant login
    if (!user || user.role === 'central' || !user.tenantId) {
      return res.status(401).json({ message: 'Kredensial tidak valid.' });
    }

    if (user.tenant && user.tenant.status === 'PENDING') {
      return res.status(403).json({ message: 'Toko Anda sedang menunggu persetujuan dari Admin Pusat.' });
    }

    if (user.tenant && user.tenant.status === 'TRIAL') {
      if (user.tenant.trialEndsAt && new Date() > new Date(user.tenant.trialEndsAt)) {
        return res.status(403).json({ message: 'Masa percobaan 24 Jam Anda telah habis. Silakan hubungi Admin Pusat untuk aktivasi pembayaran.' });
      }
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Kredensial tidak valid.' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Email Anda belum diverifikasi. Silakan cek email untuk link verifikasi.',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = issueToken({ userId: user.id, role: user.role, tenantId: user.tenantId });

    // Set HttpOnly cookie (new secure method)
    setAuthCookie(res, token);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
        emailVerified: user.emailVerified,
      },
      token,  // Still return token for backward compatibility
    });
  } catch (error) {
    console.error('Tenant login error:', error);
    res.status(500).json({ message: 'Login gagal.' });
  }
});

/* ═══════════════════════════════════════════════════════
   TENANT — GET CURRENT USER (protected, tenant)
═══════════════════════════════════════════════════════ */
router.get('/me', verifyToken, requireTenant, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId || req.user.id },
      include: { tenant: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            themeMode: true,
            primaryColor: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Gagal mengambil data pengguna.' });
  }
});

/* ═══════════════════════════════════════════════════════
   TENANT — CHANGE PASSWORD
═══════════════════════════════════════════════════════ */
router.put('/password', verifyToken, requireTenant, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi.' });
    }

    const userId = req.user.userId || req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Password lama salah.' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Gagal mengubah password.' });
  }
});

/* ═══════════════════════════════════════════════════════
   FORGOT PASSWORD — Send Reset Email (PUBLIC)
═══════════════════════════════════════════════════════ */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email wajib diisi.' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      // Security: Don't reveal if email exists or not
      return res.json({
        message: 'Jika email terdaftar, link reset password telah dikirim. Cek email Anda (termasuk folder spam).'
      });
    }

    // Exclude central admin from regular tenant reset flow
    if (user.role === 'central') {
      return res.status(403).json({ message: 'Gunakan /api/central/forgot-password untuk reset password central admin.' });
    }

    // Generate reset token (UUID)
    const resetToken = uuidv4();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    
    // Store reset token in Redis with 1-hour expiration
    const redisKey = `password_reset:${resetToken}`;
    await redis.safeSetex(redisKey, 3600, JSON.stringify({
      userId: user.id,
      email: user.email,
      tokenHash: resetTokenHash,
      createdAt: new Date().toISOString(),
    }));

    // Build reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}${
      user.role === 'admin' && user.tenantId ? `/${user.tenant.subdomain}` : '/central'
    }/reset-password?token=${resetToken}`;

    // Send email
    const emailSent = await sendResetPasswordEmail(user.email, resetLink);

    if (!emailSent) {
      return res.status(500).json({ message: 'Gagal mengirim email reset password. Silakan coba lagi nanti.' });
    }

    res.json({
      message: 'Link reset password telah dikirim ke email Anda. Cek email (termasuk folder spam). Link berlaku selama 1 jam.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan. Silakan coba lagi nanti.' });
  }
});

/* ═══════════════════════════════════════════════════════
   RESET PASSWORD — Validate Token & Update Password (PUBLIC)
═══════════════════════════════════════════════════════ */
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token dan password baru wajib diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    // Get reset token from Redis
    const redisKey = `password_reset:${token}`;
    const tokenDataStr = await redis.safeGet(redisKey);

    if (!tokenDataStr) {
      return res.status(401).json({
        message: 'Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru.'
      });
    }

    const tokenData = JSON.parse(tokenDataStr);
    const { userId, email } = tokenData;

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true, email: true, role: true, tenantId: true }
    });

    // Delete reset token from Redis (one-time use)
    await redis.safeDel(redisKey);

    // Issue new JWT token (auto-login after reset)
    const authToken = issueToken({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId
    });

    // Set HttpOnly cookie (new secure method)
    setAuthCookie(res, authToken);

    res.json({
      message: 'Password berhasil direset. Anda sedang login...',
      token: authToken,  // Still return token for backward compatibility
      user
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Gagal mereset password. Silakan coba lagi nanti.' });
  }
});

/* ═══════════════════════════════════════════════════════
   VERIFY RESET TOKEN (PUBLIC)
   Used by frontend to verify token before showing reset form
═══════════════════════════════════════════════════════ */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const redisKey = `password_reset:${token}`;
    const tokenDataStr = await redis.safeGet(redisKey);

    if (!tokenDataStr) {
      return res.status(401).json({ valid: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
    }

    const tokenData = JSON.parse(tokenDataStr);
    
    res.json({
      valid: true,
      email: tokenData.email,
      message: 'Token valid'
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ valid: false, message: 'Terjadi kesalahan saat verifikasi token.' });
  }
});

/* ═══════════════════════════════════════════════════════
   VERIFY EMAIL — Verify email token from registration
═══════════════════════════════════════════════════════ */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token verifikasi wajib diisi.' });
    }

    const result = await verifyEmailToken(token, prisma);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    res.json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Gagal memverifikasi email. Silakan coba lagi nanti.' });
  }
});

/* ═══════════════════════════════════════════════════════
   RESEND VERIFICATION EMAIL — Resend email verification link
═══════════════════════════════════════════════════════ */
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email wajib diisi.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Email tidak terdaftar.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email sudah diverifikasi.' });
    }

    const verificationToken = await sendVerificationLink(user);

    if (!verificationToken) {
      return res.status(500).json({ message: 'Gagal mengirim email verifikasi. Silakan coba lagi nanti.' });
    }

    res.json({
      message: 'Email verifikasi telah dikirim. Silakan cek email Anda (termasuk folder spam).',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Gagal mengirim email verifikasi.' });
  }
});

/* ═══════════════════════════════════════════════════════
   LOGOUT — Clear Auth Cookie
═══════════════════════════════════════════════════════ */
router.post('/logout', (req, res) => {
  // Clear the authToken cookie
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.json({ message: 'Logout berhasil.' });
});

export default router;
