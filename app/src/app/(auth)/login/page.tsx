// src/app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { cn } from '@/utils/cn'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('giaovien@gmail.com')
  const [password, setPassword] = useState('123456')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Email hoặc mật khẩu không chính xác')
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
          <div className="text-6xl mb-2">🦉</div>
          <h1
            className="font-bold text-[var(--color-text)] text-3xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ClassManager Pro
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Nền tảng quản lý lớp học cục bộ siêu tốc 🚀
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="font-semibold text-xs text-[var(--color-text)]"
            >
              Email giáo viên
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="giaovien@gmail.com"
              required
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-semibold text-xs text-[var(--color-text)]"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold text-center border border-red-200">
              ⚠️ {error}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
            🚀 Đăng nhập ngay
          </Button>
        </form>

        <div className="mt-5 p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
          <p className="font-bold text-[var(--color-primary)] mb-1">💡 Tài khoản mẫu có sẵn:</p>
          <p>• Email: <code className="font-mono font-bold text-slate-800">giaovien@gmail.com</code></p>
          <p>• Mật khẩu: <code className="font-mono font-bold text-slate-800">123456</code></p>
        </div>

        <p className="text-center mt-5 text-xs text-[var(--color-text-muted)]">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-[var(--color-primary)] font-bold hover:underline">
            Đăng ký mới
          </Link>
        </p>
      </div>
    </div>
  )
}
