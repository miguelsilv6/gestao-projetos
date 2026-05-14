import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, handleApiError, apiError } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const countOnly = searchParams.get('count') === 'true'

    if (countOnly) {
      const count = await prisma.notificacao.count({
        where: { utilizadorId: session.user.id, lida: false },
      })
      return Response.json({ count })
    }

    const notificacoes = await prisma.notificacao.findMany({
      where: {
        utilizadorId: session.user.id,
        ...(unreadOnly && { lida: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { inquerito: { select: { nuipc: true } } },
    })

    return Response.json(notificacoes)
  } catch (error) {
    return handleApiError(error)
  }
}
