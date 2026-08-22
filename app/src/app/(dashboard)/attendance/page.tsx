'use client'
// src/app/(dashboard)/attendance/page.tsx
// Trang điểm danh chính — luồng 4 bước: chọn lớp → chụp ảnh → xác nhận → lịch sử
import { useState, useCallback, useRef } from 'react'
import { useClasses } from '@/hooks/useClasses'
import { useStudents } from '@/hooks/useStudents'
import { useAttendance } from '@/hooks/useAttendance'
import { CameraCapture } from '@/components/attendance/CameraCapture'
import { AttendanceConfirm, type AttendanceEntry } from '@/components/attendance/AttendanceConfirm'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { AvatarDisplay } from '@/components/student/AvatarDisplay'
import { cn } from '@/utils/cn'
import {
  Camera, ClipboardCheck, CheckCircle,
  History, ChevronRight, GraduationCap,
  UserCheck, UserX, Clock, AlertCircle,
} from 'lucide-react'
import {
  analyzeClassPhoto,
  drawPresenceOverlay,
  type PresenceResult
} from '@/utils/presenceDetection'
import { useCurrentClass } from '@/context/ClassContext'
import type { AttendanceStatus } from '@/types'

type PagePhase = 'class-select' | 'idle' | 'camera' | 'analyzing' | 'confirm' | 'done'

export default function AttendancePage() {
  const { classes, currentClass, setCurrentClass, isLoading: classLoading } = useCurrentClass()
  const selectedClassId = currentClass?.id || null
  const setSelectedClassId = (id: string | null) => {
    if (!id) return
    const matched = classes.find(c => c.id === id)
    if (matched) setCurrentClass(matched)
  }
  const { students } = useStudents(selectedClassId)
  const { sessions, todaySession, fetchSessions, fetchToday, confirmAttendance } = useAttendance(selectedClassId)

  const [phase, setPhase] = useState<PagePhase>(selectedClassId ? 'idle' : 'class-select')
  const [analysisCanvas, setAnalysisCanvas] = useState<HTMLCanvasElement | null>(null)
  const [entries, setEntries] = useState<AttendanceEntry[]>([])
  const [analyzeRows, setAnalyzeRows] = useState(6)
  const [analyzeCols, setAnalyzeCols] = useState(6)
  const [threshold, setThreshold] = useState(180)
  const [cameraAngle, setCameraAngle] = useState<'from_board' | 'from_back'>('from_board')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Chọn lớp
  async function selectClass(classId: string) {
    setSelectedClassId(classId)
    setPhase('idle')
    await fetchToday()
    await fetchSessions()
  }

  // Nhận ảnh từ CameraCapture — chạy phân tích
  const handlePhotoCapture = useCallback((canvas: HTMLCanvasElement) => {
    setPhase('analyzing')
    setAnalysisCanvas(canvas)

    // Phân tích presence detection chuẩn góc chụp từ Bục giảng / Bảng đen
    const results = analyzeClassPhoto(canvas, analyzeRows, analyzeCols, { threshold, cameraAngle })

    // Vẽ overlay debug lên canvas
    drawPresenceOverlay(canvas, results, analyzeRows, analyzeCols, cameraAngle)

    // Map kết quả AI → entries học sinh (theo ghế)
    const seatResultMap = new Map<string, PresenceResult>()
    for (const r of results) {
      seatResultMap.set(`${r.row}-${r.col}`, r)
    }

    const presenceToStatus: Record<string, AttendanceStatus> = {
      present: 'present',
      absent:  'absent',
      unsure:  'present', // mặc định là có mặt nếu không chắc, GV sửa tay
    }

    const newEntries: AttendanceEntry[] = students.map(s => {
      const key = `${s.seat_row}-${s.seat_col}`
      const result = (s.seat_row != null && s.seat_col != null)
        ? seatResultMap.get(key)
        : undefined

      const aiStatus: AttendanceStatus = result
        ? presenceToStatus[result.presence]
        : 'present' // học sinh chưa có ghế → mặc định có mặt

      return {
        student: s,
        status: aiStatus,
        aiSuggested: aiStatus,
      }
    })

    setEntries(newEntries)
    setPhase('confirm')
  }, [students, analyzeRows, analyzeCols, threshold, cameraAngle])

  // Xác nhận & lưu
  async function handleConfirm(
    records: { student_id: string; status: AttendanceStatus; note?: string }[]
  ) {
    await confirmAttendance(records)
    setSaveSuccess(true)
    setPhase('done')
    await fetchSessions()
  }

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // ─── Bước 1: Chọn lớp ───
  if (phase === 'class-select') {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <h1 className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>
          📋 Điểm danh
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{today}</p>

        {classLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)]"
              style={{ background: 'var(--color-border)' }} />)}
          </div>
        ) : classes.length === 0 ? (
          <Card padding="lg" className="text-center py-12">
            <GraduationCap size={48} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p className="font-semibold">Chưa có lớp học</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Tạo lớp học trước tại mục Lớp học.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {classes.map(c => (
              <Card key={c.id} hover padding="md" className="cursor-pointer" onClick={() => selectClass(c.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-2xl"
                    style={{ background: 'var(--color-surface-alt)' }}>📚</div>
                  <div className="flex-1">
                    <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}>
                      {c.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Năm học {c.school_year} · Khối {c.grade_level}
                    </p>
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── Camera overlay ───
  if (phase === 'camera') {
    return (
      <CameraCapture
        onCapture={handlePhotoCapture}
        onClose={() => setPhase('idle')}
      />
    )
  }

  // ─── Đang phân tích ───
  if (phase === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        <p className="font-bold text-lg" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
          🔍 Đang phân tích ảnh...
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Đang phát hiện vị trí ghế ngồi
        </p>
      </div>
    )
  }

  // ─── Xác nhận thủ công ───
  if (phase === 'confirm') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Stepper */}
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <span style={{ color: 'var(--color-text-muted)' }}>{currentClass?.name}</span>
          <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ color: 'var(--color-primary)' }}>Xác nhận điểm danh</span>
        </div>

        {/* Preview canvas */}
        {analysisCanvas && (
          <div className="rounded-[var(--radius-lg)] overflow-hidden border-2"
            style={{ borderColor: 'var(--color-border)' }}>
            <canvas
              ref={el => { if (el && analysisCanvas) {
                el.width = analysisCanvas.width; el.height = analysisCanvas.height
                el.getContext('2d')?.drawImage(analysisCanvas, 0, 0)
              }}}
              className="w-full h-auto max-h-48 object-contain"
              style={{ background: '#000' }}
            />
          </div>
        )}

        {/* Calibration controls */}
        <details className="rounded-[var(--radius-md)] border"
          style={{ borderColor: 'var(--color-border)', padding: '10px 14px' }}>
          <summary className="cursor-pointer text-sm font-semibold"
            style={{ color: 'var(--color-text-muted)' }}>
            ⚙️ Cài đặt phân tích & Góc chụp (nâng cao)
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Góc chụp ảnh</label>
              <select
                value={cameraAngle}
                onChange={e => setCameraAngle(e.target.value as any)}
                className="px-2 py-1 border rounded text-xs"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <option value="from_board">👨‍🏫 Từ Bục giảng / Bảng đen</option>
                <option value="from_back">🏫 Từ Cuối lớp</option>
              </select>
            </div>
            {[
              { label: 'Số hàng ghế', value: analyzeRows, set: setAnalyzeRows, min: 1, max: 12 },
              { label: 'Số cột ghế', value: analyzeCols, set: setAnalyzeCols, min: 1, max: 12 },
              { label: 'Ngưỡng nhận diện', value: threshold, set: setThreshold, min: 50, max: 400 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                <input type="number" min={min} max={max} value={value}
                  onChange={e => set(+e.target.value)}
                  className="px-2 py-1 border rounded text-sm text-center"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-2"
            onClick={() => handlePhotoCapture(analysisCanvas!)}>
            🔄 Phân tích lại với góc này
          </Button>
        </details>

        <AttendanceConfirm
          entries={entries}
          onConfirm={handleConfirm}
          onReset={() => setPhase('idle')}
        />
      </div>
    )
  }

  // ─── Xong ───
  if (phase === 'done') {
    const present = todaySession?.records?.filter(r => r.status === 'present').length ?? 0
    const total = students.length
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-5 py-8 text-center">
        <div className="text-7xl animate-bounce">🎉</div>
        <h2 className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-primary)' }}>
          Điểm danh hoàn tất!
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {currentClass?.name} · {today}
        </p>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="font-bold text-3xl" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>{present}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Có mặt</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-3xl" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-heading)' }}>{total - present}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Vắng</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setPhase('idle')}>
            ← Quay lại
          </Button>
          <Button onClick={() => setPhase('camera')} leftIcon={<Camera size={16} />}>
            Chụp lại
          </Button>
        </div>
      </div>
    )
  }

  // ─── Bước 2: Idle — màn hình chính của lớp ───
  const todayPresent = todaySession?.records?.filter(r => r.status === 'present').length
  const totalStudents = students.length

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setPhase('class-select')}
          className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
          ← Lớp khác
        </button>
        <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
        <h1 className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>
          📋 {currentClass?.name}
        </h1>
      </div>
      <p className="text-sm -mt-3" style={{ color: 'var(--color-text-muted)' }}>{today}</p>

      {/* Today status card */}
      {todaySession?.confirmed_at ? (
        <Card padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(76,175,130,0.15)' }}>
            <CheckCircle size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: 'var(--color-primary)' }}>Đã điểm danh hôm nay</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {todayPresent}/{totalStudents} có mặt ·{' '}
              {new Date(todaySession.confirmed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPhase('camera')}
            leftIcon={<Camera size={14} />}>
            Chụp lại
          </Button>
        </Card>
      ) : (
        <Card padding="lg" className="text-center" style={{ border: '2px dashed var(--color-primary)' }}>
          <Camera size={40} className="mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
          <p className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Chưa điểm danh hôm nay
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {totalStudents > 0
              ? `Chụp 1 ảnh toàn lớp để điểm danh ${totalStudents} học sinh`
              : 'Thêm học sinh vào lớp trước khi điểm danh'}
          </p>

          {/* Calibration hint */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            {[
              { icon: '📐', text: `Lưới: ${analyzeRows}×${analyzeCols} ghế` },
              { icon: '👨‍🏫', text: 'Chụp từ bục giảng' },
              { icon: '☀️', text: 'Ánh sáng tốt' },
            ].map(h => (
              <div key={h.icon} className="p-2 rounded-lg flex flex-col items-center gap-1"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
                <span className="text-lg">{h.icon}</span>
                <span>{h.text}</span>
              </div>
            ))}
          </div>

          <Button size="lg" leftIcon={<Camera size={18} />}
            onClick={() => setPhase('camera')}
            disabled={totalStudents === 0}>
            📸 Bắt đầu điểm danh
          </Button>
        </Card>
      )}

      {/* Danh sách học sinh nhanh */}
      {students.length > 0 && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)' }}>
              Học sinh ({totalStudents})
            </h2>
            {todaySession && (
              <div className="flex gap-2">
                <Badge variant="primary"><UserCheck size={12} /> {todayPresent}</Badge>
                <Badge variant="danger"><UserX size={12} /> {totalStudents - (todayPresent ?? 0)}</Badge>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {students.map(s => {
              const record = todaySession?.records?.find(r => r.student_id === s.id)
              const statusCfg = record ? {
                present: { color: 'var(--color-primary)', icon: '✅' },
                absent:  { color: 'var(--color-danger)',  icon: '❌' },
                late:    { color: 'var(--color-secondary)', icon: '⏰' },
              }[record.status] : null

              return (
                <div key={s.id}
                  className="flex items-center gap-2 p-2 rounded-[var(--radius-md)]"
                  style={{
                    background: statusCfg ? `${statusCfg.color}11` : 'var(--color-surface-alt)',
                    border: `1px solid ${statusCfg ? statusCfg.color + '44' : 'var(--color-border)'}`,
                  }}>
                  <AvatarDisplay config={s.avatar_config} size="xs" />
                  <p className="text-xs font-semibold truncate flex-1" style={{ color: 'var(--color-text)' }}>
                    {s.name.split(' ').slice(-2).join(' ')}
                  </p>
                  {statusCfg && <span>{statusCfg.icon}</span>}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Lịch sử điểm danh */}
      {sessions.length > 0 && (
        <Card padding="md">
          <h2 className="font-bold mb-3 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)' }}>
            <History size={18} style={{ color: 'var(--color-text-muted)' }} />
            Lịch sử điểm danh
          </h2>
          <div className="flex flex-col gap-2">
            {sessions.slice(0, 10).map(session => {
              const presentCount = session.records?.filter(r => r.status === 'present').length ?? 0
              const d = new Date(session.date + 'T00:00:00')
              return (
                <div key={session.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--color-surface-alt)', color: 'var(--color-primary)' }}>
                    {d.getDate()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {d.toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {presentCount}/{totalStudents} có mặt
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={presentCount === totalStudents ? 'primary' : 'danger'}>
                      {presentCount === totalStudents ? '✓ Đầy đủ' : `${totalStudents - presentCount} vắng`}
                    </Badge>
                    {session.confirmed_at && (
                      <Badge variant="neutral">✓</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
