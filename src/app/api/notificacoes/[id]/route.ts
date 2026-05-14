import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, handleApiError, apiError } from '@/lib/auth-helpers'

// PATCH /api/notificacoes/:id — mark as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    const { id } = await params

    const notif = await prisma.notificacao.findUnique({ where: { id } })
    if (!notif) return apiError('Não encontrada', 404)
    if (notif.utilizadorId !== session.user.id) return apiError('Sem permissão', 403)

    await prisma.notificacao.update({ where: { id }, data: { lida: true } })
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
