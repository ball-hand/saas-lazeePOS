// backend/middleware/trialExpiry.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if tenant's trial has expired
 * and auto-suspend if needed
 */
export const checkTrialExpiry = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return next();
    }

    // Only check for TRIAL status tenants
    if (req.tenant.status !== 'TRIAL') {
      return next();
    }

    const now = new Date();

    // If trial has ended, suspend the tenant
    if (req.tenant.trialEndsAt && now > new Date(req.tenant.trialEndsAt)) {
      await prisma.tenant.update({
        where: { id: req.tenant.id },
        data: {
          status: 'SUSPENDED',
          suspendedAt: now,
          suspendedReason: 'Trial period expired. Payment required to continue.',
        },
      });

      return res.status(403).json({
        message: 'Periode percobaan Anda telah berakhir. Silakan hubungi Admin Pusat untuk melanjutkan layanan.',
      });
    }

    next();
  } catch (error) {
    console.error('Trial expiry check error:', error);
    next(); // Continue even if check fails
  }
};

/**
 * Cron job to auto-suspend expired trials
 * Run every hour to find and suspend expired trials
 */
export const suspendExpiredTrials = async () => {
  try {
    const now = new Date();

    const expiredTrials = await prisma.tenant.updateMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          lt: now,
        },
      },
      data: {
        status: 'SUSPENDED',
        suspendedAt: now,
        suspendedReason: 'Trial period expired automatically',
      },
    });

    if (expiredTrials.count > 0) {
      console.log(`[Trial Expiry] Suspended ${expiredTrials.count} expired trial tenants`);
    }

    return expiredTrials.count;
  } catch (error) {
    console.error('[Trial Expiry] Error suspending expired trials:', error);
    return 0;
  }
};

export default {
  checkTrialExpiry,
  suspendExpiredTrials,
};
