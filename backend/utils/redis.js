import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Koneksi ke Redis. Secara default, ioredis terhubung ke localhost:6379
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✅ Terhubung ke Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

export default redis;
