// backend/utils/dunning.js
// ─────────────────────────────────────────────────────────
// Dunning Scheduler — Checks for expired/expiring subscriptions
// and sends reminder emails. Suspends tenants after grace period.
//
// Schedule: Runs every 6 hours via setInterval in server.js
// ─────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import { sendDunningEmail } from './mailer.js';

const prisma = new PrismaClient();

// Grace period: 3 days after expiry before suspension
const GRACE_PERIOD_DAYS = 3;

// Dunning schedule: when to send reminders (days before/after expiry)
// Negative = before expiry, 0 = on expiry, Positive = after expiry
const DUNNING_SCHEDULE = [
  { daysFromExpiry: -7, subject: '⏰ Langganan Anda akan berakhir dalam 7 hari', attempt: 1 },
  { daysFromExpiry: -3, subject: '⚠️ Langganan Anda akan berakhir dalam 3 hari', attempt: 2 },
  { daysFromExpiry: 0,  subject: '🔴 Langganan Anda berakhir hari ini!', attempt: 3 },
  { daysFromExpiry: 1,  subject: '❌ Langganan Anda sudah berakhir', attempt: 4 },
];

/**
 * Main dunning processor — call this on a schedule
 */
export async function processDunning() {
  const now = new Date();
  console.log(`[Dunning] Starting check at ${now.toISOString()}`);

  try {
    // Get all active/past_due subscriptions with their tenants
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ['active', 'TRIAL', 'past_due'] },
        currentPeriodEnd: { not: null },
      },
      include: {
        tenant: {
          select: { id: true, name: true, subdomain: true, status: true },
        },
        plan: {
          select: { name: true, monthlyPrice: true },
        },
      },
    });

    let emailsSent = 0;
    let tenantsSuspended = 0;

    for (const sub of subscriptions) {
      if (!sub.currentPeriodEnd || !sub.tenant) continue;

      // Skip free plans (monthlyPrice = 0)
      if (sub.plan?.monthlyPrice === 0) continue;

      const expiryDate = new Date(sub.currentPeriodEnd);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // 1. Check if we should SUSPEND (past grace period)
      if (daysUntilExpiry < -GRACE_PERIOD_DAYS) {
        if (sub.tenant.status !== 'SUSPENDED') {
          await prisma.tenant.update({
            where: { id: sub.tenant.id },
            data: { status: 'SUSPENDED' },
          });

          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'suspended' },
          });

          // Get admin email for this tenant
          const admin = await prisma.user.findFirst({
            where: { tenantId: sub.tenant.id, role: 'admin' },
            select: { email: true },
          });

          if (admin) {
            await sendDunningEmail(
              admin.email,
              sub.tenant.name,
              '🚫 Akun Anda telah ditangguhkan — LazeePOS',
              `Langganan toko <strong>${sub.tenant.name}</strong> telah berakhir sejak ${GRACE_PERIOD_DAYS} hari yang lalu dan akun Anda telah ditangguhkan. Silakan lakukan pembayaran untuk mengaktifkan kembali akun Anda.`
            );
          }

          tenantsSuspended++;
          console.log(`[Dunning] SUSPENDED tenant: ${sub.tenant.subdomain} (expired ${Math.abs(daysUntilExpiry)} days ago)`);
        }
        continue;
      }

      // 2. Check if we should send a REMINDER email
      for (const schedule of DUNNING_SCHEDULE) {
        // Check if we're within the right window for this reminder
        // Allow 1-day window for each scheduled reminder
        if (daysUntilExpiry <= schedule.daysFromExpiry && daysUntilExpiry > schedule.daysFromExpiry - 1) {
          // Only send if we haven't already sent this attempt
          if (sub.dunningAttempts < schedule.attempt) {
            const admin = await prisma.user.findFirst({
              where: { tenantId: sub.tenant.id, role: 'admin' },
              select: { email: true },
            });

            if (admin) {
              let body;
              if (schedule.daysFromExpiry > 0) {
                body = `Langganan paket <strong>${sub.plan?.name || 'Unknown'}</strong> untuk toko <strong>${sub.tenant.name}</strong> sudah berakhir. Silakan lakukan pembayaran dalam ${GRACE_PERIOD_DAYS} hari sebelum akun Anda ditangguhkan.`;
              } else if (schedule.daysFromExpiry === 0) {
                body = `Langganan paket <strong>${sub.plan?.name || 'Unknown'}</strong> untuk toko <strong>${sub.tenant.name}</strong> berakhir HARI INI. Segera lakukan perpanjangan agar layanan tidak terganggu.`;
              } else {
                body = `Langganan paket <strong>${sub.plan?.name || 'Unknown'}</strong> untuk toko <strong>${sub.tenant.name}</strong> akan berakhir dalam <strong>${Math.abs(schedule.daysFromExpiry)} hari</strong>. Perpanjang sekarang untuk menghindari gangguan layanan.`;
              }

              const sent = await sendDunningEmail(admin.email, sub.tenant.name, schedule.subject, body);

              if (sent) {
                await prisma.subscription.update({
                  where: { id: sub.id },
                  data: {
                    dunningAttempts: schedule.attempt,
                    lastDunningEmailAt: now,
                    status: schedule.daysFromExpiry >= 0 ? 'past_due' : sub.status,
                  },
                });
                emailsSent++;
                console.log(`[Dunning] Sent reminder #${schedule.attempt} to ${admin.email} (${sub.tenant.subdomain}, expires in ${daysUntilExpiry}d)`);
              }
            }
            break; // Only send one email per cycle per subscription
          }
        }
      }
    }

    console.log(`[Dunning] Complete: ${emailsSent} emails sent, ${tenantsSuspended} tenants suspended`);
    return { emailsSent, tenantsSuspended, checked: subscriptions.length };
  } catch (error) {
    console.error('[Dunning] Error:', error);
    return { error: error.message };
  }
}

/**
 * Start the dunning scheduler (runs every 6 hours)
 */
export function startDunningScheduler() {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  console.log('📧 Dunning scheduler started (runs every 6 hours)');

  // Run once on startup (after 30 second delay to let DB connect)
  setTimeout(() => {
    processDunning().catch(console.error);
  }, 30000);

  // Then run every 6 hours
  setInterval(() => {
    processDunning().catch(console.error);
  }, INTERVAL_MS);
}

export default { processDunning, startDunningScheduler };
