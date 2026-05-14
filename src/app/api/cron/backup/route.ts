import { NextRequest } from 'next/server'
import { execSync } from 'child_process'

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('x-cron-secret') === secret
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const backupDir = process.env.BACKUP_DIR ?? '/backups'
    execSync(
      `BACKUP_DIR=${backupDir} DATABASE_URL=${process.env.DATABASE_URL} bash scripts/backup.sh`,
      { stdio: 'inherit' },
    )
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[cron/backup]', error)
    return Response.json({ error: 'Backup failed' }, { status: 500 })
  }
}
