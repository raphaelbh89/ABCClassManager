'use client'
// src/components/scanner/CardScannerModal.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { scanCardColors, type ScanResult } from '@/utils/colorDetection'
import { Camera, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react'

interface CardScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (counts: { red: number; green: number; yellow: number; blue: number }) => void
}

export function CardScannerModal({ isOpen, onClose, onConfirm }: CardScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [counts, setCounts] = useState<{ red: number; green: number; yellow: number; blue: number }>({
    red: 0,
    green: 0,
    yellow: 0,
    blue: 0,
  })

  // Khởi động Camera
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Ưu tiên camera sau
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      setCameraError('Không thể mở camera. Vui lòng cấp quyền truy cập camera trên thiết bị.')
    }
  }, [])

  // Dừng Camera
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      setIsScanning(false)
    }
    return () => stopCamera()
  }, [isOpen, startCamera, stopCamera])

  // Vòng lặp quét frame liên tục khi đang bật chế độ quét
  const processFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    canvas.width = 480
    canvas.height = 360
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const res = scanCardColors(canvas)
      setCounts(res.counts)
    }

    animFrameRef.current = requestAnimationFrame(processFrame)
  }, [])

  const handleToggleScan = () => {
    if (!isScanning) {
      setIsScanning(true)
      animFrameRef.current = requestAnimationFrame(processFrame)
    } else {
      setIsScanning(false)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }

  const handleAdjustCount = (color: 'red' | 'green' | 'yellow' | 'blue', delta: number) => {
    setCounts(prev => ({
      ...prev,
      [color]: Math.max(0, prev[color] + delta),
    }))
  }

  const handleConfirm = () => {
    onConfirm(counts)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📸 Quét thẻ màu học sinh" size="md">
      <div className="flex flex-col gap-4">
        {/* Khung Camera */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-[var(--color-border)]">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {cameraError ? (
            <div className="p-4 text-center text-white text-xs flex flex-col items-center gap-2">
              <AlertCircle size={24} className="text-red-400" />
              <span>{cameraError}</span>
            </div>
          ) : (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-sm">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-red-500 animate-ping' : 'bg-green-400'}`} />
              {isScanning ? 'Đang nhận diện màu...' : 'Camera sẵn sàng'}
            </div>
          )}
        </div>

        {/* Nút bấm Quét / Dừng */}
        <div className="flex gap-2">
          <Button
            variant={isScanning ? 'danger' : 'primary'}
            onClick={handleToggleScan}
            leftIcon={<Camera size={16} />}
            className="flex-1"
          >
            {isScanning ? '⏸️ Tạm dừng nhận diện' : '▶️ Bắt đầu quét màu (3s)'}
          </Button>
        </div>

        {/* Bảng kết quả nhận diện & Chỉnh sửa tay (Manual adjustment) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text)]">
            <span>Kết quả thẻ giơ lên:</span>
            <span className="text-[var(--color-text-muted)] font-normal">(Chạm +/- để chỉnh tay)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'red' as const, label: '🔴 Thẻ Đỏ (A)', count: counts.red, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { id: 'green' as const, label: '🟢 Thẻ Xanh (B)', count: counts.green, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
              { id: 'yellow' as const, label: '🟡 Thẻ Vàng (C)', count: counts.yellow, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              { id: 'blue' as const, label: '🔵 Thẻ Lam (D)', count: counts.blue, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            ].map(item => (
              <div
                key={item.id}
                className={`p-2 rounded-xl border ${item.bg} ${item.border} flex items-center justify-between`}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[var(--color-text)]">{item.label}</span>
                  <span className={`text-xl font-extrabold ${item.color}`}>{item.count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAdjustCount(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-sm flex items-center justify-center shadow-sm hover:bg-slate-50 active:scale-95"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleAdjustCount(item.id, +1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-sm flex items-center justify-center shadow-sm hover:bg-slate-50 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nút gửi kết quả lên TV */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleConfirm} leftIcon={<Check size={16} />}>
            ✅ Gửi kết quả lên Màn Chiếu TV
          </Button>
        </div>
      </div>
    </Modal>
  )
}
