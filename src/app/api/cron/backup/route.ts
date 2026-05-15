import { NextRequest } from 'next/server'
import { execSync } from 'child_process'
import { timingSafeEqual, createHash } from 'crypto'

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided = req.headers.get('x-cron-secret') ?? ''
  try {
    // Use fixed-length hashes to avoid length-leaking side channels
    const a = createHash('sha256').update(secret).digest()
    const b = createHash('sha256').update(provided).digest()
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const backupDir = process.env.BACKUP_DIR ?? '/backups'
    // Pass env vars explicitly — never interpolate them into the shell command string
    execSync('bash scripts/backup.sh', {
      stdio: 'inherit',
      env: {
        ...process.env,
        BACKUP_DIR: backupDir,
        DATABASE_URL: process.env.DATABASE_URL ?? '',
      },
    })
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[cron/backup]', error)
    return Response.json({ error: 'Backup failed' }, { status: 500 })
  }
}
