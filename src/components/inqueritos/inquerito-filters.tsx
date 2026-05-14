'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ESTADO_LABELS, FASE_LABELS } from '@/lib/constants'
import { Search, X } from 'lucide-react'

export function InqueritoFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', '1')
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      return params.toString()
    },
    [searchParams],
  )

  const hasFilters =
    searchParams.get('search') || searchParams.get('estado') || searchParams.get('faseProcessual')

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar NUIPC ou natureza..."
          className="pl-8"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) =>
            router.push(`${pathname}?${createQueryString({ search: e.target.value })}`)
          }
        />
      </div>

      <Select
        value={searchParams.get('estado') || ''}
        onValueChange={(v) =>
          router.push(`${pathname}?${createQueryString({ estado: v === 'all' ? '' : (v ?? '') })}`)
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estados</SelectItem>
          {Object.entries(ESTADO_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('faseProcessual') || ''}
        onValueChange={(v) =>
          router.push(`${pathname}?${createQueryString({ faseProcessual: v === 'all' ? '' : (v ?? '') })}`)
        }
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Fase processual" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as fases</SelectItem>
          {Object.entries(FASE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  )
}
