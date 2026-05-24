// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'LAZEE_POS_SUPER_SECRET_KEY';

/* ─────────────────────────────────────────────────────────
   verifyToken
   Verifies JWT and attaches `req.user`.
   Central owner tokens have no tenantId; tenant tokens always carry one.
───────────────────────────────────────────────────────── */
export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    return res.status(403).json({ message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

/* Back-compat alias used throughout the route files */
export const authenticate = verifyToken;

/* ─────────────────────────────────────────────────────────
   requireRole
   Restricts route execution to specific roles.
   Pass a single role string or an array of role strings.
───────────────────────────────────────────────────────── */
export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        message: `Akses ditolak. Hak akses khusus untuk peran: ${allowed.join(', ')}`,
      });
    }
    next();
  };
}

/* ─────────────────────────────────────────────────────────
   requireTenant
   Ensures the request is a tenant request (subdomain hit),
   not a central owner area.
   Also enforces that a tenant-user cannot access another tenant's data.
───────────────────────────────────────────────────────── */
export function requireTenant(req, res, next) {
  if (req.isCentral) {
    return res.status(400).json({
      message: 'Endpoint ini hanya tersedia via subdomain toko Anda.',
    });
  }

  if (req.user?.role === 'central') {
    return res.status(403).json({
      message: 'Central owner tidak dapat mengakses endpoint tenant.',
    });
  }

  if (req.user?.tenantId != null && req.user?.tenantId !== req.tenant?.id) {
    return res.status(403).json({
      message: 'Akses ilegal. Akun Anda tidak terdaftar di toko ini.',
    });
  }

  next();
}
