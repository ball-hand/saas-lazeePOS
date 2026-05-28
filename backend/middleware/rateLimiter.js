import rateLimit from 'express-rate-limit';

// Global Rate Limiter: 500 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: 'Terlalu banyak permintaan dari IP Anda, silakan coba lagi setelah beberapa saat.'
  }
});

// Auth Rate Limiter: 20 requests per 15 minutes (to prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Terlalu banyak percobaan masuk (login/register). Silakan coba lagi dalam 15 menit.'
  }
});
