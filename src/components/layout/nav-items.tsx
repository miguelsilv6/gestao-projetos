import type { Role } from '@/generated/prisma/enums'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Shield,
  BarChart3,
  Bell,
  Settings,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['INSPETOR', 'INSPETOR_CHEFE', 'COORDENADOR', 'ESTATISTICA', 'ADMINISTRACAO'],
  },
  {
    label: 'Inquéritos',
    href: '/inqueritos',
    icon: FolderOpen,
    roles: ['INSPETOR', 'INSPETOR_CHEFE', 'COORDENADOR', 'ESTATISTICA', 'ADMINISTRACAO'],
  },
  {
    label: 'Brigadas',
    href: '/brigadas',
    icon: Shield,
    roles: ['COORDENADOR', 'ADMINISTRACAO'],
  },
  {
    label: 'Estatísticas',
    href: '/estatisticas',
    icon: BarChart3,
    roles: ['COORDENADOR', 'ESTATISTICA', 'ADMINISTRACAO'],
  },
  {
    label: 'Notificações',
    href: '/notificacoes',
    icon: Bell,
    roles: ['INSPETOR', 'INSPETOR_CHEFE', 'COORDENADOR', 'ADMINISTRACAO'],
  },
  {
    label: 'Utilizadores',
    href: '/utilizadores',
    icon: Users,
    roles: ['ADMINISTRACAO'],
  },
  {
    label: 'Audit Log',
    href: '/auditlog',
    icon: ClipboardList,
    roles: ['ADMINISTRACAO'],
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    roles: ['ADMINISTRACAO'],
  },
]
