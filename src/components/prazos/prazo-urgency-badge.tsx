import { cn } from '@/lib/utils'
import { Bell, AlertTriangle, Clock } from 'lucide-react'
import { diasRestantes, urgencyFor } from '@/lib/prazos'

interface Props {
  dataPrazo: Date | string
  alertaDias: number
}

export function PrazoUrgencyBadge({ dataPrazo, alertaDias }: Props) {
  const d = typeof dataPrazo === 'string' ? new Date(dataPrazo) : dataPrazo
  const days = diasRestantes(d)
  const u = urgencyFor(d, alertaDias)

  let label: string
  if (days < 0) label = `Vencido há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`
  else if (days === 0) label = 'Vence hoje'
  else if (days === 1) label = 'Vence amanhã'
  else label = `Em ${days} dias`

  const Icon = u === 'overdue' ? AlertTriangle : u === 'urgent' ? Bell : Clock

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        u === 'overdue' &&
          'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900',
        u === 'urgent' &&
          'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900',
        u === 'soon' &&
          'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900',
        u === 'ok' &&
          'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
