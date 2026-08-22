// src/app/(auth)/register/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { cn } from '@/utils/cn'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('Cô Nguyễn Thu Hà')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [school, setSchool] = useState('Trường Tiểu học Kim Đồng')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password, school }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Lỗi đăng ký tài khoản')
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Lỗi kết nối máy chủ')
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <div
        className={cn(
          'w-full max-w-md relative',
          'bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
          'shadow-[var(--shadow-lg)] p-8'
        )}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🦉</div>
          <h1
            className="font-bold text-[var(--color-text)] text-2xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Đăng Ký Tài Khoản Giáo Viên
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Lưu trữ dữ liệu cục bộ trực tiếp trên máy chủ của bạn 🚀
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-[var(--color-text)]">
              Họ và tên Giáo viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Cô Nguyễn Thu Hà"
              required
              className="px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-[var(--color-text)]">
              Trường học / Đơn vị công tác
            </label>
            <input
              type="text"
              value={school}
              onChange={e => setSchool(e.target.value)}
              placeholder="Trường Tiểu học Kim Đồng"
              className="px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-[var(--color-text)]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="giaovien@gmail.com"
              required
              className="px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-[var(--color-text)]">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold text-center border border-red-200">
              ⚠️ {error}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} size="lg" className="mt-2 w-full">
            ✨ Tạo tài khoản & Vào Lớp
          </Button>
        </form>

        <p className="text-center mt-4 text-xs text-[var(--color-text-muted)]">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-[var(--color-primary)] font-bold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
