// backend/middleware/idempotency.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function idempotency(req, res, next) {
  // Only apply idempotency to POST, PUT, PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  // If no key is provided, we skip idempotency (or we could enforce it by returning 400)
  if (!idempotencyKey) {
    return next();
  }

  try {
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { id: idempotencyKey }
    });

    if (existingKey) {
      console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
      return res.status(existingKey.statusCode).json(existingKey.responseBody);
    }

    // Intercept res.json to save the response body
    const originalJson = res.json;
    res.json = function (data) {
      // Restore original json function to avoid loops
      res.json = originalJson;
      
      // Save to database async (do not block response)
      prisma.idempotencyKey.create({
        data: {
          id: idempotencyKey,
          responseBody: data,
          statusCode: res.statusCode,
        }
      }).catch(err => {
        console.error(`[Idempotency] Failed to save key ${idempotencyKey}:`, err);
      });

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('[Idempotency] Middleware error:', error);
    next();
  }
}
