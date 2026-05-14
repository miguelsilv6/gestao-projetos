import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NotificacoesList } from '@/components/notificacoes/notificacoes-list'

export default async function NotificacoesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const notificacoes = await prisma.notificacao.findMany({
    where: { utilizadorId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { inquerito: { select: { nuipc: true } } },
  })

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground text-sm">
          {notificacoes.filter((n) => !n.lida).length} por ler
        </p>
      </div>
      <NotificacoesList initialNotificacoes={notificacoes} />
    </div>
  )
}
