'use client'
// src/components/common/Button.tsx
import { cn } from '@/utils/cn'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white',
  secondary: 'bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-dark)] text-white',
  accent:    'bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white',
  ghost:     'bg-transparent hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border)]',
  danger:    'bg-[var(--color-danger)] hover:opacity-90 text-white',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3 text-lg gap-2',
  xl: 'px-10 py-4 text-xl gap-3',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-full',
        'transition-all duration-[var(--transition-fast)]',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'
