// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SaaS POS database...\n');

  /* ───────────────────────────────────────────────────────
     1. SUBSCRIPTION PLANS
  ─────────────────────────────────────────────────────── */
  console.log('📦 Seeding plans...');

  const plans = [
    {
      name: 'Starter',
      description: 'Cocok untuk kedai kecil. 1 cabang, produk hingga 100.',
      maxProducts: 100,
      maxUsers: 3,
      maxBranches: 1,
      monthlyPrice: 0,
      features: { pos: true, reports: true, inventory: true, multiUser: false },
    },
    {
      name: 'Pro',
      description: 'Untuk bisnis yang mulai ramai. Hingga 500 produk & 10 pengguna.',
      maxProducts: 500,
      maxUsers: 10,
      maxBranches: 3,
      monthlyPrice: 149000,
      features: { pos: true, reports: true, inventory: true, multiUser: true, multiBranch: true, api: false },
    },
    {
      name: 'Enterprise',
      description: 'Solusi penuh untuk franchise dan retail besar.',
      maxProducts: 99999,
      maxUsers: 99999,
      maxBranches: 99999,
      monthlyPrice: 490000,
      features: { pos: true, reports: true, inventory: true, multiUser: true, multiBranch: true, api: true, prioritySupport: true },
    },
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { name: planData.name },
      update: {},
      create: planData,
    });
  }

  const starterPlan = await prisma.plan.findUnique({ where: { name: 'Pro' } });

  /* ───────────────────────────────────────────────────────
     2. PLATFORM SUPERADMIN
     tenantId = null  →  platform-wide access
  ─────────────────────────────────────────────────────── */
  console.log('\n🔐 Seeding superadmin...');
  await prisma.user.deleteMany({ where: { role: 'superadmin' } });
  await prisma.user.upsert({
    where: { email: 'superadmin@lazeepos.com' },
    update: {},
    create: {
      email: 'superadmin@lazeepos.com',
      passwordHash: await bcrypt.hash('superadmin123', 10),
      name: 'Platform Super Admin',
      role: 'superadmin',
      tenantId: null,
    },
    select: { id: true, email: true },
  });
  console.log('   ✅ superadmin@lazeepos.com / superadmin123');
  console.log('   ⚠️  Ubah password ini segera di produksi!\n');

  /* ───────────────────────────────────────────────────────
     3. DEMO TENANT  ("Demo POS Store")
  ─────────────────────────────────────────────────────── */
  console.log('🏪 Seeding demo tenant...');

  const now = new Date();
  const trialEnds = new Date(now);
  trialEnds.setDate(trialEnds.getDate() + 14);
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const demoTenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Demo POS Store',
      subdomain: 'demo',
      themeMode: 'dark',
      primaryColor: '#8B5CF6',
      status: 'active',
    },
  });

  // Subscription for demo tenant
  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {
      planId: starterPlan.id,
      billingCycle: 'monthly',
      status: 'active',
      currentPeriodEnd: periodEnd,
    },
    create: {
      tenantId: demoTenant.id,
      planId: starterPlan.id,
      billingCycle: 'monthly',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  // Clear existing users for demo tenant
  await prisma.user.deleteMany({ where: { tenantId: demoTenant.id } });

  const adminPw = await bcrypt.hash('admin123', 10);
  const cashierPw = await bcrypt.hash('cashier123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@pos.com',
      passwordHash: adminPw,
      name: 'Store Admin',
      role: 'admin',
      tenantId: demoTenant.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'cashier@pos.com',
      passwordHash: cashierPw,
      name: 'Demo Cashier',
      role: 'cashier',
      tenantId: demoTenant.id,
    },
  });
  console.log('   ✅ admin@pos.com / admin123');
  console.log('   ✅ cashier@pos.com / cashier123');

  // Fresh product / warehouse seed ─ replace old data
  await prisma.product.deleteMany({ where: { tenantId: demoTenant.id } });
  const products = [
    { tenantId: demoTenant.id, name: 'Espresso', sku: 'BEV-001', category: 'Beverages', price: 35000, costPrice: 8000 },
    { tenantId: demoTenant.id, name: 'Latte', sku: 'BEV-002', category: 'Beverages', price: 45000, costPrice: 12000 },
    { tenantId: demoTenant.id, name: 'Croissant', sku: 'FOOD-001', category: 'Food', price: 30000, costPrice: 9000 },
    { tenantId: demoTenant.id, name: 'Blueberry Muffin', sku: 'FOOD-002', category: 'Food', price: 27500, costPrice: 8500 },
  ];

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        ...p,
        warehouse: { create: { quantity: 50, reorderLevel: 10, location: 'Main Storage' } },
      },
    });
  }

  // Seed discount rules
  await prisma.discountRule.deleteMany({ where: { tenantId: demoTenant.id } });
  await prisma.discountRule.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        name: 'Grand Opening 10%',
        discountType: 'percentage',
        discountValue: 10,
        appliesTo: 'all',
      },
      {
        tenantId: demoTenant.id,
        name: 'Beverage Sale',
        discountType: 'fixed_amount',
        discountValue: 1500,
        appliesTo: 'category',
        appliesToCategory: 'Beverages',
        minQuantity: 2,
      },
    ],
  });

  console.log('✅ Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
