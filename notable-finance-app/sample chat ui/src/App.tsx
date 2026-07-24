import { useState, useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────
interface FinancialCard {
  id: string
  type: 'transfer' | 'payment' | 'approval' | 'investment'
  title: string
  from?: string
  to?: string
  amount: number
  currency: string
  fee?: number
  date: string
  reference: string
  risk: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'denied'
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  card?: FinancialCard
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  preview: string
  timestamp: Date
}

// ── Sample card generator ─────────────────────────────────────────────
function generateCard(prompt: string, id: string): FinancialCard {
  const types: FinancialCard['type'][] = ['transfer', 'payment', 'approval', 'investment']
  const type = types[Math.floor(Math.random() * types.length)]
  const amounts = [12450.00, 87320.50, 5000.00, 234000.00, 1850.75, 45600.00]
  const amount = amounts[Math.floor(Math.random() * amounts.length)]
  const risks: FinancialCard['risk'][] = ['low', 'medium', 'high']
  const risk = risks[Math.floor(Math.random() * risks.length)]

  const cards: Record<FinancialCard['type'], Partial<FinancialCard>> = {
    transfer: {
      title: 'Wire Transfer Request',
      from: 'Acct ···4821',
      to: 'Meridian Capital LLC',
      fee: 25.00,
    },
    payment: {
      title: 'Vendor Payment Authorization',
      from: 'Operating Account',
      to: 'TechSolutions GmbH',
      fee: 0,
    },
    approval: {
      title: 'Large Transaction Approval',
      from: 'Corporate Reserve',
      to: 'Investment Portfolio',
      fee: 150.00,
    },
    investment: {
      title: 'Portfolio Rebalancing Order',
      from: 'Cash Position',
      to: 'S&P 500 Index Fund',
      fee: 4.95,
    },
  }

  return {
    id,
    type,
    currency: 'USD',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    reference: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    risk,
    status: 'pending',
    amount,
    ...cards[type],
  } as FinancialCard
}

// ── AI Response generator ─────────────────────────────────────────────
function generateResponse(prompt: string): string {
  const responses = [
    "I've analyzed your request and identified a transaction that requires your authorization. Please review the details below and approve or deny accordingly.",
    "Based on current market conditions and your portfolio parameters, I've prepared an action for your review. The risk assessment has been completed — your decision is needed.",
    "I've flagged this transaction for compliance review. All counterparty checks passed. Here's the pending action requiring your sign-off:",
    "Your request has been processed. I've cross-referenced this against your spending limits and authorization matrix. Please review the card below:",
    "Understood. I've prepared the financial action based on your instructions. The transaction has been pre-validated — final approval is yours:",
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

// ── Conversations list ────────────────────────────────────────────────
const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'Q3 Budget Transfers', preview: 'Wire transfer to Meridian Capital…', timestamp: new Date(Date.now() - 86400000 * 2) },
  { id: '2', title: 'Vendor Payments Oct', preview: 'Authorize TechSolutions payment…', timestamp: new Date(Date.now() - 86400000 * 5) },
  { id: '3', title: 'Portfolio Rebalancing', preview: 'Move 15% to fixed income…', timestamp: new Date(Date.now() - 86400000 * 10) },
  { id: '4', title: 'Compliance Review', preview: 'High-value transfers flagged…', timestamp: new Date(Date.now() - 86400000 * 14) },
]

const QUICK_PROMPTS = [
  'Review pending wire transfers',
  'Authorize payroll processing',
  'Check flagged transactions',
  'Portfolio rebalancing order',
]

// ── Risk badge ────────────────────────────────────────────────────────
function RiskBadge({ risk }: { risk: FinancialCard['risk'] }) {
  const styles = {
    low: 'bg-[rgba(61,223,166,0.12)] text-[#3ddfa6] border border-[rgba(61,223,166,0.2)]',
    medium: 'bg-[rgba(245,166,35,0.1)] text-[#f5a623] border border-[rgba(245,166,35,0.2)]',
    high: 'bg-[rgba(240,79,106,0.12)] text-[#f04f6a] border border-[rgba(240,79,106,0.2)]',
  }
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-widest ${styles[risk]}`}>
      {risk} risk
    </span>
  )
}

// ── Financial action card ─────────────────────────────────────────────
function ActionCard({
  card,
  onAction,
}: {
  card: FinancialCard
  onAction: (id: string, action: 'approved' | 'denied') => void
}) {
  const isPending = card.status === 'pending'

  const typeIcon: Record<FinancialCard['type'], string> = {
    transfer: '⇄',
    payment: '↑',
    approval: '◈',
    investment: '◎',
  }

  return (
    <div
      className="msg-enter mt-3 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #161d2e 0%, #111827 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Card header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(74,158,255,0.15)', color: '#4a9eff' }}
          >
            {typeIcon[card.type]}
          </div>
          <div>
            <div className="text-sm font-medium text-[#e8edf5]">{card.title}</div>
            <div className="text-[11px] text-[#6b7896] mt-0.5 font-mono-num">{card.reference}</div>
          </div>
        </div>
        <RiskBadge risk={card.risk} />
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {/* Amount */}
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[#6b7896]">Amount</span>
          <span
            className="font-mono-num text-2xl font-medium text-[#e8edf5]"
          >
            <span className="text-[#6b7896] text-base mr-1">{card.currency}</span>
            {card.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* From/To */}
        <div
          className="rounded-xl p-3 space-y-2"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6b7896] text-[11px] uppercase tracking-wider">From</span>
            <span className="text-[#e8edf5] font-medium text-[13px]">{card.from}</span>
          </div>
          <div
            className="flex items-center justify-center"
            style={{ color: '#3a4560' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6b7896] text-[11px] uppercase tracking-wider">To</span>
            <span className="text-[#e8edf5] font-medium text-[13px]">{card.to}</span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[#6b7896]">Date </span>
              <span className="font-mono-num text-[#a0aec0]">{card.date}</span>
            </div>
            {card.fee !== undefined && card.fee > 0 && (
              <div>
                <span className="text-[#6b7896]">Fee </span>
                <span className="font-mono-num text-[#a0aec0]">
                  ${card.fee.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card footer — action buttons */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {card.status === 'pending' ? (
          <>
            <button
              onClick={() => onAction(card.id, 'approved')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #1a8a62, #27c98e)',
                color: '#ffffff',
                boxShadow: '0 2px 12px rgba(39,201,142,0.3)',
              }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onAction(card.id, 'denied')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                background: 'rgba(240,79,106,0.12)',
                color: '#f04f6a',
                border: '1px solid rgba(240,79,106,0.25)',
              }}
            >
              ✕ Deny
            </button>
          </>
        ) : card.status === 'approved' ? (
          <div
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{ background: 'rgba(61,223,166,0.1)', color: '#3ddfa6', border: '1px solid rgba(61,223,166,0.2)' }}
          >
            ✓ Approved
          </div>
        ) : (
          <div
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{ background: 'rgba(240,79,106,0.1)', color: '#f04f6a', border: '1px solid rgba(240,79,106,0.2)' }}
          >
            ✕ Denied
          </div>
        )}
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 msg-enter">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
        style={{ background: 'rgba(74,158,255,0.15)', color: '#4a9eff', border: '1px solid rgba(74,158,255,0.2)' }}
      >
        ◈
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-md"
        style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-1.5 h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6b7896] dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#6b7896] dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#6b7896] dot-3" />
        </div>
      </div>
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────
function MessageBubble({
  message,
  onAction,
}: {
  message: Message
  onAction: (id: string, action: 'approved' | 'denied') => void
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end msg-enter">
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f, #1a3052)',
            color: '#e8edf5',
            border: '1px solid rgba(74,158,255,0.15)',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 msg-enter">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(74,158,255,0.15)', color: '#4a9eff', border: '1px solid rgba(74,158,255,0.2)' }}
      >
        ◈
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-md text-sm leading-relaxed text-[#c8d3e8]"
          style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {message.content}
        </div>
        {message.card && (
          <ActionCard card={message.card} onAction={onAction} />
        )}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [conversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [activeConvId, setActiveConvId] = useState('new')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (text?: string) => {
    const prompt = (text ?? input).trim()
    if (!prompt || isTyping) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 1400 + Math.random() * 600))

    const cardId = `card-${Date.now()}`
    const card = generateCard(prompt, cardId)
    const aiMsg: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: generateResponse(prompt),
      card,
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages(prev => [...prev, aiMsg])
  }

  const handleAction = (cardId: string, action: 'approved' | 'denied') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.card?.id === cardId
          ? { ...msg, card: { ...msg.card!, status: action } }
          : msg
      )
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const formatConvDate = (d: Date) => {
    const days = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080b12' }}>
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: sidebarOpen ? '260px' : '0px',
          overflow: 'hidden',
          background: '#0e1320',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ width: '260px' }}>
          {/* Logo */}
          <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563a8)', color: '#4a9eff' }}
            >
              F
            </div>
            <span className="text-sm font-semibold text-[#e8edf5] tracking-tight">FinanceAI</span>
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(74,158,255,0.15)', color: '#4a9eff' }}
            >
              PRO
            </span>
          </div>

          {/* New chat */}
          <div className="px-3 pt-4 pb-2">
            <button
              onClick={() => { setActiveConvId('new'); setMessages([]) }}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:brightness-110"
              style={{
                background: 'rgba(74,158,255,0.1)',
                color: '#4a9eff',
                border: '1px solid rgba(74,158,255,0.2)',
              }}
            >
              <span className="text-base leading-none">+</span>
              New conversation
            </button>
          </div>

          {/* Conversation list */}
          <div className="px-3 mt-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#3a4560] font-medium">Recent</div>
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group"
                style={{
                  background: activeConvId === conv.id ? 'rgba(74,158,255,0.08)' : 'transparent',
                  border: activeConvId === conv.id ? '1px solid rgba(74,158,255,0.15)' : '1px solid transparent',
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[13px] font-medium text-[#c8d3e8] truncate pr-2">{conv.title}</span>
                  <span className="text-[10px] text-[#3a4560] flex-shrink-0">{formatConvDate(conv.timestamp)}</span>
                </div>
                <div className="text-[11px] text-[#6b7896] truncate">{conv.preview}</div>
              </button>
            ))}
          </div>

          {/* User section */}
          <div
            className="absolute bottom-0 left-0 px-4 py-3 flex items-center gap-3"
            style={{
              width: '260px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: '#0e1320',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563a8)', color: '#93c5fd' }}
            >
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[#c8d3e8] truncate">James Dawson</div>
              <div className="text-[10px] text-[#6b7896]">CFO · Apex Corp</div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#3ddfa6]" />
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(8,11,18,0.8)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
              style={{ color: '#6b7896' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            </button>
            <div>
              <div className="text-sm font-semibold text-[#e8edf5]">Financial Assistant</div>
              <div className="text-[11px] text-[#3ddfa6] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ddfa6] inline-block" />
                Active · Monitoring 4 accounts
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-mono-num"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7896' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" />
              3 pending actions
            </div>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7896] transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 4.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#080b12' }}>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                style={{ background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.2)' }}
              >
                ◈
              </div>
              <h2 className="text-xl font-semibold text-[#e8edf5] mb-2">How can I help today?</h2>
              <p className="text-[13px] text-[#6b7896] max-w-sm leading-relaxed mb-8">
                I can help you review transactions, authorize payments, analyze portfolio positions, and manage financial workflows.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-4 py-3 rounded-xl text-left text-[12px] text-[#a0aec0] transition-all duration-150 hover:text-[#e8edf5]"
                    style={{
                      background: '#0e1320',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(74,158,255,0.25)'
                      e.currentTarget.style.background = 'rgba(74,158,255,0.05)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                      e.currentTarget.style.background = '#0e1320'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
              {messages.map(msg => (
                <div key={msg.id}>
                  <MessageBubble message={msg} onAction={handleAction} />
                  <div className={`text-[10px] text-[#3a4560] mt-1.5 ${msg.role === 'user' ? 'text-right' : 'pl-10'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(8,11,18,0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <div
              className="flex items-end gap-3 rounded-2xl px-4 py-3"
              style={{
                background: '#0e1320',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 0 0 0 transparent',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={() => {}}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your finances…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-[#e8edf5] placeholder-[#3a4560] outline-none leading-relaxed"
                style={{ maxHeight: '120px', minHeight: '22px' }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 flex-shrink-0"
                style={{
                  background: input.trim() && !isTyping ? 'linear-gradient(135deg, #1e3a5f, #2563a8)' : 'rgba(255,255,255,0.05)',
                  color: input.trim() && !isTyping ? '#93c5fd' : '#3a4560',
                  border: '1px solid rgba(74,158,255,0.15)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-[#3a4560]">Enter to send · Shift+Enter for new line</span>
              <span className="text-[10px] text-[#3a4560] font-mono-num">GPT-4 · End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
