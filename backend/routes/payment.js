// backend/routes/payment.js
// Midtrans payment gateway integration for SaaS subscription billing
import express from 'express';
import midtransClient from 'midtrans-client';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireTenant } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/* ─────────────────────────────────────────────────────
   Midtrans client setup
   Set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in .env
   isProduction: false = sandbox, true = production
───────────────────────────────────────────────────── */
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

/* ─────────────────────────────────────────────────────
   Utility: generate unique order_id
───────────────────────────────────────────────────── */
function makeOrderId(tenantId, planId) {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LZ-${ts}-${rnd}`;
}

/* ═══════════════════════════════════════════════════
   GET /api/payment/plans
   Public: list active plans with pricing
═══════════════════════════════════════════════════ */
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
      select: {
        id: true, name: true, description: true,
        maxProducts: true, maxUsers: true, maxBranches: true,
        monthlyPrice: true, features: true,
      },
    });
    res.json({ plans });
  } catch (err) {
    console.error('List plans error:', err);
    res.status(500).json({ message: 'Gagal memuat paket.' });
  }
});

/* ═══════════════════════════════════════════════════
   GET /api/payment/subscription
   Tenant: get current subscription & billing info
═══════════════════════════════════════════════════ */
router.get('/subscription', verifyToken, requireTenant, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true, name: true, monthlyPrice: true,
                maxProducts: true, maxUsers: true, maxBranches: true, features: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) return res.status(404).json({ message: 'Tenant tidak ditemukan.' });

    // Last 5 payment transactions
    const transactions = await prisma.paymentTransaction.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, orderId: true, amount: true, status: true,
        paymentType: true, billingCycle: true, paidAt: true, createdAt: true,
        plan: { select: { name: true } },
      },
    });

    // Counts for limit utilization
    const activeUsers = await prisma.user.count({ where: { tenantId: req.user.tenantId, isActive: true } });
    const productCount = await prisma.product.count({ where: { tenantId: req.user.tenantId, isActive: true } });

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt,
      },
      subscription: tenant.subscription,
      recentTransactions: transactions,
      activeUsers,
      productCount,
    });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ message: 'Gagal memuat data langganan.' });
  }
});

/* ═══════════════════════════════════════════════════
   POST /api/payment/create-transaction
   Tenant admin: initiate subscription upgrade/payment
   Body: { planId, billingCycle: "monthly"|"yearly" }
═══════════════════════════════════════════════════ */
router.post('/create-transaction', verifyToken, requireTenant, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin toko yang dapat melakukan upgrade.' });
    }

    const { planId, billingCycle = 'monthly' } = req.body;
    if (!planId) return res.status(400).json({ message: 'planId wajib diisi.' });

    const plan = await prisma.plan.findUnique({
      where: { id: planId, isActive: true },
    });
    if (!plan) return res.status(404).json({ message: 'Paket tidak ditemukan.' });

    // Free plan: upgrade immediately, no Midtrans charge
    if (parseFloat(plan.monthlyPrice) === 0) {
      await _activateSubscription(req.user.tenantId, plan.id, billingCycle, null);
      return res.json({ free: true, message: 'Berhasil beralih ke paket Starter.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: { users: { select: { email: true, name: true }, take: 1 } },
    });

    // Calculate amount
    const monthlyPrice = parseFloat(plan.monthlyPrice);
    const amount = billingCycle === 'yearly'
      ? Math.round(monthlyPrice * 12 * 0.85)   // 15% annual discount
      : Math.round(monthlyPrice);

    const orderId = makeOrderId(req.user.tenantId, plan.id);
    const adminEmail = tenant.users[0]?.email || 'user@lazeepos.com';
    const adminName = tenant.users[0]?.name || tenant.name;

    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create Midtrans Snap transaction
    const snapParam = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: `PLAN-${plan.id}`,
          name: `LazeePOS ${plan.name} (${billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})`,
          price: amount,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: adminName,
        email: adminEmail,
      },
      callbacks: {
        finish: `${origin}/billing?status=finish`,
        error:  `${origin}/billing?status=error`,
        pending: `${origin}/billing?status=pending`,
      },
    };

    const snapResponse = await snap.createTransaction(snapParam);

    // Persist pending transaction
    const tx = await prisma.paymentTransaction.create({
      data: {
        tenantId: req.user.tenantId,
        planId: plan.id,
        orderId,
        snapToken: snapResponse.token,
        snapRedirectUrl: snapResponse.redirect_url,
        amount,
        billingCycle,
        status: 'pending',
      },
    });

    res.json({
      orderId: tx.orderId,
      snapToken: snapResponse.token,
      snapRedirectUrl: snapResponse.redirect_url,
      amount,
      plan: { id: plan.id, name: plan.name },
    });
  } catch (err) {
    console.error('Create Midtrans transaction error:', err);
    res.status(500).json({
      message: 'Gagal membuat transaksi pembayaran.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/* ═══════════════════════════════════════════════════
   POST /api/payment/notification
   Midtrans webhook — receives payment status updates
   MUST be publicly reachable (no auth)
═══════════════════════════════════════════════════ */
router.post('/notification', async (req, res) => {
  try {
    // Verify notification signature
    const notification = await coreApi.transaction.notification(req.body);

    const { order_id, transaction_status, fraud_status, payment_type, transaction_id } = notification;

    console.log(`[Midtrans] ${order_id} → ${transaction_status} (fraud: ${fraud_status})`);

    const tx = await prisma.paymentTransaction.findUnique({ where: { orderId: order_id } });
    if (!tx) {
      console.warn(`[Midtrans] Unknown order_id: ${order_id}`);
      return res.status(200).json({ message: 'ok' }); // Always 200 to Midtrans
    }

    let newStatus = tx.status;
    let paidAt = tx.paidAt;

    if (transaction_status === 'capture') {
      newStatus = fraud_status === 'accept' ? 'settlement' : 'challenge';
    } else if (transaction_status === 'settlement') {
      newStatus = 'settlement';
      paidAt = new Date();
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newStatus = transaction_status;
    } else if (transaction_status === 'pending') {
      newStatus = 'pending';
    }

    // Update transaction record
    await prisma.paymentTransaction.update({
      where: { orderId: order_id },
      data: {
        status: newStatus,
        paymentType: payment_type || null,
        paidAt,
      },
    });

    // If settled — activate/upgrade subscription
    if (newStatus === 'settlement' && tx.planId) {
      await _activateSubscription(tx.tenantId, tx.planId, tx.billingCycle, tx.orderId);
    }

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error('Midtrans notification error:', err);
    res.status(200).json({ message: 'error handled' }); // Still 200 to prevent Midtrans retries
  }
});

/* ═══════════════════════════════════════════════════
   GET /api/payment/status/:orderId
   Tenant: poll payment status (for frontend polling)
═══════════════════════════════════════════════════ */
router.get('/status/:orderId', verifyToken, requireTenant, async (req, res) => {
  try {
    const tx = await prisma.paymentTransaction.findFirst({
      where: {
        orderId: req.params.orderId,
        tenantId: req.user.tenantId,
      },
      include: { plan: { select: { name: true, monthlyPrice: true } } },
    });

    if (!tx) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });

    res.json({ transaction: tx });
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ message: 'Gagal mengambil status pembayaran.' });
  }
});

/* ═══════════════════════════════════════════════════
   POST /api/payment/cancel/:orderId
   Tenant admin: cancel a pending transaction
═══════════════════════════════════════════════════ */
router.post('/cancel/:orderId', verifyToken, requireTenant, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat membatalkan transaksi.' });
    }

    const tx = await prisma.paymentTransaction.findFirst({
      where: { orderId: req.params.orderId, tenantId: req.user.tenantId },
    });

    if (!tx) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ message: 'Hanya transaksi pending yang dapat dibatalkan.' });
    }

    try {
      await coreApi.transaction.cancel(req.params.orderId);
    } catch (_e) {
      // Midtrans may already have expired it — that's fine
    }

    await prisma.paymentTransaction.update({
      where: { orderId: req.params.orderId },
      data: { status: 'cancel' },
    });

    res.json({ message: 'Transaksi berhasil dibatalkan.' });
  } catch (err) {
    console.error('Cancel transaction error:', err);
    res.status(500).json({ message: 'Gagal membatalkan transaksi.' });
  }
});

/* ═══════════════════════════════════════════════════
   Internal helper: activate/upgrade subscription
═══════════════════════════════════════════════════ */
async function _activateSubscription(tenantId, planId, billingCycle, orderId) {
  const now = new Date();
  const isYearly = billingCycle === 'yearly';
  const periodEnd = new Date(now);
  if (isYearly) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await prisma.$transaction([
    // Update or create subscription
    prisma.subscription.upsert({
      where: { tenantId },
      update: {
        planId,
        billingCycle,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        lastPaymentAt: now,
        paymentProvider: 'midtrans',
      },
      create: {
        tenantId,
        planId,
        billingCycle,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        lastPaymentAt: now,
        paymentProvider: 'midtrans',
      },
    }),
    // PERBAIKAN: Promote tenant status to ACTIVE and ensure isActive is true
    prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        status: 'ACTIVE', 
        planId: String(planId), 
        isActive: true 
      },
    }),
  ]);

  console.log(`[Billing] Tenant ${tenantId} upgraded to plan ${planId} (${billingCycle}), ends ${periodEnd.toISOString()}`);
}

export default router;