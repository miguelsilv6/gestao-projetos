import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, handleApiError, apiError } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/rbac'
import { notifyAtividadeAdicionada } from '@/lib/notifications'
import { z } from 'zod'
import type { Role } from '@/generated/prisma/enums'

const schema = z.object({
  inqueritoid: z.string().min(1),
  descricao: z.string().min(1, 'Descrição obrigatória').max(2000),
  dataRealizacao: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const role = session.user.role as Role

    if (!hasPermission(role, 'atividade:create:own')) {
      return apiError('Sem permissão para adicionar atividades', 403)
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

    const { inqueritoid, descricao, dataRealizacao } = parsed.data

    // Find inquiry and check access
    const inquerito = await prisma.inquerito.findUnique({
      where: { id: inqueritoid },
      include: { inspetor: { select: { id: true, email: true, nome: true } } },
    })
    if (!inquerito) return apiError('Inquérito não encontrado', 404)

    const canAdd =
      role === 'ESTATISTICA' ? false :
      role === 'INSPETOR' ? inquerito.inspetorId === session.user.id :
      role === 'INSPETOR_CHEFE' ? inquerito.brigadaId === session.user.brigadaId :
      true

    if (!canAdd) return apiError('Sem permissão para adicionar atividade neste inquérito', 403)

    const atividade = await prisma.atividade.create({
      data: {
        descricao,
        dataRealizacao: dataRealizacao ? new Date(dataRealizacao) : new Date(),
        inqueritoid,
        utilizadorId: session.user.id,
      },
      include: {
        realizadaPor: { select: { id: true, nome: true } },
      },
    })

    // Fire notification async (non-blocking)
    notifyAtividadeAdicionada({
      inqueritoid,
      nuipc: inquerito.nuipc,
      inspetorId: inquerito.inspetorId,
      inspetorEmail: inquerito.inspetor?.email ?? null,
      inspetorNome: inquerito.inspetor?.nome ?? null,
      addedByUserId: session.user.id,
    }).catch(() => {})

    return Response.json(atividade, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
