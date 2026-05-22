// backend/middleware/tenant.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function tenantIdentificator(req, res, next) {
  const host = req.headers.host;

  if (!host) {
    return res.status(400).json({ message: 'Host header tidak ditemukan.' });
  }

  const parts = host.split('.');
  let subdomain = null;

  // Production: subdomain.lazeepos.com (3+ parts)
  // Dev: subdomain.localhost:5000 (2 parts, second contains 'localhost')
  if (parts.length >= 3) {
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1].includes('localhost')) {
    subdomain = parts[0];
  }

  // No subdomain or root domain → central area (landing / superadmin)
  if (!subdomain || subdomain === 'www' || subdomain === 'localhost') {
    req.isCentral = true;
    req.tenant = null;
    return next();
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
      select: {
        id: true,
        name: true,
        subdomain: true,
        themeMode: true,
        primaryColor: true,
        logoUrl: true,
        status: true,
        planId: true,
        trialEndsAt: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        message: `Toko dengan subdomain '${subdomain}' tidak ditemukan.`,
      });
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({
        message: 'Toko ini sedang ditangguhkan. Hubungi tim support untuk informasi lebih lanjut.',
      });
    }

    // Warn if trial has expired (but still allow access, let billing handle hard block)
    if (tenant.status === 'trial' && tenant.trialEndsAt && new Date() > new Date(tenant.trialEndsAt)) {
      req.trialExpired = true;
    }

    req.isCentral = false;
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant identification error:', error);
    res.status(500).json({ message: 'Gagal mengidentifikasi toko.' });
  }
}
