import { auth } from '@/auth'
import { hasPermission, type Permission } from '@/lib/rbac'
import type { Role } from '@/generated/prisma/enums'
import type { Prisma } from '@/generated/prisma/client'
import { Prisma as PrismaLib } from '@/generated/prisma/client'

export async function getSession() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Não autenticado', { cause: 401 })
  }
  return session
}

export async function checkPermission(permission: Permission) {
  const session = await getSession()
  if (!hasPermission(session.user.role as Role, permission)) {
    throw new Error('Sem permissão', { cause: 403 })
  }
  return session
}

export function buildInqueritoWhere(
  role: Role,
  userId: string,
  brigadaId: string | null,
): Prisma.InqueritoWhereInput {
  if (role === 'INSPETOR') {
    return { inspetorId: userId }
  }
  if (role === 'INSPETOR_CHEFE') {
    return brigadaId ? { brigadaId } : { inspetorId: userId }
  }
  return {}
}

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export function handleApiError(error: unknown) {
  // Prisma unique constraint violation → 409 Conflict
  if (error instanceof PrismaLib.PrismaClientKnownRequestError && error.code === 'P2002') {
    return apiError('Registo duplicado — verifique os campos únicos', 409)
  }
  if (error instanceof Error) {
    const status = (error.cause as number) || 500
    if (status === 401) return apiError('Não autenticado', 401)
    if (status === 403) return apiError('Sem permissão', 403)
    return apiError(error.message, status)
  }
  return apiError('Erro interno', 500)
}
