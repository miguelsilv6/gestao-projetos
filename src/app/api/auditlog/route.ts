import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, handleApiError, apiError } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/rbac'
import type { Role } from '@/generated/prisma/enums'

const PAGE_SIZE = 30

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const role = session.user.role as Role
    if (!hasPermission(role, 'sistema:config')) return apiError('Sem permissão', 403)

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor') ?? undefined
    const entidade = searchParams.get('entidade') ?? undefined
    const utilizadorId = searchParams.get('utilizadorId') ?? undefined

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entidade && { entidade }),
        ...(utilizadorId && { utilizadorId }),
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const hasMore = logs.length > PAGE_SIZE
    const items = hasMore ? logs.slice(0, PAGE_SIZE) : logs
    const nextCursor = hasMore ? items[items.length - 1].id : null

    // Enrich with user names
    const utilizadorIds = [...new Set(items.map((l) => l.utilizadorId))]
    const utilizadores = await prisma.utilizador.findMany({
      where: { id: { in: utilizadorIds } },
      select: { id: true, nome: true },
    })
    const userMap = Object.fromEntries(utilizadores.map((u) => [u.id, u.nome]))

    const enriched = items.map((l) => ({ ...l, utilizadorNome: userMap[l.utilizadorId] ?? l.utilizadorId }))

    return Response.json({ items: enriched, nextCursor })
  } catch (error) {
    return handleApiError(error)
  }
}
