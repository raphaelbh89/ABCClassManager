// src/app/(auth)/layout.tsx
// Layout cho nhóm trang auth (login, register) — không có sidebar
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
