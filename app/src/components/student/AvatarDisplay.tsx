'use client'
// src/components/student/AvatarDisplay.tsx
// Hiển thị avatar nhân vật học sinh kiểu RPG (không cần ảnh thật)
import { cn } from '@/utils/cn'
import type { AvatarConfig } from '@/types'

const AVATAR_EMOJI: Record<AvatarConfig['type'], string> = {
  owl:    '🦉',
  rocket: '🚀',
  star:   '⭐',
  robot:  '🤖',
  cat:    '🐱',
  dragon: '🐲',
}

interface AvatarDisplayProps {
  config: AvatarConfig
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showRing?: boolean
}

const sizeStyles = {
  xs: { container: 'w-7 h-7', emoji: 'text-sm' },
  sm: { container: 'w-10 h-10', emoji: 'text-xl' },
  md: { container: 'w-14 h-14', emoji: 'text-3xl' },
  lg: { container: 'w-20 h-20', emoji: 'text-5xl' },
  xl: { container: 'w-28 h-28', emoji: 'text-7xl' },
}

export function AvatarDisplay({
  config,
  size = 'md',
  className,
  showRing = false,
}: AvatarDisplayProps) {
  const { container, emoji } = sizeStyles[size]
  const bgColor = config.color ?? 'var(--color-primary)'

  return (
    <div
      className={cn(
        container,
        'rounded-full flex items-center justify-center flex-shrink-0',
        'select-none',
        showRing && 'ring-4 ring-offset-2',
        className
      )}
      style={{
        background: `${bgColor}22`,  // 13% opacity tint
        border: `2px solid ${bgColor}`,
        ...(showRing ? { '--tw-ring-color': bgColor } as React.CSSProperties : {}),
      }}
    >
      <span className={emoji} role="img" aria-label="avatar">
        {AVATAR_EMOJI[config.type] ?? '🦉'}
      </span>
    </div>
  )
}

// ─── Avatar Picker ─── (dùng khi tạo/sửa học sinh)
const AVATAR_TYPES: AvatarConfig['type'][] = ['owl', 'rocket', 'star', 'robot', 'cat', 'dragon']
const AVATAR_COLORS = [
  '#4CAF82', '#FFB347', '#7C4DFF', '#29B6F6',
  '#FF5252', '#FF80AB', '#69F0AE', '#40C4FF',
]

interface AvatarPickerProps {
  value: AvatarConfig
  onChange: (config: AvatarConfig) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Type picker */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Chọn nhân vật
        </p>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...value, type })}
              className={cn(
                'w-12 h-12 rounded-[var(--radius-md)] text-2xl',
                'transition-all duration-[var(--transition-fast)]',
                'hover:scale-110',
                value.type === type
                  ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110'
                  : 'border border-[var(--color-border)]'
              )}
              style={{
                background: value.type === type ? `${value.color}22` : 'var(--color-surface)',
              }}
            >
              {AVATAR_EMOJI[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Chọn màu sắc
        </p>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...value, color })}
              className={cn(
                'w-8 h-8 rounded-full',
                'transition-all duration-[var(--transition-fast)]',
                'hover:scale-110',
                value.color === color && 'ring-2 ring-offset-2 ring-[var(--color-text)] scale-110'
              )}
              style={{ background: color }}
              aria-label={`Màu ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)]"
        style={{ background: 'var(--color-surface-alt)' }}>
        <AvatarDisplay config={value} size="md" showRing />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Xem trước nhân vật
        </p>
      </div>
    </div>
  )
}
