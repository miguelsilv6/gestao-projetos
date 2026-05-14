// Cron worker — runs as a separate Docker service
// Started with: npx tsx worker.ts
import { startCronJobs } from '@/lib/cron'

console.log('[worker] Starting GPI cron worker...')
startCronJobs()

// Keep process alive
process.on('SIGTERM', () => {
  console.log('[worker] SIGTERM received, shutting down...')
  process.exit(0)
})
