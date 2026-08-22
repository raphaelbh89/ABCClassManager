// src/lib/supabase/middleware.ts
// Middleware helper để refresh session
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Nếu có cookie demo_user -> cho phép truy cập mọi trang
  const isDemo = request.cookies.get('demo_user')?.value === 'teacher'
  if (isDemo) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isDummyUrl = !supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_ID')

  // Nếu chưa cấu hình Supabase Cloud -> tạm thời cho phép vào để trải nghiệm
  if (isDummyUrl) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Redirect về login nếu chưa xác thực và đang vào trang cần auth
    const protectedPaths = ['/dashboard', '/attendance', '/students', '/game']
    const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

    if (!user && isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  } catch {
    // Tránh crash nếu Supabase URL không hợp lệ
    return supabaseResponse
  }

  return supabaseResponse
}
