'use client'
// src/components/common/QRCodeCanvas.tsx
import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeCanvasProps {
  text: string
  size?: number
  className?: string
}

export function QRCodeCanvas({ text, size = 180, className = '' }: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !text) return

    QRCode.toCanvas(
      canvasRef.current,
      text,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#1E293B',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      err => {
        if (err) console.error('Error generating QR Code', err)
      }
    )
  }, [text, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-2xl shadow-md border border-slate-200 ${className}`}
    />
  )
}
