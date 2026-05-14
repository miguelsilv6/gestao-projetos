import { Badge } from '@/components/ui/badge'
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/constants'
import type { EstadoInquerito } from '@/generated/prisma/enums'
import { cn } from '@/lib/utils'

export function EstadoBadge({ estado }: { estado: EstadoInquerito }) {
  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', ESTADO_COLORS[estado])}>
      {ESTADO_LABELS[estado]}
    </Badge>
  )
}
