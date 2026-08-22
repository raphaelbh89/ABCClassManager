'use client'
// src/app/(dashboard)/classes/page.tsx
// Quản lý danh sách lớp học — CRUD
import { useState } from 'react'
import { useClasses } from '@/hooks/useClasses'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Badge } from '@/components/common/Badge'
import { cn } from '@/utils/cn'
import { Plus, Pencil, Trash2, GraduationCap, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import type { Class } from '@/types'

const SCHOOL_YEAR = '2025-2026'

export default function ClassesPage() {
  const { classes, isLoading, addClass, editClass, removeClass } = useClasses()

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Class | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null)

  const [formName, setFormName] = useState('')
  const [formYear, setFormYear] = useState(SCHOOL_YEAR)
  const [formGrade, setFormGrade] = useState(3)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function openAdd() {
    setFormName(''); setFormYear(SCHOOL_YEAR); setFormGrade(3); setFormError(null)
    setAddOpen(true)
  }

  function openEdit(c: Class) {
    setEditTarget(c)
    setFormName(c.name); setFormYear(c.school_year); setFormGrade(c.grade_level)
    setFormError(null); setEditOpen(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Vui lòng nhập tên lớp'); return }
    setFormLoading(true)
    try {
      await addClass({ name: formName.trim(), school_year: formYear, grade_level: formGrade })
      setAddOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally { setFormLoading(false) }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget || !formName.trim()) { setFormError('Vui lòng nhập tên lớp'); return }
    setFormLoading(true)
    try {
      await editClass(editTarget.id, { name: formName.trim(), school_year: formYear, grade_level: formGrade })
      setEditOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally { setFormLoading(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setFormLoading(true)
    try {
      await removeClass(deleteTarget.id)
      setDeleteOpen(false)
    } finally { setFormLoading(false) }
  }

  async function copyRoomCode(roomCode: string, id: string) {
    await navigator.clipboard.writeText(roomCode)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const ClassForm = ({ onSubmit, label }: { onSubmit: (e: React.FormEvent) => void; label: string }) => (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold text-sm">Tên lớp <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <input
          type="text" value={formName} onChange={e => setFormName(e.target.value)}
          placeholder="VD: Lớp 3A, 3B, 4A..."
          required maxLength={20}
          className={cn('px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)]',
            'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-opacity-20',
            'focus:ring-[var(--color-primary)] transition-all duration-150')}
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-sm">Năm học</label>
          <select value={formYear} onChange={e => setFormYear(e.target.value)}
            className={cn('px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)]',
              'focus:outline-none focus:border-[var(--color-primary)] bg-white')}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {['2024-2025', '2025-2026', '2026-2027'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-sm">Khối lớp</label>
          <select value={formGrade} onChange={e => setFormGrade(+e.target.value)}
            className={cn('px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)]',
              'focus:outline-none focus:border-[var(--color-primary)] bg-white')}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Khối {g}</option>)}
          </select>
        </div>
      </div>
      {formError && (
        <p className="text-sm font-semibold text-center" style={{ color: 'var(--color-danger)' }}>
          ⚠️ {formError}
        </p>
      )}
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={() => { setAddOpen(false); setEditOpen(false) }}>Huỷ</Button>
        <Button type="submit" isLoading={formLoading}>{label}</Button>
      </div>
    </form>
  )

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>
            📚 Quản lý lớp học
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {classes.length} lớp · Năm học {SCHOOL_YEAR}
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>Tạo lớp mới</Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-[var(--radius-lg)] animate-pulse"
              style={{ background: 'var(--color-border)' }} />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card padding="lg" className="text-center py-16">
          <GraduationCap size={56} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="font-bold text-lg mb-1">Chưa có lớp học nào</p>
          <p className="mb-4" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Tạo lớp học đầu tiên để bắt đầu quản lý học sinh.
          </p>
          <Button onClick={openAdd} leftIcon={<Plus size={16} />}>Tạo lớp ngay</Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {classes.map(c => (
            <Card key={c.id} padding="md" className="flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-[var(--radius-md)] flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'var(--color-surface-alt)' }}
              >
                📚
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}>
                    {c.name}
                  </p>
                  <Badge variant={c.is_active ? 'primary' : 'neutral'}>
                    {c.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                  </Badge>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Năm học {c.school_year} · Khối {c.grade_level}
                </p>
                {/* Room code */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Room code:
                  </span>
                  <span
                    className="font-bold tracking-widest px-2 py-0.5 rounded"
                    style={{
                      fontSize: '0.75rem',
                      background: 'var(--color-surface-alt)',
                      color: 'var(--color-accent)',
                      letterSpacing: '0.15em',
                    }}
                  >
                    {c.room_code}
                  </span>
                  <button
                    onClick={() => copyRoomCode(c.room_code, c.id)}
                    className="p-0.5 rounded hover:bg-[var(--color-surface-alt)] transition-colors"
                    title="Copy room code"
                  >
                    {copiedId === c.id
                      ? <Check size={13} style={{ color: 'var(--color-primary)' }} />
                      : <Copy size={13} style={{ color: 'var(--color-text-muted)' }} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link href="/students">
                  <Button variant="ghost" size="sm" leftIcon={<GraduationCap size={14} />}>
                    Học sinh
                  </Button>
                </Link>
                <button onClick={() => openEdit(c)}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]">
                  <Pencil size={16} />
                </button>
                <button onClick={() => { setDeleteTarget(c); setDeleteOpen(true) }}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--color-danger)] hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="➕ Tạo lớp học mới">
        <ClassForm onSubmit={handleAdd} label="Tạo lớp" />
      </Modal>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="✏️ Sửa thông tin lớp">
        <ClassForm onSubmit={handleEdit} label="Lưu thay đổi" />
      </Modal>
      <ConfirmDialog
        isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xoá lớp học"
        message={`Xoá lớp "${deleteTarget?.name}" sẽ xoá toàn bộ học sinh và dữ liệu trong lớp. Hành động này KHÔNG thể hoàn tác.`}
        confirmLabel="Xoá lớp học"
        isLoading={formLoading}
      />
    </div>
  )
}
