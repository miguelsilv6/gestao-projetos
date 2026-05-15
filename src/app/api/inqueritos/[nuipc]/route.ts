import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, buildInqueritoWhere, handleApiError, apiError } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/rbac'
import { inqueritoSchema } from '@/lib/validations/inquerito'
import { notifyInqueritoAtribuido } from '@/lib/notifications'
import { slugToNuipc } from '@/lib/utils'
import type { Role } from '@/generated/prisma/enums'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ nuipc: string }> },
) {
  try {
    const session = await getSession()
    const { nuipc: slug } = await params
    const nuipc = slugToNuipc(slug)
    const role = session.user.role as Role
    const roleWhere = buildInqueritoWhere(role, session.user.id, session.user.brigadaId)

    const inquerito = await prisma.inquerito.findFirst({
      where: { nuipc, ...roleWhere },
      include: {
        brigada: { select: { id: true, nome: true } },
        inspetor: { select: { id: true, nome: true, email: true } },
        atividades: {
          orderBy: { dataRealizacao: 'desc' },
          include: { realizadaPor: { select: { id: true, nome: true } } },
        },
      },
    })

    if (!inquerito) return apiError('Inquérito não encontrado', 404)
    return Response.json(inquerito)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ nuipc: string }> },
) {
  try {
    const session = await getSession()
    const { nuipc: slug } = await params
    const nuipc = slugToNuipc(slug)
    const role = session.user.role as Role

    const existing = await prisma.inquerito.findUnique({ where: { nuipc } })
    if (!existing) return apiError('Inquérito não encontrado', 404)

    const canEdit =
      (role === 'INSPETOR' && existing.inspetorId === session.user.id && hasPermission(role, 'inquerito:edit:own')) ||
      (role === 'INSPETOR_CHEFE' && existing.brigadaId === session.user.brigadaId && hasPermission(role, 'inquerito:edit:brigade')) ||
      hasPermission(role, 'inquerito:edit:all')

    if (!canEdit) return apiError('Sem permissão para editar este inquérito', 403)

    const body = await req.json()
    const parsed = inqueritoSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

    const data = parsed.data

    if (data.nuipc !== nuipc) {
      const dup = await prisma.inquerito.findUnique({ where: { nuipc: data.nuipc } })
      if (dup) return apiError('NUIPC já existe', 409)
    }

    const updated = await prisma.inquerito.update({
      where: { nuipc },
      data: {
        nuipc: data.nuipc,
        nai: data.nai || null,
        natureza: data.natureza,
        estado: data.estado,
        faseProcessual: data.faseProcessual,
        dataAbertura: new Date(data.dataAbertura),
        dataPrazo: data.dataPrazo ? new Date(data.dataPrazo) : null,
        dataConclusao: data.dataConclusao ? new Date(data.dataConclusao) : null,
        notas: data.notas ?? null,
        brigadaId: data.brigadaId,
        inspetorId: data.inspetorId ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        acao: 'UPDATE_INQUERITO',
        entidade: 'Inquerito',
        entidadeId: updated.id,
        utilizadorId: session.user.id,
        detalhes: { before: { estado: existing.estado }, after: { estado: updated.estado } } as never,
      },
    })

    const inspetorChanged = data.inspetorId && data.inspetorId !== existing.inspetorId
    if (inspetorChanged) {
      const inspetor = await prisma.utilizador.findUnique({
        where: { id: data.inspetorId! },
        select: { id: true, email: true, nome: true },
      })
      if (inspetor) {
        notifyInqueritoAtribuido({
          inqueritoid: updated.id,
          nuipc: updated.nuipc,
          inspetorId: inspetor.id,
          inspetorEmail: inspetor.email,
          inspetorNome: inspetor.nome,
        }).catch(() => {})
      }
    }

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
