// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value
  const pathname = request.nextUrl.pathname

  const protectedPaths = ['/dashboard', '/attendance', '/students', '/game', '/classes', '/questions', '/settings']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (!userId && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (userId && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
