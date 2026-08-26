'use client'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ClipboardCheck, Gamepad2, Trophy, Users } from 'lucide-react'
import { useCurrentClass } from '@/context/ClassContext'
import Link from 'next/link'

const quickActions = [
  {
    icon: '📋',
    title: 'Điểm danh',
    desc: 'Điểm danh hôm nay',
    href: '/attendance',
    color: 'var(--color-info)',
  },
  {
    icon: '🎮',
    title: 'Bắt đầu Game',
    desc: 'Tạo quiz nhanh',
    href: '/game',
    color: 'var(--color-accent)',
  },
  {
    icon: '🏆',
    title: 'Bảng xếp hạng',
    desc: 'Xem top học sinh',
    href: '/students',
    color: 'var(--color-secondary)',
  },
  {
    icon: '👥',
    title: 'Học sinh',
    desc: 'Quản lý nhân vật',
    href: '/students',
    color: 'var(--color-primary)',
  },
]

export default function DashboardPage() {
  const { currentClass } = useCurrentClass()

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div
        className="rounded-[var(--radius-xl)] p-6 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div>
          <h1
            className="text-white font-bold mb-1"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}
          >
            Chào buổi sáng! 👋
            <span className="ml-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.75)' }}>
              (Good Morning!)
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-sm)' }}>
            Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} • {currentClass ? `${currentClass.name} (Khối ${currentClass.grade_level})` : 'Chưa chọn lớp'}
          </p>
        </div>
        <div className="text-5xl hidden sm:block select-none">🦉</div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2
          className="font-bold mb-3"
          style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}
        >
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link key={action.href + action.title} href={action.href}>
              <Card hover className="text-center py-6 px-4">
                <div className="text-4xl mb-2">{action.icon}</div>
                <p
                  className="font-bold"
                  style={{ color: action.color, fontSize: 'var(--text-base)' }}
                >
                  {action.title}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {action.desc}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-white text-xl"
            style={{ background: 'var(--color-primary)' }}
          >
            <ClipboardCheck size={24} />
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Có mặt hôm nay</p>
            <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-primary)' }}>
              30<span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>/32</span>
            </p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            <Gamepad2 size={24} />
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Game tuần này</p>
            <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-accent)' }}>
              5 <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>phiên</span>
            </p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-white"
            style={{ background: 'var(--color-secondary)' }}
          >
            <Trophy size={24} />
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Huy hiệu hôm nay</p>
            <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-secondary)' }}>
              3 🏅
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card padding="md">
        <h2
          className="font-bold mb-4"
          style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)' }}
        >
          🌟 Hoạt động gần đây
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { emoji: '🌟', text: 'Nguyễn Văn An đạt huy hiệu "Siêu Sao"', time: '15 phút trước', color: 'var(--color-secondary)' },
            { emoji: '🏆', text: 'Nhóm B thắng Quiz Toán học', time: '1 giờ trước', color: 'var(--color-primary)' },
            { emoji: '📋', text: 'Điểm danh lớp 3A hoàn tất — 30/32 có mặt', time: '3 giờ trước', color: 'var(--color-info)' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
              <span className="text-xl">{item.emoji}</span>
              <p className="flex-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                {item.text}
              </p>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
