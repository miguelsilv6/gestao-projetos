import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, handleApiError, apiError } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/rbac'
import { bulkActionSchema } from '@/lib/validations/inquerito'
import type { Role } from '@/generated/prisma/enums'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const role = session.user.role as Role
    const body = await req.json()

    const parsed = bulkActionSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

    const { ids, action, inspetorId, estado, faseProcessual, brigadaId } = parsed.data

    // Validate permissions per action
    if (action === 'transfer' && !hasPermission(role, 'inquerito:transfer')) {
      return apiError('Sem permissão para transferir inquéritos', 403)
    }
    if ((action === 'assign' || action === 'changeState' || action === 'changeFase') && !hasPermission(role, 'inquerito:bulk:brigade')) {
      return apiError('Sem permissão para operações em massa', 403)
    }

    // Scope check: INSPETOR_CHEFE can only bulk within own brigade
    let scopeWhere = {}
    if (role === 'INSPETOR_CHEFE') {
      scopeWhere = { brigadaId: session.user.brigadaId }
    }

    const targets = await prisma.inquerito.findMany({
      where: { id: { in: ids }, ...scopeWhere },
      select: { id: true },
    })

    if (targets.length === 0) return apiError('Nenhum inquérito válido encontrado', 404)
    const validIds = targets.map((t) => t.id)

    let updateData: Record<string, unknown> = {}
    if (action === 'assign' && inspetorId) updateData = { inspetorId }
    if (action === 'changeState' && estado) updateData = { estado }
    if (action === 'changeFase' && faseProcessual) updateData = { faseProcessual }
    if (action === 'transfer' && brigadaId) updateData = { brigadaId, inspetorId: null }

    await prisma.inquerito.updateMany({
      where: { id: { in: validIds } },
      data: updateData,
    })

    await prisma.auditLog.createMany({
      data: validIds.map((id) => ({
        acao: `BULK_${action.toUpperCase()}`,
        entidade: 'Inquerito',
        entidadeId: id,
        utilizadorId: session.user.id,
        detalhes: updateData as never,
      })),
    })

    return Response.json({ updated: validIds.length })
  } catch (error) {
    return handleApiError(error)
  }
}
