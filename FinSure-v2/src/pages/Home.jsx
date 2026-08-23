import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useStore } from '../store/useStore'
import { useBankRates } from '../hooks/useBankRates'

/* ─── Terminal color palette ─── */
const T = {
  green:   '#00ff41',
  dimGreen:'#00cc33',
  cyan:    '#00ffff',
  yellow:  '#ffff00',
  red:     '#ff4444',
  purple:  '#cc88ff',
  white:   '#e0e0e0',
  dim:     '#555555',
  bg:      '#0a0a0a',
  bgLine:  'rgba(0,255,65,0.025)',
}

/* ─── All features ─── */
const FEATURES = [
  { cmd:'findna',      label:'FinDNA Analyzer',    desc:'AI 5-factor financial DNA score + loan eligibility',    route:'/eligibility', tag:'[AI]',    color: T.cyan    },
  { cmd:'emi',         label:'EMI Calculator',      desc:'Real-time amortisation with live sliders + PDF export', route:'/emi',         tag:'[CALC]',  color: T.green   },
  { cmd:'loan',        label:'Loan Feasibility',    desc:'Approval probability across 10 real Indian banks',      route:'/policy',      tag:'[BANK]',  color: T.yellow  },
  { cmd:'compare',     label:'Bank Comparison',     desc:'SBI HDFC ICICI Axis Kotak PNB BOB Canara IDBI Union',  route:'/compare',     tag:'[DATA]',  color: T.cyan    },
  { cmd:'recommend',   label:'Loan Recommender',    desc:'Match score engine — best bank ranked for your profile',route:'/recommend',   tag:'[AI]',    color: T.purple  },
  { cmd:'tools',       label:'Financial Tools',     desc:'Tax 80C+24B / SIP / Debt planner / Net worth / Prepay',route:'/tools',       tag:'[UTIL]',  color: T.green   },
  { cmd:'goals',       label:'Goal Planner',        desc:'Reverse-calculate monthly savings for any life goal',   route:'/goals',       tag:'[PLAN]',  color: T.yellow  },
  { cmd:'credit',      label:'CIBIL Booster',       desc:'Month-by-month roadmap to target credit score',        route:'/credit',      tag:'[ROAD]',  color: T.cyan    },
  { cmd:'dashboard',   label:'Your Dashboard',      desc:'Badges streaks FinScore leaderboard full journey',     route:'/dashboard',   tag:'[STAT]',  color: T.purple  },
  { cmd:'report',      label:'FinDNA Report Card',  desc:'Shareable PNG of your financial score — download now', route:'/report-card', tag:'[GEN]',   color: T.green   },
  { cmd:'leaderboard', label:'Leaderboard',         desc:'Anonymous global FinScore ranks — Diamond to Bronze',  route:'/leaderboard', tag:'[RANK]',  color: T.yellow  },
  { cmd:'history',     label:'Report History',      desc:'All saved reports across EMI eligibility and loans',   route:'/history',     tag:'[LOG]',   color: T.dim     },
]

/* ─── Typewriter hook ─── */
function useTypewriter(text, speed = 32, startDelay = 0) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed(''); setDone(false)
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(interval); setDone(true) }
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [text, speed, startDelay])
  return { displayed, done }
}

/* ─── Blinking cursor ─── */
function Cursor({ color = T.green }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
      style={{ display: 'inline-block', width: 9, height: 16, background: color, marginLeft: 2, verticalAlign: 'middle' }}
    />
  )
}

/* ─── Scanline overlay ─── */
function Scanlines() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      mixBlendMode: 'multiply',
    }} />
  )
}

/* ─── CRT vignette ─── */
function Vignette() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)',
    }} />
  )
}

/* ─── Matrix rain (subtle, right side) ─── */
function MatrixRain() {
  const canvasRef = useRef()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = 220
    canvas.height = window.innerHeight
    const cols = Math.floor(220 / 16)
    const drops = Array(cols).fill(1)
    const chars = '₹%#@!01ABCDEFエオカキ9871NRSZ'
    const draw = () => {
      ctx.fillStyle = 'rgba(10,10,10,0.07)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#00ff41'
      ctx.font = '13px "JetBrains Mono", monospace'
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)]
        ctx.globalAlpha = Math.random() * 0.5 + 0.1
        ctx.fillText(ch, i * 16, y * 16)
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
      ctx.globalAlpha = 1
    }
    const id = setInterval(draw, 55)
    return () => clearInterval(id)
  }, [])
  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', right: 0, top: 0, height: '100vh', width: 220,
      opacity: 0.18, pointerEvents: 'none', zIndex: 5,
    }} />
  )
}

/* ─── Terminal line ─── */
function TermLine({ children, color = T.white, indent = 0, style = {} }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 13, lineHeight: 1.7, color, paddingLeft: indent * 16, ...style }}>
      {children}
    </div>
  )
}

/* ─── Feature row ─── */
function FeatureRow({ feature, idx, isSelected, onClick, query }) {
  const match = query.length > 0 && (
    feature.cmd.includes(query.toLowerCase()) ||
    feature.label.toLowerCase().includes(query.toLowerCase()) ||
    feature.desc.toLowerCase().includes(query.toLowerCase())
  )
  const hidden = query.length > 0 && !match
  if (hidden) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * idx, duration: 0.2 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'baseline', gap: 12,
        padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
        background: isSelected ? 'rgba(0,255,65,0.08)' : 'transparent',
        border: isSelected ? '1px solid rgba(0,255,65,0.2)' : '1px solid transparent',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,255,65,0.04)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
      {/* Prompt */}
      <span style={{ color: isSelected ? T.green : T.dimGreen, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, flexShrink: 0 }}>
        {isSelected ? '>' : ' '}
      </span>
      {/* Command */}
      <span style={{ color: feature.color, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, width: 120, flexShrink: 0, fontWeight: isSelected ? 700 : 400 }}>
        finsure <span style={{ color: isSelected ? T.white : T.dimGreen }}>{feature.cmd}</span>
      </span>
      {/* Tag */}
      <span style={{ color: T.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, width: 54, flexShrink: 0 }}>
        {feature.tag}
      </span>
      {/* Desc */}
      <span style={{ color: isSelected ? T.white : '#888', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        # {feature.desc}
      </span>
    </motion.div>
  )
}

/* ─── Bank rate table ─── */
function BankTable({ banks, rbi }) {
  return (
    <div>
      <TermLine color={T.dimGreen}>┌─ live_rates.json ──────────────────────────────────</TermLine>
      <TermLine color={T.dim}>│  RBI_REPO_RATE = <span style={{ color: T.yellow }}>{rbi.repoRate}%</span>  SOURCE = RBI_MPC_2025</TermLine>
      <TermLine color={T.dim}>│</TermLine>
      <TermLine color={T.dim}>│  <span style={{ color: T.dim }}>{'BANK'.padEnd(10)} {'HOME'.padEnd(8)} {'PERSONAL'.padEnd(12)} TYPE</span></TermLine>
      {banks.slice(0, 6).map(b => (
        <TermLine key={b.bank} color={T.dim}>
          │  <span style={{ color: T.green }}>{b.bank.padEnd(10)}</span>
          <span style={{ color: T.yellow }}>{`${b.homeLoan.min}%`.padEnd(8)}</span>
          <span style={{ color: T.cyan }}>{`${b.personalLoan.min}%`.padEnd(12)}</span>
          <span style={{ color: T.dim }}>{b.type}</span>
        </TermLine>
      ))}
      <TermLine color={T.dimGreen}>└────────────────────────────────────────────────────</TermLine>
    </div>
  )
}

/* ─── Main Home ─── */
export default function Home() {
  const navigate = useNavigate()
  const { updateStreak } = useStore()
  const { rbi, banks, source } = useBankRates()
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showRates, setShowRates] = useState(false)
  const [booted, setBooted] = useState(false)
  const [bootLines, setBootLines] = useState([])
  const inputRef = useRef()
  const loggedIn = localStorage.getItem('loggedIn') === 'true'

  const { displayed: headline, done: headlineDone } = useTypewriter(
    'FINSURE FINANCIAL INTELLIGENCE PLATFORM v2.0', 28, 400
  )
  const { displayed: subline } = useTypewriter(
    `> Loaded ${FEATURES.length} modules  > ${banks.length} bank feeds active  > RBI repo ${rbi.repoRate}%`,
    18, 1800
  )

  /* Boot sequence */
  useEffect(() => {
    updateStreak()
    const lines = [
      { t: 0,    text: 'Initializing FinSure kernel...', color: T.dimGreen },
      { t: 280,  text: 'Loading bank_rates.json → 10 banks OK', color: T.green },
      { t: 560,  text: `RBI repo rate: ${rbi.repoRate}% [FETCHED]`, color: T.yellow },
      { t: 840,  text: 'Firebase auth module → CONNECTED', color: T.green },
      { t: 1100, text: 'AI engine (claude-sonnet-4-6) → STANDBY', color: T.cyan },
      { t: 1380, text: 'All systems operational. Type a command.', color: T.green },
    ]
    lines.forEach(l => {
      setTimeout(() => setBootLines(prev => [...prev, l]), l.t)
    })
    setTimeout(() => setBooted(true), 1700)
  }, [])

  const visibleFeatures = FEATURES.filter(f =>
    query.length === 0 ||
    f.cmd.includes(query.toLowerCase()) ||
    f.label.toLowerCase().includes(query.toLowerCase()) ||
    f.desc.toLowerCase().includes(query.toLowerCase())
  )

  const goTo = (route) => {
    if (loggedIn) navigate(route)
    else navigate('/login')
  }

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, visibleFeatures.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      const f = visibleFeatures[selectedIdx]
      if (f) goTo(f.route)
    }
    if (e.key === 'Escape') { setQuery(''); setSelectedIdx(0) }
  }

  // Reset selection when query changes
  useEffect(() => { setSelectedIdx(0) }, [query])

  return (
    <div style={{ background: T.bg, minHeight: '100vh', overflowX: 'hidden' }}
      onClick={() => inputRef.current?.focus()}>
      <Scanlines />
      <Vignette />
      <MatrixRain />
      <Navbar />

      {/* ─── TERMINAL WINDOW ─── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '84px 20px 60px', position: 'relative', zIndex: 10 }}>

        {/* Terminal chrome */}
        <div style={{ border: `1px solid ${T.dimGreen}40`, borderRadius: 8, overflow: 'hidden', boxShadow: `0 0 60px ${T.green}08, 0 0 0 1px ${T.dimGreen}20` }}>

          {/* Title bar */}
          <div style={{ background: '#111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.dimGreen}25` }}>
            <div style={{ display: 'flex', gap: 7 }}>
              {['#ff5f56','#ffbd2e','#27c93f'].map((c, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.dim, flex: 1, textAlign: 'center' }}>
              finsure@terminal ~ bash
            </span>
          </div>

          {/* Terminal body */}
          <div style={{ background: T.bg, padding: '20px 24px', minHeight: '80vh', fontFamily: "'JetBrains Mono',monospace" }}>

            {/* Boot sequence */}
            <div style={{ marginBottom: 20 }}>
              {bootLines.map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <TermLine color={l.color}>{l.text}</TermLine>
                </motion.div>
              ))}
            </div>

            {booted && (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

                  {/* Headline */}
                  <div style={{ marginBottom: 24 }}>
                    <TermLine color={T.green} style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.04em' }}>
                      {headline}{!headline.endsWith('v2.0') && <Cursor />}
                    </TermLine>
                    <TermLine color={T.dimGreen} style={{ fontSize: 12 }}>{subline}</TermLine>
                  </div>

                  {/* Divider */}
                  <TermLine color={T.dimGreen}>{'─'.repeat(72)}</TermLine>

                  {/* Search prompt */}
                  <div style={{ margin: '16px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: T.green, fontSize: 14 }}>root@finsure:~$</span>
                    <span style={{ color: T.cyan, fontSize: 14 }}>finsure search</span>
                    <span style={{ color: T.dim, fontSize: 14 }}>"</span>
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleKey}
                      autoFocus
                      placeholder="type to filter..."
                      style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        color: T.white, fontFamily: "'JetBrains Mono',monospace", fontSize: 14,
                        width: 220, caretColor: T.green,
                      }}
                    />
                    <span style={{ color: T.dim, fontSize: 14 }}>"</span>
                    {!query && <Cursor color={T.green} />}
                  </div>

                  {/* Keyboard hint */}
                  <TermLine color={T.dim} style={{ fontSize: 11, marginBottom: 12 }}>
                    {'  '}↑↓ navigate  · ENTER launch  · ESC clear  · click to select
                  </TermLine>

                  <TermLine color={T.dimGreen}>{'─'.repeat(72)}</TermLine>

                  {/* Feature list */}
                  <div style={{ marginTop: 8 }}>
                    {visibleFeatures.length === 0 ? (
                      <TermLine color={T.red} indent={1}>
                        bash: {query}: command not found. Try 'emi', 'loan', 'findna'...
                      </TermLine>
                    ) : (
                      visibleFeatures.map((f, i) => (
                        <FeatureRow
                          key={f.cmd}
                          feature={f}
                          idx={i}
                          isSelected={i === selectedIdx}
                          onClick={() => goTo(f.route)}
                          query={query}
                        />
                      ))
                    )}
                  </div>

                  <TermLine color={T.dimGreen} style={{ marginTop: 12 }}>{'─'.repeat(72)}</TermLine>

                  {/* Quick actions */}
                  <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                      { label: '--analyze', action: () => goTo('/eligibility'), color: T.cyan },
                      { label: '--compare-banks', action: () => goTo('/compare'), color: T.yellow },
                      { label: '--show-rates', action: () => setShowRates(p => !p), color: T.green },
                      { label: loggedIn ? '--logout' : '--login', action: () => { if(loggedIn){localStorage.removeItem('loggedIn');navigate('/')}else navigate('/login') }, color: loggedIn ? T.red : T.purple },
                    ].map(a => (
                      <button key={a.label} onClick={a.action}
                        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: a.color, background: 'transparent', border: `1px solid ${a.color}35`, borderRadius: 4, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${a.color}12`; e.currentTarget.style.borderColor = a.color }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${a.color}35` }}>
                        finsure {a.label}
                      </button>
                    ))}
                  </div>

                  {/* Live rates panel */}
                  <AnimatePresence>
                    {showRates && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                        style={{ marginTop: 20, overflow: 'hidden' }}>
                        <BankTable banks={banks} rbi={rbi} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Status bar */}
                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <TermLine color={T.dim} style={{ fontSize: 11 }}>
                      MODULES: {FEATURES.length} &nbsp;|&nbsp; BANKS: {banks.length} ONLINE &nbsp;|&nbsp; REPO: {rbi.repoRate}% &nbsp;|&nbsp; SESSION: {loggedIn ? <span style={{ color: T.green }}>AUTHENTICATED</span> : <span style={{ color: T.red }}>GUEST</span>}
                    </TermLine>
                    <TermLine color={T.dim} style={{ fontSize: 11 }}>
                      {source}
                    </TermLine>
                  </div>

                  {/* Blinking final prompt */}
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: T.green, fontSize: 14, fontFamily: "'JetBrains Mono',monospace" }}>root@finsure:~$</span>
                    <Cursor />
                  </div>

                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Outside-terminal footer */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.dim }}>
            FinSure Financial Intelligence Platform · React + Firebase + Three.js
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { l: 'GitHub', h: 'https://github.com/Balaji4723' },
              { l: 'Portfolio', h: 'https://balaji4723.github.io/PORTFOLIO-WEBSITE/' },
              { l: 'Email', h: 'mailto:balajimaninadar4712@gmail.com' },
            ].map(c => (
              <a key={c.l} href={c.h} target="_blank" rel="noreferrer"
                style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.dim, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = T.green}
                onMouseLeave={e => e.target.style.color = T.dim}>
                [{c.l}]
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
