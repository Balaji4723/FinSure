import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BANK_DATA, RBI_RATES } from '../data/bankRates'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { Spinner } from './UI'

const SYSTEM_PROMPT = `You are FinAI, an expert Indian financial advisor embedded inside FinSure.
You have real data on:
- RBI Repo Rate: ${RBI_RATES.repoRate}% (June 2025)
- Home loans from ${Math.min(...BANK_DATA.map(b=>b.homeLoan.min))}% (SBI, Union Bank)
- Personal loans from ${Math.min(...BANK_DATA.map(b=>b.personalLoan.min))}% (HDFC)
- 10 banks: SBI, HDFC, ICICI, Axis, Kotak, PNB, BOB, Canara, IDBI, Union Bank
Rules:
- Respond concisely and practically
- Use Rs. for currency when typing, always give real numbers
- Be India-specific — mention CIBIL, RBI, PMAY where relevant
- For major decisions, note you are not a certified advisor
- Keep responses under 200 words unless detailed analysis is needed`

const SUGGESTIONS = [
  "Best home loan rate right now?",
  "EMI on Rs.50L for 20 years?",
  "How to improve CIBIL score?",
  "SBI vs HDFC home loan?",
  "Section 80C tax benefit on home loan?",
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0,1,2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          style={{ background: 'var(--cyan)' }}
          animate={{ y:[0,-5,0], opacity:[0.4,1,0.4] }}
          transition={{ duration:0.7, delay:i*0.15, repeat:Infinity }} />
      ))}
    </div>
  )
}

export default function FinAIDrawer() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi! I'm FinAI.\n\nI know live rates from 10 Indian banks and RBI data. Ask me anything about loans, EMIs, credit scores, or tax savings.\n\nRBI Repo: ${RBI_RATES.repoRate}% · Home loans from ${Math.min(...BANK_DATA.map(b=>b.homeLoan.min))}%`,
    ts: Date.now()
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const userMsg = { role:'user', content:msg, ts:Date.now() }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          messages: history.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      const reply = data.text || "I'm having trouble connecting. Please try again."
      setMessages(prev => [...prev, { role:'assistant', content:reply, ts:Date.now() }])
      try {
        await addDoc(collection(db,'aiChats'), {
          userEmail: auth.currentUser?.email,
          question: msg, answer: reply, createdAt: new Date()
        })
      } catch(e) {}
    } catch(e) {
      setMessages(prev => [...prev, { role:'assistant', content:"Connection error. Please try again.", ts:Date.now() }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 200,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--cyan), #818cf8)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 0 0 0 rgba(34,211,238,0.4)',
          display: open ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          animation: 'pulseRing 2.5s ease-out infinite',
        }}
        aria-label="Open FinAI">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          <path d="M8 9h8M8 13h5"/>
        </svg>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(2,10,18,0.5)', backdropFilter:'blur(4px)', zIndex:198 }}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type:'spring', damping:28, stiffness:280 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 199,
              width: '100%', maxWidth: 420,
              background: 'rgba(4,15,26,0.98)',
              backdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(34,211,238,0.15)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
            }}>

            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(34,211,238,0.1)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,var(--cyan),#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:'var(--text-primary)', fontSize:15 }}>FinAI Assistant</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>Online · Real bank data</span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setMessages([{ role:'assistant', content:`Hi! I'm FinAI. Ask me anything about loans, EMIs or credit scores.`, ts:Date.now() }])}
                  style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontSize:11, fontFamily:"'Space Grotesk',sans-serif" }}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--cyan)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                  Clear
                </button>
                <button onClick={() => setOpen(false)}
                  style={{ width:30, height:30, borderRadius:8, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.15)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(34,211,238,0.15)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(34,211,238,0.08)'}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Suggestions — only when fresh */}
            {messages.length <= 1 && (
              <div style={{ padding:'12px 16px 0', flexShrink:0, display:'flex', flexWrap:'wrap', gap:6 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    style={{ padding:'6px 12px', borderRadius:20, fontSize:11, cursor:'pointer', background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.15)', color:'var(--text-secondary)', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(34,211,238,0.12)';e.currentTarget.style.color='var(--cyan)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(34,211,238,0.06)';e.currentTarget.style.color='var(--text-secondary)'}}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
              {messages.map((m,i) => {
                const isAI = m.role === 'assistant'
                return (
                  <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                    style={{ display:'flex', gap:10, flexDirection: isAI ? 'row' : 'row-reverse' }}>
                    <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: isAI ? 'linear-gradient(135deg,var(--cyan),#818cf8)' : 'rgba(129,140,248,0.15)', border: isAI ? 'none' : '1px solid rgba(129,140,248,0.3)' }}>
                      {isAI
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      }
                    </div>
                    <div style={{
                      maxWidth:'82%', padding:'10px 14px', borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      background: isAI ? 'rgba(34,211,238,0.06)' : 'rgba(129,140,248,0.1)',
                      border: isAI ? '1px solid rgba(34,211,238,0.15)' : '1px solid rgba(129,140,248,0.2)',
                      fontSize:13, lineHeight:1.6, color:'var(--text-primary)',
                      whiteSpace:'pre-wrap', wordBreak:'break-word'
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
                  <div style={{ padding:'4px 8px', borderRadius:'4px 16px 16px 16px', background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.15)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(34,211,238,0.08)', flexShrink:0, display:'flex', gap:8 }}>
              <textarea value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                placeholder="Ask about loans, EMIs, credit score..."
                rows={1}
                style={{
                  flex:1, background:'rgba(4,15,26,0.9)', border:'1px solid rgba(34,211,238,0.15)',
                  borderRadius:12, padding:'10px 14px', color:'var(--text-primary)', fontSize:13,
                  fontFamily:'Inter,sans-serif', outline:'none', resize:'none',
                  minHeight:42, maxHeight:100, overflow:'auto', lineHeight:1.5,
                  transition:'border-color 0.2s'
                }}
                onFocus={e=>e.target.style.borderColor='var(--cyan)'}
                onBlur={e=>e.target.style.borderColor='rgba(34,211,238,0.15)'}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                style={{
                  width:42, height:42, borderRadius:12, flexShrink:0,
                  background: (!input.trim()||loading) ? 'rgba(34,211,238,0.1)' : 'var(--cyan)',
                  border:'none', cursor: (!input.trim()||loading) ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.2s',
                  color: (!input.trim()||loading) ? 'rgba(34,211,238,0.4)' : '#020a12',
                }}>
                {loading
                  ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                }
              </button>
            </div>

            <p style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', paddingBottom:10 }}>
              FinAI · Real bank data · Not a certified advisor
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
