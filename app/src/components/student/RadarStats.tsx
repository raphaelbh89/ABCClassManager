'use client'
// src/components/student/RadarStats.tsx
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

interface RadarStatItem {
  name: string
  icon: string
  score: number
  maxScore: number
}

interface RadarStatsProps {
  stats: RadarStatItem[]
}

export function RadarStats({ stats }: RadarStatsProps) {
  if (!stats || stats.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Chưa có dữ liệu đánh giá để vẽ biểu đồ
      </div>
    )
  }

  // Chuẩn hóa dữ liệu cho Recharts (thang điểm 100)
  const chartData = stats.map(s => ({
    subject: `${s.icon} ${s.name}`,
    score: Math.min(100, Math.round((s.score / (s.maxScore || 100)) * 100)),
    rawScore: s.score,
    fullMark: 100,
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--color-text)', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          />
          <Radar
            name="Chỉ số"
            dataKey="score"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
