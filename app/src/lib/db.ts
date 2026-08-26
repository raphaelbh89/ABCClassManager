// src/lib/db.ts
// Quản lý cơ sở dữ liệu SQLite cục bộ ngay trong thư mục database/
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Đường dẫn file database đặt tại /database/classmanagers.db
const dbDir = path.resolve(process.cwd(), '../database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'classmanagers.db')
const db = new Database(dbPath)

// Tự động bật Foreign Keys & WAL mode (Write-Ahead Logging) cho tốc độ siêu nhanh < 1ms
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Khởi tạo toàn bộ cấu trúc bảng tự động
db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    school TEXT,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    name TEXT NOT NULL,
    school_year TEXT NOT NULL,
    grade_level INTEGER NOT NULL,
    room_code TEXT UNIQUE NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    english_name TEXT,
    avatar_config TEXT NOT NULL, -- JSON
    seat_row INTEGER,
    seat_col INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS criteria (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '⭐',
    max_score INTEGER NOT NULL DEFAULT 100,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    criteria_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    note TEXT,
    session_type TEXT NOT NULL,
    evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    confirmed_at DATETIME,
    UNIQUE(class_id, date),
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'present', 'absent', 'late'
    note TEXT,
    UNIQUE(session_id, student_id),
    FOREIGN KEY(session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    trigger_description TEXT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    teacher_id TEXT,
    subject TEXT,
    topic TEXT,
    content TEXT NOT NULL,
    question_type TEXT NOT NULL,
    options TEXT, -- JSON
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium',
    subtopic TEXT,
    embedding TEXT, -- JSON array of float (dùng cho dedup similarity)
    duration_seconds INTEGER DEFAULT 20,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    template TEXT, -- JSON
    status TEXT DEFAULT 'waiting',
    room_code TEXT NOT NULL,
    started_at DATETIME,
    finished_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );
`)

// Đảm bảo migration cho cột topic nếu database cũ chưa có
try {
  db.exec('ALTER TABLE questions ADD COLUMN topic TEXT;')
} catch {}

// Migration cho cột english_name của học sinh nếu database cũ chưa có
try {
  db.exec('ALTER TABLE students ADD COLUMN english_name TEXT;')
} catch {}

// Migration nâng cấp module AI: explanation, difficulty, subtopic, embedding
try { db.exec('ALTER TABLE questions ADD COLUMN explanation TEXT;') } catch {}
try { db.exec("ALTER TABLE questions ADD COLUMN difficulty TEXT DEFAULT 'medium';") } catch {}
try { db.exec('ALTER TABLE questions ADD COLUMN subtopic TEXT;') } catch {}
try { db.exec('ALTER TABLE questions ADD COLUMN embedding TEXT;') } catch {}

// ═══ Subject Management Module (modulesupdate-arch) ═══
// Danh mục môn học chủ động — giáo viên tự tạo/đặt tên
db.exec(`
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📘',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)
// Lựa chọn môn giảng dạy của từng giáo viên (hỗ trợ đa GV về sau)
db.exec(`
  CREATE TABLE IF NOT EXISTS teacher_subjects (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL DEFAULT 'teacher-1',
    subject_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, subject_id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );
`)
// Câu hỏi gắn khóa ngoại môn học (giữ cột subject TEXT cũ để tương thích ngược)
try { db.exec('ALTER TABLE questions ADD COLUMN subject_id TEXT;') } catch {}

// Seed mặc định bộ môn Tiếng Anh trọng tâm của dự án
const __seedSubjects = db.prepare(`
  INSERT INTO subjects (id, name, icon, sort_order)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO NOTHING
`)
__seedSubjects.run('subj-tieng-anh', 'Tiếng Anh', '🔤', 1)
__seedSubjects.run('subj-toan-tieng-anh', 'Toán Tiếng Anh', '📐', 2)
__seedSubjects.run('subj-khoa-hoc-tieng-anh', 'Khoa học Tiếng Anh', '🔬', 3)

// Mặc định: giáo viên dạy cả 3 môn nếu chưa có lựa chọn nào
if ((db.prepare('SELECT COUNT(*) AS n FROM teacher_subjects').get() as any).n === 0) {
  const insTs = db.prepare('INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id) VALUES (?, ?, ?)')
  ;['subj-tieng-anh', 'subj-toan-tieng-anh', 'subj-khoa-hoc-tieng-anh'].forEach(sid => {
    insTs.run(`ts-${sid}`, 'teacher-1', sid)
  })
}

// Backfill: map câu hỏi cũ sang subject_id theo tên
try {
  db.exec(`
    UPDATE questions SET subject_id = (
      SELECT s.id FROM subjects s WHERE s.name = questions.subject LIMIT 1
    )
    WHERE subject_id IS NULL AND subject IS NOT NULL;
  `)
} catch {}

// Khởi tạo dữ liệu mẫu ban đầu nếu database còn trống
const teacherCount = db.prepare('SELECT count(*) as count FROM teachers').get() as { count: number }
if (teacherCount.count === 0) {
  const teacherId = 'teacher-1'
  db.prepare(`
    INSERT INTO teachers (id, name, email, school, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(teacherId, 'Cô Nguyễn Thu Hà', 'giaovien@gmail.com', 'Trường Tiểu học Kim Đồng', '123456')

  const classId = 'class-3a'
  db.prepare(`
    INSERT INTO classes (id, teacher_id, name, school_year, grade_level, room_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(classId, teacherId, 'Lớp 3A', '2025-2026', 3, 'LOP3A')

  // Seed 5 tiêu chí
  const defaultCriteria = [
    { id: 'crit-1', name: 'Học tập', icon: '📚', order: 0 },
    { id: 'crit-2', name: 'Kỷ luật', icon: '⚡', order: 1 },
    { id: 'crit-3', name: 'Hợp tác nhóm', icon: '🤝', order: 2 },
    { id: 'crit-4', name: 'Sáng tạo', icon: '💡', order: 3 },
    { id: 'crit-5', name: 'Chuyên cần', icon: '🌟', order: 4 },
  ]
  for (const c of defaultCriteria) {
    db.prepare(`
      INSERT INTO criteria (id, class_id, name, icon, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(c.id, classId, c.name, c.icon, c.order)
  }

  // Seed 8 học sinh mẫu
  const sampleStudents = [
    { id: 'st-1', name: 'Nguyễn Văn An', english: 'Andy', type: 'owl', color: '#4CAF82', r: 0, c: 0 },
    { id: 'st-2', name: 'Trần Thị Bình', english: 'Bella', type: 'cat', color: '#FFB347', r: 0, c: 1 },
    { id: 'st-3', name: 'Lê Hoàng Cúc', english: 'Daisy', type: 'rocket', color: '#7C4DFF', r: 0, c: 2 },
    { id: 'st-4', name: 'Phạm Minh Đức', english: 'David', type: 'robot', color: '#29B6F6', r: 0, c: 3 },
    { id: 'st-5', name: 'Vũ Ngọc Hân', english: 'Helen', type: 'dragon', color: '#FF5252', r: 1, c: 0 },
    { id: 'st-6', name: 'Đỗ Quốc Khánh', english: 'Kevin', type: 'star', color: '#FFB347', r: 1, c: 1 },
    { id: 'st-7', name: 'Bùi Mai Linh', english: 'Lily', type: 'owl', color: '#7C4DFF', r: 1, c: 2 },
    { id: 'st-8', name: 'Hoàng Gia Nam', english: 'Nathan', type: 'rocket', color: '#4CAF82', r: 1, c: 3 },
  ]

  for (const s of sampleStudents) {
    db.prepare(`
      INSERT INTO students (id, class_id, name, english_name, avatar_config, seat_row, seat_col)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(s.id, classId, s.name, s.english, JSON.stringify({ type: s.type, color: s.color }), s.r, s.c)
  }

  // Seed 4 câu hỏi mẫu
  const sampleQuestions = [
    {
      id: 'q-1',
      subject: 'Toán học',
      content: '5 × 6 bằng bao nhiêu?',
      type: 'mcq',
      options: JSON.stringify([
        { label: 'A', text: '25' },
        { label: 'B', text: '30' },
        { label: 'C', text: '35' },
        { label: 'D', text: '40' },
      ]),
      correct: 'B',
      duration: 15,
    },
    {
      id: 'q-2',
      subject: 'Toán học',
      content: 'Hình vuông có mấy cạnh bằng nhau?',
      type: 'mcq',
      options: JSON.stringify([
        { label: 'A', text: '2 cạnh' },
        { label: 'B', text: '3 cạnh' },
        { label: 'C', text: '4 cạnh' },
        { label: 'D', text: '5 cạnh' },
      ]),
      correct: 'C',
      duration: 15,
    },
    {
      id: 'q-3',
      subject: 'Tiếng Việt',
      content: 'Từ nào sau đây là từ chỉ hoạt động?',
      type: 'mcq',
      options: JSON.stringify([
        { label: 'A', text: 'Bông hoa' },
        { label: 'B', text: 'Chạy nhảy' },
        { label: 'C', text: 'Xinh xắn' },
        { label: 'D', text: 'Ngôi nhà' },
      ]),
      correct: 'B',
      duration: 20,
    },
    {
      id: 'q-4',
      subject: 'Tự nhiên & Xã hội',
      content: 'Cơ quan nào trong cơ thể giúp chúng ta hô hấp?',
      type: 'mcq',
      options: JSON.stringify([
        { label: 'A', text: 'Dạ dày' },
        { label: 'B', text: 'Phổi' },
        { label: 'C', text: 'Tim' },
        { label: 'D', text: 'Gan' },
      ]),
      correct: 'B',
      duration: 20,
    },
  ]

  for (const q of sampleQuestions) {
    db.prepare(`
      INSERT INTO questions (id, teacher_id, subject, content, question_type, options, correct_answer, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(q.id, teacherId, q.subject, q.content, q.type, q.options, q.correct, q.duration)
  }
}

export default db
