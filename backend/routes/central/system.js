import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import redis from '../../utils/redis.js';

const router = express.Router();
const prisma = new PrismaClient();
const protect = [verifyToken, requireRole('central')];

/* ───────────────────────────────────────────────────────
   GET /api/central/system/logs
   Get all logs and metrics (Audit, Errors, API Version)
──────────────────────────────────────────────────────── */
router.get('/system/logs', ...protect, async (req, res) => {
  try {
    const [auditLogs, errorLogs] = await Promise.all([
      prisma.centralAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.systemErrorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    // Get API metrics from Redis for today
    const dateStr = new Date().toISOString().split('T')[0];
    const metrics = await redis.hgetall(`api:usage:${dateStr}`);

    res.json({
      auditLogs,
      errorLogs,
      apiMetrics: metrics || {}
    });
  } catch (error) {
    console.error('System logs error:', error);
    res.status(500).json({ message: 'Gagal memuat log sistem.' });
  }
});

/* ───────────────────────────────────────────────────────
   POST /api/central/system/purge
   Purge old/voided database records
──────────────────────────────────────────────────────── */
router.post('/system/purge', ...protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Hard delete voided transactions older than 30 days
    const purgeTransactions = await prisma.transaction.deleteMany({
      where: {
        isVoided: true,
        updatedAt: { lt: thirtyDaysAgo }
      }
    });

    // Hard delete suspended tenants older than 30 days
    const purgeTenants = await prisma.tenant.deleteMany({
      where: {
        isActive: false,
        suspendedAt: { lt: thirtyDaysAgo }
      }
    });

    // Log this action to AuditLog
    await prisma.centralAuditLog.create({
      data: {
        action: 'DB_PURGE',
        actorId: req.user.userId,
        details: JSON.stringify({ 
          purgedTransactions: purgeTransactions.count,
          purgedTenants: purgeTenants.count 
        })
      }
    });

    res.json({
      message: 'Pembersihan database berhasil dieksekusi.',
      result: {
        transactionsPurged: purgeTransactions.count,
        tenantsPurged: purgeTenants.count
      }
    });
  } catch (error) {
    console.error('Purge error:', error);
    res.status(500).json({ message: 'Gagal membersihkan database.' });
  }
});

export default router;
