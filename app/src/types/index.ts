// src/types/index.ts
// Định nghĩa tất cả TypeScript types dùng chung trong project

export type AvatarConfig = {
  type: 'owl' | 'rocket' | 'star' | 'robot' | 'cat' | 'dragon'
  color: string
  accessory?: string
}

export type Student = {
  id: string
  class_id: string
  name: string
  avatar_config: AvatarConfig
  seat_row: number | null
  seat_col: number | null
  is_active: boolean
  created_at: string
}

export type Class = {
  id: string
  teacher_id: string
  name: string
  school_year: string
  grade_level: number
  room_code: string
  is_active: boolean
  created_at: string
}

export type Criterion = {
  id: string
  class_id: string
  name: string
  icon: string
  max_score: number
  sort_order: number
  is_active: boolean
}

export type Evaluation = {
  id: string
  student_id: string
  criteria_id: string
  score: number
  note?: string
  session_type: 'quick' | 'periodic' | 'game'
  evaluated_at: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late'

export type AttendanceRecord = {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  note?: string
}

export type AttendanceSession = {
  id: string
  class_id: string
  date: string
  seat_layout_id?: string
  confirmed_at?: string
  records?: AttendanceRecord[]
}

export type SeatLayoutItem = {
  student_id: string
  student_name: string
  row: number
  col: number
}

export type Achievement = {
  id: string
  student_id: string
  badge_type: string
  trigger_description?: string
  earned_at: string
}

export type QuestionType = 'mcq' | 'true_false' | 'truefalse' | 'buzzer'

export type Question = {
  id: string
  teacher_id: string
  subject?: string
  content: string
  question_type: QuestionType
  options?: { label: string; text: string }[]
  correct_answer?: string
  duration_seconds: number
  is_active: boolean
  created_at: string
}

export type GameType = 'individual' | '1v1' | 'team' | 'collective'
export type GameStatus = 'waiting' | 'active' | 'finished'

export type GameSession = {
  id: string
  class_id: string
  game_type: GameType
  template?: Record<string, unknown>
  status: GameStatus
  room_code: string
  started_at?: string
  finished_at?: string
  created_at: string
}

// ─── Display / Scanner sync payload ───
export type SyncPayload =
  | { type: 'SHOW_QUESTION'; question: Question; questionIndex: number; total: number }
  | { type: 'START_TIMER'; durationSeconds: number }
  | { type: 'SCAN_RESULT'; counts: { red: number; green: number; yellow: number; blue: number } }
  | { type: 'REVEAL_ANSWER'; correctAnswer: string; scores: { studentId: string; delta: number }[] }
  | { type: 'SHOW_LEADERBOARD'; ranks: { studentId: string; name: string; total: number }[] }
  | { type: 'GAME_OVER' }
