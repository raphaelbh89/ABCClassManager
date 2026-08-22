import type { Metadata, Viewport } from 'next'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: 'ClassManager Pro — Quản lý lớp học thông minh',
  description: 'Ứng dụng quản lý lớp học game hóa dành cho giáo viên tiểu học',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#4CAF82',
  width: 'device-width',
  initialScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full">
        {children}
      </body>
    </html>
  )
}
