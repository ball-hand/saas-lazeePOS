import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// State to track if Redis is available, allowing graceful degradation
let isRedisConnected = false;

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      // If retried more than 5 times, stop retrying for a while to avoid blocking
      return null;
    }
    return Math.min(times * 100, 2000);
  }
});

redis.on('connect', () => {
  isRedisConnected = true;
  logger.info('✅ Terhubung ke Redis');
});

redis.on('error', (err) => {
  if (isRedisConnected) {
    logger.error('❌ Redis Connection Error (running in degraded mode): %O', err);
  }
  isRedisConnected = false;
});

redis.on('end', () => {
  isRedisConnected = false;
});

/**
 * Safe wrapper for redis.get.
 * Returns null if Redis is down, preventing app crashes.
 */
redis.safeGet = async (key) => {
  if (!isRedisConnected) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    logger.warn(`Redis safeGet failed for key ${key}: ${err.message}`);
    return null;
  }
};

/**
 * Safe wrapper for redis.set.
 * Silently fails if Redis is down, preventing app crashes.
 */
redis.safeSet = async (key, value, mode, duration) => {
  if (!isRedisConnected) return false;
  try {
    if (mode && duration) {
      await redis.set(key, value, mode, duration);
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (err) {
    logger.warn(`Redis safeSet failed for key ${key}: ${err.message}`);
    return false;
  }
};

/**
 * Safe wrapper for redis.setex.
 */
redis.safeSetex = async (key, seconds, value) => {
  if (!isRedisConnected) return false;
  try {
    await redis.setex(key, seconds, value);
    return true;
  } catch (err) {
    logger.warn(`Redis safeSetex failed for key ${key}: ${err.message}`);
    return false;
  }
};

/**
 * Safe wrapper for redis.del.
 */
redis.safeDel = async (key) => {
  if (!isRedisConnected) return false;
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    logger.warn(`Redis safeDel failed for key ${key}: ${err.message}`);
    return false;
  }
};

export default redis;
