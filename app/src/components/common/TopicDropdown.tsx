'use client'
// src/components/common/TopicDropdown.tsx
// Bộ chọn chủ đề dạng dropdown — không bị che/cắt như hàng pill cuộn ngang
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Tag } from 'lucide-react'
import { cn } from '@/utils/cn'

interface TopicOption {
  name: string
  count: number
}

interface TopicDropdownProps {
  topics: TopicOption[]
  /** 'all' hoặc tên chủ đề đang chọn */
  value: string
  onSelect: (topicName: string) => void
  /** Tổng số câu khi chưa lọc chủ đề (hiện trên lựa chọn "Tất cả") */
  totalCount: number
  className?: string
}

export function TopicDropdown({ topics, value, onSelect, totalCount, className }: TopicDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Đóng khi click ra ngoài / nhấn Escape
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    if (!kw) return topics
    return topics.filter(t => t.name.toLowerCase().includes(kw))
  }, [topics, search])

  const selectedLabel = value === 'all' ? 'Tất cả chủ đề' : value

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Nút mở dropdown */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all w-full sm:w-auto max-w-full',
          open
            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
            : 'border-slate-200 hover:bg-slate-50'
        )}
        style={{ background: 'var(--color-surface)' }}
      >
        <Tag size={13} className="text-amber-500 flex-shrink-0" />
        <span className="truncate max-w-[180px] sm:max-w-[240px]" title={selectedLabel}>
          🎯 {selectedLabel}
          {value !== 'all' && (
            <span className="text-[10px] opacity-70">
              {' '}({topics.find(t => t.name === value)?.count ?? 0})
            </span>
          )}
          {value === 'all' && <span className="opacity-60"> ({totalCount})</span>}
        </span>
        <ChevronDown size={14} className={cn('flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Panel danh sách */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 mt-1.5 w-full sm:w-80 max-w-[calc(100vw-2rem)] z-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Ô tìm kiếm trong dropdown */}
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm chủ đề..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {/* Lựa chọn Tất cả */}
            <button
              type="button"
              onClick={() => { onSelect('all'); setOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold transition-colors',
                value === 'all' ? 'bg-amber-50 text-amber-800' : 'hover:bg-slate-50'
              )}
              style={{ color: value === 'all' ? undefined : 'var(--color-text)' }}
            >
              <span>🌐 Tất cả chủ đề</span>
              <span className="text-[10px] font-black text-slate-400">{totalCount}</span>
            </button>

            {filtered.map(t => (
              <button
                key={t.name}
                type="button"
                role="option"
                aria-selected={value === t.name}
                onClick={() => { onSelect(t.name); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold transition-colors',
                  value === t.name ? 'bg-amber-50 text-amber-800' : 'hover:bg-slate-50'
                )}
              >
                <span className="truncate">🎯 {t.name}</span>
                <span className="text-[10px] font-black text-slate-400 flex-shrink-0">{t.count}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-slate-400">
                Không có chủ đề nào khớp "{search}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
