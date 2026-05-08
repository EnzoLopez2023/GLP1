import { useMemo, useState, useRef } from 'react'
import PageHero from '../components/motion/PageHero'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import {
  Search, ArrowLeft, BookOpen, Syringe, Droplets, Activity, Cookie,
  Salad, TrendingUp, AlertTriangle, AlertCircle, Zap, Moon, LineChart,
  Info, ChevronRight, FlaskConical, Sparkles, MessageCircle, Send, Loader,
} from 'lucide-react'
import { TOPICS, CATEGORIES, searchTopics, getTopic } from '../data/knowledgeBase'
import {
  GLP1MechanismDiagram, GlucoseCurveDiagram, A1CDiagram,
  CarbAbsorptionDiagram, PlateDiagram, SpikeTypesDiagram,
} from '../components/knowledge/Diagrams'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { estimatedA1C } from '../utils/insights'

const ICONS = {
  Syringe, Droplets, Activity, Cookie, Salad, TrendingUp,
  AlertTriangle, AlertCircle, Zap, Moon, LineChart, BookOpen,
}

const DIAGRAMS = {
  GLP1MechanismDiagram, GlucoseCurveDiagram, A1CDiagram,
  CarbAbsorptionDiagram, PlateDiagram, SpikeTypesDiagram,
}

export default function KnowledgeBase() {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('all')
  const [openId,   setOpenId]   = useState(null)

  // AI Q&A
  const [askText,  setAskText]  = useState('')
  const [answer,   setAnswer]   = useState(null)
  const [asking,   setAsking]   = useState(false)
  const [askError, setAskError] = useState(null)
  const answerRef = useRef(null)

  const { data: profile    } = useQuery(api.getProfile)
  const { data: glucoseAll } = useQuery(() => api.getGlucose())
  const { data: weights    } = useQuery(api.getWeightLog)
  const { data: injections } = useQuery(api.getInjections)

  const userContext = useMemo(() => {
    const daysSince = (d) => d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000)) : undefined
    const vals = (glucoseAll ?? []).map(r => r.value)
    const avgGlucose  = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : undefined
    const fastingVals = (glucoseAll ?? []).filter(r => r.readingType === 'fasting').map(r => r.value)
    const fastingAvg  = fastingVals.length ? Math.round(fastingVals.reduce((s, v) => s + v, 0) / fastingVals.length) : undefined
    const sorted      = [...(injections ?? [])].sort((a, b) => a.injectedAt.localeCompare(b.injectedAt))
    const latest      = sorted[sorted.length - 1]
    const recentWeight = (weights ?? [])[0]?.weightLbs
    const startWeight  = profile?.weightLbs
    return {
      diagnosisDate:       profile?.diagnosisDate  || undefined,
      ketoStartDate:       profile?.ketoStartDate  || undefined,
      glp1StartDate:       profile?.startDate      || undefined,
      medication:          latest?.medicationName  ?? profile?.medicationName,
      currentDose:         latest?.doseMg          ?? profile?.currentDoseMg,
      weeksSinceDiagnosis: profile?.diagnosisDate  ? Math.floor(daysSince(profile.diagnosisDate) / 7) : undefined,
      weeksOnKeto:         profile?.ketoStartDate  ? Math.floor(daysSince(profile.ketoStartDate)  / 7) : undefined,
      weeksOnGLP1:         profile?.startDate      ? Math.floor(daysSince(profile.startDate)       / 7) : undefined,
      avgGlucose,
      fastingAvg,
      estimatedA1C:        estimatedA1C(avgGlucose) ?? undefined,
      recentWeightLbs:     recentWeight,
      totalLostLbs:        startWeight && recentWeight ? +(startWeight - recentWeight).toFixed(1) : undefined,
    }
  }, [profile, glucoseAll, weights, injections])

  async function handleAsk(e) {
    e?.preventDefault()
    const q = askText.trim()
    if (!q || asking) return
    setAsking(true)
    setAnswer(null)
    setAskError(null)
    try {
      const { answer: text } = await api.askQuestion({ question: q, userContext })
      setAnswer(text)
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch {
      setAskError('Could not get an answer — make sure ANTHROPIC_API_KEY is set on the server.')
    } finally {
      setAsking(false)
    }
  }

  const filtered = useMemo(() => {
    const base = category === 'all' ? TOPICS : TOPICS.filter(t => t.category === category)
    return query.trim() ? searchTopics(query, base) : base
  }, [query, category])

  if (openId) {
    const topic = getTopic(openId)
    if (topic) return <TopicDetail topic={topic} onBack={() => setOpenId(null)} onOpen={setOpenId} />
  }

  return (
    <PageHero variant="learn">
    <div className="space-y-5">
      {/* Intro + disclaimer */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Knowledge Base</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Plain-English and deep-dive answers about GLP-1s, glucose, and eating well.
              Each topic has a simple view and a scientific view you can toggle.
            </p>
          </div>
        </div>
      </Card>

      {/* ── AI Ask ──────────────────────────────────────────────────────── */}
      <Card className="border-purple-100 bg-purple-50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <MessageCircle size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">Ask a Question</p>
            <p className="text-xs text-purple-600">Answered with your health context — not generic advice</p>
          </div>
        </div>
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={askText}
            onChange={e => setAskText(e.target.value)}
            placeholder="e.g. Why is my morning glucose still high on keto?"
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-purple-200 bg-white
              focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-gray-400"
          />
          <Button type="submit" disabled={!askText.trim() || asking}
            className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white border-0">
            {asking ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
        </form>
        {(answer || asking || askError) && (
          <div ref={answerRef} className="mt-3 p-3 bg-white rounded-xl border border-purple-100">
            {asking && (
              <div className="flex items-center gap-2 text-xs text-purple-500">
                <Loader size={13} className="animate-spin" /> Thinking...
              </div>
            )}
            {answer && <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>}
            {askError && <p className="text-xs text-red-600">{askError}</p>}
          </div>
        )}
        <p className="text-[10px] text-purple-400 mt-2">Educational context only — not medical advice. Always discuss changes with your clinician.</p>
      </Card>

      {/* Search */}
      <Card padding={false}>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search — e.g. nausea, A1C, dawn phenomenon, fiber..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border-0
              focus:ring-2 focus:ring-brand-300 outline-none bg-transparent"
          />
        </div>
      </Card>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <CategoryChip label="All" active={category === 'all'} onClick={() => setCategory('all')} />
        {CATEGORIES.map(c => (
          <CategoryChip
            key={c.id}
            label={c.label}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <Search size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-700">No matches</p>
            <p className="text-xs text-gray-500 mt-1">Try a simpler term or clear the filter.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <TopicRow key={t.id} topic={t} onOpen={() => setOpenId(t.id)} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <Card className="bg-amber-50 border-amber-100">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Educational content only.</strong> This is not medical advice, diagnosis,
            or a substitute for your clinician. Always talk to your prescriber before
            changing medication, diet, or activity — especially if you are pregnant, have
            Type 1 diabetes, kidney disease, or take insulin or sulfonylureas.
          </p>
        </div>
      </Card>
    </div>
    </PageHero>
  )
}

// ── Topic row (list item) ───────────────────────────────────────────────────
function TopicRow({ topic, onOpen }) {
  const Icon = ICONS[topic.icon] ?? BookOpen
  const cat = CATEGORIES.find(c => c.id === topic.category)
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-[#fffaf3] rounded-2xl shadow-tile
        hover:bg-[#fff7eb] transition-colors p-4 flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{topic.title}</h3>
          <ChevronRight size={16} className="text-gray-400 shrink-0 mt-0.5" />
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{topic.summary}</p>
        {cat && (
          <div className="mt-2">
            <Badge color="blue">{cat.label}</Badge>
          </div>
        )}
      </div>
    </button>
  )
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : 'bg-[#fffaf3] text-wood-700 border border-wood-200/60 hover:border-brand-300'
      }`}
    >
      {label}
    </button>
  )
}

// ── Topic detail view ───────────────────────────────────────────────────────
function TopicDetail({ topic, onBack, onOpen }) {
  const [view, setView] = useState('simple')  // 'simple' | 'science'
  const Icon = ICONS[topic.icon] ?? BookOpen
  const Diagram = topic.diagram ? DIAGRAMS[topic.diagram] : null
  const cat = CATEGORIES.find(c => c.id === topic.category)
  const body = view === 'simple' ? topic.simple : topic.science

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft size={16} /> Back to Knowledge Base
      </button>

      <Card>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Icon size={22} />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 leading-snug">{topic.title}</h1>
            <p className="text-xs text-gray-500 mt-1">{topic.summary}</p>
            {cat && <div className="mt-2"><Badge color="blue">{cat.label}</Badge></div>}
          </div>
        </div>
      </Card>

      {/* View toggle */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        <ViewTab label="Simple"     icon={Sparkles}     active={view === 'simple'}  onClick={() => setView('simple')}  />
        <ViewTab label="Scientific" icon={FlaskConical} active={view === 'science'} onClick={() => setView('science')} />
      </div>

      {/* Diagram */}
      {Diagram && (
        <Card>
          <Diagram />
        </Card>
      )}

      {/* Body */}
      <Card>
        <MarkdownLite text={body} />
      </Card>

      {/* FAQ */}
      {topic.faq?.length > 0 && (
        <Card>
          <CardHeader title="Frequently asked" />
          <div className="space-y-3">
            {topic.faq.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </Card>
      )}

      {/* Nav between topics */}
      <TopicNavigator currentId={topic.id} onOpen={onOpen} />

      <Card className="bg-amber-50 border-amber-100">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Educational content only — not medical advice. Always discuss changes with your clinician.
          </p>
        </div>
      </Card>
    </div>
  )
}

function ViewTab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium
        px-3 py-2 rounded-lg transition-all ${
        active
          ? 'bg-white text-brand-700 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-800">{q}</p>
          <ChevronRight
            size={14}
            className={`text-gray-400 shrink-0 mt-1 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </div>
      </button>
      {open && <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{a}</p>}
    </div>
  )
}

function TopicNavigator({ currentId, onOpen }) {
  const idx = TOPICS.findIndex(t => t.id === currentId)
  const prev = idx > 0                ? TOPICS[idx - 1] : null
  const next = idx < TOPICS.length - 1 ? TOPICS[idx + 1] : null
  const go = (id) => { window.scrollTo({ top: 0 }); onOpen(id) }
  return (
    <div className="grid grid-cols-2 gap-2">
      {prev ? (
        <button
          onClick={() => go(prev.id)}
          className="text-xs font-medium text-gray-600 hover:text-brand-700 px-3 py-2 rounded-xl
            bg-gray-50 hover:bg-brand-50 transition-colors line-clamp-2 text-left"
        >
          ← {prev.title}
        </button>
      ) : <div />}
      {next ? (
        <button
          onClick={() => go(next.id)}
          className="text-xs font-medium text-gray-600 hover:text-brand-700 px-3 py-2 rounded-xl
            bg-gray-50 hover:bg-brand-50 transition-colors line-clamp-2 text-right"
        >
          {next.title} →
        </button>
      ) : <div />}
    </div>
  )
}

// ── Minimal markdown-ish renderer ───────────────────────────────────────────
// Supports: paragraphs, **bold**, *italic*, `code`, - bullets, 1. numbered,
// blockquotes (>), and simple headings.
function MarkdownLite({ text }) {
  const lines = String(text ?? '').split('\n')
  const blocks = []
  let buffer = []

  const flushPara = () => {
    if (!buffer.length) return
    const content = buffer.join(' ').trim()
    if (content) blocks.push({ type: 'p', content })
    buffer = []
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { flushPara(); i++; continue }

    // Bulleted list
    if (/^-\s+/.test(trimmed)) {
      flushPara()
      const items = []
      while (i < lines.length && /^-\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^-\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      flushPara()
      const items = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      flushPara()
      const quote = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', content: quote.join(' ') })
      continue
    }

    // Heading: a line that is entirely bold (no other asterisks).
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      flushPara()
      blocks.push({ type: 'h4', content: trimmed.replace(/^\*\*|\*\*$/g, '') })
      i++
      continue
    }

    buffer.push(trimmed)
    i++
  }
  flushPara()

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.type === 'p')     return <p key={idx} className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(b.content) }} />
        if (b.type === 'h4')    return <h4 key={idx} className="text-sm font-semibold text-gray-900 mt-1" dangerouslySetInnerHTML={{ __html: inline(b.content) }} />
        if (b.type === 'quote') return <blockquote key={idx} className="border-l-4 border-brand-300 pl-3 text-sm text-gray-600 italic" dangerouslySetInnerHTML={{ __html: inline(b.content) }} />
        if (b.type === 'ul') return (
          <ul key={idx} className="space-y-1.5 pl-1">
            {b.items.map((it, j) => (
              <li key={j} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                <span className="text-brand-500 mt-0.5 shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: inline(it) }} />
              </li>
            ))}
          </ul>
        )
        if (b.type === 'ol') return (
          <ol key={idx} className="space-y-1.5 pl-1">
            {b.items.map((it, j) => (
              <li key={j} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                <span className="text-brand-600 font-semibold shrink-0 min-w-[18px]">{j + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: inline(it) }} />
              </li>
            ))}
          </ol>
        )
        return null
      })}
    </div>
  )
}

// Very small inline formatter. Input is trusted (our own content module); we
// still escape HTML before applying markdown to avoid surprises.
function inline(s) {
  const esc = String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-[12px]">$1</code>')
}
