'use client'
// src/app/(dashboard)/questions/page.tsx
// Ngân hàng Câu hỏi: Tích hợp Custom AI API (Gemini, ChatGPT, Groq, Custom), Test API Key, Chống lặp câu hỏi
import { useState, useMemo } from 'react'
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
  Tag,
  Activity,
} from 'lucide-react'
import type { Question, QuestionType } from '@/types'

const SUBJECTS = [
  { id: 'all', name: '🌐 Tất cả môn' },
  { id: 'Tiếng Anh', name: '🔤 Tiếng Anh' },
  { id: 'Toán Tiếng Anh', name: '📐 Toán Tiếng Anh' },
  { id: 'Khoa học Tiếng Anh', name: '🔬 Khoa học Tiếng Anh' },
  { id: 'Tiếng Việt', name: '📖 Tiếng Việt' },
  { id: 'Toán học', name: '📐 Toán học' },
  { id: 'Tự nhiên & Xã hội', name: '🌍 Tự nhiên & Xã hội' },
]

export default function QuestionsPage() {
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
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
  const [subject, setSubject] = useState('Tiếng Anh')
  const [topic, setTopic] = useState('Đại từ xưng hô (Pronouns)')
  const [content, setContent] = useState('')
  const [optA, setOptA] = useState('')
  const [optB, setOptB] = useState('')
  const [optC, setOptC] = useState('')
  const [optD, setOptD] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('A')
  const [duration, setDuration] = useState(15)
  const [formLoading, setFormLoading] = useState(false)

  // Form states cho sinh bộ câu hỏi tự động bằng AI
  const [genTopic, setGenTopic] = useState('các loại phương tiện')
  const [genSubject, setGenSubject] = useState('Tiếng Anh')
  const [genCount, setGenCount] = useState(5)
  const [genType, setGenType] = useState<'mcq' | 'true_false' | 'all'>('mcq')
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'groq' | 'custom'>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [showKeySetting, setShowKeySetting] = useState(false)
  const [genLoading, setGenLoading] = useState(false)

  // Test Key State
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  // Load API Key & Provider từ localStorage
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedKey = localStorage.getItem('classmanager_ai_key') || ''
        const savedProvider = (localStorage.getItem('classmanager_ai_provider') as any) || 'gemini'
        const savedBaseUrl = localStorage.getItem('classmanager_ai_base_url') || ''
        const savedModel = localStorage.getItem('classmanager_ai_model') || ''
        if (savedKey) setApiKey(savedKey)
        if (savedProvider) setAiProvider(savedProvider)
        if (savedBaseUrl) setCustomBaseUrl(savedBaseUrl)
        if (savedModel) setCustomModel(savedModel)
      } catch {}
    }
  })

  const handleSaveApiKey = (key: string, provider: 'gemini' | 'openai' | 'groq' | 'custom', baseUrl = customBaseUrl, model = customModel) => {
    setApiKey(key)
    setAiProvider(provider)
    setCustomBaseUrl(baseUrl)
    setCustomModel(model)
    setTestResult(null)
    try {
      localStorage.setItem('classmanager_ai_key', key)
      localStorage.setItem('classmanager_ai_provider', provider)
      localStorage.setItem('classmanager_ai_base_url', baseUrl)
      localStorage.setItem('classmanager_ai_model', model)
    } catch {}
  }

  // Kiểm tra kết nối API Key
  const handleTestApiKey = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: apiKey.trim(),
          customBaseUrl: customBaseUrl.trim(),
          customModel: customModel.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({ success: true, message: `✓ ${data.message} (${data.latency})` })
      } else {
        setTestResult({ success: false, error: `✕ ${data.error || 'Kiểm tra thất bại.'}` })
      }
    } catch (err: any) {
      setTestResult({ success: false, error: `✕ Lỗi kết nối: ${err.message}` })
    } finally {
      setTestLoading(false)
    }
  }

  // Danh sách Topics trích xuất từ câu hỏi hiện có
  const availableTopics = useMemo(() => {
    const topicMap = new Map<string, number>()
    questions.forEach(q => {
      const t = q.topic || q.subject || 'Tổng hợp'
      topicMap.set(t, (topicMap.get(t) || 0) + 1)
    })
    return Array.from(topicMap.entries()).map(([name, count]) => ({ name, count }))
  }, [questions])

  // Lọc theo Topic
  const filteredQuestions = useMemo(() => {
    if (selectedTopic === 'all') return questions
    return questions.filter(q => (q.topic || q.subject || 'Tổng hợp') === selectedTopic)
  }, [questions, selectedTopic])

  const resetForm = () => {
    setQType('mcq')
    setContent('')
    setTopic('Đại từ xưng hô (Pronouns)')
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
    setSubject(q.subject || 'Tiếng Anh')
    setTopic(q.topic || 'Tổng hợp')
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
            { label: 'A', text: optA || 'TRUE (Đúng / Thẻ Xanh)' },
            { label: 'B', text: optB || 'FALSE (Sai / Thẻ Đỏ)' },
          ]
        : [
            { label: 'A', text: optA },
            { label: 'B', text: optB },
            { label: 'C', text: optC },
            { label: 'D', text: optD },
          ]

      await addQuestion({
        subject,
        topic: topic.trim() || 'Tổng hợp',
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
            { label: 'A', text: optA || 'TRUE (Đúng / Thẻ Xanh)' },
            { label: 'B', text: optB || 'FALSE (Sai / Thẻ Đỏ)' },
          ]
        : [
            { label: 'A', text: optA },
            { label: 'B', text: optB },
            { label: 'C', text: optC },
            { label: 'D', text: optD },
          ]

      await editQuestion(editTarget.id, {
        subject,
        topic: topic.trim() || 'Tổng hợp',
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

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null)

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
          customBaseUrl: customBaseUrl.trim(),
          customModel: customModel.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setGenerateOpen(false)
        await refetch()

        if (data.isAiGenerated) {
          setToastMessage({
            text: `✨ Đã tạo thành công ${data.count} câu hỏi bằng ${data.providerName} về chủ đề "${genTopic}"! (Đã tự động loại bỏ ${data.skippedCount || 0} câu trùng lặp)`,
            type: 'success',
          })
        } else {
          setToastMessage({
            text: `⚠️ Đang dùng Bộ mẫu Offline (đã thêm ${data.count} câu). Hãy dán API Key (Gemini/ChatGPT) để AI tự do tạo câu hỏi chính xác theo chủ đề bạn nhập!`,
            type: 'warning',
          })
        }
        setTimeout(() => setToastMessage(null), 6000)
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
            📚 Ngân hàng Câu hỏi Theo Chủ Đề
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Quản lý câu hỏi Tiếng Anh, Toán & Khoa học bằng Tiếng Anh, phân loại theo từng chủ đề bài học
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Sparkles size={16} />}
            onClick={openGenerate}
          >
            ✨ Tạo Bộ câu hỏi bằng AI
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* Toast thông báo nguồn gốc AI */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{toastMessage.type === 'success' ? '✨' : '⚠️'}</span>
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-black px-2 py-1 hover:bg-black/5 rounded-lg">✕</button>
        </div>
      )}

      {/* Tabs Môn học */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SUBJECTS.map(s => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedSubject(s.id)
              setSelectedTopic('all')
            }}
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

      {/* Thanh Lọc Theo Chủ Đề (Topic Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-black text-slate-500 flex items-center gap-1 flex-shrink-0">
          <Tag size={13} /> Chủ đề:
        </span>
        <button
          onClick={() => setSelectedTopic('all')}
          className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap border transition-all ${
            selectedTopic === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Tất cả ({questions.length})
        </button>

        {availableTopics.map(t => (
          <button
            key={t.name}
            onClick={() => setSelectedTopic(t.name)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
              selectedTopic === t.name
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/60 text-amber-950 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>🎯 {t.name}</span>
            <span className="text-[10px] font-black opacity-80">({t.count})</span>
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
      ) : filteredQuestions.length === 0 ? (
        <Card padding="lg" className="text-center py-16">
          <BookOpen size={48} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="font-bold text-base mb-1">Chưa có câu hỏi nào thuộc chủ đề này</p>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Bạn có thể tạo câu hỏi thủ công hoặc dùng tính năng "Tạo Bộ câu hỏi bằng AI".
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={openGenerate} leftIcon={<Sparkles size={16} />}>
              Tạo nhanh bằng AI
            </Button>
            <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
              Thêm câu hỏi thủ công
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q, idx) => (
            <Card key={q.id} padding="md" className="flex flex-col justify-between gap-3 border shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                      🎯 {q.topic || q.subject || 'Tổng hợp'}
                    </span>
                    <Badge variant="primary">{q.subject || 'Tiếng Anh'}</Badge>
                    <Badge variant={q.question_type === 'true_false' ? 'secondary' : 'neutral'}>
                      {q.question_type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm'}
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
                <div className="grid grid-cols-2 gap-2">
                  {(q.options || []).map((opt: any) => {
                    const isCorrect = opt.label === q.correct_answer
                    return (
                      <div
                        key={opt.label}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                          isCorrect
                            ? 'bg-green-50 border-green-400 text-green-800 ring-1 ring-green-400 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                          isCorrect ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {opt.label}
                        </span>
                        <span className="truncate flex-1">{opt.text}</span>
                        {isCorrect && <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Pencil size={14} />}
                  onClick={() => openEdit(q)}
                >
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => {
                    setDeleteTarget(q)
                    setDeleteOpen(true)
                  }}
                  className="text-red-500 hover:bg-red-50"
                >
                  Xoá
                </Button>
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
                  if (!optA) setOptA('TRUE (Đúng / Thẻ Xanh)')
                  if (!optB) setOptB('FALSE (Sai / Thẻ Đỏ)')
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
              <label className="text-xs font-semibold text-[var(--color-text)]">Chủ đề bài học</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="VD: Đại từ xưng hô, Động vật, Phương tiện..."
                className="p-2.5 rounded-lg border bg-white text-sm"
                style={{ borderColor: 'var(--color-border)' }}
              />
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
                { label: 'A', val: optA, set: setOptA, placeholder: 'Phương án A' },
                { label: 'B', val: optB, set: setOptB, placeholder: 'Phương án B' },
                { label: 'C', val: optC, set: setOptC, placeholder: 'Phương án C' },
                { label: 'D', val: optD, set: setOptD, placeholder: 'Phương án D' },
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
                Đáp án Đúng/Sai (Click vào chữ cái để chọn Đúng)
              </label>
              {[
                { label: 'A', val: optA, set: setOptA, def: 'TRUE (Đúng / Thẻ Xanh)' },
                { label: 'B', val: optB, set: setOptB, def: 'FALSE (Sai / Thẻ Đỏ)' },
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
                  >
                    {item.label}
                  </button>
                  <input
                    type="text"
                    value={item.val || item.def}
                    onChange={e => item.set(e.target.value)}
                    required
                    className="flex-1 p-2 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
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
              <span className="text-[10px] font-bold text-amber-700">Tùy biến không giới hạn</span>
            </label>
            <input
              type="text"
              value={genTopic}
              onChange={e => setGenTopic(e.target.value)}
              placeholder="VD: các loại phương tiện, School things, Animals, Weather..."
              className="p-3 rounded-xl border border-amber-300 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
            <p className="text-[11px] text-amber-800 leading-snug">
              Nhập bất kỳ chủ đề bài học nào bạn muốn dạy, AI sẽ tự động tạo câu hỏi chuẩn kiến thức và phân bổ đều đáp án (chống trùng lặp 100%).
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
                <option value="Tiếng Anh">🔤 Tiếng Anh</option>
                <option value="Toán Tiếng Anh">📐 Toán bằng Tiếng Anh</option>
                <option value="Khoa học Tiếng Anh">🔬 Khoa học bằng Tiếng Anh</option>
                <option value="Tiếng Việt">📖 Tiếng Việt</option>
                <option value="Toán học">📐 Toán học</option>
                <option value="Tự nhiên & Xã hội">🌍 Tự nhiên & Xã hội</option>
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

          {/* ─── CẤU HÌNH & TEST API KEY AI (GEMINI FREE / CHATGPT / GROQ / CUSTOM) ─── */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowKeySetting(!showKeySetting)}
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5 hover:text-[var(--color-primary)] cursor-pointer"
              >
                <Sparkles size={15} className="text-amber-500" />
                <span>Cấu hình AI ({aiProvider === 'gemini' ? 'Google Gemini Free' : aiProvider === 'openai' ? 'OpenAI ChatGPT' : aiProvider === 'groq' ? 'Groq Llama 3.3 Free' : 'Custom Endpoint'})</span>
                <span className="text-[10px] text-slate-400 font-normal">[{showKeySetting ? 'Thu gọn' : 'Chỉnh sửa Key'}]</span>
              </button>

              {apiKey.trim().length > 5 && !showKeySetting && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Đã có Key
                </span>
              )}
            </div>

            {showKeySetting && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'gemini', label: '🌟 Gemini (Free)' },
                    { id: 'openai', label: '🤖 ChatGPT' },
                    { id: 'groq', label: '⚡ Groq (Free)' },
                    { id: 'custom', label: '🛠️ Custom' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSaveApiKey(apiKey, p.id as any)}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                        aiProvider === p.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {aiProvider === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customBaseUrl}
                      onChange={e => handleSaveApiKey(apiKey, 'custom', e.target.value, customModel)}
                      placeholder="Base URL: https://api.deepseek.com/v1"
                      className="p-2 rounded-lg border bg-white text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={customModel}
                      onChange={e => handleSaveApiKey(apiKey, 'custom', customBaseUrl, e.target.value)}
                      placeholder="Model: deepseek-chat"
                      className="p-2 rounded-lg border bg-white text-xs font-mono"
                    />
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => handleSaveApiKey(e.target.value, aiProvider)}
                    placeholder={`Dán ${aiProvider === 'gemini' ? 'Gemini API Key (AIza...)' : aiProvider === 'openai' ? 'OpenAI API Key (sk-...)' : aiProvider === 'groq' ? 'Groq Key (gsk_...)' : 'Custom API Key'}`}
                    className="flex-1 p-2 rounded-lg border bg-white text-xs font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleTestApiKey}
                    disabled={testLoading || !apiKey.trim()}
                    leftIcon={<Activity size={13} className={testLoading ? 'animate-spin' : ''} />}
                    className="text-xs font-bold flex-shrink-0"
                  >
                    {testLoading ? 'Đang test...' : 'Test Key'}
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-2 rounded-lg text-[11px] font-bold ${
                    testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {testResult.success ? testResult.message : testResult.error}
                  </div>
                )}

                <span className="text-[10px] text-slate-500 leading-snug">
                  {aiProvider === 'gemini' && '🎁 Lấy Key Gemini miễn phí 100% tại: aistudio.google.com/app/apikey (15 lượt/phút)'}
                  {aiProvider === 'openai' && '🔑 Dùng tài khoản OpenAI ChatGPT API (gpt-4o-mini)'}
                  {aiProvider === 'groq' && '⚡ Lấy Key Groq miễn phí 100% tại: console.groq.com/keys (Llama 3.3 siêu nhanh)'}
                  {aiProvider === 'custom' && '🛠️ Tương thích OpenAI API Format (DeepSeek, OpenRouter, Local Ollama)'}
                </span>
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
