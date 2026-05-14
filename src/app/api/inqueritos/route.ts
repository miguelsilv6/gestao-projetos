import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, buildInqueritoWhere, handleApiError, apiError } from '@/lib/auth-helpers'
import { inqueritoSchema } from '@/lib/validations/inquerito'
import type { Role } from '@/generated/prisma/enums'

export async function GET(req: NextRequest) {
  try {
    const session = await checkPermission('inquerito:read:own')
    const role = session.user.role as Role
    const { searchParams } = req.nextUrl

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const skip = (page - 1) * limit

    const search = searchParams.get('search') ?? ''
    const estado = searchParams.get('estado') ?? ''
    const faseProcessual = searchParams.get('faseProcessual') ?? ''
    const brigadaId = searchParams.get('brigadaId') ?? ''
    const inspetorId = searchParams.get('inspetorId') ?? ''

    const roleWhere = buildInqueritoWhere(role, session.user.id, session.user.brigadaId)

    const where = {
      ...roleWhere,
      ...(search && {
        OR: [
          { nuipc: { contains: search, mode: 'insensitive' as const } },
          { natureza: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(estado && { estado: estado as never }),
      ...(faseProcessual && { faseProcessual: faseProcessual as never }),
      ...(brigadaId && { brigadaId }),
      ...(inspetorId && { inspetorId }),
    }

    const [inqueritos, total] = await Promise.all([
      prisma.inquerito.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          brigada: { select: { id: true, nome: true } },
          inspetor: { select: { id: true, nome: true } },
          _count: { select: { atividades: true } },
        },
      }),
      prisma.inquerito.count({ where }),
    ])

    return Response.json({
      data: inqueritos,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await checkPermission('inquerito:create')
    const body = await req.json()
    const parsed = inqueritoSchema.safeParse(body)

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400)
    }

    const data = parsed.data

    const existing = await prisma.inquerito.findUnique({ where: { nuipc: data.nuipc } })
    if (existing) return apiError('NUIPC já existe', 409)

    const inquerito = await prisma.inquerito.create({
      data: {
        nuipc: data.nuipc,
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
        acao: 'CREATE_INQUERITO',
        entidade: 'Inquerito',
        entidadeId: inquerito.id,
        utilizadorId: session.user.id,
        detalhes: { nuipc: inquerito.nuipc },
      },
    })

    return Response.json(inquerito, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
