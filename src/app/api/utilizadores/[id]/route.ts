import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, handleApiError, apiError } from '@/lib/auth-helpers'
import { hasPermission } from '@/lib/rbac'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import type { Role } from '@/generated/prisma/enums'

const schema = z.object({
  nome: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['INSPETOR', 'INSPETOR_CHEFE', 'COORDENADOR', 'ESTATISTICA', 'ADMINISTRACAO']).optional(),
  brigadaId: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    const role = session.user.role as Role
    if (!hasPermission(role, 'utilizador:manage')) return apiError('Sem permissão', 403)

    const { id } = await params
    const utilizador = await prisma.utilizador.findUnique({
      where: { id },
      select: {
        id: true, nome: true, email: true, role: true, ativo: true,
        brigadaId: true, brigada: { select: { id: true, nome: true } },
        createdAt: true,
      },
    })
    if (!utilizador) return apiError('Utilizador não encontrado', 404)
    return Response.json(utilizador)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    const role = session.user.role as Role
    if (!hasPermission(role, 'utilizador:manage')) return apiError('Sem permissão', 403)

    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

    const utilizador = await prisma.utilizador.findUnique({ where: { id } })
    if (!utilizador) return apiError('Utilizador não encontrado', 404)

    if (parsed.data.email && parsed.data.email !== utilizador.email) {
      const exists = await prisma.utilizador.findUnique({ where: { email: parsed.data.email } })
      if (exists) return apiError('Já existe um utilizador com este email', 409)
    }

    if (parsed.data.brigadaId) {
      const brigada = await prisma.brigada.findUnique({ where: { id: parsed.data.brigadaId } })
      if (!brigada) return apiError('Brigada não encontrada', 404)
    }

    const { password, ...rest } = parsed.data
    const data: Record<string, unknown> = { ...rest }
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 12)
    }

    const updated = await prisma.utilizador.update({
      where: { id },
      data,
      select: {
        id: true, nome: true, email: true, role: true, ativo: true, brigadaId: true,
      },
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    const role = session.user.role as Role
    if (!hasPermission(role, 'utilizador:manage')) return apiError('Sem permissão', 403)

    const { id } = await params

    if (id === session.user.id) {
      return apiError('Não pode desativar a sua própria conta', 400)
    }

    const utilizador = await prisma.utilizador.findUnique({ where: { id } })
    if (!utilizador) return apiError('Utilizador não encontrado', 404)

    // Soft delete — just deactivate
    await prisma.utilizador.update({ where: { id }, data: { ativo: false } })
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
