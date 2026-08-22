import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Globe3D, DataStream, TiltCard } from '../components/UI'
import { useStore } from '../store/useStore'
import { useBankRates } from '../hooks/useBankRates'

function Counter({ target, suffix = '' }) {
  const [n, setN] = useState(0); const ref = useRef()
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      let s = 0; const step = target / (1.8*60)
      const t = setInterval(() => { s+=step; if(s>=target){setN(target);clearInterval(t)}else setN(Math.floor(s)) }, 1000/60)
      obs.disconnect()
    }, { threshold:0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>
}

/* ── Feature SVG icons ── */
const ICONS = {
  dna: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2C8 6 8 10 12 12s4 6 0 10M12 2c4 4 4 8 0 10s-4 6 0 10M8 4h8M8 20h8M6 9h12M6 15h12"/></svg>,
  emi: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4"/></svg>,
  loan: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  compare: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  tools: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  dashboard: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  recommend: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  goals: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  credit: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  card: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  leaderboard: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
}

/* ── Bento grid config ── */
const BENTO = [
  // Row 1 — 3 cols: big | medium | medium stack
  {
    id:'r1',
    cells: [
      { route:'/eligibility', span:'col-span-2 row-span-2', size:'large', title:'FinDNA Analyzer', eyebrow:'AI-Powered Score', desc:'Real-time 5-factor financial DNA scoring. Know your loan eligibility instantly.', icon:'dna', color:'#22d3ee', accent:'rgba(34,211,238,0.08)' },
      { route:'/emi', span:'col-span-1 row-span-1', size:'medium', title:'EMI Calculator', eyebrow:'Live Calculation', desc:'Sliders update everything in real time — EMI, interest, amortisation table.', icon:'emi', color:'#818cf8', accent:'rgba(129,140,248,0.08)' },
      { route:'/compare', span:'col-span-1 row-span-1', size:'medium', title:'Bank Comparison', eyebrow:'10 Banks Live', desc:'Compare SBI, HDFC, ICICI and 7 more side by side.', icon:'compare', color:'#eab308', accent:'rgba(234,179,8,0.06)' },
    ]
  },
  // Row 2 — 3 cols: medium stack | medium | medium
  {
    id:'r2',
    cells: [
      { route:'/policy', span:'col-span-1 row-span-1', size:'medium', title:'Loan Feasibility', eyebrow:'Approval Engine', desc:'Approval probability across 10 real Indian banks.', icon:'loan', color:'#22c55e', accent:'rgba(34,197,94,0.06)' },
      { route:'/recommend', span:'col-span-1 row-span-1', size:'medium', title:'Loan Recommender', eyebrow:'Smart Match', desc:'Profile in, best bank out. Scores all 10 banks for you.', icon:'recommend', color:'#34d399', accent:'rgba(52,211,153,0.06)' },
      { route:'/tools', span:'col-span-1 row-span-1', size:'medium', title:'Financial Tools', eyebrow:'5 Calculators', desc:'Tax, SIP, Debt planner, Net worth, Prepayment optimizer.', icon:'tools', color:'#f472b6', accent:'rgba(244,114,182,0.06)' },
    ]
  },
  // Row 3 — 4 compact cards
  {
    id:'r3',
    cells: [
      { route:'/goals', span:'col-span-1', size:'compact', title:'Goal Planner', eyebrow:'Reverse Calc', icon:'goals', color:'#fb923c' },
      { route:'/credit', span:'col-span-1', size:'compact', title:'CIBIL Booster', eyebrow:'Credit Roadmap', icon:'credit', color:'#22c55e' },
      { route:'/report-card', span:'col-span-1', size:'compact', title:'Report Card', eyebrow:'Shareable PNG', icon:'card', color:'#f9a8d4' },
      { route:'/leaderboard', span:'col-span-1', size:'compact', title:'Leaderboard', eyebrow:'Global Rank', icon:'leaderboard', color:'#eab308' },
    ]
  },
]

function BentoCard({ cell, onClick }) {
  const ref = useRef()
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.transform = `perspective(900px) rotateY(${x*8}deg) rotateX(${-y*8}deg) scale(1.02)`
  }
  const onLeave = () => { ref.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) scale(1)' }

  const isLarge = cell.size === 'large'
  const isCompact = cell.size === 'compact'

  return (
    <div ref={ref} onClick={onClick}
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition:'transform 0.15s ease', willChange:'transform', transformStyle:'preserve-3d', cursor:'pointer',
        gridColumn: isLarge ? 'span 2' : 'span 1',
        gridRow: isLarge ? 'span 2' : 'span 1',
      }}>
      <div style={{
        height: '100%', minHeight: isLarge ? 280 : isCompact ? 100 : 160,
        background: cell.accent || 'rgba(8,24,40,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: isCompact ? '18px 20px' : isLarge ? '32px 32px' : '24px 24px',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${cell.color}30`; e.currentTarget.style.boxShadow = `0 0 40px ${cell.color}12` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none' }}>

        {/* Subtle gradient orb */}
        <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, ${cell.color}18 0%, transparent 70%)`, pointerEvents:'none' }} />

        {isCompact ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:1 }}>
            <div>
              <div style={{ fontSize:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color: cell.color, marginBottom:4 }}>{cell.eyebrow}</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>{cell.title}</div>
            </div>
            <div style={{ width:36, height:36, borderRadius:10, background:`${cell.color}15`, border:`1px solid ${cell.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: cell.color }}>
              {ICONS[cell.icon]}
            </div>
          </div>
        ) : (
          <>
            <div style={{ width:44, height:44, borderRadius:12, background:`${cell.color}15`, border:`1px solid ${cell.color}25`, display:'flex', alignItems:'center', justifyContent:'center', color:cell.color, marginBottom:16, zIndex:1 }}>
              {ICONS[cell.icon]}
            </div>
            <div style={{ fontSize:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:cell.color, marginBottom:8, zIndex:1 }}>{cell.eyebrow}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize: isLarge ? 24 : 17, color:'var(--text-primary)', marginBottom:10, lineHeight:1.2, zIndex:1 }}>{cell.title}</div>
            {cell.desc && <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, zIndex:1, flex:1 }}>{cell.desc}</p>}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:16, color:cell.color, fontSize:13, fontWeight:600, fontFamily:"'Space Grotesk',sans-serif", zIndex:1 }}>
              Open
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0,500], [0,-60])
  const { updateStreak } = useStore()
  const { rbi, banks, source } = useBankRates()
  useEffect(() => { updateStreak() }, [])
  const goTo = (r) => { if (localStorage.getItem('loggedIn')==='true') navigate(r); else navigate('/login') }

  const particles = Array.from({length:16}, (_,i) => ({
    left:`${(i*13+7)%97}%`, top:`${(i*17+11)%93}%`,
    '--dur':`${2.5+i%3}s`, '--delay':`${(i*0.4)%3}s`,
  }))

  return (
    <div style={{ background:'var(--bg-void)', minHeight:'100vh', overflowX:'hidden' }}>
      <div className="grid-bg" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        {particles.map((p,i) => <div key={i} className="particle" style={p} />)}
      </div>
      <div className="orb-cyan" style={{ width:600, height:600, top:-200, left:-200, zIndex:0 }} />
      <div className="orb-purple" style={{ width:500, height:500, top:'40%', right:-150, zIndex:0 }} />
      <Navbar />

      {/* ── HERO ── */}
      <motion.section style={{ y:heroY, position:'relative', zIndex:10, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 20px 60px' }}>
        <div style={{ maxWidth:1200, width:'100%', margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:40 }}>

          {/* Hero text */}
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }}
            style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--cyan)', marginBottom:20, opacity:0.8 }}>
              India's Smartest Financial Platform
            </div>
            <h1 className="display-xl" style={{ marginBottom:20 }}>
              <span style={{ color:'var(--text-primary)' }}>Decode Your </span>
              <span className="shimmer-text">Financial DNA</span>
            </h1>
            <p style={{ maxWidth:560, margin:'0 auto 32px', fontSize:16, color:'var(--text-secondary)', lineHeight:1.7 }}>
              Real-time rates from 10 Indian banks. AI-powered loan eligibility. 
              Biometric-secured. Built for the future of fintech.
            </p>

            {/* RBI live pill */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 16px', borderRadius:100, background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.2)', marginBottom:36 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', animation:'glowPulse 2s infinite' }} />
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>
                RBI Repo Rate: <strong style={{ color:'var(--cyan)' }}>{rbi.repoRate}%</strong>
                <span style={{ color:'var(--text-muted)', marginLeft:8, fontSize:11 }}>· {source}</span>
              </span>
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center' }}>
              <button onClick={() => goTo('/eligibility')} className="btn-primary glow-pulse" style={{ padding:'14px 32px', fontSize:15 }}>
                Analyze My FinDNA
              </button>
              <button onClick={() => goTo('/compare')} className="btn-outline" style={{ padding:'14px 32px', fontSize:15 }}>
                Compare 10 Banks
              </button>
            </div>
          </motion.div>

          {/* Globe + data stream */}
          <motion.div initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ duration:1, delay:0.3 }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <Globe3D size={typeof window!=='undefined'&&window.innerWidth<768?240:320} />
            <div className="glass" style={{ borderRadius:16, padding:'12px 16px', width:260 }}>
              <div style={{ fontSize:9, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--cyan)', marginBottom:10, textAlign:'center', opacity:0.7 }}>
                Live Financial Data
              </div>
              <DataStream cols={8} height={72} />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── BANK RATE TICKER ── */}
      <div style={{ position:'relative', zIndex:10, borderTop:'1px solid rgba(34,211,238,0.08)', borderBottom:'1px solid rgba(34,211,238,0.08)', background:'rgba(4,15,26,0.8)', padding:'14px 0', overflow:'hidden' }}>
        <div style={{ fontSize:9, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', textAlign:'center', marginBottom:10 }}>
          Live Bank Rates · {source}
        </div>
        <div style={{ overflow:'hidden', maskImage:'linear-gradient(90deg,transparent,black 8%,black 92%,transparent)' }}>
          <motion.div style={{ display:'flex', gap:16, width:'max-content' }}
            animate={{ x:[0,-2000] }} transition={{ duration:28, repeat:Infinity, ease:'linear' }}>
            {[...banks,...banks].map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, padding:'6px 14px', borderRadius:12, background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.1)' }}>
                <span style={{ fontWeight:700, fontSize:13, color:'var(--cyan)', fontFamily:"'Space Grotesk',sans-serif" }}>{b.bank}</span>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Home {b.homeLoan.min}%</span>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>Personal {b.personalLoan.min}%</span>
                <span style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background: b.type==='Public'?'rgba(34,211,238,0.08)':'rgba(129,140,248,0.08)', color: b.type==='Public'?'var(--cyan)':'var(--purple)' }}>{b.type}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ position:'relative', zIndex:10, padding:'60px 20px', background:'rgba(4,15,26,0.4)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'24px 32px', textAlign:'center' }} className="md-grid-4">
          {[
            { val:10, suffix:' Banks', label:'Real Bank Data' },
            { val:98, suffix:'%', label:'Accuracy Rate' },
            { val:12, suffix:' Pages', label:'Platform Features' },
            { val:100, suffix:'%', label:'Data Privacy' },
          ].map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'2rem', color:'var(--cyan)' }}>
                <Counter target={s.val} suffix={s.suffix} />
              </div>
              <div style={{ marginTop:4, fontSize:13, color:'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BENTO GRID ── */}
      <section style={{ position:'relative', zIndex:10, maxWidth:1100, margin:'0 auto', padding:'40px 20px 80px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ marginBottom:48, textAlign:'center' }}>
          <div style={{ fontSize:11, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--cyan)', marginBottom:12 }}>Platform</div>
          <h2 className="display-lg" style={{ color:'var(--text-primary)', marginBottom:12 }}>Everything in one place</h2>
          <p style={{ fontSize:15, color:'var(--text-secondary)', maxWidth:480, margin:'0 auto' }}>
            Twelve tools built on real Indian bank data and AI scoring.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
          className="bento-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, gridAutoRows:'auto' }}>
          {/* Row 1: large + 2 medium */}
          <BentoCard cell={BENTO[0].cells[0]} onClick={() => goTo(BENTO[0].cells[0].route)} />
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <BentoCard cell={BENTO[0].cells[1]} onClick={() => goTo(BENTO[0].cells[1].route)} />
            <BentoCard cell={BENTO[0].cells[2]} onClick={() => goTo(BENTO[0].cells[2].route)} />
          </div>
          {/* Row 2: stacked */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <BentoCard cell={BENTO[1].cells[0]} onClick={() => goTo(BENTO[1].cells[0].route)} />
            <BentoCard cell={BENTO[1].cells[1]} onClick={() => goTo(BENTO[1].cells[1].route)} />
          </div>
          {/* Row 2 middle + right */}
          <BentoCard cell={BENTO[1].cells[2]} onClick={() => goTo(BENTO[1].cells[2].route)} />
          <div style={{ gridColumn:'span 1' }} />
          {/* Row 3: 4 compact cards in a 4-col sub-grid */}
          <div className="compact-row" style={{ gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {BENTO[2].cells.map(cell => (
              <BentoCard key={cell.route} cell={cell} onClick={() => goTo(cell.route)} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:10, borderTop:'1px solid rgba(34,211,238,0.08)', padding:'48px 20px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', gap:32 }}>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', gap:24 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'var(--cyan)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/><path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/></svg>
                </div>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.2rem', color:'var(--cyan)' }}>FinSure</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', maxWidth:280, lineHeight:1.6 }}>
                Real bank data. AI-powered intelligence. Built on React + Firebase + Three.js.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 48px', fontSize:13 }}>
              {[
                { l:'Email', h:'mailto:balajimaninadar4712@gmail.com', t:'balajimaninadar4712@gmail.com' },
                { l:'GitHub', h:'https://github.com/Balaji4723', t:'Balaji4723' },
                { l:'Portfolio', h:'https://balaji4723.github.io/PORTFOLIO-WEBSITE/', t:'Portfolio Site' },
                { l:'LinkedIn', h:'https://www.linkedin.com/in/nadar-balaji-mani-murugan-27218a360', t:'Nadar Balaji' },
              ].map(c => (
                <div key={c.l}><span style={{ color:'var(--text-muted)' }}>{c.l}: </span>
                  <a href={c.h} target="_blank" rel="noreferrer" style={{ color:'var(--text-secondary)', textDecoration:'none' }}
                    onMouseEnter={e=>e.target.style.color='var(--cyan)'}
                    onMouseLeave={e=>e.target.style.color='var(--text-secondary)'}>{c.t}</a>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(34,211,238,0.06)', paddingTop:20, display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', flexWrap:'wrap', gap:8 }}>
            <span>FinSure Financial Intelligence Platform</span>
            <span>React · Firebase · Three.js · Framer Motion</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
