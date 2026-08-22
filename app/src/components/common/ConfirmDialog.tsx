'use client'
// src/components/common/ConfirmDialog.tsx
// Dialog xác nhận trước thao tác xoá — tuân thủ testing_protocol.md
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Xác nhận xoá',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 items-start">
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(255,82,82,0.1)' }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Huỷ
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
