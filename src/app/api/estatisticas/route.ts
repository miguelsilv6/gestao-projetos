import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, handleApiError, apiError } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/rbac'
import type { Role } from '@/generated/prisma/enums'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const role = session.user.role as Role

    if (!hasPermission(role, 'estatistica:read')) {
      return apiError('Sem permissão para ver estatísticas', 403)
    }

    const { searchParams } = new URL(req.url)
    const brigadaId = searchParams.get('brigadaId') ?? undefined
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    const where = {
      ...(brigadaId && { brigadaId }),
      ...(dataInicio || dataFim
        ? {
            dataAbertura: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) }),
            },
          }
        : {}),
    }

    const [
      porEstado,
      porFase,
      porBrigada,
      porNatureza,
      total,
      vencidos,
      semInspetor,
    ] = await Promise.all([
      prisma.inquerito.groupBy({ by: ['estado'], where, _count: true }),
      prisma.inquerito.groupBy({ by: ['faseProcessual'], where, _count: true }),
      prisma.inquerito.groupBy({
        by: ['brigadaId'],
        where,
        _count: true,
        orderBy: { _count: { brigadaId: 'desc' } },
      }),
      prisma.inquerito.groupBy({
        by: ['natureza'],
        where,
        _count: true,
        orderBy: { _count: { natureza: 'desc' } },
        take: 10,
      }),
      prisma.inquerito.count({ where }),
      prisma.inquerito.count({
        where: {
          ...where,
          dataPrazo: { lt: new Date() },
          estado: { notIn: ['CONCLUIDO', 'ARQUIVADO'] },
        },
      }),
      prisma.inquerito.count({
        where: { ...where, inspetorId: null, estado: { notIn: ['CONCLUIDO', 'ARQUIVADO'] } },
      }),
    ])

    // Enrich brigadaId groupBy with names
    const brigadas = await prisma.brigada.findMany({
      where: { id: { in: porBrigada.map((b) => b.brigadaId) } },
      select: { id: true, nome: true },
    })
    const brigadaNomes = Object.fromEntries(brigadas.map((b) => [b.id, b.nome]))

    return Response.json({
      total,
      vencidos,
      semInspetor,
      porEstado: porEstado.map((r) => ({ estado: r.estado, count: r._count })),
      porFase: porFase.map((r) => ({ fase: r.faseProcessual, count: r._count })),
      porBrigada: porBrigada.map((r) => ({
        brigadaId: r.brigadaId,
        nome: brigadaNomes[r.brigadaId] ?? r.brigadaId,
        count: r._count,
      })),
      porNatureza: porNatureza.map((r) => ({ natureza: r.natureza, count: r._count })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
