-- ============================================================
-- ClassManager Pro — Database Schema
-- Engine: PostgreSQL (via Supabase)
-- Version: 0.1.0
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BẢNG: teachers (Giáo viên)
-- ============================================================
CREATE TABLE teachers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  school      TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG: classes (Lớp học)
-- ============================================================
CREATE TABLE classes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id   UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  school_year  TEXT NOT NULL,           -- VD: "2025-2026"
  grade_level  SMALLINT NOT NULL CHECK (grade_level BETWEEN 1 AND 5),
  room_code    VARCHAR(8) NOT NULL UNIQUE, -- Room code để sync Display & Scanner
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG: students (Học sinh)
-- ============================================================
CREATE TABLE students (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id       UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  avatar_config  JSONB NOT NULL DEFAULT '{}', -- {type, color, accessory, ...}
  seat_row       SMALLINT,    -- Vị trí hàng trong sơ đồ (NULL = chưa gán ghế)
  seat_col       SMALLINT,    -- Vị trí cột trong sơ đồ (NULL = chưa gán ghế)
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, seat_row, seat_col) -- Mỗi ghế chỉ 1 học sinh
);

-- ============================================================
-- BẢNG: seat_layouts (Lịch sử sơ đồ ghế)
-- Lưu snapshot theo thời gian để tra cứu điểm danh cũ đúng ngữ cảnh
-- ============================================================
CREATE TABLE seat_layouts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  layout_data     JSONB NOT NULL, -- [{student_id, row, col, name}, ...]
  effective_from  DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG: criteria (Tiêu chí đánh giá — tuỳ chỉnh theo lớp)
-- ============================================================
CREATE TABLE criteria (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '⭐',
  max_score  INT NOT NULL DEFAULT 100 CHECK (max_score > 0),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- BẢNG: evaluations (Đánh giá học sinh theo tiêu chí)
-- ============================================================
CREATE TABLE evaluations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  criteria_id   UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  score         INT NOT NULL CHECK (score >= 0),
  note          TEXT,
  session_type  TEXT NOT NULL CHECK (session_type IN ('quick', 'periodic', 'game')),
  evaluated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG: attendance_sessions (Phiên điểm danh)
-- ============================================================
CREATE TABLE attendance_sessions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id             UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  seat_layout_id       UUID REFERENCES seat_layouts(id),
  confirmed_at         TIMESTAMPTZ,
  UNIQUE(class_id, date)
);

-- ============================================================
-- BẢNG: attendance_records (Chi tiết điểm danh từng học sinh)
-- ============================================================
CREATE TABLE attendance_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  note        TEXT,
  UNIQUE(session_id, student_id)
);

-- ============================================================
-- BẢNG: achievements (Thành tích / Huy hiệu)
-- ============================================================
CREATE TABLE achievements (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id           UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_type           TEXT NOT NULL,
  trigger_description  TEXT,
  earned_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG: questions (Ngân hàng câu hỏi)
-- ============================================================
CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id       UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject          TEXT,
  content          TEXT NOT NULL,
  question_type    TEXT NOT NULL CHECK (question_type IN ('mcq', 'truefalse', 'buzzer')),
  options          JSONB,
  correct_answer   TEXT,
  duration_seconds INT NOT NULL DEFAULT 20 CHECK (duration_seconds BETWEEN 5 AND 120),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG: game_sessions (Phiên game)
-- ============================================================
CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  game_type    TEXT NOT NULL CHECK (game_type IN ('individual','1v1','team','collective')),
  template     JSONB,
  status       TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','finished')),
  room_code    VARCHAR(8) NOT NULL,
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BẢNG: game_results (Kết quả từng câu trong game)
-- ============================================================
CREATE TABLE game_results (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  student_id            UUID REFERENCES students(id) ON DELETE SET NULL,
  question_id           UUID REFERENCES questions(id) ON DELETE SET NULL,
  answer_given          TEXT,
  is_correct            BOOLEAN,
  scan_result_raw       JSONB,
  confirmed_by_teacher  BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX idx_evaluations_evaluated_at ON evaluations(evaluated_at);
CREATE INDEX idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_sessions_class_date ON attendance_sessions(class_id, date);
CREATE INDEX idx_game_results_session_id ON game_results(session_id);
CREATE INDEX idx_achievements_student_id ON achievements(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_own_classes" ON classes
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "teacher_own_students" ON students
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

CREATE POLICY "teacher_own_questions" ON questions
  FOR ALL USING (teacher_id = auth.uid());
