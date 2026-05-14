'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export function NotificationBell({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notificacoes?count=true', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setCount(data.count)
      }
    } catch {
      // Silently ignore
    }
  }, [])

  useEffect(() => {
    // Poll every 30s
    const interval = setInterval(fetchCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return (
    <Link
      href="/notificacoes"
      className="relative inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
      <span className="sr-only">Notificações</span>
    </Link>
  )
}
