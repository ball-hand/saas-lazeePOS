// backend/routes/central/system.js
// Superadmin-only: system log viewer + manual DB backup trigger
import express from 'express';
import { fileURLToPath } from 'url';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const protect = [verifyToken, requireRole('central')];

/* ─── helpers ─────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const LOG_DIR = process.env.LOG_DIR || '/var/log/lazeepos';
const FALLBACK_LOG = path.join(__dirname, '..', '..', 'logs', 'app.log');

function tailLines(text, n = 150) {
  return text.split('\n').slice(-n);
}

/* ═══════════════════════════════════════════════════════
   GET /api/central/system/logs
   Returns the last N lines of the application log file.
   Query params:
     level  = error | warn | info | all   (default: error)
     limit  = number of lines to return     (default: 150)
     file   = application | nginx | mysql   (default: application)
═══════════════════════════════════════════════════ */
router.get('/system/logs', ...protect, async (_req, res) => {
  try {
    const LEVEL_MAP = {
      error: ['ERROR', 'FATAL', 'CRITICAL', 'error', 'Error', 'ERRO'],
      warn:  ['WARN', 'WARNING', 'warn', 'Warning'],
      info:  ['INFO', 'INF', 'info'],
      all:   null, // no filter
    };

    // Map file selector to log path
    const fileMap = {
      application: FALLBACK_LOG,
      nginx:       '/var/log/nginx/error.log',
      mysql:       '/var/log/mysql/error.log',
    };

    const level = (_req.query.level || 'error');
    const limit = parseInt(_req.query.limit || '150', 10);
    const fileKey = _req.query.file || 'application';

    const logPath = fileMap[fileKey] ?? FALLBACK_LOG;

    if (!fs.existsSync(logPath)) {
      if (fileKey === 'application') {
        try {
          const logDir = path.dirname(logPath);
          if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
          }
          fs.writeFileSync(logPath, `[${new Date().toISOString()}] INFO: Application log initialized.\n`, 'utf-8');
        } catch (err) {
          console.error('Failed to create fallback log file:', err);
        }
      } else {
        return res.status(404).json({
          file: fileKey,
          path: logPath,
          message: `Log file not found: ${logPath}`,
          lines: [],
          lineCount: 0,
        });
      }
    }

    const raw = fs.readFileSync(logPath, 'utf-8');
    const allLines = raw.split('\n');
    const trailingLines = allLines.slice(-limit);

    // Optional level filter
    let filteredLines = trailingLines;
    if (LEVEL_MAP[level]) {
      filteredLines = trailingLines.filter(line =>
        LEVEL_MAP[level].some(marker => line.includes(marker))
      );
    }

    res.json({
      file: fileKey,
      path: logPath,
      level,
      lineCount: filteredLines.length,
      lines: filteredLines.map((line) => line.trim()),
    });
  } catch (err) {
    console.error('System logs error:', err);
    res.status(500).json({ message: 'Gagal memuat log sistem.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET /api/central/system/info
   Lightweight process / OS info for infrastructure monitoring:
   uptime, Node version, platform, memory usage, disk space
═══════════════════════════════════════════════════ */
router.get('/system/info', ...protect, async (_req, res) => {
  try {
    const osInfo = execSync('uname -a', { encoding: 'utf-8' }).trim();
    const uptimeInfo = execSync('uptime', { encoding: 'utf-8' }).trim();
    const dfResult   = execSync('df -h /', { encoding: 'utf-8' });
    const dfLines = dfResult.trim().split('\n');
    const diskParts = dfLines[1]?.trim().split(/\s+/) ?? [];
    const memInfo = execSync('free -h', { encoding: 'utf-8' });
    const memLines = memInfo.trim().split('\n');

    res.json({
      uptime: uptimeInfo,
      os: osInfo,
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      memory: {
        rss:   `${Math.round(process.memoryUsage().rss    / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        heapUsed:  `${Math.round(process.memoryUsage().heapUsed  / 1024 / 1024)} MB`,
        systemMem: memLines[1]?.trim() || 'N/A',
      },
      disk: {
        filesystem: diskParts[0] ?? 'N/A',
        size:       diskParts[1] ?? 'N/A',
        used:       diskParts[2] ?? 'N/A',
        available:  diskParts[3] ?? 'N/A',
        usePercent: diskParts[4] ?? 'N/A',
        mount:      diskParts[5] ?? 'N/A',
      },
    });
  } catch (err) {
    console.error('System info error:', err);
    // Return a safe partial response even if some commands fail
    res.json({
      uptime: 'N/A',
      os: 'N/A',
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        systemMem: 'N/A',
      },
      disk: { filesystem: 'N/A', size: 'N/A', used: 'N/A', available: 'N/A', usePercent: 'N/A', mount: 'N/A' },
      rawError: err.message,
    });
  }
});

/* ═══════════════════════════════════════════════════════
   POST /api/central/backup
   Trigger a manual MySQL database backup using mysqldump.
   Returns the backup file path.
   ENV var required:  MYSQL_BACKUP_PATH  (absolute directory to store dumps)
═══════════════════════════════════════════════════ */
router.post('/backup', ...protect, async (req, res) => {
  try {
    const dbUrl      = process.env.DATABASE_URL || '';
    const backupDir  = process.env.MYSQL_BACKUP_PATH || '/var/backups/lazeepos';
    const now        = new Date();
    const timestamp  = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName   = `lazeepos_${timestamp}.sql.gz`;
    const filePath   = path.join(backupDir, fileName);

    // Parse DATABASE_URL  mysql://user:pass@host:port/dbname
    const match = dbUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/);
    if (!match) return res.status(500).json({ message: 'DATABASE_URL tidak valid untuk backup otomatis.' });
    const [, dbUser, dbPass, dbHost, dbPort, dbName] = match;

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // Build mysqldump command
    const cmd = `mysqldump --user="${dbUser}" --password="${dbPass}" --host="${dbHost}" --port="${dbPort}" ${dbName} 2> /tmp/mysqldump_err | gzip > "${filePath}"`;

    execSync(cmd, { encoding: 'utf-8' });

    // Verify file was created
    const stat = fs.statSync(filePath);
    if (!stat.size) throw new Error('Backup file created but size is 0.');

    res.json({
      success: true,
      message: 'Backup database berhasil dibuat.',
      details: {
        file: fileName,
        path: filePath,
        sizeKb: Math.round(stat.size / 1024),
        sizeMb: Math.round(stat.size / 1024 / 1024 * 100) / 100,
        createdAt: now.toISOString(),
      },
    });
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({
      message: 'Gagal membuat backup database.',
      hint: 'Pastikan mysqldump terinstal dan MYSQL_BACKUP_PATH ditentukan di .env.',
      raw: err.message,
    });
  }
});

export default router;
