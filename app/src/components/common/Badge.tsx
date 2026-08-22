'use client'
// src/components/common/Badge.tsx
import { cn } from '@/utils/cn'

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'info' | 'danger' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  primary:   'bg-[var(--color-primary)] text-white',
  secondary: 'bg-[var(--color-secondary)] text-white',
  accent:    'bg-[var(--color-accent)] text-white',
  info:      'bg-[var(--color-info)] text-white',
  danger:    'bg-[var(--color-danger)] text-white',
  neutral:   'bg-[var(--color-border)] text-[var(--color-text-muted)]',
}

export function Badge({ variant = 'primary', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5',
        'text-xs font-bold rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
