'use client'
// src/components/common/Card.tsx
import { cn } from '@/utils/cn'
import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingStyles = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

export function Card({ hover = false, padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
        'border border-[var(--color-border)]',
        'shadow-[var(--shadow-card)]',
        hover && 'transition-all duration-[var(--transition-normal)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 cursor-pointer',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
