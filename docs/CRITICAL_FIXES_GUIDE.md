# 🔒 Critical Security Fixes Implementation Guide

This document explains the 5 critical security and reliability fixes that have been implemented in LazeePOS.

---

## ✅ Fix #1: Persistent File Uploads

**Problem:** Images and files uploaded by tenants were lost when the container restarted.

**Solution:** Added volume mounts in both development and production docker-compose files:

```yaml
volumes:
  - ./backend/public/uploads:/app/public/uploads  # Persist uploaded files
```

**Action Required:** None. This is automatic.

---

## ✅ Fix #2: Password Reset Flow

**Problem:** No way for users to recover forgotten passwords. Fallback was "contact admin".

**New Endpoints:**

### 1. `POST /api/v1/auth/forgot-password`
Initiates password reset process.

```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Jika email terdaftar, link reset password telah dikirim..."
}
```

**Behind the scenes:**
- Generates a unique reset token
- Stores it in Redis (expires in 1 hour)
- Sends email with reset link

### 2. `GET /api/v1/auth/verify-reset-token/:token`
Frontend uses this to validate the reset token before showing the form.

```json
{
  "valid": true,
  "email": "user@example.com"
}
```

### 3. `POST /api/v1/auth/reset-password`
Completes the password reset.

```json
{
  "token": "uuid-here",
  "newPassword": "newpassword123"
}
```

**Response:** Returns a new JWT and auto-logs in the user.

### 4. `POST /api/v1/auth/logout` (NEW)
Clears the authentication cookie.

**Action Required:** 

Configure email sending in your `.env`:

```bash
# Email Configuration (nodemailer)
MAIL_SERVICE=gmail                    # or: outlook, yahoo, custom SMTP
MAIL_FROM=noreply@lazeepos.com       # From address
MAIL_USER=your-email@gmail.com       # SMTP username
MAIL_PASSWORD=your-app-password      # SMTP password (NOT your Gmail password)
FRONTEND_URL=https://lazeepos.com    # Where the reset link points to
```

**Gmail Setup** (recommended for development):
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the 16-character password in `MAIL_PASSWORD`

**Other providers:** Configure MAIL_SERVICE and credentials accordingly.

---

## ✅ Fix #3: Database Backups

**Problem:** No automated backups meant losing all tenant data if the database crashed.

**Two backup scripts provided:**

### Option A: Host-Level Backup (Linux/Mac)

```bash
# Make script executable
chmod +x scripts/backup.sh

# Manual backup
./scripts/backup.sh

# Automated daily backup (via cron)
# Edit your crontab:
crontab -e

# Add this line (runs backup daily at 2 AM):
0 2 * * * cd /path/to/POS && ./scripts/backup.sh >> /var/log/lazeepos_backup.log 2>&1
```

Configuration (in `.env` or `.env.production`):
```bash
BACKUP_DIR=.backups              # Where to store backups locally
RETENTION_DAYS=30                # Keep only last 30 days
BACKUP_REMOTE_PATH=s3://my-bucket/backups  # Optional: upload to cloud
```

### Option B: Docker Backup

```bash
# Manual backup inside container
docker-compose exec -T mysql bash -c '/app/backup-docker.sh'

# Automated via host cron (for docker-compose)
0 2 * * * cd /path/to/POS && docker-compose exec -T mysql bash -c '/app/backup-docker.sh' >> /var/log/lazeepos_backup.log 2>&1
```

**Backups include:**
- ✅ All tenant data, products, transactions
- ✅ All user accounts and authentication
- ✅ Subscriptions and billing information
- ✅ Compressed to save storage space

**Cloud Backup (Optional):**

Support for AWS S3 and Google Cloud Storage:

```bash
# AWS S3
BACKUP_REMOTE_PATH="s3://my-bucket/backups"
# Requires: aws CLI installed and configured

# Google Cloud Storage
BACKUP_REMOTE_PATH="gs://my-bucket/backups"
# Requires: gsutil installed and configured
```

**Action Required:** 

1. Test the backup script locally
2. Set up cron job for automated daily backups
3. (Optional) Configure cloud storage for off-site backups

---

## ✅ Fix #4: Database Migrations (Prisma)

**Problem:** Using `prisma db push` directly modifies the database without tracking changes. This is dangerous and can cause data loss.

**Solution:** Migrated to `prisma migrate` which creates version-controlled migration files.

**New NPM Scripts:**

```bash
npm run db:migrate:dev     # Create new migration in development
npm run db:migrate:deploy  # Apply migrations in production (auto-runs on container start)
npm run db:migrate:status  # Check migration status
```

**How it works:**

1. When you make schema changes in `prisma/schema.prisma`:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```

2. This creates a timestamped migration file in `prisma/migrations/`

3. In production, migrations run automatically on container startup:
   ```bash
   npx prisma migrate deploy && node server.js
   ```

4. Each migration is version-controlled (committed to git)

**Action Required:**

If you've been using `db push`, you may need to:
```bash
npx prisma migrate resolve --rolled-back  # If issues occurred
npx prisma migrate deploy                 # Apply all pending migrations
```

---

## ✅ Fix #5: HttpOnly Cookies for JWT Storage

**Problem:** JWT tokens stored in localStorage are vulnerable to XSS attacks. Malicious JavaScript can steal the token and impersonate the user.

**Solution:** Moved JWT to HttpOnly cookies that cannot be accessed by JavaScript.

**What Changed:**

### Backend Changes:
- Added `cookie-parser` middleware
- Auth endpoints now set secure HttpOnly cookies:
  ```
  Set-Cookie: authToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
  ```
- Auth middleware reads from cookies (fallback: Authorization header for APIs)

### Frontend Changes:
- Axios now sends cookies automatically with `withCredentials: true`
- No JavaScript can access the cookie (XSS safe)
- Logout clears the cookie

**Security Features:**

- ✅ **HttpOnly**: JavaScript cannot access the token (XSS protection)
- ✅ **Secure**: Cookie only sent over HTTPS in production
- ✅ **SameSite=Strict**: Prevents CSRF attacks
- ✅ **24-hour expiration**: Auto-logout for abandoned sessions

**Backward Compatibility:**

- Still returns `token` in JSON response for API clients
- Still accepts `Authorization: Bearer <token>` header
- Existing mobile apps/integrations continue working

**Action Required:**

1. Reinstall dependencies:
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```

2. Test login/logout flow:
   - Login → Check DevTools → Cookies should show `authToken`
   - No token in localStorage
   - Logout → Cookie should be cleared

3. In production:
   - Ensure HTTPS is configured
   - Browser will refuse to send cookie over HTTP

---

## Implementation Timeline

| Phase | Priority | Time | What | Who |
|-------|----------|------|------|-----|
| **Phase 1** | 🔴 Immediate | 1 hour | Redeploy with volume fixes + backup script setup | DevOps |
| **Phase 2** | 🔴 Critical | 2-3 hours | Test password reset flow with email config | QA |
| **Phase 3** | 🔴 Critical | 1-2 hours | Verify HttpOnly cookies work, test logout | QA |
| **Phase 4** | 🟠 Important | 30 min | Update documentation, train support team | Docs |
| **Phase 5** | 🟠 Important | 1 week | Monitor backup logs, ensure daily backups succeed | DevOps |

---

## Testing Checklist

```
[ ] Upload an image → Verify persists after container restart
[ ] Forgot password → Email received, reset link works
[ ] Reset password → Auto-logged in after reset
[ ] Login → Token stored in HttpOnly cookie (not localStorage)
[ ] API calls → Authorization header still works (for tools, webhooks)
[ ] Logout → Cookie cleared, cannot access protected routes
[ ] Backup script → Runs successfully, files compressed
[ ] Migration deploy → Runs on container startup without errors
```

---

## Environment Variables Reference

```bash
# Email (for password reset)
MAIL_SERVICE=gmail
MAIL_FROM=noreply@lazeepos.com
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=app-password-from-gmail
FRONTEND_URL=https://lazeepos.com

# Database backups
BACKUP_DIR=.backups
RETENTION_DAYS=30
BACKUP_REMOTE_PATH=s3://bucket/path  # Optional

# JWT (existing, unchanged)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Database (existing)
DATABASE_URL=mysql://user:pass@host/db
REDIS_URL=redis://redis:6379
```

---

## Troubleshooting

### Password reset email not received
- [ ] Check MAIL_USER and MAIL_PASSWORD in .env
- [ ] Gmail: Verify app password (not regular password)
- [ ] Check spam folder
- [ ] Look at Docker logs: `docker logs pos-backend-1 | grep -i mail`

### Backup script fails
- [ ] Ensure MySQL is running: `docker-compose exec mysql mysqldump --version`
- [ ] Check backup directory exists: `mkdir -p .backups`
- [ ] Verify permissions: `chmod +x scripts/backup.sh`

### HttpOnly cookie not working
- [ ] Check browser DevTools → Application → Cookies
- [ ] Verify `authToken` cookie exists
- [ ] Ensure CORS is configured with `credentials: true` (already done)
- [ ] Test in incognito window (no cache issues)

### Prisma migration errors
- [ ] Check database connection: `npx prisma db execute --stdin`
- [ ] Verify schema.prisma is valid
- [ ] If stuck: `npx prisma migrate reset` (⚠️ deletes all data for dev only!)

---

## Next: Important Fixes (in order of priority)

After these critical fixes are deployed and tested, prioritize:

1. ✅ **Email verification on registration** — Validate email before allowing login
2. ✅ **Dunning/Payment failure handling** — Auto-suspend after payment fails
3. ✅ **Monitoring & alerting** — Know when server goes down
4. ✅ **Trial expiry validation** — Auto-suspend expired trials
5. ✅ **Rate limiting on auth** — Prevent brute force attacks

See `docs/7_EVALUATION_AND_IMPROVEMENTS.md` for complete list.
