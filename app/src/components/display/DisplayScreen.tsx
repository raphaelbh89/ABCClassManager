'use client'
// src/components/display/DisplayScreen.tsx
// Màn Hình Chiếu TV Tương Tác: 1v1 Thanh Máu Đối Kháng, Đánh Boss Hoạt Hình, Tổ vs Tổ & Bảng Điểm Thật
import { useState, useEffect, useMemo } from 'react'
import confetti from 'canvas-confetti'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { QRCodeCanvas } from '@/components/common/QRCodeCanvas'
import {
  Trophy,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  Tv,
  QrCode,
  X,
  Swords,
  ShieldAlert,
  Flame,
  Heart,
  Crown,
  Zap,
} from 'lucide-react'
import type { RealtimeEvent, DuelPlayerState, TeamGroupState, BossFightState } from '@/services/sync'

interface DisplayScreenProps {
  roomCode: string
  lastEvent: RealtimeEvent | null
}

const OPTION_COLORS: Record<string, { bg: string; border: string; text: string; labelBg: string }> = {
  A: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-700', labelBg: 'bg-red-500' },
  B: { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-700', labelBg: 'bg-green-500' },
  C: { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-700', labelBg: 'bg-amber-500' },
  D: { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-700', labelBg: 'bg-blue-500' },
}

export function DisplayScreen({ roomCode, lastEvent }: DisplayScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null)
  const [questionIndex, setQuestionIndex] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [initialTime, setInitialTime] = useState<number>(15)
  const [scanCounts, setScanCounts] = useState<{ red: number; green: number; yellow: number; blue: number } | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [originUrl, setOriginUrl] = useState('')

  // Game States
  const [gameType, setGameType] = useState<'classic' | 'arena' | 'team' | 'boss'>('classic')
  const [duelState, setDuelState] = useState<{ p1: DuelPlayerState; p2: DuelPlayerState } | null>(null)
  const [teamState, setTeamState] = useState<TeamGroupState[] | null>(null)
  const [bossState, setBossState] = useState<BossFightState | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin)
    }
  }, [])

  const qrConnectUrl = useMemo(() => {
    const base = originUrl || 'http://localhost:3005'
    return `${base}/scanner?code=${encodeURIComponent(roomCode)}`
  }, [originUrl, roomCode])

  // Xử lý sự kiện Realtime gửi từ Scanner điện thoại
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

        if (lastEvent.game_type) setGameType(lastEvent.game_type)
        if (lastEvent.duel_state) setDuelState(lastEvent.duel_state)
        if (lastEvent.team_state) setTeamState(lastEvent.team_state)
        if (lastEvent.boss_state) setBossState(lastEvent.boss_state)

        if (lastEvent.seconds && lastEvent.seconds > 0) {
          setInitialTime(lastEvent.seconds)
          setTimeLeft(lastEvent.seconds)
        } else {
          setTimeLeft(null)
        }
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
        if (lastEvent.duel_state) setDuelState(lastEvent.duel_state)
        if (lastEvent.team_state) setTeamState(lastEvent.team_state)
        if (lastEvent.boss_state) setBossState(lastEvent.boss_state)
        if (lastEvent.leaderboard) setLeaderboard(lastEvent.leaderboard)

        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        })
        break

      case 'UPDATE_GAME_STATE':
        if (lastEvent.game_type) setGameType(lastEvent.game_type)
        if (lastEvent.duel_state) setDuelState(lastEvent.duel_state)
        if (lastEvent.team_state) setTeamState(lastEvent.team_state)
        if (lastEvent.boss_state) setBossState(lastEvent.boss_state)
        if (lastEvent.leaderboard) setLeaderboard(lastEvent.leaderboard)
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
        setTimeLeft(null)
        setScanCounts(null)
        setLeaderboard(null)
        break
    }
  }, [lastEvent])

  // Vòng lặp đếm ngược
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 bg-gradient-to-b from-amber-50/40 via-white to-slate-50 overflow-hidden select-none">
      {/* ─── ĐỒNG HỒ ĐẾM NGƯỢC TOP-CENTER (120px) ─── */}
      {timeLeft !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in zoom-in-75 duration-300">
          <div
            className={`w-[120px] h-[120px] rounded-full border-4 shadow-2xl flex flex-col items-center justify-center relative transition-all ${
              timeLeft <= 5 && timeLeft > 0
                ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-300 ring-8 ring-red-400/40 animate-pulse scale-105'
                : timeLeft === 0
                ? 'bg-slate-900 text-white border-slate-700 ring-4 ring-slate-500/20'
                : 'bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 text-slate-950 border-white ring-8 ring-amber-400/30'
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <Clock size={80} />
            </div>

            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={timeLeft <= 5 ? '#ffffff' : '#f59e0b'}
                strokeWidth="6"
                strokeDasharray="276"
                strokeDashoffset={276 * (1 - timeLeft / (initialTime || 15))}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tighter drop-shadow-md relative z-10 leading-none">
              {timeLeft}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5 opacity-90 relative z-10">
              {timeLeft === 0 ? 'HẾT GIỜ' : 'GIÂY'}
            </span>
          </div>
        </div>
      )}

      {/* ─── TOP BAR ─── */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--color-primary)] to-emerald-400 flex items-center justify-center text-white shadow-md">
            <Tv size={24} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
              Màn Chiếu TV Lớp Học
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] font-semibold">
              Đồng bộ trực tiếp qua điện thoại Scanner
            </p>
          </div>
        </div>

        {/* Mã Phòng & Nút Quét QR */}
        <div className="flex items-center gap-3">
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

      {/* ─── GIAO DIỆN ĐẶC BIỆT CHẾ ĐỘ 1: ĐỐI KHÁNG 1V1 (ARENA) ─── */}
      {gameType === 'arena' && duelState && (
        <div className="max-w-5xl mx-auto w-full my-2 bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-red-200 shadow-md flex items-center justify-between gap-4 z-20 animate-in fade-in duration-300">
          {/* Đấu thủ 1 (Bên Trái) */}
          <div className="flex-1 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
              🔴
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sm text-red-950 truncate">{duelState.p1.name}</span>
                <span className="text-xs font-black text-red-600">{duelState.p1.hp}% HP</span>
              </div>
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden border border-red-200 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-700"
                  style={{ width: `${duelState.p1.hp}%` }}
                />
              </div>
            </div>
          </div>

          {/* VS Biểu tượng */}
          <div className="flex flex-col items-center px-2">
            <span className="text-xl font-black text-slate-800 tracking-widest font-mono">VS</span>
            <Swords size={18} className="text-red-500 animate-pulse" />
          </div>

          {/* Đấu thủ 2 (Bên Phải) */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sm text-blue-950 truncate">{duelState.p2.name}</span>
                <span className="text-xs font-black text-blue-600">{duelState.p2.hp}% HP</span>
              </div>
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden border border-blue-200 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-700"
                  style={{ width: `${duelState.p2.hp}%` }}
                />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
              🔵
            </div>
          </div>
        </div>
      )}

      {/* ─── GIAO DIỆN ĐẶC BIỆT CHẾ ĐỘ 2: ĐÁNH BOSS (BOSS FIGHT) ─── */}
      {gameType === 'boss' && bossState && (
        <div className="max-w-5xl mx-auto w-full my-2 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-4 border-2 border-purple-400 shadow-xl flex items-center justify-between gap-4 z-20 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl bg-purple-800 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-lg transition-transform ${
              bossState.status === 'hit' ? 'animate-ping scale-110' : bossState.status === 'attack' ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {bossState.isDefeated ? '💥' : bossState.avatar || '🐉'}
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-300 block">
                {bossState.isDefeated ? '🎉 BOSS ĐÃ BỊ TIÊU DIỆT!' : 'BOSS THỬ THÁCH TẬP THỂ'}
              </span>
              <h3 className="font-extrabold text-base text-amber-300">{bossState.name}</h3>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <div className="flex justify-between items-center mb-1 text-xs font-black">
              <span className="text-purple-200">MÁU BOSS (HP)</span>
              <span className="text-amber-300 font-mono text-sm">{bossState.hp}% / 100%</span>
            </div>
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-purple-500/50 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 transition-all duration-700"
                style={{ width: `${bossState.hp}%` }}
              />
            </div>
          </div>

          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] text-purple-200 block font-bold">Tỉ lệ đúng cả lớp</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{bossState.overallAccuracy}%</span>
          </div>
        </div>
      )}

      {/* ─── NỘI DUNG CHÍNH Ở GIỮA ─── */}
      <div className="flex-1 flex flex-col justify-center my-3 relative z-10">
        {leaderboard ? (
          // Bảng xếp hạng thật
          <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl p-8 border border-[var(--color-border)] shadow-xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <Trophy size={48} className="mx-auto mb-2 text-amber-500" />
              <h2 className="text-3xl font-extrabold text-amber-950" style={{ fontFamily: 'var(--font-heading)' }}>
                BẢNG XẾP HẠNG THỰC TẾ LỚP HỌC 🏆
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">Tổng hợp điểm số thực tế từ các lượt trả lời câu hỏi</p>
            </div>
            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
              {leaderboard.slice(0, 8).map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl font-bold text-lg border transition-all ${
                    idx === 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-md scale-105'
                      : idx === 1
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : idx === 2
                      ? 'bg-orange-50 border-orange-200 text-orange-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-center text-xl font-black">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[var(--color-primary)] font-black text-xl font-mono">
                    {item.score} sao ⭐
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : currentQuestion ? (
          // Màn hình hiển thị câu hỏi
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-5 relative">
            {/* Header Câu hỏi */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--color-border)] shadow-lg text-center relative overflow-hidden">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-black bg-[var(--color-surface-alt)] text-[var(--color-primary)] mb-2">
                Câu hỏi {questionIndex} / {totalQuestions}
              </span>
              <h2
                className="text-2xl sm:text-4xl font-extrabold leading-snug text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {currentQuestion.content}
              </h2>
            </div>

            {/* Các lựa chọn đáp án */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(currentQuestion.options || []).map((opt: any) => {
                const optStyle = OPTION_COLORS[opt.label] || OPTION_COLORS['A']
                const isRevealed = revealedAnswer === opt.label
                const isWrong = revealedAnswer && !isRevealed

                return (
                  <div
                    key={opt.label}
                    className={`relative p-5 rounded-2xl border-4 font-bold text-xl sm:text-2xl flex items-center gap-4 transition-all shadow-md ${
                      isRevealed
                        ? 'bg-green-500 border-green-400 text-white scale-105 shadow-xl ring-8 ring-green-400/40 z-10'
                        : isWrong
                        ? 'bg-slate-100 border-slate-300 text-slate-400 opacity-40'
                        : `bg-white ${optStyle.border} ${optStyle.text} hover:scale-[1.01]`
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-sm flex-shrink-0 ${
                        isRevealed ? 'bg-white text-green-700' : optStyle.labelBg
                      }`}
                    >
                      {opt.label}
                    </div>
                    <span className="flex-1 leading-snug">{opt.text}</span>
                    {isRevealed && (
                      <span className="text-3xl animate-bounce">✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Màn hình chờ kết nối
          <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl p-8 sm:p-10 border border-[var(--color-border)] shadow-xl text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl shadow-inner animate-bounce">
              📺
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Sẵn Sàng Cho Tiết Học Tương Tác
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                Thầy/Cô hãy dùng điện thoại mở bộ điều khiển hoặc quét mã QR bên dưới để bắt đầu đẩy câu hỏi.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
              <QRCodeCanvas text={qrConnectUrl} size={160} className="rounded-xl shadow-xs" />
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-500 block">Quét mã QR để mở Scanner trên Mobile</span>
                <span className="text-base font-black text-[var(--color-primary)] font-mono">{roomCode}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM BAR ─── */}
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-4 z-20">
        <div className="flex items-center gap-2 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Kênh đồng bộ: Đang kết nối</span>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl border bg-white hover:bg-slate-100 transition-all text-slate-700 flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <Maximize2 size={16} />
          <span>Toàn màn hình</span>
        </button>
      </div>

      {/* ─── MODAL PHÓNG TO MÃ QR KẾT NỐI ─── */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl flex flex-col items-center gap-4 text-center">
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Mã QR Kết Nối Scanner
              </span>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <QRCodeCanvas text={qrConnectUrl} size={220} className="rounded-2xl border-4 border-amber-300 shadow-md p-2 bg-white" />

            <div>
              <span className="text-xs text-slate-500 block mb-1">Mã phòng kết nối</span>
              <span className="text-3xl font-black text-[var(--color-primary)] font-mono tracking-widest">{roomCode}</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Dùng camera điện thoại của Giáo viên quét mã này để mở trang điều khiển và quét thẻ màu.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
