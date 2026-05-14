import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, handleApiError, apiError } from '@/lib/auth-helpers'
import { notifyInqueritoTransferido } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const session = await checkPermission('inquerito:transfer')
    const { nuipc, brigadaId } = await req.json()

    if (!nuipc || !brigadaId) return apiError('nuipc e brigadaId obrigatórios', 400)

    const inquerito = await prisma.inquerito.findUnique({ where: { nuipc } })
    if (!inquerito) return apiError('Inquérito não encontrado', 404)

    const brigada = await prisma.brigada.findUnique({ where: { id: brigadaId } })
    if (!brigada) return apiError('Brigada não encontrada', 404)

    const updated = await prisma.inquerito.update({
      where: { nuipc },
      data: { brigadaId, inspetorId: null },
    })

    await prisma.auditLog.create({
      data: {
        acao: 'TRANSFER_INQUERITO',
        entidade: 'Inquerito',
        entidadeId: updated.id,
        utilizadorId: session.user.id,
        detalhes: {
          from: inquerito.brigadaId,
          to: brigadaId,
          nomeBrigada: brigada.nome,
        },
      },
    })

    // Notify brigade chiefs
    const [chefeOrigem, chefeDestino] = await Promise.all([
      prisma.utilizador.findFirst({
        where: { brigadaId: inquerito.brigadaId, role: 'INSPETOR_CHEFE', ativo: true },
        select: { id: true, email: true },
      }),
      prisma.utilizador.findFirst({
        where: { brigadaId, role: 'INSPETOR_CHEFE', ativo: true },
        select: { id: true, email: true },
      }),
    ])

    notifyInqueritoTransferido({
      inqueritoid: updated.id,
      nuipc: updated.nuipc,
      brigadaOrigemChefeId: chefeOrigem?.id ?? null,
      brigadaOrigemChefeEmail: chefeOrigem?.email ?? null,
      brigadaDestinoChefeId: chefeDestino?.id ?? null,
      brigadaDestinoChefeEmail: chefeDestino?.email ?? null,
    }).catch(() => {})

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
