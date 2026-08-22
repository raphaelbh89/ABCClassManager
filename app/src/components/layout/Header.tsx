'use client'
// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCurrentClass } from '@/context/ClassContext'
import { cn } from '@/utils/cn'
import {
  ChevronDown,
  Plus,
  GraduationCap,
  LogOut,
  User,
  Check,
  Bell,
  Sparkles,
} from 'lucide-react'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const router = useRouter()
  const { classes, currentClass, setCurrentClass } = useCurrentClass()

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  const classDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    document.cookie = 'user_id=; path=/; max-age=0'
    document.cookie = 'demo_user=; path=/; max-age=0'
    localStorage.removeItem('classmanager_user')
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-3',
        'bg-[var(--color-surface)] border-b border-[var(--color-border)]',
        'shadow-[var(--shadow-sm)] sticky top-0 z-[var(--z-dropdown)]',
        className
      )}
    >
      {/* ─── Bộ chọn lớp học (Class Selector Dropdown) ─── */}
      <div className="relative" ref={classDropdownRef}>
        <button
          onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 rounded-[var(--radius-md)]',
            'bg-[var(--color-surface-alt)] border border-[var(--color-border)]',
            'font-bold text-[var(--color-text)] transition-all duration-[var(--transition-fast)]',
            'hover:border-[var(--color-primary)] hover:shadow-sm active:scale-95',
            isClassDropdownOpen && 'ring-2 ring-[var(--color-primary)] border-transparent'
          )}
        >
          <span className="text-xl">📚</span>
          <span style={{ fontSize: 'var(--text-sm)' }}>
            {currentClass ? currentClass.name : 'Chọn lớp học'}
          </span>
          {currentClass && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary)] text-white font-mono tracking-wider"
            >
              {currentClass.room_code}
            </span>
          )}
          <ChevronDown
            size={16}
            className={cn('transition-transform duration-200 text-[var(--color-text-muted)]', isClassDropdownOpen && 'rotate-180')}
          />
        </button>

        {/* Dropdown Menu Lớp Học */}
        {isClassDropdownOpen && (
          <div
            className={cn(
              'absolute top-full left-0 mt-2 w-72 p-2',
              'bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
              'border border-[var(--color-border)] shadow-[var(--shadow-lg)]',
              'animate-in fade-in slide-in-from-top-2 duration-150 z-50'
            )}
          >
            <div className="px-3 py-1.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Danh sách lớp của bạn ({classes.length})
            </div>

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto my-1">
              {classes.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--color-text-muted)]">
                  Chưa có lớp học nào.
                </div>
              ) : (
                classes.map(cls => {
                  const isSelected = currentClass?.id === cls.id
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setCurrentClass(cls)
                        setIsClassDropdownOpen(false)
                      }}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all',
                        isSelected
                          ? 'bg-[var(--color-surface-alt)] text-[var(--color-primary)] font-bold'
                          : 'hover:bg-slate-50 text-[var(--color-text)] font-semibold'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">🏫</span>
                        <div className="truncate">
                          <p className="text-sm leading-snug">{cls.name}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)] font-normal">
                            Khối {cls.grade_level} · Năm {cls.school_year}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-[var(--color-primary)] flex-shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div className="pt-2 border-t border-[var(--color-border)] mt-1">
              <Link
                href="/classes"
                onClick={() => setIsClassDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                <Plus size={15} />
                <span>Quản lý & Thêm lớp mới</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── Actions & User Menu ─── */}
      <div className="flex items-center gap-3">
        {/* Thông báo */}
        <button
          className={cn(
            'relative p-2 rounded-[var(--radius-md)]',
            'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]',
            'transition-all duration-[var(--transition-fast)]'
          )}
          aria-label="Thông báo"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-full)]',
              'bg-[var(--color-primary)] text-white font-bold',
              'transition-all duration-[var(--transition-fast)] hover:bg-[var(--color-primary-dark)] shadow-sm'
            )}
            style={{ fontSize: 'var(--text-sm)' }}
          >
            <span>👩‍🏫</span>
            <span>Giáo viên</span>
            <ChevronDown size={14} className={cn('transition-transform duration-200', isUserDropdownOpen && 'rotate-180')} />
          </button>

          {isUserDropdownOpen && (
            <div
              className={cn(
                'absolute top-full right-0 mt-2 w-56 p-2',
                'bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
                'border border-[var(--color-border)] shadow-[var(--shadow-lg)]',
                'animate-in fade-in slide-in-from-top-2 duration-150 z-50'
              )}
            >
              <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                <p className="font-bold text-sm text-[var(--color-text)]">Cô Nguyễn Thu Hà</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">giaovien@gmail.com</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setIsUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                <Sparkles size={14} className="text-[var(--color-secondary)]" />
                <span>Cài đặt & Xuất báo cáo</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
