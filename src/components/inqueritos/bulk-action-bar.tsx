'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Inspetor { id: string; nome: string }
interface Brigada { id: string; nome: string }

interface BulkActionBarProps {
  selectedIds: string[]
  onClear: () => void
  canTransfer: boolean
  inspetores: Inspetor[]
  brigadas: Brigada[]
}

const ESTADO_LABELS: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_INVESTIGACAO: 'Em Investigação',
  SUSPENSO: 'Suspenso',
  CONCLUIDO: 'Concluído',
  ARQUIVADO: 'Arquivado',
}

const FASE_LABELS: Record<string, string> = {
  INQUERITO: 'Inquérito',
  INSTRUCAO: 'Instrução',
  JULGAMENTO: 'Julgamento',
  RECURSO: 'Recurso',
  TRANSITO_EM_JULGADO: 'Trânsito em Julgado',
}

export function BulkActionBar({
  selectedIds,
  onClear,
  canTransfer,
  inspetores,
  brigadas,
}: BulkActionBarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (selectedIds.length === 0) return null

  async function execute(action: string, extra: Record<string, string>) {
    setLoading(true)
    const res = await fetch('/api/inqueritos/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, action, ...extra }),
    })
    setLoading(false)

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Erro na operação')
      return
    }

    const { updated } = await res.json()
    toast.success(`${updated} inquérito${updated !== 1 ? 's' : ''} actualizado${updated !== 1 ? 's' : ''}`)
    onClear()
    router.refresh()
  }

  function promptSelect(label: string, options: { value: string; label: string }[], cb: (v: string) => void) {
    const val = window.prompt(
      `${label}:\n${options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}\n\nIntroduza o número:`,
    )
    if (!val) return
    const idx = parseInt(val) - 1
    if (idx >= 0 && idx < options.length) cb(options[idx].value)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-popover border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 flex-wrap max-w-[95vw]">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
      </span>

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() =>
            promptSelect(
              'Atribuir inspetor',
              inspetores.map((i) => ({ value: i.id, label: i.nome })),
              (inspetorId) => execute('assign', { inspetorId }),
            )
          }
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Atribuir inspetor'}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() =>
            promptSelect(
              'Alterar estado',
              Object.entries(ESTADO_LABELS).map(([v, l]) => ({ value: v, label: l })),
              (estado) => execute('changeState', { estado }),
            )
          }
        >
          Alterar estado
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() =>
            promptSelect(
              'Alterar fase',
              Object.entries(FASE_LABELS).map(([v, l]) => ({ value: v, label: l })),
              (faseProcessual) => execute('changeFase', { faseProcessual }),
            )
          }
        >
          Alterar fase
        </Button>

        {canTransfer && (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() =>
              promptSelect(
                'Transferir para brigada',
                brigadas.map((b) => ({ value: b.id, label: b.nome })),
                (brigadaId) => execute('transfer', { brigadaId }),
              )
            }
          >
            Transferir
          </Button>
        )}
      </div>

      <button
        onClick={onClear}
        className="ml-auto p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
