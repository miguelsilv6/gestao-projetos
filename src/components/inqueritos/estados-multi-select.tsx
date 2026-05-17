'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EstadoOption {
  id: string
  codigo: string
  nome: string
}

interface Props {
  estados: EstadoOption[]
  /** Selected codigos (controlled). */
  value: string[]
  onChange: (next: string[]) => void
  className?: string
}

/**
 * Multi-select dropdown of estados (codigos). Built ad-hoc because the base-ui
 * `Select` wrapper in this project is single-value. Click outside to close.
 */
export function EstadosMultiSelect({ estados, value, onChange, className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open])

  function toggle(codigo: string) {
    if (value.includes(codigo)) onChange(value.filter((c) => c !== codigo))
    else onChange([...value, codigo])
  }

  function clear() {
    onChange([])
  }

  function label() {
    if (value.length === 0) return 'Todos os estados'
    if (value.length === 1) {
      return estados.find((e) => e.codigo === value[0])?.nome ?? '1 estado'
    }
    return `${value.length} estados`
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full sm:w-44 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm h-8 transition-colors',
          'hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
          value.length === 0 && 'text-muted-foreground',
          'dark:bg-input/30 dark:hover:bg-input/50',
        )}
      >
        <span className="line-clamp-1 text-left flex-1">{label()}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border bg-popover shadow-md ring-1 ring-foreground/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b text-xs">
            <span className="text-muted-foreground">Selecione estados</span>
            {value.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto p-1">
            {estados.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground">
                Sem estados disponíveis.
              </li>
            ) : (
              estados.map((e) => {
                const selected = value.includes(e.codigo)
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => toggle(e.codigo)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center justify-center h-4 w-4 rounded border',
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-input',
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="flex-1">{e.nome}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
