'use client'
// src/app/(dashboard)/settings/page.tsx
// Cài đặt & Quản lý Hệ thống: Môn Giảng Dạy Tiếng Anh, Cấu hình AI Key, Xuất Báo Cáo & Đổi Mật Khẩu
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
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react'

const TEACHING_SUBJECT_OPTIONS = [
  {
    id: 'all_english',
    title: '🌟 Tất cả Tiếng Anh (Khuyên dùng)',
    desc: 'Bao gồm Tiếng Anh tổng quát, Toán Tiếng Anh (Math) và Khoa học Tiếng Anh (Science)',
  },
  {
    id: 'Tiếng Anh',
    title: '🔤 Tiếng Anh (Language & Grammar)',
    desc: 'Chuyên sâu từ vựng, ngữ pháp, đại từ xưng hô, giao tiếp tiếng Anh tiểu học',
  },
  {
    id: 'Toán Tiếng Anh',
    title: '📐 Toán Tiếng Anh (Math in English)',
    desc: 'Các phép tính, hình học, số đếm và đơn vị đo lường bằng tiếng Anh',
  },
  {
    id: 'Khoa học Tiếng Anh',
    title: '🔬 Khoa học Tiếng Anh (Science in English)',
    desc: 'Vũ trụ, hệ mặt trời, động thực vật và cơ thể người bằng tiếng Anh',
  },
  {
    id: 'all',
    title: '🌐 Toàn bộ các môn học',
    desc: 'Hiển thị đầy đủ cả Toán học, Tiếng Việt, Tự nhiên & Xã hội và Tiếng Anh',
  },
]

export default function SettingsPage() {
  const { classes, currentClass, setCurrentClass } = useCurrentClass()
  const selectedClassId = currentClass?.id || classes[0]?.id || ''
  const setSelectedClassId = (id: string) => {
    const matched = classes.find(c => c.id === id)
    if (matched) setCurrentClass(matched)
  }

  const { students } = useStudents(selectedClassId || null)
  const { sessions } = useAttendance(selectedClassId || null)

  // Cài đặt Môn Giảng Dạy & AI
  const [teachingSubject, setTeachingSubject] = useState<string>('all_english')
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'groq' | 'local'>('gemini')
  const [apiKey, setApiKey] = useState('')

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

    try {
      const savedSubject = localStorage.getItem('classmanager_teaching_subject')
      if (savedSubject) setTeachingSubject(savedSubject)

      const savedAiKey = localStorage.getItem('classmanager_ai_key')
      if (savedAiKey) setApiKey(savedAiKey)

      const savedAiProvider = localStorage.getItem('classmanager_ai_provider') as any
      if (savedAiProvider) setAiProvider(savedAiProvider)
    } catch {}
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
    try {
      localStorage.setItem('classmanager_teaching_subject', teachingSubject)
      localStorage.setItem('classmanager_ai_key', apiKey.trim())
      localStorage.setItem('classmanager_ai_provider', aiProvider)
    } catch {}

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
          <span className="ml-2 font-semibold text-sm text-[var(--color-text-muted)]">
            (System Settings & Management)
          </span>
        </h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          Cấu hình môn giảng dạy, API Key AI tạo câu hỏi, tài khoản và hiệu chỉnh nhận diện camera
        </p>
      </div>

      {/* ─── MỤC MỚI: MÔN HỌC GIẢNG DẠY CỦA GIÁO VIÊN ─── */}
      <Card padding="md" className="flex flex-col gap-4 border shadow-sm bg-gradient-to-br from-amber-50/30 to-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs">
              🎓
            </div>
            <div>
              <h2 className="font-black text-base text-[var(--color-text)]">Môn Học Giảng Dạy Của Giáo Viên</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Lựa chọn môn học chính để Trung tâm trò chơi và Ngân hàng câu hỏi ưu tiên hiển thị đúng chuyên môn
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEACHING_SUBJECT_OPTIONS.map(opt => {
            const isSelected = teachingSubject === opt.id
            return (
              <div
                key={opt.id}
                onClick={() => setTeachingSubject(opt.id)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-400/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">{opt.title}</span>
                  {isSelected && <CheckCircle2 size={16} className="text-amber-600" />}
                </div>
                <p className="text-xs text-slate-500 leading-snug">{opt.desc}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ─── MỤC MỚI: CẤU HÌNH AI KEY TẠO CÂU HỎI THEO CHỦ ĐỀ ─── */}
      <Card padding="md" className="flex flex-col gap-4 border shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-xs">
              🤖
            </div>
            <div>
              <h2 className="font-black text-base text-[var(--color-text)]">Cấu Hình AI Key (Tạo Bộ Câu Hỏi Theo Chủ Đề)</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Hỗ trợ Google Gemini Miễn Phí (Khuyên dùng), Groq Miễn Phí hoặc OpenAI ChatGPT
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'gemini', label: '🌟 Google Gemini (Miễn phí 100%)' },
              { id: 'openai', label: '🤖 OpenAI ChatGPT' },
              { id: 'groq', label: '⚡ Groq Llama 3.3 (Miễn phí)' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setAiProvider(p.id as any)}
                className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                  aiProvider === p.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Dán API Key của bạn:</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={`Dán ${aiProvider === 'gemini' ? 'Gemini API Key (AIza...)' : aiProvider === 'openai' ? 'OpenAI API Key (sk-...)' : 'Groq API Key (gsk_...)'}`}
              className="p-3 rounded-xl border border-slate-300 bg-white text-xs font-mono"
            />
            <span className="text-xs text-slate-500 leading-relaxed mt-0.5">
              {aiProvider === 'gemini' && '🎁 Lấy Key Google Gemini miễn phí 100% tại: aistudio.google.com (15 yêu cầu/phút)'}
              {aiProvider === 'openai' && '🔑 Dùng tài khoản OpenAI ChatGPT API (mô hình gpt-4o-mini)'}
              {aiProvider === 'groq' && '⚡ Lấy Key Groq miễn phí 100% tại: console.groq.com (Llama 3.3 siêu nhanh)'}
            </span>
          </div>
        </div>
      </Card>

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
          <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text)]">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
                required
                className="w-full p-2.5 rounded-lg border text-sm pr-9"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text)]">Mật khẩu mới</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
              className="w-full p-2.5 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text)]">Xác nhận mật khẩu</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                className="w-full p-2.5 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <Button type="submit" isLoading={pwLoading} leftIcon={<KeyRound size={15} />}>
                Đổi
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Mục 2: Xuất Báo Cáo & Sổ Điểm */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="font-bold text-base text-[var(--color-text)]">Xuất Báo Cáo & Sổ Điểm</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Đang chọn: <span className="font-bold text-[var(--color-primary)]">{activeClass?.name || 'Chưa chọn lớp'}</span> ({students.length} học sinh)
              </p>
            </div>
          </div>

          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="p-2 rounded-lg border bg-white text-xs font-bold"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="secondary"
            leftIcon={<FileSpreadsheet size={16} className="text-emerald-600" />}
            onClick={handleExportStudentsExcel}
            className="justify-start py-3"
          >
            Xuất Danh sách lớp (Excel)
          </Button>

          <Button
            variant="secondary"
            leftIcon={<FileSpreadsheet size={16} className="text-emerald-600" />}
            onClick={handleExportAttendanceExcel}
            className="justify-start py-3"
          >
            Xuất Sổ Điểm danh (Excel)
          </Button>

          <Button
            variant="secondary"
            leftIcon={<FileText size={16} className="text-rose-600" />}
            onClick={handleExportPDF}
            className="justify-start py-3"
          >
            Xuất Phiếu Báo Cáo (PDF)
          </Button>
        </div>
      </Card>

      {/* Mục 3: Cài đặt Âm thanh & Trải nghiệm */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔔</span>
          <h2 className="font-bold text-base text-[var(--color-text)]">Âm thanh & Trải nghiệm</h2>
        </div>

        <div className="flex flex-col gap-3">
          {/* Chế độ yên lặng */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="font-bold text-sm text-[var(--color-text)]">Chế độ im lặng trong giờ kiểm tra</p>
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
