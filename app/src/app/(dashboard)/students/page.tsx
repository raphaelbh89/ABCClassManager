'use client'
// src/app/(dashboard)/students/page.tsx
// Trang danh sách học sinh — quản lý + thêm/sửa/xoá
import { useState, useEffect, useCallback } from 'react'
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
  Pencil, Trash2, GraduationCap, LayoutDashboard, Upload, FileDown,
} from 'lucide-react'
import * as XLSX from 'xlsx'
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
  const { students, isLoading, addStudent, bulkAddStudents, editStudent, removeStudent, updateSeatMap } = useStudents(selectedClassId)
  const { criteria, giveScore } = useEvaluations(selectedClassId)

  // Tổng điểm + huy hiệu theo từng học sinh (để hiển thị trên card)
  const [scoreSummary, setScoreSummary] = useState<Record<string, { total_score: number; badge_count: number }>>({})

  const loadScoreSummary = useCallback(async () => {
    if (!selectedClassId) return
    try {
      const res = await fetch(`/api/evaluations?type=summary&classId=${encodeURIComponent(selectedClassId)}`)
      if (!res.ok) return
      const rows: { student_id: string; total_score: number; badge_count: number }[] = await res.json()
      const map: Record<string, { total_score: number; badge_count: number }> = {}
      for (const r of rows) map[r.student_id] = r
      setScoreSummary(map)
    } catch {}
  }, [selectedClassId])

  useEffect(() => { loadScoreSummary() }, [loadScoreSummary])

  // Trạng thái điểm danh HÔM NAY của lớp — HS 'absent' sẽ bị làm mờ trong sơ đồ chỗ ngồi
  const [attendanceStatusMap, setAttendanceStatusMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({})

  useEffect(() => {
    const loadTodayAttendance = async () => {
      if (!selectedClassId) return
      try {
        const d = new Date()
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const res = await fetch(`/api/attendance?classId=${encodeURIComponent(selectedClassId)}&date=${today}`)
        if (!res.ok) return
        const session = await res.json()
        const map: Record<string, 'present' | 'absent' | 'late'> = {}
        if (session?.records) {
          for (const r of session.records) map[r.student_id] = r.status
        }
        setAttendanceStatusMap(map)
      } catch {}
    }
    loadTodayAttendance()
  }, [selectedClassId])

  // Chấm điểm nhanh xong thì tải lại tổng điểm để card cập nhật ngay
  const handleGiveScoreAndRefresh = useCallback(async (params: Parameters<typeof giveScore>[0]) => {
    await giveScore(params)
    await loadScoreSummary()
  }, [giveScore, loadScoreSummary])

  const [viewMode, setViewMode] = useState<ViewMode>('seating')
  const [search, setSearch] = useState('')

  // Modal state
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [detailTarget, setDetailTarget] = useState<Student | null>(null)

  // Import Excel state
  const [importOpen, setImportOpen] = useState(false)
  const [importRows, setImportRows] = useState<{ name: string; english_name: string }[]>([])
  const [importSkipped, setImportSkipped] = useState(0)
  const [importError, setImportError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEnglishName, setFormEnglishName] = useState('')
  const [formAvatar, setFormAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Seating config — lưu theo từng lớp vào localStorage để không mất khi chuyển trang
  const [gridRows, setGridRows] = useState(6)
  const [gridCols, setGridCols] = useState(6)

  useEffect(() => {
    if (!selectedClassId) return
    try {
      const saved = localStorage.getItem(`seat_grid_${selectedClassId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Number.isFinite(+parsed?.rows)) setGridRows(Math.min(12, Math.max(1, +parsed.rows)))
        if (Number.isFinite(+parsed?.cols)) setGridCols(Math.min(12, Math.max(1, +parsed.cols)))
      }
    } catch {}
  }, [selectedClassId])

  const changeGridRows = (v: number) => {
    if (!Number.isFinite(v)) return
    const clamped = Math.min(12, Math.max(1, v))
    setGridRows(clamped)
    if (selectedClassId) {
      localStorage.setItem(`seat_grid_${selectedClassId}`, JSON.stringify({ rows: clamped, cols: gridCols }))
    }
  }

  const changeGridCols = (v: number) => {
    if (!Number.isFinite(v)) return
    const clamped = Math.min(12, Math.max(1, v))
    setGridCols(clamped)
    if (selectedClassId) {
      localStorage.setItem(`seat_grid_${selectedClassId}`, JSON.stringify({ rows: gridRows, cols: clamped }))
    }
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function openDetail(s: Student) {
    setDetailTarget(s)
    setDetailOpen(true)
  }

  function openAdd() {
    setFormName(''); setFormEnglishName(''); setFormAvatar(DEFAULT_AVATAR); setFormError(null)
    setAddOpen(true)
  }

  function openEdit(s: Student) {
    setEditTarget(s)
    setFormName(s.name)
    setFormEnglishName(s.english_name || '')
    setFormAvatar(s.avatar_config)
    setFormError(null)
    setEditOpen(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) { setFormError('Vui lòng nhập tên học sinh'); return }
    setFormLoading(true)
    try {
      await addStudent({ name: formName.trim(), english_name: formEnglishName.trim() || null, avatar_config: formAvatar })
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
      await editStudent(editTarget.id, { name: formName.trim(), english_name: formEnglishName.trim() || null, avatar_config: formAvatar })
      setEditOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setFormLoading(false)
    }
  }

  // ─── Import danh sách học sinh từ Excel/CSV ───
  const normalizeHeader = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z]/g, '')

  function handleImportFile(file: File) {
    setImportError(null)
    setImportRows([])
    setImportSkipped(0)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        if (!ws) throw new Error('File không có sheet dữ liệu nào')
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
        if (json.length === 0) throw new Error('File không có dòng dữ liệu nào')

        // Dò tên cột linh hoạt: "Họ và tên"/"Tên"/"Name" và "Tên tiếng Anh"/"English"
        const allKeys = Array.from(new Set(json.flatMap(r => Object.keys(r))))
        let engKey: string | null = null
        for (const k of allKeys) {
          if (/english|tienganh|tenanh/.test(normalizeHeader(k))) { engKey = k; break }
        }
        let nameKey: string | null = null
        for (const k of allKeys) {
          if (k === engKey) continue
          const n = normalizeHeader(k)
          if (/hoten|hovateng|hovaten|tenthanhvien|tenhocsinh|ten|name|student/.test(n)) { nameKey = k; break }
        }
        // Fallback: cột đầu tiên = tên, cột thứ hai = tên tiếng Anh
        if (!nameKey && allKeys.length > 0) nameKey = allKeys[0]
        if (!engKey && allKeys.length > 1 && allKeys[1] !== nameKey) engKey = allKeys[1]

        // Lọc trùng trong file + trùng với HS hiện có của lớp
        const existingNames = new Set(students.map(s => s.name.trim().toLowerCase()))
        const seen = new Set<string>()
        const parsed: { name: string; english_name: string }[] = []
        let skipped = 0
        for (const row of json) {
          const name = String(row[nameKey!] ?? '').trim()
          if (!name) continue
          const key = name.toLowerCase()
          if (existingNames.has(key) || seen.has(key)) { skipped++; continue }
          seen.add(key)
          parsed.push({ name, english_name: engKey ? String(row[engKey] ?? '').trim() : '' })
        }
        setImportRows(parsed)
        setImportSkipped(skipped)
        if (parsed.length === 0) setImportError('Không tìm thấy học sinh mới nào trong file (có thể tất cả đã tồn tại).')
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'File Excel không đọc được')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImportConfirm() {
    if (importRows.length === 0) return
    setImportLoading(true)
    try {
      await bulkAddStudents(importRows)
      setImportOpen(false)
      setImportRows([])
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Nhập danh sách thất bại')
    } finally {
      setImportLoading(false)
    }
  }

  function downloadTemplate() {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['Họ và tên', 'Tên tiếng Anh'],
      ['Nguyễn Văn An', 'Andy'],
      ['Trần Thị Bình', 'Bella'],
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách lớp')
    XLSX.writeFile(wb, 'mau-danh-sach-hoc-sinh.xlsx')
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
          <span className="ml-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            (Select a Class)
          </span>
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

      <div className="flex flex-col gap-1.5">
        <label className="font-semibold" style={{ fontSize: 'var(--text-sm)' }}>
          Tên tiếng Anh <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(không bắt buộc)</span>
        </label>
        <input
          type="text"
          value={formEnglishName}
          onChange={e => setFormEnglishName(e.target.value)}
          placeholder="VD: Andy, Bella..."
          maxLength={60}
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Tìm học sinh..."
            className={cn(
              'px-3 py-2 rounded-[var(--radius-full)] border border-[var(--color-border)] w-full sm:w-auto sm:min-w-[180px]',
              'focus:outline-none focus:border-[var(--color-primary)]',
              'transition-all duration-[var(--transition-fast)]'
            )}
            style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)' }}
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

          <Button variant="secondary" leftIcon={<Upload size={16} />} onClick={() => { setImportError(null); setImportRows([]); setImportSkipped(0); setImportOpen(true) }}>
            Nhập Excel
          </Button>

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
                onChange={e => changeGridRows(+e.target.value)}
                className="w-14 px-2 py-1 border rounded-md text-center text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <label style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Cột:</label>
              <input type="number" min={1} max={12} value={gridCols}
                onChange={e => changeGridCols(+e.target.value)}
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
            attendanceStatus={attendanceStatusMap}
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
                <StudentCard
                  student={s}
                  onClick={() => openDetail(s)}
                  totalScore={scoreSummary[s.id]?.total_score ?? 0}
                  badgeCount={scoreSummary[s.id]?.badge_count ?? 0}
                />
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
                    <StudentCard
                      student={s}
                      compact
                      totalScore={scoreSummary[s.id]?.total_score ?? 0}
                      badgeCount={scoreSummary[s.id]?.badge_count ?? 0}
                    />
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
        onGiveScore={handleGiveScoreAndRefresh}
      />

      {/* ─── Modals ─── */}
      <StudentDetailModal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailTarget(null) }}
        student={detailTarget}
        classId={selectedClassId}
      />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="➕ Thêm học sinh mới">
        <StudentForm onSubmit={handleAdd} submitLabel="Thêm học sinh" />
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="✏️ Sửa thông tin học sinh">
        <StudentForm onSubmit={handleEdit} submitLabel="Lưu thay đổi" />
      </Modal>

      {/* ─── Modal nhập danh sách từ Excel ─── */}
      <Modal isOpen={importOpen} onClose={() => { if (!importLoading) setImportOpen(false) }} title="📥 Nhập danh sách học sinh từ Excel">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Chọn file <strong>.xlsx / .xls / .csv</strong> có cột <strong>"Họ và tên"</strong> và (không bắt buộc)
            <strong> "Tên tiếng Anh"</strong>. Học sinh trùng tên trong lớp sẽ được tự động bỏ qua.
          </p>

          <Button variant="ghost" size="sm" onClick={downloadTemplate} className="self-start">
            <FileDown size={14} /> Tải file mẫu
          </Button>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = '' }}
            className="block w-full text-sm rounded-[var(--radius-md)] border border-dashed p-3 cursor-pointer"
            style={{ borderColor: 'var(--color-border)' }}
          />

          {importError && (
            <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
              ⚠️ {importError}
            </p>
          )}

          {importRows.length > 0 && (
            <>
              <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 rounded-[var(--radius-md)] border p-2"
                style={{ borderColor: 'var(--color-border)' }}>
                {importRows.map((r, i) => (
                  <div key={`${r.name}-${i}`} className="flex items-center gap-2 text-sm px-1 py-0.5">
                    <span className="w-6 text-right font-bold flex-shrink-0"
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {i + 1}
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.name}</span>
                    {r.english_name && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                        ({r.english_name})
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Sẵn sàng thêm <strong>{importRows.length}</strong> học sinh
                {importSkipped > 0 ? ` · Bỏ qua ${importSkipped} dòng trùng` : ''}
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setImportOpen(false)} disabled={importLoading}>
                  Huỷ
                </Button>
                <Button onClick={handleImportConfirm} isLoading={importLoading}>
                  Nhập {importRows.length} học sinh
                </Button>
              </div>
            </>
          )}
        </div>
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
