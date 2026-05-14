import { Badge } from '@/components/ui/badge'
import { FASE_LABELS, FASE_COLORS } from '@/lib/constants'
import type { FaseProcessual } from '@/generated/prisma/enums'
import { cn } from '@/lib/utils'

export function FaseBadge({ fase }: { fase: FaseProcessual }) {
  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', FASE_COLORS[fase])}>
      {FASE_LABELS[fase]}
    </Badge>
  )
}
