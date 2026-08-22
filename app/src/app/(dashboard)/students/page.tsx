'use client'
// src/app/(dashboard)/students/page.tsx
// Trang danh sách học sinh — quản lý + thêm/sửa/xoá
import { useState } from 'react'
import { useClasses } from '@/hooks/useClasses'
import { useStudents } from '@/hooks/useStudents'
import { StudentCard } from '@/components/student/StudentCard'
import { SeatingGrid } from '@/components/attendance/SeatingGrid'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Modal } from '@/components/common/Modal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AvatarPicker } from '@/components/student/AvatarDisplay'
import { StudentDetailModal } from '@/components/student/StudentDetailModal'
import { QuickActionFAB } from '@/components/student/QuickActionFAB'
import { useEvaluations } from '@/hooks/useEvaluations'
import { cn } from '@/utils/cn'
import {
  Plus, Users, LayoutGrid, List,
  Pencil, Trash2, GraduationCap, LayoutDashboard,
} from 'lucide-react'
import type { AvatarConfig, Student } from '@/types'

type ViewMode = 'grid' | 'list' | 'seating'

import { useCurrentClass } from '@/context/ClassContext'

const DEFAULT_AVATAR: AvatarConfig = { type: 'owl', color: '#4CAF82' }

export default function StudentsPage() {
  const { classes, currentClass, setCurrentClass, isLoading: classLoading } = useCurrentClass()
  const selectedClassId = currentClass?.id || null
  const setSelectedClassId = (id: string | null) => {
    if (!id) return
    const matched = classes.find(c => c.id === id)
    if (matched) setCurrentClass(matched)
  }
  const { students, isLoading, addStudent, editStudent, removeStudent, updateSeatMap } = useStudents(selectedClassId)
  const { criteria, giveScore } = useEvaluations(selectedClassId)

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')

  // Modal state
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [detailTarget, setDetailTarget] = useState<Student | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAvatar, setFormAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Seating config
  const [gridRows, setGridRows] = useState(6)
  const [gridCols, setGridCols] = useState(6)

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function openDetail(s: Student) {
    setDetailTarget(s)
    setDetailOpen(true)
  }

  function openAdd() {
    setFormName(''); setFormAvatar(DEFAULT_AVATAR); setFormError(null)
    setAddOpen(true)
  }

  function openEdit(s: Student) {
    setEditTarget(s)
    setFormName(s.name)
    setFormAvatar(s.avatar_config)
    setFormError(null)
    setEditOpen(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Vui lòng nhập tên học sinh'); return }
    setFormLoading(true)
    try {
      await addStudent({ name: formName.trim(), avatar_config: formAvatar })
      setAddOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget || !formName.trim()) { setFormError('Vui lòng nhập tên'); return }
    setFormLoading(true)
    try {
      await editStudent(editTarget.id, { name: formName.trim(), avatar_config: formAvatar })
      setEditOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setFormLoading(true)
    try {
      await removeStudent(deleteTarget.id)
      setDeleteOpen(false)
    } catch {
      // error handled by hook
    } finally {
      setFormLoading(false)
    }
  }

  // ─── Chưa chọn lớp ───
  if (!selectedClassId) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="font-bold mb-6" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>
          👥 Chọn lớp học
        </h1>
        {classLoading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Đang tải...</p>
        ) : classes.length === 0 ? (
          <Card padding="lg" className="text-center">
            <GraduationCap size={48} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p className="font-semibold mb-1">Chưa có lớp nào</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Hãy tạo lớp học trước khi thêm học sinh.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map(c => (
              <Card
                key={c.id}
                hover
                padding="md"
                className="cursor-pointer"
                onClick={() => setSelectedClassId(c.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-2xl"
                    style={{ background: 'var(--color-surface-alt)' }}
                  >
                    📚
                  </div>
                  <div>
                    <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      Năm học {c.school_year} · Khối {c.grade_level}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── Form học sinh (dùng chung add/edit) ───
  const StudentForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 'var(--text-sm)' }}>
          Họ và tên học sinh <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <input
          type="text"
          value={formName}
          onChange={e => setFormName(e.target.value)}
          placeholder="VD: Nguyễn Văn An"
          maxLength={60}
          required
          className={cn(
            'px-4 py-2.5 rounded-[var(--radius-md)]',
            'border border-[var(--color-border)]',
            'focus:outline-none focus:border-[var(--color-primary)]',
            'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20',
            'transition-all duration-[var(--transition-fast)]'
          )}
          style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)' }}
        />
      </div>

      <AvatarPicker value={formAvatar} onChange={setFormAvatar} />

      {formError && (
        <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
          ⚠️ {formError}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={() => { setAddOpen(false); setEditOpen(false) }}>
          Huỷ
        </Button>
        <Button type="submit" isLoading={formLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setSelectedClassId(null)}
              className="text-sm font-semibold hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              ← Tất cả lớp
            </button>
          </div>
          <h1 className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>
            👥 {currentClass?.name}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {students.length} học sinh · Năm {currentClass?.school_year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Tìm học sinh..."
            className={cn(
              'px-3 py-2 rounded-[var(--radius-full)] border border-[var(--color-border)]',
              'focus:outline-none focus:border-[var(--color-primary)]',
              'transition-all duration-[var(--transition-fast)]'
            )}
            style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', width: 180 }}
          />

          {/* View toggle */}
          <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
            {([
              { mode: 'grid' as ViewMode, Icon: LayoutGrid },
              { mode: 'list' as ViewMode, Icon: List },
              { mode: 'seating' as ViewMode, Icon: LayoutDashboard },
            ]).map(({ mode, Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'p-2 transition-all duration-[var(--transition-fast)]',
                  viewMode === mode
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
                )}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
            Thêm học sinh
          </Button>
        </div>
      </div>

      {/* ─── View: Seating ─── */}
      {viewMode === 'seating' && (
        <Card padding="md">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}>
              🗺️ Sơ đồ chỗ ngồi
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <label style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Hàng:</label>
              <input type="number" min={1} max={12} value={gridRows}
                onChange={e => setGridRows(+e.target.value)}
                className="w-14 px-2 py-1 border rounded-md text-center text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <label style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Cột:</label>
              <input type="number" min={1} max={12} value={gridCols}
                onChange={e => setGridCols(+e.target.value)}
                className="w-14 px-2 py-1 border rounded-md text-center text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              💡 Kéo thả học sinh để đổi chỗ ngồi
            </p>
          </div>
          <SeatingGrid
            students={students}
            rows={gridRows}
            cols={gridCols}
            onSeatChange={updateSeatMap}
          />
        </Card>
      )}

      {/* ─── View: Grid ─── */}
      {viewMode === 'grid' && (
        isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded-[var(--radius-lg)] animate-pulse"
                style={{ background: 'var(--color-border)' }} />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Users size={48} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p className="font-semibold">Chưa có học sinh nào</p>
            <p className="mt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Nhấn "Thêm học sinh" để bắt đầu.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredStudents.map(s => (
              <div key={s.id} className="relative group">
                <StudentCard student={s} onClick={() => openDetail(s)} />
                {/* Action overlay */}
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg bg-white shadow-md text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
                    title="Sửa"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => { setDeleteTarget(s); setDeleteOpen(true) }}
                    className="p-1.5 rounded-lg bg-white shadow-md text-[var(--color-danger)] hover:bg-red-50"
                    title="Xoá"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ─── View: List ─── */}
      {viewMode === 'list' && (
        <Card padding="md">
          {filteredStudents.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              Không có học sinh nào.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredStudents.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span
                    className="w-6 text-right font-bold flex-shrink-0"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 cursor-pointer" onClick={() => openDetail(s)}>
                    <StudentCard student={s} compact />
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => { setDeleteTarget(s); setDeleteOpen(true) }}
                      className="p-1.5 rounded-lg text-[var(--color-danger)] hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Floating Action Button (Chấm điểm nhanh) ─── */}
      <QuickActionFAB
        students={students}
        criteria={criteria}
        onGiveScore={giveScore}
      />

      {/* ─── Modals ─── */}
      <StudentDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        student={detailTarget}
        classId={selectedClassId}
      />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="➕ Thêm học sinh mới">
        <StudentForm onSubmit={handleAdd} submitLabel="Thêm học sinh" />
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="✏️ Sửa thông tin học sinh">
        <StudentForm onSubmit={handleEdit} submitLabel="Lưu thay đổi" />
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xoá học sinh"
        message={`Bạn có chắc muốn xoá học sinh "${deleteTarget?.name}"? Dữ liệu lịch sử (điểm danh, đánh giá) sẽ được giữ lại.`}
        confirmLabel="Xoá học sinh"
        isLoading={formLoading}
      />
    </div>
  )
}
