// src/app/api/auth/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    let teacher: any
    if (userId) {
      teacher = db.prepare('SELECT id, name, email, school FROM teachers WHERE id = ?').get(userId)
    }

    if (!teacher) {
      teacher = db.prepare('SELECT id, name, email, school FROM teachers LIMIT 1').get()
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    return NextResponse.json({ user: teacher })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, name, email, password, school, current_password, new_password } = body

    if (action === 'register') {
      const existing = db.prepare('SELECT id FROM teachers WHERE email = ?').get(email)
      if (existing) {
        return NextResponse.json({ error: 'Email này đã được sử dụng' }, { status: 400 })
      }

      const id = `teacher-${Date.now()}`
      db.prepare(`
        INSERT INTO teachers (id, name, email, school, password_hash)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name.trim(), email.trim(), school?.trim() || '', password)

      const response = NextResponse.json({ success: true, user: { id, name, email, school } })
      response.cookies.set('user_id', id, { path: '/', maxAge: 86400 * 7 })
      return response
    }

    if (action === 'login') {
      const user = db.prepare('SELECT * FROM teachers WHERE email = ?').get(email) as any
      if (!user || user.password_hash !== password) {
        return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 400 })
      }

      const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, school: user.school } })
      response.cookies.set('user_id', user.id, { path: '/', maxAge: 86400 * 7 })
      return response
    }

    // ─── Cập nhật hồ sơ giáo viên (đổi tên / trường) ───
    if (action === 'update_profile') {
      const cookieStore = await cookies()
      const userId = cookieStore.get('user_id')?.value

      let user: any
      if (userId) {
        user = db.prepare('SELECT * FROM teachers WHERE id = ?').get(userId)
      }
      if (!user) {
        user = db.prepare('SELECT * FROM teachers LIMIT 1').get()
      }

      if (!user) {
        return NextResponse.json({ error: 'Không tìm thấy tài khoản người dùng' }, { status: 404 })
      }

      const newName = String(body.new_name || '').trim()
      if (!newName) {
        return NextResponse.json({ error: 'Tên giáo viên không được để trống' }, { status: 400 })
      }
      if (newName.length > 80) {
        return NextResponse.json({ error: 'Tên quá dài (tối đa 80 ký tự)' }, { status: 400 })
      }
      const newSchool = body.new_school !== undefined ? String(body.new_school).trim().slice(0, 120) : user.school

      db.prepare('UPDATE teachers SET name = ?, school = ? WHERE id = ?').run(newName, newSchool, user.id)

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật hồ sơ thành công!',
        user: { id: user.id, name: newName, email: user.email, school: newSchool },
      })
    }

    // ─── Đổi mật khẩu tài khoản ───
    if (action === 'change_password') {
      const cookieStore = await cookies()
      const userId = cookieStore.get('user_id')?.value

      let user: any
      if (userId) {
        user = db.prepare('SELECT * FROM teachers WHERE id = ?').get(userId)
      }
      if (!user) {
        user = db.prepare('SELECT * FROM teachers LIMIT 1').get()
      }

      if (!user) {
        return NextResponse.json({ error: 'Không tìm thấy tài khoản người dùng' }, { status: 404 })
      }

      if (user.password_hash && user.password_hash !== current_password) {
        return NextResponse.json({ error: 'Mật khẩu hiện tại không chính xác' }, { status: 400 })
      }

      if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, { status: 400 })
      }

      db.prepare('UPDATE teachers SET password_hash = ? WHERE id = ?').run(new_password, user.id)

      return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công!' })
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý' }, { status: 500 })
  }
}
