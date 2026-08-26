'use client'
// src/components/common/Modal.tsx
// Modal/Dialog dùng chung với overlay + animation
import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Đóng modal bằng Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className={cn(
          'w-full relative max-h-[92dvh] overflow-y-auto',
          'bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
          'shadow-[var(--shadow-lg)]',
          'animate-in fade-in slide-in-from-bottom-4 duration-200',
          sizeMap[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            id="modal-title"
            className="font-bold"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-[var(--radius-md)]',
              'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]',
              'hover:text-[var(--color-text)] transition-all duration-[var(--transition-fast)]'
            )}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
