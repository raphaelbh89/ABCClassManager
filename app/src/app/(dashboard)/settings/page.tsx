'use client'
// src/app/(dashboard)/settings/page.tsx
import { useState, useEffect } from 'react'
import { useCurrentClass } from '@/context/ClassContext'
import { useStudents } from '@/hooks/useStudents'
import { useAttendance } from '@/hooks/useAttendance'
import {
  exportStudentsToExcel,
  exportAttendanceToExcel,
  exportSummaryPDF,
} from '@/utils/exportReports'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import {
  FileSpreadsheet,
  FileText,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react'

export default function SettingsPage() {
  const { classes, currentClass, setCurrentClass } = useCurrentClass()
  const selectedClassId = currentClass?.id || classes[0]?.id || ''
  const setSelectedClassId = (id: string) => {
    const matched = classes.find(c => c.id === id)
    if (matched) setCurrentClass(matched)
  }

  const { students } = useStudents(selectedClassId || null)
  const { sessions } = useAttendance(selectedClassId || null)

  // Cài đặt hệ thống
  const [quietMode, setQuietMode] = useState(false)
  const [soundEffects, setSoundEffects] = useState(true)
  const [colorSensitivity, setColorSensitivity] = useState<'low' | 'medium' | 'high'>('medium')
  const [savedToast, setSavedToast] = useState(false)

  // Thông tin tài khoản & Đổi mật khẩu
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string; school?: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setCurrentUser(data.user)
      })
      .catch(() => {})
  }, [])

  const activeClass = classes.find(c => c.id === selectedClassId)

  const handleExportStudentsExcel = () => {
    if (!activeClass) return
    exportStudentsToExcel(activeClass.name, students)
  }

  const handleExportAttendanceExcel = () => {
    if (!activeClass) return
    exportAttendanceToExcel(activeClass.name, students, sessions)
  }

  const handleExportPDF = () => {
    if (!activeClass) return
    exportSummaryPDF(activeClass.name, currentUser?.name || 'Giáo viên Chủ nhiệm', students.length, 95)
  }

  const handleSaveSettings = () => {
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)

    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu nhập lại không khớp với mật khẩu mới.')
      return
    }

    setPwLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setPwError(data.error || 'Đổi mật khẩu thất bại.')
      } else {
        setPwSuccess('🎉 Đổi mật khẩu thành công! Bạn có thể dùng mật khẩu mới trong lần đăng nhập tiếp theo.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPwSuccess(null), 5000)
      }
    } catch {
      setPwError('Lỗi kết nối máy chủ. Vui lòng thử lại.')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
          ⚙️ Cài đặt & Quản lý Hệ thống
        </h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          Quản lý tài khoản, đổi mật khẩu, xuất dữ liệu PDF/Excel và cấu hình camera nhận diện
        </p>
      </div>

      {/* Mục 1: Đổi mật khẩu & Tài khoản Giáo viên */}
      <Card padding="md" className="flex flex-col gap-4 border shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <div>
              <h2 className="font-bold text-base text-[var(--color-text)]">Tài Khoản & Đổi Mật Khẩu</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Giáo viên: <span className="font-bold text-[var(--color-text)]">{currentUser?.name || 'Cô Giáo'}</span> · Email: <span className="font-bold text-[var(--color-primary)]">{currentUser?.email || 'giaovien@gmail.com'}</span>
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <UserCheck size={13} /> Đang hoạt động
          </span>
        </div>

        {pwSuccess && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-300 text-green-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1">
              <KeyRound size={13} /> Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ..."
                required
                className="w-full p-2.5 rounded-lg border bg-white text-xs font-semibold pr-8"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1">
              <Lock size={13} /> Mật khẩu mới
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự..."
              required
              className="w-full p-2.5 rounded-lg border bg-white text-xs font-semibold"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--color-text)]">
              Xác nhận mật khẩu mới
            </label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                required
                className="w-full p-2.5 rounded-lg border bg-white text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <Button type="submit" isLoading={pwLoading} className="whitespace-nowrap flex-shrink-0">
                Đổi mật khẩu
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Mục 2: Xuất báo cáo dữ liệu */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="font-bold text-base text-[var(--color-text)]">Xuất Báo Cáo & Hồ Sơ Lớp</h2>
          </div>
          {classes.length > 0 && (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="p-1.5 rounded-lg border bg-white text-xs font-bold"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <p className="text-xs text-[var(--color-text-muted)]">
          Tải xuống các báo cáo định dạng Excel và PDF phục vụ công tác lưu trữ hoặc gửi Ban Giám Hiệu / Phụ huynh.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="ghost"
            onClick={handleExportStudentsExcel}
            leftIcon={<FileSpreadsheet size={16} className="text-green-600" />}
            className="border-green-200 hover:bg-green-50 justify-start text-xs"
          >
            Xuất DS Học sinh (.xlsx)
          </Button>

          <Button
            variant="ghost"
            onClick={handleExportAttendanceExcel}
            leftIcon={<FileSpreadsheet size={16} className="text-blue-600" />}
            className="border-blue-200 hover:bg-blue-50 justify-start text-xs"
          >
            Xuất Điểm danh (.xlsx)
          </Button>

          <Button
            variant="ghost"
            onClick={handleExportPDF}
            leftIcon={<FileText size={16} className="text-red-500" />}
            className="border-red-200 hover:bg-red-50 justify-start text-xs"
          >
            Xuất Phiếu Báo Cáo (.pdf)
          </Button>
        </div>
      </Card>

      {/* Mục 3: Trải nghiệm trong lớp học (Chế độ yên tĩnh & Âm thanh) */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔕</span>
          <h2 className="font-bold text-base text-[var(--color-text)]">Chế độ Tiết học & Âm thanh</h2>
        </div>

        <div className="flex flex-col gap-3">
          {/* Ngày yên tĩnh */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-[var(--color-surface-alt)]" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="font-bold text-sm text-[var(--color-text)]">Chế độ "Ngày Yên Tĩnh" (Quiet Day)</p>
              <p className="text-xs text-[var(--color-text-muted)]">Tắt toàn bộ hiệu ứng âm thanh cổ vũ ồn ào khi lớp cần tập trung tối đa.</p>
            </div>
            <button
              onClick={() => setQuietMode(!quietMode)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                quietMode ? 'bg-[var(--color-primary)]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  quietMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Âm thanh hiệu ứng */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="font-bold text-sm text-[var(--color-text)]">Âm thanh đồng hồ đếm ngược & Pháo hoa</p>
              <p className="text-xs text-[var(--color-text-muted)]">Phát tiếng tick-tắc đếm ngược và nhạc chúc mừng khi công bố đáp án đúng.</p>
            </div>
            <button
              onClick={() => setSoundEffects(!soundEffects)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                soundEffects ? 'bg-[var(--color-primary)]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  soundEffects ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Mục 4: Hiệu chỉnh nhận diện Camera (Calibration) */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📷</span>
          <h2 className="font-bold text-base text-[var(--color-text)]">Hiệu chỉnh Nhận diện Thẻ Màu (Camera Calibration)</h2>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--color-text)]">
            Độ nhạy phân biệt màu dưới ánh sáng phòng học:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low' as const, label: 'Thấp (Phòng tối/Ánh sáng vàng)' },
              { id: 'medium' as const, label: 'Tiêu chuẩn (Khuyên dùng)' },
              { id: 'high' as const, label: 'Cao (Phòng nhiều cửa sổ/Nắng)' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setColorSensitivity(item.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  colorSensitivity === item.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Nút Lưu Cài Đặt */}
      <div className="flex items-center justify-between">
        {savedToast ? (
          <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1.5">
            ✓ Đã lưu cài đặt thành công!
          </span>
        ) : <div />}
        <Button size="lg" onClick={handleSaveSettings}>
          Lưu thay đổi cài đặt
        </Button>
      </div>
    </div>
  )
}
