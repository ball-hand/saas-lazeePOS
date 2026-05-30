// backend/middleware/tenant.js
import { PrismaClient } from '@prisma/client';
import redis from '../utils/redis.js';

const prisma = new PrismaClient();

export async function tenantIdentificator(req, res, next) {
  const host = req.headers.host;

  if (!host) {
    return res.status(400).json({ message: 'Host header tidak ditemukan.' });
  }

  const parts = host.split('.');
  let subdomain = null;

   // Production: subdomain.lazeepos.com (3+ parts)
   // Dev:    demo.localhost              (2 parts, second is bare TLD)
   // Dev:    localhost:5000              (2 parts, second is pure digits → port, treat as no-subdomain)
   if (parts.length >= 3) {
     subdomain = parts[0];
   } else if (parts.length === 2) {
     const second = parts[1];
     // If second part is purely a port number (e.g. "5000"), treat as no-subdomain
     if (!/^\d+$/.test(second)) {
       subdomain = parts[0];   // e.g. "demo" from "demo.localhost"
     }
   }

   // Only mark as central if no tenant subdomain was found AND it's the bare host
   if (!subdomain || ['www', 'localhost'].includes(subdomain)) {
     req.isCentral = true;
     req.tenant = null;
     return next();
   }

  try {
    const redisKey = `tenant:${subdomain.toLowerCase()}`;
    
    // 1. Cek di Redis terlebih dahulu
    const cachedTenant = await redis.safeGet(redisKey);
    let tenant = null;

    if (cachedTenant) {
      tenant = JSON.parse(cachedTenant);
      console.log(`[Cache Hit] Redis: Memuat tenant ${subdomain}`);
    } else {
      // 2. Jika tidak ada di cache, query ke database
      tenant = await prisma.tenant.findUnique({
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

      if (tenant) {
        // Simpan ke Redis (Expire 1 jam)
        await redis.safeSetex(redisKey, 3600, JSON.stringify(tenant));
        console.log(`[Cache Miss] DB: Menyimpan tenant ${subdomain} ke Redis`);
      }
    }

    if (!tenant) {
      return res.status(404).json({
        message: `Toko dengan subdomain '${subdomain}' tidak ditemukan.`,
      });
    }

    if (tenant.status === 'SUSPENDED' || tenant.status === 'suspended') {
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
