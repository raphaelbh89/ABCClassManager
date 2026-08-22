'use client'
// src/components/display/DisplayScreen.tsx
// Màn Chiếu TV: Đồng Hồ Đếm Ngược Khổng Lồ Giữa Màn Hình + Mã QR Quét Nhanh
import { useEffect, useState, useMemo } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Clock, Sparkles, QrCode, X, Smartphone, AlertCircle } from 'lucide-react'
import { QRCodeCanvas } from '@/components/common/QRCodeCanvas'
import type { RealtimeEvent } from '@/services/sync'

interface DisplayScreenProps {
  roomCode: string
  lastEvent: RealtimeEvent | null
}

const OPTION_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  A: { bg: '#FF5252', border: '#D32F2F', text: '#FFFFFF', label: '🔴 Thẻ Đỏ' },
  B: { bg: '#4CAF82', border: '#358A62', text: '#FFFFFF', label: '🟢 Thẻ Xanh Lá' },
  C: { bg: '#FFB347', border: '#E0922A', text: '#FFFFFF', label: '🟡 Thẻ Vàng' },
  D: { bg: '#29B6F6', border: '#0288D1', text: '#FFFFFF', label: '🔵 Thẻ Xanh Dương' },
}

export function DisplayScreen({ roomCode, lastEvent }: DisplayScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [initialTime, setInitialTime] = useState<number>(15)
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null)
  const [scanCounts, setScanCounts] = useState<{ red: number; green: number; yellow: number; blue: number } | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [originUrl, setOriginUrl] = useState('')

  // Lấy origin URL trên client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin)
    }
  }, [])

  const qrConnectUrl = useMemo(() => {
    const base = originUrl || 'http://localhost:3005'
    return `${base}/scanner?code=${encodeURIComponent(roomCode)}`
  }, [originUrl, roomCode])

  // Xử lý sự kiện Realtime gửi từ điện thoại GV
  useEffect(() => {
    if (!lastEvent) return

    switch (lastEvent.type) {
      case 'SHOW_QUESTION':
        setCurrentQuestion(lastEvent.question)
        setQuestionIndex(lastEvent.index)
        setTotalQuestions(lastEvent.total)
        setRevealedAnswer(null)
        setScanCounts(null)
        setLeaderboard(null)
        setTimeLeft(null)
        break

      case 'START_TIMER':
        setInitialTime(lastEvent.seconds || 15)
        setTimeLeft(lastEvent.seconds || 15)
        break

      case 'STOP_TIMER':
        setTimeLeft(null)
        break

      case 'SCAN_PREVIEW':
        setScanCounts(lastEvent.counts)
        break

      case 'REVEAL_ANSWER':
        setRevealedAnswer(lastEvent.correctAnswer)
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        })
        break

      case 'TRIGGER_CONFETTI':
        confetti({
          particleCount: 130,
          spread: 100,
          origin: { y: 0.5 },
        })
        break

      case 'UPDATE_LEADERBOARD':
        setLeaderboard(lastEvent.leaderboard)
        break

      case 'RESET_VIEW':
        setCurrentQuestion(null)
        setRevealedAnswer(null)
        setScanCounts(null)
        setLeaderboard(null)
        setTimeLeft(null)
        break
    }
  }, [lastEvent])

  // Countdown timer tự động giảm
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Tính % vòng tròn đồng hồ đếm ngược
  const progressRatio = timeLeft !== null && initialTime > 0 ? timeLeft / initialTime : 0
  const strokeDashoffset = 283 * (1 - progressRatio)

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-6 sm:p-8 text-[var(--color-text)] select-none relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #FFFDE7, #E8F5E9)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ─── TOP BAR: Logo + QR Code + Room Code ─── */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] z-10">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🦉</span>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ClassManager Pro
            </h1>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              Màn Chiếu Lớp Học (Display Screen)
            </p>
          </div>
        </div>

        {/* Cụm Mã Phòng & Nút QR Kết Nối Nhanh */}
        <div className="flex items-center gap-3">
          {/* Nút bấm mở QR Code */}
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)] hover:bg-slate-50 transition-all cursor-pointer group"
            title="Quét mã QR bằng điện thoại để điều khiển"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <QrCode size={18} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                Quét QR Mobile
              </span>
              <span className="text-xs font-extrabold text-[var(--color-primary)]">
                Mở Điều Khiển
              </span>
            </div>
          </button>

          {/* Badge Mã Phòng */}
          <div className="bg-white px-5 py-2 rounded-2xl border border-[var(--color-border)] shadow-sm text-right">
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold block uppercase tracking-wider">
              Mã phòng kết nối
            </span>
            <span className="text-2xl font-black tracking-widest text-[var(--color-accent)] font-mono">
              {roomCode}
            </span>
          </div>
        </div>
      </div>

      {/* ─── NỘI DUNG CHÍNH Ở GIỮA (MAIN CENTER CONTENT) ─── */}
      <div className="flex-1 flex flex-col justify-center my-4 relative z-10">
        {leaderboard ? (
          // Bảng xếp hạng Top học sinh
          <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl p-8 border border-[var(--color-border)] shadow-xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <Trophy size={48} className="mx-auto mb-2 text-[var(--color-secondary)]" />
              <h2 className="text-3xl font-extrabold text-[var(--color-secondary)]" style={{ fontFamily: 'var(--font-heading)' }}>
                BẢNG VINH DANH LỚP HỌC 🏆
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {leaderboard.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-2xl font-bold text-xl border transition-all ${
                    idx === 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-md scale-105'
                      : idx === 1
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-white border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center text-2xl font-black">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[var(--color-primary)] font-extrabold">
                    {item.score} điểm
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : currentQuestion ? (
          // Màn hình hiển thị câu hỏi
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 relative">
            {/* Header Câu hỏi */}
            <div className="bg-white rounded-3xl p-8 border border-[var(--color-border)] shadow-lg text-center relative overflow-hidden">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-black bg-[var(--color-surface-alt)] text-[var(--color-primary)] mb-3">
                Câu hỏi {questionIndex}/{totalQuestions}
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold leading-snug text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {currentQuestion.content}
              </h2>
            </div>

            {/* Các lựa chọn đáp án */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(currentQuestion.options || []).map((opt: any) => {
                const optStyle = OPTION_COLORS[opt.label] || OPTION_COLORS['A']
                const isRevealed = revealedAnswer === opt.label
                const isWrong = revealedAnswer && !isRevealed

                return (
                  <div
                    key={opt.label}
                    className={`relative p-6 rounded-2xl border-4 font-bold text-2xl flex items-center gap-5 transition-all shadow-md ${
                      isRevealed
                        ? 'ring-8 ring-green-400 scale-105 shadow-2xl animate-pulse'
                        : isWrong
                        ? 'opacity-40 grayscale'
                        : ''
                    }`}
                    style={{
                      background: optStyle.bg,
                      borderColor: optStyle.border,
                      color: optStyle.text,
                    }}
                  >
                    <span className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center text-3xl font-black flex-shrink-0">
                      {opt.label}
                    </span>
                    <span className="flex-1 leading-normal">{opt.text}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/20 absolute top-3 right-3">
                      {optStyle.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Thống kê quét thẻ tạm thời */}
            {scanCounts && (
              <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-[var(--color-border)] flex items-center justify-around font-bold text-lg shadow-sm">
                <span className="text-[var(--color-text-muted)] text-sm">Kết quả giơ thẻ:</span>
                <span className="text-red-500">🔴 {scanCounts.red}</span>
                <span className="text-green-600">🟢 {scanCounts.green}</span>
                <span className="text-amber-500">🟡 {scanCounts.yellow}</span>
                <span className="text-blue-500">🔵 {scanCounts.blue}</span>
              </div>
            )}
          </div>
        ) : (
          // Màn hình chờ kết nối / Chưa bắt đầu câu hỏi
          <div className="max-w-2xl mx-auto w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 border-2 border-[var(--color-border)] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex-1 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black self-center md:self-start">
                <Smartphone size={15} />
                <span>KẾT NỐI ĐIỀU KHIỂN BẰNG ĐIỆN THOẠI</span>
              </div>
              <h2
                className="text-3xl font-black text-[var(--color-primary)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Sẵn Sàng Cho Tiết Học!
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Giáo viên mở camera điện thoại quét mã QR bên cạnh để vào thẳng bộ điều khiển, hoặc nhập mã phòng:
              </p>
              <div className="bg-[var(--color-surface-alt)] p-3 rounded-2xl border border-slate-200 inline-block self-center md:self-start">
                <span className="text-3xl font-black font-mono tracking-widest text-[var(--color-accent)]">
                  {roomCode}
                </span>
              </div>
            </div>

            {/* Khung Mã QR to rõ ràng */}
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-md">
              <QRCodeCanvas text={qrConnectUrl} size={190} />
              <span className="text-[11px] font-extrabold text-indigo-700">
                📸 Quét mã để kết nối ngay
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── ĐỒNG HỒ ĐẾM NGƯỢC KHỔNG LỒ Ở CHÍNH GIỮA MÀN HÌNH (CENTER GIANT STOPWATCH) ─── */}
      {timeLeft !== null && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/10 backdrop-blur-2xs animate-in fade-in duration-200">
          <div
            className={`relative flex flex-col items-center justify-center p-8 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.35)] border-8 transition-all transform ${
              timeLeft <= 5 && timeLeft > 0
                ? 'bg-red-600 border-red-300 text-white scale-110 animate-pulse'
                : timeLeft === 0
                ? 'bg-amber-500 border-amber-200 text-white scale-115'
                : 'bg-white/95 border-amber-400 text-slate-900 scale-100'
            }`}
            style={{ width: '280px', height: '280px' }}
          >
            {/* Vòng tròn SVG đếm ngược Radial Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-2" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={timeLeft <= 5 ? 'rgba(255,255,255,0.3)' : '#F1F5F9'}
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={timeLeft <= 5 ? '#FFFFFF' : '#F59E0B'}
                strokeWidth="7"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Nội dung bên trong đồng hồ */}
            <div className="flex flex-col items-center justify-center relative z-10">
              <Clock size={32} className={`mb-1 ${timeLeft <= 5 ? 'animate-bounce text-white' : 'text-amber-500'}`} />

              <span
                className={`font-black tracking-tight leading-none ${
                  timeLeft <= 5 ? 'text-8xl drop-shadow-md' : 'text-7xl text-slate-900'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {timeLeft}
              </span>

              <span className={`text-xs font-black uppercase tracking-widest mt-1 ${
                timeLeft <= 5 ? 'text-white/90' : 'text-slate-500'
              }`}>
                {timeLeft === 0 ? '⏰ HẾT GIỜ! GIƠ THẺ!' : 'GIÂY'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL PHÓNG TO MÃ QR KẾT NỐI ─── */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode size={28} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
                Quét Mã QR Kết Nối
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dùng camera điện thoại hoặc Zalo quét mã dưới đây để mở ngay bảng điều khiển Scanner.
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-inner">
              <QRCodeCanvas text={qrConnectUrl} size={220} />
            </div>

            <div className="bg-slate-100 px-4 py-2 rounded-xl text-center w-full">
              <span className="text-[11px] text-slate-500 font-bold block">Mã phòng</span>
              <span className="text-2xl font-black font-mono tracking-widest text-[var(--color-primary)]">
                {roomCode}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono break-all">
              {qrConnectUrl}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs font-semibold text-[var(--color-text-muted)] z-10">
        ClassManager Pro · Trải nghiệm học tập tương tác Game hóa
      </div>
    </div>
  )
}
