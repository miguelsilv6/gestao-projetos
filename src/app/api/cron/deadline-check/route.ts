import { NextRequest } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided = req.headers.get('x-cron-secret') ?? ''
  try {
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
    const config = await prisma.configuracaoSistema.findUnique({ where: { id: 'singleton' } })
    const alertDays = config?.prazoAlertaDias ?? 7

    const threshold = new Date()
    threshold.setDate(threshold.getDate() + alertDays)

    const [approaching, overdue] = await Promise.all([
      prisma.inquerito.findMany({
        where: {
          dataPrazo: { gte: new Date(), lte: threshold },
          estado: { notIn: ['CONCLUIDO', 'ARQUIVADO'] },
          inspetorId: { not: null },
        },
        include: { inspetor: { select: { id: true, email: true } } },
      }),
      prisma.inquerito.findMany({
        where: {
          dataPrazo: { lt: new Date() },
          estado: { notIn: ['CONCLUIDO', 'ARQUIVADO'] },
          inspetorId: { not: null },
        },
        include: { inspetor: { select: { id: true, email: true } } },
      }),
    ])

    const jobs: Promise<unknown>[] = []

    for (const inq of approaching) {
      if (!inq.inspetorId || !inq.inspetor) continue
      jobs.push(
        createNotification({
          utilizadorId: inq.inspetorId,
          tipo: 'PRAZO_APROXIMANDO',
          titulo: `Prazo a aproximar — ${inq.nuipc}`,
          mensagem: `O prazo do inquérito ${inq.nuipc} vence em breve.`,
          inqueritoid: inq.id,
          sendEmail: true,
          emailAddress: inq.inspetor.email,
        }),
      )
    }

    for (const inq of overdue) {
      if (!inq.inspetorId || !inq.inspetor) continue
      jobs.push(
        createNotification({
          utilizadorId: inq.inspetorId,
          tipo: 'PRAZO_ULTRAPASSADO',
          titulo: `Prazo ultrapassado — ${inq.nuipc}`,
          mensagem: `O prazo do inquérito ${inq.nuipc} foi ultrapassado.`,
          inqueritoid: inq.id,
          sendEmail: true,
          emailAddress: inq.inspetor.email,
        }),
      )
    }

    await Promise.allSettled(jobs)

    return Response.json({
      approaching: approaching.length,
      overdue: overdue.length,
      notified: jobs.length,
    })
  } catch (error) {
    console.error('[cron/deadline-check]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
