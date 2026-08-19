import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, DNAHelix, Spinner, BackBtn } from '../components/UI'
import { BANK_DATA, RBI_RATES } from '../data/bankRates'
import { useStore } from '../store/useStore'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { BADGE_DEFS } from '../utils/badges'

const SYSTEM_PROMPT = `You are FinAI, an expert Indian financial advisor embedded inside FinSure — a fintech platform. 
You have deep knowledge of:
- Indian banking system: SBI, HDFC, ICICI, Axis, Kotak, PNB, BOB, Canara, IDBI, Union Bank
- Current RBI repo rate: ${RBI_RATES.repoRate}% (as of ${RBI_RATES.lastUpdated})
- Home loan rates: SBI ${BANK_DATA[0].homeLoan.min}%, HDFC ${BANK_DATA[1].homeLoan.min}%, ICICI ${BANK_DATA[2].homeLoan.min}%
- Personal loan rates: SBI ${BANK_DATA[0].personalLoan.min}%, HDFC ${BANK_DATA[1].personalLoan.min}%
- CIBIL/credit score impact on loan eligibility
- Section 80C, 24B tax deductions on home loans
- EMI calculation, prepayment strategies, debt snowball vs avalanche
- PMAY (Pradhan Mantri Awas Yojana) schemes
- SIP, mutual funds, retirement planning

Rules:
- Always respond in the same language as the user (English/Hindi/Marathi)
- Keep answers concise, practical, and India-specific
- Use ₹ for currency, always give real numbers
- Never give stock/crypto advice
- If asked about a specific bank rate, use the real data above
- Sign off with "— FinAI" on longer responses
- Format with clear sections when helpful
- You are NOT a replacement for a certified financial advisor — mention this for major decisions`

const SUGGESTIONS = [
  "What is the best home loan rate right now?",
  "How much EMI can I afford on ₹60,000 salary?",
  "Compare SBI vs HDFC for home loan",
  "How does CIBIL score affect my loan eligibility?",
  "What is Section 80C deduction on home loan?",
  "Explain prepayment penalty in simple terms",
  "Should I choose 20yr or 30yr home loan tenure?",
  "What is RBI repo rate and how does it affect me?",
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-5 py-4">
      {[0,1,2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--cyan)' }}
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </div>
  )
}

function Message({ msg }) {
  const isAI = msg.role === 'assistant'
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
        style={{ background: isAI ? 'var(--cyan)' : 'rgba(129,140,248,0.2)', color: isAI ? '#020a12' : 'var(--purple)', border: isAI ? 'none' : '1px solid rgba(129,140,248,0.3)' }}>
        isAI ? 'AI' : 'ME'
      </div>
      {/* Bubble */}
      <div className={`max-w-[80%] px-5 py-4 rounded-2xl text-sm leading-relaxed ${isAI ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={{
          background: isAI ? 'rgba(34,211,238,0.06)' : 'rgba(129,140,248,0.1)',
          border: isAI ? '1px solid rgba(34,211,238,0.2)' : '1px solid rgba(129,140,248,0.2)',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
        {msg.content}
        {isAI && (
          <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function FinAI() {
  const { addBadge } = useStore()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste! I'm FinAI, your personal Indian financial advisor.\n\nI have real-time data on:\n• 10 major Indian banks (SBI, HDFC, ICICI, Axis, Kotak + 5 more)\n• RBI Repo Rate: ${RBI_RATES.repoRate}%\n• Home loans from ${Math.min(...BANK_DATA.map(b=>b.homeLoan.min))}% p.a.\n\nAsk me anything about loans, EMIs, credit scores, tax savings, or financial planning.\n\n— FinAI`,
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatCount, setChatCount] = useState(0)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')

    const userMsg = { role: 'user', content: userText, timestamp: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      const aiText = data.content?.[0]?.text || "I'm having trouble connecting right now. Please try again in a moment."

      const aiMsg = { role: 'assistant', content: aiText, timestamp: Date.now() }
      setMessages(prev => [...prev, aiMsg])

      // Save to Firestore
      try {
        await addDoc(collection(db, 'aiChats'), {
          userEmail: auth.currentUser?.email,
          question: userText,
          answer: aiText,
          createdAt: new Date()
        })
      } catch (e) { /* silent */ }

      // Badge
      const newCount = chatCount + 1
      setChatCount(newCount)
      if (newCount === 1) addBadge(BADGE_DEFS.find(b => b.id === 'first_analysis'))

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm currently offline. Please check your connection and try again.\n\n— FinAI",
        timestamp: Date.now()
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared. I'm FinAI — ready for your next question!\n\nRBI Repo Rate: ${RBI_RATES.repoRate}% | Home loans from ${Math.min(...BANK_DATA.map(b=>b.homeLoan.min))}% p.a.\n\n— FinAI`,
      timestamp: Date.now()
    }])
  }

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-4xl mx-auto px-5 md:px-10 pt-20 pb-6 flex flex-col" style={{ height: '100vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 py-4 flex-shrink-0">
          <BackBtn />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,var(--cyan),var(--purple))', boxShadow: '0 0 20px rgba(34,211,238,0.3)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 2v6M8 2h8M7 15h.01M12 15h.01M17 15h.01"/></svg>
            </div>
            <div>
              <div className="font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--text-primary)' }}>FinAI Assistant</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Online — Real bank data</span>
              </div>
            </div>
          </div>
          <button onClick={clearChat} className="btn-outline px-4 py-2 text-xs">Clear Chat</button>
        </div>

        {/* Suggestion pills */}
        {messages.length <= 1 && (
          <div className="flex gap-2 flex-wrap mb-4 flex-shrink-0">
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="px-3 py-2 rounded-xl text-xs transition-all"
                style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; e.currentTarget.style.color = 'var(--cyan)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1" style={{ minHeight: 0 }}>
          {messages.map((m, i) => <Message key={i} msg={m} />)}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--cyan)", flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 2v6M8 2h8M7 15h.01M12 15h.01M17 15h.01"/></svg></div>
              <div className="rounded-2xl rounded-tl-sm" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions when chatting */}
        {messages.length > 2 && !loading && (
          <div className="flex gap-2 flex-wrap py-2 flex-shrink-0">
            {SUGGESTIONS.slice(4).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="px-3 py-1.5 rounded-xl text-xs"
                style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.1)' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex gap-3 pt-3 flex-shrink-0 border-t" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about loans, EMIs, credit score, tax savings..."
              rows={1}
              className="fin-input resize-none"
              style={{ paddingRight: 56, minHeight: 52, maxHeight: 120, overflow: 'auto', lineHeight: '1.5' }}
            />
            <div className="absolute right-3 bottom-3 text-xs" style={{ color: 'var(--text-muted)' }}>↵</div>
          </div>
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="btn-primary px-5 py-3 flex items-center gap-2 text-sm flex-shrink-0"
            style={{ opacity: (!input.trim() || loading) ? 0.5 : 1, height: 52 }}>
            {loading ? <Spinner /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs mt-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          FinAI uses real bank data. Not a substitute for a certified financial advisor.
        </p>
      </div>
    </PageShell>
  )
}
