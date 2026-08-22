'use client'
// src/components/attendance/CameraCapture.tsx
// Chụp ảnh lớp học bằng camera thiết bị (PWA)
// ⚠️ Giới hạn: kết quả phân tích phụ thuộc ánh sáng/góc chụp — LUÔN có bước xác nhận thủ công

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { Camera, RotateCcw, Check, X, Flashlight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/common/Button'

interface CameraCaptureProps {
  onCapture: (canvas: HTMLCanvasElement) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<'preview' | 'captured' | 'error'>('preview')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  // Khởi động camera
  const startCamera = useCallback(async (mode: 'environment' | 'user' = 'environment') => {
    // Tắt stream cũ nếu có
    streamRef.current?.getTracks().forEach(t => t.stop())

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPhase('preview')
      setErrorMsg(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi camera'
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setErrorMsg('⛔ Chưa cấp quyền camera. Hãy cho phép trình duyệt truy cập camera.')
      } else if (msg.includes('NotFoundError')) {
        setErrorMsg('📷 Không tìm thấy camera trên thiết bị này.')
      } else {
        setErrorMsg(`Lỗi camera: ${msg}`)
      }
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [startCamera, facingMode])

  // Chụp ảnh từ video frame
  function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhase('captured')

    // Tắt camera để tiết kiệm pin sau khi chụp
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function handleRetake() {
    startCamera(facingMode)
  }

  function handleConfirm() {
    const canvas = canvasRef.current
    if (!canvas) return
    onCapture(canvas)
  }

  function toggleCamera() {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: '#000', zIndex: 'var(--z-modal)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
        <p className="font-bold text-white" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}>
          📸 Chụp ảnh điểm danh
        </p>
        <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* Video preview */}
        <video
          ref={videoRef}
          className={cn('w-full h-full object-contain', phase === 'captured' && 'hidden')}
          playsInline
          muted
        />

        {/* Captured canvas */}
        <canvas
          ref={canvasRef}
          className={cn('w-full h-full object-contain', phase !== 'captured' && 'hidden')}
        />

        {/* Error state */}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <AlertCircle size={56} style={{ color: 'var(--color-danger)' }} />
            <p className="font-bold text-white text-lg">{errorMsg}</p>
            <Button variant="secondary" onClick={() => startCamera(facingMode)}>
              Thử lại
            </Button>
          </div>
        )}

        {/* Viewfinder grid overlay (preview mode) */}
        {phase === 'preview' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-amber-300 bg-black/50 px-3 py-1 rounded-full mx-auto">
              ⬆️ PHÍA SAU LỚP HỌC (BÀN CUỐI)
            </div>

            <div
              className="flex-1 my-2 rounded-xl relative flex items-center justify-between px-2"
              style={{ border: '2px dashed rgba(255,255,255,0.45)' }}
            >
              <span className="text-[10px] font-bold text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
                ⬅️ Dãy Trái
              </span>
              <span className="text-[10px] font-bold text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
                Dãy Phải ➡️
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] font-bold text-green-300 bg-black/50 px-3 py-1 rounded-full">
                ⬇️ VỊ TRÍ BẢNG ĐEN / BỤC GIẢNG (BÀN ĐẦU)
              </div>
              <p
                className="text-center font-semibold mt-1"
                style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-xs)' }}
              >
                💡 Đứng tại Bục giảng / Bảng đen, hướng camera xuống bao quát các dãy bàn
              </p>
            </div>
          </div>
        )}

        {/* Captured overlay */}
        {phase === 'captured' && (
          <div
            className="absolute top-3 left-0 right-0 text-center"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full font-bold text-white"
              style={{ background: 'rgba(76,175,130,0.85)', fontSize: 'var(--text-sm)' }}
            >
              ✓ Ảnh đã chụp — Xem lại trước khi xác nhận
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className="flex items-center justify-around px-6 py-5"
        style={{ background: 'rgba(0,0,0,0.7)' }}
      >
        {phase === 'preview' ? (
          <>
            {/* Đổi camera trước/sau */}
            <button
              onClick={toggleCamera}
              className="flex flex-col items-center gap-1 text-white/70 hover:text-white"
            >
              <RotateCcw size={24} />
              <span style={{ fontSize: '0.65rem' }}>Đổi camera</span>
            </button>

            {/* Nút chụp chính */}
            <button
              onClick={handleCapture}
              className={cn(
                'w-18 h-18 rounded-full border-4 border-white',
                'flex items-center justify-center',
                'bg-white/20 hover:bg-white/30 active:scale-95 transition-all'
              )}
              style={{ width: 72, height: 72 }}
              aria-label="Chụp ảnh"
            >
              <Camera size={32} className="text-white" />
            </button>

            {/* Placeholder */}
            <div className="w-12" />
          </>
        ) : phase === 'captured' ? (
          <>
            {/* Chụp lại */}
            <Button variant="ghost" onClick={handleRetake}
              leftIcon={<RotateCcw size={16} />}
              className="text-white border-white/40 hover:bg-white/10"
            >
              Chụp lại
            </Button>

            {/* Xác nhận dùng ảnh này */}
            <Button onClick={handleConfirm} size="lg" leftIcon={<Check size={18} />}>
              Dùng ảnh này
            </Button>
          </>
        ) : null}
      </div>

      {/* Warning banner */}
      <div
        className="px-4 py-2 text-center"
        style={{ background: 'rgba(255,179,71,0.15)', borderTop: '1px solid rgba(255,179,71,0.3)' }}
      >
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,179,71,0.9)' }}>
          ⚠️ Kết quả AI chỉ là gợi ý — Bắt buộc xác nhận thủ công trước khi lưu
        </p>
      </div>
    </div>
  )
}
