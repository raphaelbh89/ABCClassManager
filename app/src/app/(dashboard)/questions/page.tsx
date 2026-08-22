'use client'
// src/app/(dashboard)/questions/page.tsx
import { useState } from 'react'
import { useQuestions } from '@/hooks/useQuestions'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Badge } from '@/components/common/Badge'
import {
  Plus,
  BookOpen,
  Clock,
  Pencil,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react'
import type { Question, QuestionType } from '@/types'

const SUBJECTS = [
  { id: 'all', name: 'Tất cả môn' },
  { id: 'Toán học', name: '📐 Toán học' },
  { id: 'Tiếng Việt', name: '📖 Tiếng Việt' },
  { id: 'Tự nhiên & Xã hội', name: '🌍 Tự nhiên & Xã hội' },
  { id: 'Tiếng Anh', name: '🔤 Tiếng Anh' },
  { id: 'Toán Tiếng Anh', name: '📐 Toán Tiếng Anh' },
]

export default function QuestionsPage() {
  const [selectedSubject, setSelectedSubject] = useState('all')
  const { questions, isLoading, addQuestion, editQuestion, removeQuestion, refetch } = useQuestions(selectedSubject)

  // Modals
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)

  const [editTarget, setEditTarget] = useState<Question | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)

  // Form states cho tạo 1 câu
  const [qType, setQType] = useState<QuestionType>('mcq')
  const [subject, setSubject] = useState('Toán học')
  const [content, setContent] = useState('')
  const [optA, setOptA] = useState('')
  const [optB, setOptB] = useState('')
  const [optC, setOptC] = useState('')
  const [optD, setOptD] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('A')
  const [duration, setDuration] = useState(15)
  const [formLoading, setFormLoading] = useState(false)

  // Form states cho sinh bộ câu hỏi tự động bằng AI
  const [genTopic, setGenTopic] = useState('')
  const [genSubject, setGenSubject] = useState('Toán học')
  const [genCount, setGenCount] = useState(5)
  const [genType, setGenType] = useState<'mcq' | 'true_false' | 'all'>('mcq')
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'groq' | 'local'>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [showKeySetting, setShowKeySetting] = useState(false)
  const [genLoading, setGenLoading] = useState(false)

  // Load API Key & Provider từ localStorage
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedKey = localStorage.getItem('classmanager_ai_key') || ''
        const savedProvider = (localStorage.getItem('classmanager_ai_provider') as any) || 'gemini'
        if (savedKey) setApiKey(savedKey)
        if (savedProvider) setAiProvider(savedProvider)
      } catch {}
    }
  })

  const handleSaveApiKey = (key: string, provider: 'gemini' | 'openai' | 'groq' | 'local') => {
    setApiKey(key)
    setAiProvider(provider)
    try {
      localStorage.setItem('classmanager_ai_key', key)
      localStorage.setItem('classmanager_ai_provider', provider)
    } catch {}
  }

  const resetForm = () => {
    setQType('mcq')
    setContent('')
    setOptA('')
    setOptB('')
    setOptC('')
    setOptD('')
    setCorrectAnswer('A')
    setDuration(15)
  }

  const openAdd = () => {
    resetForm()
    if (selectedSubject !== 'all') setSubject(selectedSubject)
    setAddOpen(true)
  }

  const openGenerate = () => {
    if (selectedSubject !== 'all') setGenSubject(selectedSubject)
    setGenerateOpen(true)
  }

  const openEdit = (q: Question) => {
    setEditTarget(q)
    setQType(q.question_type || 'mcq')
    setSubject(q.subject || 'Toán học')
    setContent(q.content)
    setOptA(q.options?.[0]?.text || '')
    setOptB(q.options?.[1]?.text || '')
    setOptC(q.options?.[2]?.text || '')
    setOptD(q.options?.[3]?.text || '')
    setCorrectAnswer(q.correct_answer || 'A')
    setDuration(q.duration_seconds || 15)
    setEditOpen(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const options = qType === 'true_false'
        ? [
            { label: 'A', text: optA || 'ĐÚNG (Thẻ Xanh Lá)' },
            { label: 'B', text: optB || 'SAI (Thẻ Đỏ)' },
          ]
        : [
            { label: 'A', text: optA },
            { label: 'B', text: optB },
            { label: 'C', text: optC },
            { label: 'D', text: optD },
          ]

      await addQuestion({
        subject,
        content,
        question_type: qType,
        options,
        correct_answer: correctAnswer,
        duration_seconds: duration,
      })
      setAddOpen(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setFormLoading(true)
    try {
      const options = qType === 'true_false'
        ? [
            { label: 'A', text: optA || 'ĐÚNG (Thẻ Xanh Lá)' },
            { label: 'B', text: optB || 'SAI (Thẻ Đỏ)' },
          ]
        : [
            { label: 'A', text: optA },
            { label: 'B', text: optB },
            { label: 'C', text: optC },
            { label: 'D', text: optD },
          ]

      await editQuestion(editTarget.id, {
        subject,
        content,
        question_type: qType,
        options,
        correct_answer: correctAnswer,
        duration_seconds: duration,
      })
      setEditOpen(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setFormLoading(true)
    try {
      await removeQuestion(deleteTarget.id)
      setDeleteOpen(false)
    } finally {
      setFormLoading(false)
    }
  }

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Xử lý tạo tự động bộ câu hỏi qua AI theo Chủ đề
  const handleGenerateSet = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenLoading(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai_generate',
          topic: genTopic.trim() || genSubject,
          subject: genSubject,
          count: genCount,
          question_type: genType,
          provider: aiProvider,
          apiKey: apiKey.trim(),
        }),
      })
      if (res.ok) {
        setGenerateOpen(false)
        await refetch()
        setToastMessage(`🎉 Đã tạo thành công ${genCount} câu hỏi AI về chủ đề: "${genTopic || genSubject}"!`)
        setTimeout(() => setToastMessage(null), 4000)
      }
    } finally {
      setGenLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
            📚 Ngân hàng & Bộ câu hỏi Quiz
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Tạo câu hỏi trắc nghiệm A/B/C/D, câu hỏi Đúng/Sai hoặc sinh nhanh bộ đề theo môn học
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Sparkles size={16} />}
            onClick={openGenerate}
          >
            ⚡ Tạo nhanh Bộ câu hỏi
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-green-50 border border-green-300 text-green-800 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-green-700 hover:text-green-900 font-black">✕</button>
        </div>
      )}

      {/* Tabs môn học */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SUBJECTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSubject(s.id)}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
              selectedSubject === s.id
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-white text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Danh sách câu hỏi */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 rounded-2xl animate-pulse bg-[var(--color-border)]" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card padding="lg" className="text-center py-16">
          <BookOpen size={48} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="font-bold text-base mb-1">Chưa có câu hỏi nào</p>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Bạn có thể tạo câu hỏi thủ công hoặc dùng tính năng "Tạo nhanh Bộ câu hỏi".
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={openGenerate} leftIcon={<Sparkles size={16} />}>
              Tạo nhanh bộ câu hỏi mẫu
            </Button>
            <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
              Tạo câu hỏi thủ công
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q, idx) => (
            <Card key={q.id} padding="md" className="flex flex-col justify-between gap-3 border shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="primary">{q.subject || 'Chung'}</Badge>
                    <Badge variant={q.question_type === 'true_false' ? 'secondary' : 'neutral'}>
                      {q.question_type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm ABCD'}
                    </Badge>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
                    <Clock size={12} /> {q.duration_seconds}s
                  </span>
                </div>
                <h3 className="font-bold text-base text-[var(--color-text)] mb-3 leading-snug">
                  {idx + 1}. {q.content}
                </h3>

                {/* Các phương án */}
                <div className={`grid gap-2 text-xs ${q.question_type === 'true_false' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {(q.options || []).map((opt: any) => {
                    const isCorrect = q.correct_answer === opt.label
                    return (
                      <div
                        key={opt.label}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-between ${
                          isCorrect
                            ? 'bg-green-50 border-green-300 text-green-800 ring-1 ring-green-400'
                            : 'bg-slate-50 border-[var(--color-border)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="px-1.5 py-0.5 rounded bg-black/10 text-[10px]">{opt.label}</span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                        {isCorrect && <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1 pt-2 border-t border-[var(--color-border)]">
                <button
                  onClick={() => openEdit(q)}
                  className="p-1.5 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
                  title="Sửa câu hỏi"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { setDeleteTarget(q); setDeleteOpen(true) }}
                  className="p-1.5 rounded-lg text-[var(--color-danger)] hover:bg-red-50"
                  title="Xoá câu hỏi"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Modal Thêm/Sửa câu hỏi ─── */}
      <Modal isOpen={addOpen || editOpen} onClose={() => { setAddOpen(false); setEditOpen(false) }} title={addOpen ? "➕ Thêm câu hỏi mới" : "✏️ Sửa câu hỏi"} size="md">
        <form onSubmit={addOpen ? handleAdd : handleEdit} className="flex flex-col gap-4">
          {/* Loại câu hỏi */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text)]">Định dạng câu hỏi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQType('mcq')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  qType === 'mcq'
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                }`}
              >
                🔤 Trắc nghiệm 4 lựa chọn (A/B/C/D)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQType('true_false')
                  if (!optA) setOptA('ĐÚNG (Thẻ Xanh Lá)')
                  if (!optB) setOptB('SAI (Thẻ Đỏ)')
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  qType === 'true_false'
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                }`}
              >
                ⚖️ Đúng / Sai (True / False)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-text)]">Môn học</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="p-2.5 rounded-lg border bg-white text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {SUBJECTS.filter(s => s.id !== 'all').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-text)]">Thời gian đếm ngược</label>
              <select
                value={duration}
                onChange={e => setDuration(+e.target.value)}
                className="p-2.5 rounded-lg border bg-white text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {[10, 15, 20, 30, 45, 60].map(sec => (
                  <option key={sec} value={sec}>{sec} giây</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text)]">Nội dung câu hỏi</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              rows={2}
              required
              className="p-3 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* Đáp án */}
          {qType === 'mcq' ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--color-text)]">
                4 Phương án lựa chọn (Click vào chữ cái để chọn Đáp Án Đúng)
              </label>
              {[
                { label: 'A', val: optA, set: setOptA, placeholder: 'VD: 25' },
                { label: 'B', val: optB, set: setOptB, placeholder: 'VD: 30' },
                { label: 'C', val: optC, set: setOptC, placeholder: 'VD: 35' },
                { label: 'D', val: optD, set: setOptD, placeholder: 'VD: 40' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(item.label)}
                    className={`w-9 h-9 rounded-lg font-black text-sm flex items-center justify-center border transition-all ${
                      correctAnswer === item.label
                        ? 'bg-[var(--color-primary)] text-white ring-2 ring-offset-1 ring-[var(--color-primary)]'
                        : 'bg-slate-100 text-[var(--color-text-muted)] border-[var(--color-border)]'
                    }`}
                    title="Đánh dấu đáp án đúng"
                  >
                    {item.label}
                  </button>
                  <input
                    type="text"
                    value={item.val}
                    onChange={e => item.set(e.target.value)}
                    placeholder={item.placeholder}
                    required
                    className="flex-1 p-2 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--color-text)]">
                Đáp án Đúng / Sai (Click để chọn đáp án đúng)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectAnswer('A')}
                  className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    correctAnswer === 'A'
                      ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-400'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span>🟢</span>
                  <span>ĐÚNG (Thẻ Xanh)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCorrectAnswer('B')}
                  className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    correctAnswer === 'B'
                      ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span>🔴</span>
                  <span>SAI (Thẻ Đỏ)</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setAddOpen(false); setEditOpen(false) }}>
              Huỷ
            </Button>
            <Button type="submit" isLoading={formLoading}>
              {addOpen ? 'Lưu câu hỏi' : 'Cập nhật câu hỏi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal Sinh Nhanh Bộ Câu Hỏi Bằng AI (AI Topic Generator) ─── */}
      <Modal isOpen={generateOpen} onClose={() => setGenerateOpen(false)} title="✨ Tạo Bộ Câu Hỏi Bằng AI Theo Chủ Đề" size="md">
        <form onSubmit={handleGenerateSet} className="flex flex-col gap-4">
          {/* Ô nhập Chủ đề / Yêu cầu cụ thể */}
          <div className="flex flex-col gap-1.5 p-3.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border border-amber-200">
            <label className="text-xs font-black text-amber-950 flex items-center justify-between">
              <span>🎯 CHỦ ĐỀ HOẶC BÀI HỌC CỤ THỂ</span>
              <span className="text-[10px] font-bold text-amber-700">Tùy biến theo giáo án</span>
            </label>
            <input
              type="text"
              value={genTopic}
              onChange={e => setGenTopic(e.target.value)}
              placeholder="VD: Bảng nhân 7, Từ đồng nghĩa lớp 3, Hệ mặt trời, Animals & Colors..."
              className="p-3 rounded-xl border border-amber-300 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
            <p className="text-[11px] text-amber-800 leading-snug">
              Nhập bất kỳ chủ đề bài học nào bạn muốn dạy, AI sẽ tự động tạo câu hỏi chuẩn kiến thức và phân bổ đều đáp án.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-text)]">Môn học</label>
              <select
                value={genSubject}
                onChange={e => setGenSubject(e.target.value)}
                className="p-2.5 rounded-xl border bg-white text-xs font-bold text-slate-800"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <option value="Toán học">📐 Toán học</option>
                <option value="Tiếng Việt">📖 Tiếng Việt</option>
                <option value="Tự nhiên & Xã hội">🌍 Tự nhiên & Xã hội</option>
                <option value="Tiếng Anh">🔤 Tiếng Anh</option>
                <option value="Toán Tiếng Anh">📐 Toán bằng Tiếng Anh</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-text)]">Loại câu hỏi</label>
              <select
                value={genType}
                onChange={e => setGenType(e.target.value as any)}
                className="p-2.5 rounded-xl border bg-white text-xs font-bold text-slate-800"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <option value="mcq">🔤 Trắc nghiệm ABCD</option>
                <option value="true_false">⚖️ Đúng / Sai (True/False)</option>
                <option value="all">🔀 Kết hợp cả hai</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text)]">Số lượng câu hỏi</label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setGenCount(cnt)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                    genCount === cnt
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                  }`}
                >
                  {cnt} câu
                </button>
              ))}
            </div>
          </div>

          {/* ─── CẤU HÌNH AI API KEY (GEMINI FREE / CHATGPT / GROQ) ─── */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowKeySetting(!showKeySetting)}
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-[var(--color-primary)] cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Cấu hình AI ({aiProvider === 'gemini' ? 'Google Gemini Free' : aiProvider === 'openai' ? 'OpenAI ChatGPT' : aiProvider === 'groq' ? 'Groq Free' : 'Tự động'})</span>
                <span className="text-[10px] text-slate-400">[{showKeySetting ? 'Thu gọn' : 'Chỉnh sửa'}]</span>
              </button>
            </div>

            {showKeySetting && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'gemini', label: '🌟 Gemini (Free)' },
                    { id: 'openai', label: '🤖 ChatGPT' },
                    { id: 'groq', label: '⚡ Groq (Free)' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSaveApiKey(apiKey, p.id as any)}
                      className={`p-1.5 rounded-lg border text-[11px] font-bold ${
                        aiProvider === p.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => handleSaveApiKey(e.target.value, aiProvider)}
                    placeholder={`Dán ${aiProvider === 'gemini' ? 'Gemini API Key (AIza...)' : aiProvider === 'openai' ? 'OpenAI API Key (sk-...)' : 'Groq API Key (gsk_...)'}`}
                    className="p-2 rounded-lg border bg-white text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500 leading-snug">
                    {aiProvider === 'gemini' && '🎁 Lấy Key Gemini miễn phí 100% tại: aistudio.google.com (15 lượt/phút)'}
                    {aiProvider === 'openai' && '🔑 Dùng tài khoản OpenAI ChatGPT API (gpt-4o-mini)'}
                    {aiProvider === 'groq' && '⚡ Lấy Key Groq miễn phí 100% tại: console.groq.com (Llama 3.3 siêu nhanh)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button type="button" variant="ghost" onClick={() => setGenerateOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" isLoading={genLoading} leftIcon={<Sparkles size={16} />} className="bg-[var(--color-primary)] text-white font-black">
              Tạo {genCount} câu hỏi bằng AI
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Xoá câu hỏi */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xoá câu hỏi"
        message="Bạn có chắc muốn xoá câu hỏi này khỏi ngân hàng?"
        confirmLabel="Xoá câu hỏi"
        isLoading={formLoading}
      />
    </div>
  )
}
