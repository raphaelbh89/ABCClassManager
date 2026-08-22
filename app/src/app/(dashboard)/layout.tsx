// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ClassProvider } from '@/context/ClassContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClassProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ClassProvider>
  )
}
