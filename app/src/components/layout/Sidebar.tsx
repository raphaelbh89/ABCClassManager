'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import {
  LayoutDashboard, Users, ClipboardCheck,
  Gamepad2, BookOpen, Settings, GraduationCap,
  Tv, Smartphone, Trophy, Flame
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/classes',    icon: GraduationCap,   label: 'Lớp học' },
  { href: '/attendance', icon: ClipboardCheck,  label: 'Điểm danh' },
  { href: '/students',   icon: Users,           label: 'Học sinh' },
  { href: '/race',       icon: Trophy,          label: '🎯 Gọi Trả Bài' },
  { href: '/game',       icon: Gamepad2,        label: 'Game / Quiz' },
  { href: '/display',    icon: Tv,              label: '📺 Màn chiếu TV' },
  { href: '/scanner',    icon: Smartphone,      label: '📱 Quét Mobile' },
  { href: '/settings',   icon: Settings,        label: 'Cài đặt' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col w-64 min-h-screen',
        'bg-[var(--color-surface-alt)] border-r border-[var(--color-border)]',
        'shadow-[var(--shadow-sm)]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border)]">
        <span className="text-3xl">🦉</span>
        <div>
          <p
            className="font-bold text-[var(--color-text)] leading-tight"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}
          >
            ClassManager
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Pro
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)]',
                'text-[var(--text-sm)] font-semibold transition-all duration-[var(--transition-fast)]',
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-primary)]'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--color-border)]">
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          ClassManager Pro v0.1.0
        </p>
      </div>
    </aside>
  )
}
