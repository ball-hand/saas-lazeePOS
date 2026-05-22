// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding LazeePOS database...\n');

  /* ──────────────────────────────────────────
     1. PLANS
  ────────────────────────────────────────── */
  console.log('📦 Seeding plans...');
  const plans = [
    {
      name: 'Starter',
      description: 'Cocok untuk kedai kecil. 1 cabang, produk hingga 100.',
      maxProducts: 100,
      maxUsers: 3,
      maxBranches: 1,
      monthlyPrice: 0,
      features: JSON.stringify({ pos: true, reports: true, inventory: true, multiUser: false }),
    },
    {
      name: 'Pro',
      description: 'Untuk bisnis yang mulai ramai. Hingga 500 produk & 10 pengguna.',
      maxProducts: 500,
      maxUsers: 10,
      maxBranches: 3,
      monthlyPrice: 149000,
      features: JSON.stringify({ pos: true, reports: true, inventory: true, multiUser: true, multiBranch: true, api: false }),
    },
    {
      name: 'Enterprise',
      description: 'Solusi penuh untuk franchise dan retail besar.',
      maxProducts: 99999,
      maxUsers: 99999,
      maxBranches: 99999,
      monthlyPrice: 490000,
      features: JSON.stringify({ pos: true, reports: true, inventory: true, multiUser: true, multiBranch: true, api: true, prioritySupport: true }),
    },
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { name: planData.name },
      update: {},
      create: planData,
    });
  }
  console.log('   ✅ Plans seeded: Starter, Pro, Enterprise');

  const proPlan = await prisma.plan.findUnique({ where: { name: 'Pro' } });

  /* ──────────────────────────────────────────
     2. SUPERADMIN
  ────────────────────────────────────────── */
  console.log('\n🔐 Seeding superadmin...');
  await prisma.user.upsert({
    where: { email: 'admin@lazeepos.com' },
    update: {},
    create: {
      email: 'admin@lazeepos.com',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      name: 'Platform Super Admin',
      role: 'superadmin',
      tenantId: null,
    },
  });
  console.log('   ✅ admin@lazeepos.com / Admin123!');
  console.log('   ⚠️  Ubah password ini segera di produksi!\n');

  /* ──────────────────────────────────────────
     3. DEMO TENANT
  ────────────────────────────────────────── */
  console.log('🏪 Seeding demo tenant...');

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Clean up existing demo data
  const existingDemo = await prisma.tenant.findUnique({ where: { subdomain: 'demo' } });
  if (existingDemo) {
    await prisma.discountRule.deleteMany({ where: { tenantId: existingDemo.id } });
    const productIds = (await prisma.product.findMany({ where: { tenantId: existingDemo.id }, select: { id: true } })).map(p => p.id);
    if (productIds.length) {
      await prisma.warehouse.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.product.deleteMany({ where: { tenantId: existingDemo.id } });
    }
    await prisma.user.deleteMany({ where: { tenantId: existingDemo.id } });
  }

  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: { status: 'active' },
    create: {
      name: 'Demo Store — LazeePOS',
      subdomain: 'demo',
      themeMode: 'dark',
      primaryColor: '#8B5CF6',
      status: 'active',
      planId: proPlan.id,
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: { planId: proPlan.id, status: 'active', currentPeriodEnd: periodEnd },
    create: {
      tenantId: demoTenant.id,
      planId: proPlan.id,
      billingCycle: 'monthly',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  /* Demo users */
  await prisma.user.create({
    data: {
      email: 'demo@lazeepos.com',
      passwordHash: await bcrypt.hash('Demo123!', 10),
      name: 'Demo Admin',
      role: 'admin',
      tenantId: demoTenant.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'kasir@lazeepos.com',
      passwordHash: await bcrypt.hash('Kasir123!', 10),
      name: 'Demo Kasir',
      role: 'cashier',
      tenantId: demoTenant.id,
    },
  });
  console.log('   ✅ demo@lazeepos.com / Demo123! (admin)');
  console.log('   ✅ kasir@lazeepos.com / Kasir123! (cashier)');

  /* Demo products */
  const productsSeed = [
    { name: 'Espresso', sku: 'BEV-001', category: 'Minuman', price: 35000, costPrice: 8000, stock: 100 },
    { name: 'Cappuccino', sku: 'BEV-002', category: 'Minuman', price: 45000, costPrice: 12000, stock: 80 },
    { name: 'Latte', sku: 'BEV-003', category: 'Minuman', price: 48000, costPrice: 13000, stock: 75 },
    { name: 'Matcha Latte', sku: 'BEV-004', category: 'Minuman', price: 52000, costPrice: 15000, stock: 60 },
    { name: 'Americano', sku: 'BEV-005', category: 'Minuman', price: 35000, costPrice: 8000, stock: 90 },
    { name: 'Croissant', sku: 'FOOD-001', category: 'Makanan', price: 30000, costPrice: 9000, stock: 40 },
    { name: 'Blueberry Muffin', sku: 'FOOD-002', category: 'Makanan', price: 27500, costPrice: 8500, stock: 8 },
    { name: 'Avocado Toast', sku: 'FOOD-003', category: 'Makanan', price: 55000, costPrice: 18000, stock: 25 },
    { name: 'Granola Bowl', sku: 'FOOD-004', category: 'Makanan', price: 45000, costPrice: 14000, stock: 3 },
    { name: 'Air Mineral 600ml', sku: 'BOT-001', category: 'Botolan', price: 8000, costPrice: 3000, stock: 150 },
  ];

  for (const p of productsSeed) {
    await prisma.product.create({
      data: {
        tenantId: demoTenant.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        isActive: true,
        warehouse: {
          create: {
            quantity: p.stock,
            reorderLevel: 10,
            location: 'Gudang Utama',
          },
        },
      },
    });
  }
  console.log(`   ✅ ${productsSeed.length} products seeded`);

  /* Demo discount rules */
  await prisma.discountRule.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        name: 'Grand Opening 10%',
        discountType: 'percentage',
        discountValue: 10,
        appliesTo: 'all',
        isActive: true,
      },
      {
        tenantId: demoTenant.id,
        name: 'Diskon Minuman Rp 5.000',
        discountType: 'fixed_amount',
        discountValue: 5000,
        appliesTo: 'category',
        appliesToCategory: 'Minuman',
        minQuantity: 2,
        isActive: true,
      },
      {
        tenantId: demoTenant.id,
        name: 'Buy 2 Get 1 Muffin',
        discountType: 'bogo',
        discountValue: 27500,
        appliesTo: 'product',
        appliesToId: null, // Will be set if needed
        minQuantity: 2,
        isActive: false,
      },
    ],
  });
  console.log('   ✅ 3 discount rules seeded');

  console.log('\n✅ Seeding complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('🔑 Login Credentials:');
  console.log('   Super Admin  : admin@lazeepos.com / Admin123!');
  console.log('   Demo Admin   : demo@lazeepos.com / Demo123!  (via demo.lazeepos.com)');
  console.log('   Demo Kasir   : kasir@lazeepos.com / Kasir123! (via demo.lazeepos.com)');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
