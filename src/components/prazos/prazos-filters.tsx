'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface Inspetor {
  id: string
  nome: string
}

interface Props {
  /** Whether to show the "Inspetor" filter (only meaningful for chefe+). */
  canFilterInspetor: boolean
  inspetores: Inspetor[]
  /** Current user id — enables the "Definidos por mim" option for chefe+. */
  currentUserId?: string
}

const STATUS_LABELS: Record<string, string> = {
  todos: 'Todos os prazos',
  vencidos: 'Apenas vencidos',
  proximos: 'Próximos (alerta)',
}

/** Sentinel value in the URL for "atividades definidas pelo próprio utilizador". */
const MINE_VALUE = '__mine__'

export function PrazosFilters({ canFilterInspetor, inspetores, currentUserId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('page')
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const status = searchParams.get('status') ?? 'todos'
  const inspetorId = searchParams.get('inspetorId') ?? ''

  const hasFilters = status !== 'todos' || !!inspetorId

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
      <Select
        value={status}
        onValueChange={(v) => update({ status: v && v !== 'todos' ? v : null })}
      >
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="Estado dos prazos">
            {(v: string) => STATUS_LABELS[v] ?? STATUS_LABELS.todos}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canFilterInspetor && (
        <Select
          value={inspetorId || 'all'}
          onValueChange={(v) => update({ inspetorId: !v || v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder="Filtrar por inspetor">
              {(v: string) => {
                if (!v || v === 'all') return 'Toda a brigada'
                if (v === MINE_VALUE) return 'Definidos por mim'
                const nome = inspetores.find((i) => i.id === v)?.nome
                return nome ?? 'Toda a brigada'
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda a brigada</SelectItem>
            {currentUserId && (
              <SelectItem value={MINE_VALUE}>Definidos por mim</SelectItem>
            )}
            {inspetores
              .filter((i) => i.id !== currentUserId)
              .map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Preserve view but clear filters
            const view = searchParams.get('view')
            const params = new URLSearchParams()
            if (view) params.set('view', view)
            router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`)
          }}
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  )
}
