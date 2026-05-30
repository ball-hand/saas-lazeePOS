// backend/routes/health.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import redis from '../utils/redis.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Health check endpoint
 * Returns status of critical services
 * 
 * Usage:
 *   GET /api/v1/health
 */
router.get('/', async (req, res) => {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {},
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.services.database = { status: 'healthy', latency: 'ok' };
    } catch (error) {
      checks.services.database = { status: 'unhealthy', error: error.message };
    }

    // Check Redis
    try {
      const redisHealth = await redis.ping();
      checks.services.redis = {
        status: redisHealth === 'PONG' ? 'healthy' : 'unhealthy',
        latency: 'ok',
      };
    } catch (error) {
      checks.services.redis = { status: 'unhealthy', error: error.message };
    }

    // Overall status
    const allHealthy = Object.values(checks.services).every(
      (service) => service.status === 'healthy'
    );
    checks.status = allHealthy ? 'healthy' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * Simplified health check (just UP/DOWN)
 * Good for load balancers
 */
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
