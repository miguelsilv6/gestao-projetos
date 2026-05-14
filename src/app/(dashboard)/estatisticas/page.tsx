import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/rbac'
import { EstatisticasDashboard } from '@/components/estatisticas/estatisticas-dashboard'
import type { Role } from '@/generated/prisma/enums'

export default async function EstatisticasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as Role
  if (!hasPermission(role, 'estatistica:read')) redirect('/dashboard')

  const brigadas = await prisma.brigada.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estatísticas</h1>
        <p className="text-muted-foreground text-sm">Análise de inquéritos</p>
      </div>
      <EstatisticasDashboard brigadas={brigadas} />
    </div>
  )
}
