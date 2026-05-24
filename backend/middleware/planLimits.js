// backend/middleware/planLimits.js
// Enforces per-plan resource limits at the API boundary.
// Works alongside database-level constraints as a fast-fail guard.
// All usage coordinates with Angular spec: req.user.tenantId is set by verifyToken.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ─────────────────────────────────────────────────
   requireProductLimit
   Blocks POST /api/products when tenant would exceed plan's maxProducts.
   Extracts tenantId from req.user (set by verifyToken, required before this middleware).
   ─────────────────────────────────────────────── */
export async function requireProductLimit(req, res, next) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return next();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: { plan: { select: { maxProducts: true, name: true } } },
        },
      },
    });

    const max = tenant?.subscription?.plan?.maxProducts;
    if (!max || max <= 0) return next(); // unlimited or not set — allow

    const currentCount = await prisma.product.count({ where: { tenantId } });
    if (currentCount >= max) {
      return res.status(403).json({
        message: `Batas maksimal ${max} produk untuk paket "${tenant?.subscription?.plan?.name ?? 'ini'}". Upgrade paket untuk menambah produk.`,
        limit: { type: 'products', max, current: currentCount },
      });
    }

    next();
  } catch (err) {
    console.error('Plan product limit check error:', err);
    next(); // pass-through on error
  }
}

/* ─────────────────────────────────────────────────
   requireUserLimit
   Blocks POST /api/settings/staff when tenant would exceed plan's maxUsers.
   ─────────────────────────────────────────────── */
export async function requireUserLimit(req, res, next) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return next();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: { plan: { select: { maxUsers: true, name: true } } },
        },
      },
    });

    const max = tenant?.subscription?.plan?.maxUsers;
    if (!max || max <= 0) return next(); // unlimited — allow

    const currentCount = await prisma.user.count({
      where: { tenantId, isActive: true },
    });
    // +1 because this request would create a new user
    if (currentCount >= max) {
      return res.status(403).json({
        message: `Batas maksimal ${max} pengguna untuk paket "${tenant?.subscription?.plan?.name ?? 'ini'}". Upgrade paket untuk menambah staf.`,
        limit: { type: 'users', max, current: currentCount },
      });
    }

    next();
  } catch (err) {
    console.error('Plan user limit check error:', err);
    next();
  }
}
