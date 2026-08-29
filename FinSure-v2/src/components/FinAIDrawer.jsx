import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BANK_DATA, RBI_RATES } from '../data/bankRates'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'

/* ── Real bank rate table for system prompt ── */
const BANK_TABLE = BANK_DATA.map(b =>
  `${b.bank} (${b.fullName}): Home ${b.homeLoan.min}%-${b.homeLoan.max}%, Personal ${b.personalLoan.min}%-${b.personalLoan.max}%, Car ${b.carLoan.min}%, Min CIBIL ${b.minCreditScore}, Processing ${b.processingFee}, Rating ${b.rating}/5`
).join('\n')

const SYSTEM_PROMPT = `You are FinAI — an expert Indian financial advisor built into the FinSure platform. You have deep knowledge of the Indian financial ecosystem and REAL current data.

REAL BANK DATA (RBI MPC June 2025):
RBI Repo Rate: ${RBI_RATES.repoRate}%
${BANK_TABLE}

YOUR CAPABILITIES:
1. EMI CALCULATION: Use formula EMI = P×r×(1+r)^n / ((1+r)^n-1) where r = monthly rate, n = months
2. LOAN ELIGIBILITY: Max EMI = 40-50% of monthly salary. Eligible loan = (salary × 0.4 - existingEMI) × tenure_months / (r×(1+r)^n/((1+r)^n-1))
3. BANK COMPARISON: Compare any banks from the real data above — rates, fees, eligibility
4. CREDIT SCORE ADVICE: CIBIL 750+ = best rates, 700-749 = good, 650-699 = fair, below 650 = limited options
5. TAX SAVINGS: Section 80C = up to ₹1.5L on principal repayment, Section 24B = up to ₹2L on interest
6. INVESTMENT: SIP formula FV = P×((1+r)^n-1)/r×(1+r), PPF, NPS, ELSS guidance
7. PREPAYMENT: Calculate interest saved, years reduced
8. DEBT ADVICE: Snowball vs Avalanche strategy, debt-to-income ratio guidance

RESPONSE RULES:
- Always use ₹ symbol and Indian number format (lakhs, crores)
- Give EXACT numbers when asked — calculate properly, don't estimate
- When comparing banks, show a mini table with rates and EMIs
- For eligibility questions, ask for salary and existing EMI if not provided
- Mention relevant tax benefits when discussing home loans
- Keep responses concise but complete — under 300 words unless detailed calculation needed
- Always verify: Is this person asking for calculation, comparison, advice, or explanation?
- NEVER give stock/crypto/insurance product recommendations
- For legal/regulatory questions, recommend consulting RBI website or certified advisor

PERSONALITY: Professional, precise, India-focused. Use simple language. Format numbers clearly.`

function TypingDots() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'12px 16px' }}>
      {[0,1,2].map(i => (
        <motion.div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--cyan)' }}
          animate={{ y:[0,-5,0], opacity:[0.4,1,0.4] }}
          transition={{ duration:0.7, delay:i*0.15, repeat:Infinity }} />
      ))}
    </div>
  )
}

const SUGGESTIONS = [
  "EMI on ₹50L home loan at 8.5% for 20 years?",
  "Compare SBI vs HDFC home loan",
  "How much loan can I get on ₹60,000 salary?",
  "How to improve CIBIL score fast?",
  "Tax savings on home loan Section 80C + 24B?",
  "Which bank has lowest personal loan rate?",
  "Prepayment benefit calculation",
  "SIP needed to save ₹1 crore in 15 years?",
]

export default function FinAIDrawer() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Namaste! I'm FinAI — your personal Indian financial advisor.\n\nI can help you with:\n• EMI calculations with exact numbers\n• Bank comparison (10 banks, real rates)\n• Loan eligibility based on your salary\n• CIBIL score improvement plan\n• Tax savings on home loans\n• SIP & investment planning\n\nRBI Repo Rate: ${RBI_RATES.repoRate}% · Home loans from ${Math.min(...BANK_DATA.map(b=>b.homeLoan.min))}% p.a.\n\nWhat would you like to know?`,
    ts: Date.now()
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
      inputRef.current?.focus()
    }
  }, [messages, loading, open])

  const send = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const userMsg = { role:'user', content:msg, ts:Date.now() }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          messages: history.map(m => ({ role:m.role, content:m.content }))
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const reply = data.text || "I couldn't generate a response. Please try again."
      setMessages(prev => [...prev, { role:'assistant', content:reply, ts:Date.now() }])

      // Save to Firestore silently
      try {
        if (auth.currentUser) {
          await addDoc(collection(db,'aiChats'), {
            userEmail: auth.currentUser.email,
            question: msg, answer: reply, createdAt: new Date()
          })
        }
      } catch(e) { /* silent */ }

    } catch(err) {
      console.error('FinAI error:', err)
      setError(`Connection failed: ${err.message}. Check that GEMINI_API_KEY is set in Vercel.`)
      setMessages(prev => [...prev, {
        role:'assistant',
        content:"I'm having trouble connecting right now. Please try again in a moment.",
        ts:Date.now()
      }])
    }
    setLoading(false)
  }, [input, messages, loading])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const clearChat = () => {
    setMessages([{
      role:'assistant',
      content:`Chat cleared. Ready for your next question!\n\nRBI Repo: ${RBI_RATES.repoRate}% · Home loans from ${Math.min(...BANK_DATA.map(b=>b.homeLoan.min))}%`,
      ts:Date.now()
    }])
    setError('')
  }

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
            exit={{ scale:0, opacity:0 }} whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
            onClick={() => setOpen(true)}
            style={{
              position:'fixed', bottom:28, right:28, zIndex:200,
              width:56, height:56, borderRadius:'50%',
              background:'linear-gradient(135deg, var(--cyan), #818cf8)',
              border:'none', cursor:'pointer',
              boxShadow:'0 4px 24px rgba(34,211,238,0.45)',
              display:'flex', alignItems:'center', justifyContent:'center',
              animation:'pulseRing 2.5s ease-out infinite',
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2.2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              <path d="M8 9h8M8 13h5"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(2,10,18,0.55)', backdropFilter:'blur(4px)', zIndex:198 }} />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
            transition={{ type:'spring', damping:28, stiffness:280 }}
            style={{
              position:'fixed', top:0, right:0, bottom:0, zIndex:199,
              width:'100%', maxWidth:440,
              background:'rgba(4,15,26,0.98)',
              backdropFilter:'blur(24px)',
              borderLeft:'1px solid rgba(34,211,238,0.15)',
              display:'flex', flexDirection:'column',
              boxShadow:'-24px 0 80px rgba(0,0,0,0.5)',
            }}>

            {/* Header */}
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(34,211,238,0.1)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,var(--cyan),#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2.2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:'var(--text-primary)', fontSize:15 }}>FinAI Assistant</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>Online · Real bank data · Claude AI</span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={clearChat} style={{ fontSize:11, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", padding:'4px 8px', borderRadius:6 }}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--cyan)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>Clear</button>
                <button onClick={() => setOpen(false)}
                  style={{ width:30, height:30, borderRadius:8, background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.15)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div style={{ padding:'12px 16px 0', flexShrink:0, display:'flex', flexWrap:'wrap', gap:6 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    style={{ padding:'6px 12px', borderRadius:20, fontSize:11, cursor:'pointer', background:'rgba(34,211,238,0.05)', border:'1px solid rgba(34,211,238,0.15)', color:'var(--text-secondary)', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(34,211,238,0.12)';e.currentTarget.style.color='var(--cyan)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(34,211,238,0.05)';e.currentTarget.style.color='var(--text-secondary)'}}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div style={{ margin:'8px 16px', padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', fontSize:12, color:'#f87171', flexShrink:0 }}>
                {error}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
              {messages.map((m,i) => {
                const isAI = m.role === 'assistant'
                return (
                  <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    style={{ display:'flex', gap:10, flexDirection:isAI ? 'row' : 'row-reverse' }}>
                    <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                      background: isAI ? 'linear-gradient(135deg,var(--cyan),#818cf8)' : 'rgba(129,140,248,0.15)',
                      border: isAI ? 'none' : '1px solid rgba(129,140,248,0.3)' }}>
                      {isAI
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      }
                    </div>
                    <div style={{
                      maxWidth:'82%', padding:'10px 14px',
                      borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      background: isAI ? 'rgba(34,211,238,0.05)' : 'rgba(129,140,248,0.1)',
                      border: isAI ? '1px solid rgba(34,211,238,0.12)' : '1px solid rgba(129,140,248,0.2)',
                      fontSize:13, lineHeight:1.65, color:'var(--text-primary)',
                      whiteSpace:'pre-wrap', wordBreak:'break-word',
                      fontFamily:'Inter, system-ui, sans-serif'
                    }}>
                      {m.content}
                    </div>
                  </motion.div>
                )
              })}
              {loading && (
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,var(--cyan),#818cf8)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </div>
                  <div style={{ padding:'4px 8px', borderRadius:'4px 16px 16px 16px', background:'rgba(34,211,238,0.05)', border:'1px solid rgba(34,211,238,0.12)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(34,211,238,0.08)', flexShrink:0, display:'flex', gap:8 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about EMI, banks, loans, CIBIL..."
                rows={1}
                style={{
                  flex:1, background:'rgba(4,15,26,0.9)',
                  border:'1px solid rgba(34,211,238,0.15)',
                  borderRadius:12, padding:'10px 14px',
                  color:'var(--text-primary)', fontSize:13,
                  fontFamily:'Inter,sans-serif', outline:'none',
                  resize:'none', minHeight:42, maxHeight:100,
                  overflow:'auto', lineHeight:1.5, transition:'border-color 0.2s'
                }}
                onFocus={e=>e.target.style.borderColor='var(--cyan)'}
                onBlur={e=>e.target.style.borderColor='rgba(34,211,238,0.15)'}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                style={{
                  width:42, height:42, borderRadius:12, flexShrink:0,
                  background: (!input.trim()||loading) ? 'rgba(34,211,238,0.08)' : 'var(--cyan)',
                  border:'none', cursor: (!input.trim()||loading) ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: (!input.trim()||loading) ? 'rgba(34,211,238,0.3)' : '#020a12',
                  transition:'all 0.2s',
                }}>
                {loading
                  ? <svg style={{ animation:'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
              </button>
            </div>
            <p style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', paddingBottom:12 }}>
              FinAI · Real RBI + bank data · Powered by Gemini 1.5 Flash · Not a certified advisor
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
