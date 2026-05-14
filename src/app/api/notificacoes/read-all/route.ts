import { prisma } from '@/lib/prisma'
import { getSession, handleApiError } from '@/lib/auth-helpers'

export async function POST() {
  try {
    const session = await getSession()
    await prisma.notificacao.updateMany({
      where: { utilizadorId: session.user.id, lida: false },
      data: { lida: true },
    })
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
