'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { List, CalendarDays } from 'lucide-react'

export function PrazosViewToggle({ view }: { view: 'list' | 'calendar' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setView = useCallback(
    (next: 'list' | 'calendar') => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'list') params.delete('view')
      else params.set('view', next)
      params.delete('day')
      params.delete('month')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5" role="group">
      <button
        type="button"
        onClick={() => setView('list')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
          view === 'list'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-3.5 w-3.5" />
        Lista
      </button>
      <button
        type="button"
        onClick={() => setView('calendar')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
          view === 'calendar'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Calendário
      </button>
    </div>
  )
}
