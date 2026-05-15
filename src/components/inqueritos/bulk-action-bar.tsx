'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

type ActionType = 'assign' | 'changeState' | 'changeFase' | 'transfer' | null

export function BulkActionBar({
  selectedIds,
  onClear,
  canTransfer,
  inspetores,
  brigadas,
}: BulkActionBarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [selectedValue, setSelectedValue] = useState('')

  if (selectedIds.length === 0) return null

  async function execute() {
    if (!selectedValue) return
    setLoading(true)

    const extra: Record<string, string> = {}
    if (activeAction === 'assign') extra.inspetorId = selectedValue
    if (activeAction === 'changeState') extra.estado = selectedValue
    if (activeAction === 'changeFase') extra.faseProcessual = selectedValue
    if (activeAction === 'transfer') extra.brigadaId = selectedValue

    const res = await fetch('/api/inqueritos/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, action: activeAction, ...extra }),
    })
    setLoading(false)

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Erro na operação')
      return
    }

    const { updated } = await res.json()
    toast.success(`${updated} inquérito${updated !== 1 ? 's' : ''} actualizado${updated !== 1 ? 's' : ''}`)
    closeDialog()
    onClear()
    router.refresh()
  }

  function openDialog(action: ActionType) {
    setActiveAction(action)
    setSelectedValue('')
  }

  function closeDialog() {
    setActiveAction(null)
    setSelectedValue('')
  }

  const dialogConfig: Record<NonNullable<ActionType>, { title: string; label: string; options: { value: string; label: string }[] }> = {
    assign: {
      title: 'Atribuir inspetor',
      label: 'Inspetor',
      options: inspetores.map((i) => ({ value: i.id, label: i.nome })),
    },
    changeState: {
      title: 'Alterar estado',
      label: 'Novo estado',
      options: Object.entries(ESTADO_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    changeFase: {
      title: 'Alterar fase processual',
      label: 'Nova fase',
      options: Object.entries(FASE_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    transfer: {
      title: 'Transferir brigada',
      label: 'Brigada de destino',
      options: brigadas.map((b) => ({ value: b.id, label: b.nome })),
    },
  }

  const config = activeAction ? dialogConfig[activeAction] : null

  return (
    <>
      <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-popover border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 flex-wrap max-w-[95vw]">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
        </span>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" disabled={loading} onClick={() => openDialog('assign')}>
            Atribuir inspetor
          </Button>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => openDialog('changeState')}>
            Alterar estado
          </Button>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => openDialog('changeFase')}>
            Alterar fase
          </Button>
          {canTransfer && (
            <Button size="sm" variant="outline" disabled={loading} onClick={() => openDialog('transfer')}>
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

      <Dialog open={!!activeAction} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-sm">
          {config && (
            <>
              <DialogHeader>
                <DialogTitle>{config.title}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                A aplicar a <strong>{selectedIds.length}</strong> inquérito{selectedIds.length !== 1 ? 's' : ''}.
              </p>
              <div className="space-y-1.5">
                <Label>{config.label}</Label>
                <Select value={selectedValue} onValueChange={(v) => setSelectedValue(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Selecionar ${config.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={loading}>Cancelar</Button>
                <Button onClick={execute} disabled={loading || !selectedValue}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
