import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Globe3D, DataStream, TiltCard, SectionHeader } from '../components/UI'
import { useStore } from '../store/useStore'
import { useBankRates } from '../hooks/useBankRates'

function Counter({ target, suffix = '', prefix = '' }) {
  const [n, setN] = useState(0); const ref = useRef()
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      let s = 0; const step = target / (1.8 * 60)
      const t = setInterval(() => { s += step; if (s >= target) { setN(target); clearInterval(t) } else setN(Math.floor(s)) }, 1000/60)
      obs.disconnect()
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>
}

const FEATURES = [
  { route:'/eligibility', eyebrow:'FinDNA Score', title:'Eligibility Analyzer', desc:'AI-powered financial DNA scoring with real-time 5-factor analysis and loan eligibility calculation.', icon:'DNA', color:'#22d3ee' },
  { route:'/emi', eyebrow:'EMI Intelligence', title:'EMI Calculator', desc:'Live amortisation schedules, prepayment optimizer, and real bank rate comparisons across 10 banks.', icon:'EMI', color:'#818cf8' },
  { route:'/policy', eyebrow:'Loan Analyzer', title:'Loan Feasibility', desc:'Approval probability engine across 10 real Indian banks with published rate data from RBI.', icon:'LOAN', color:'#22c55e' },
  { route:'/compare', eyebrow:'Bank Compare', title:'Loan Comparison', desc:'Compare 3 loans simultaneously across SBI, HDFC, ICICI and 7 more banks side by side in real time.', icon:'CMP', color:'#eab308' },
  { route:'/tools', eyebrow:'Smart Tools', title:'Financial Tools', desc:'Tax calculator, debt planner, retirement SIP projector, net worth tracker and credit booster roadmap.', icon:'TOOL', color:'#f472b6' },
  { route:'/dashboard', eyebrow:'Gamification', title:'Your Dashboard', desc:'Track badges, streaks, FinScore leaderboard and your complete financial journey in one place.', icon:'DASH', color:'#fb923c' },
  { route:'/ai', eyebrow:'FinAI Assistant', title:'AI Financial Advisor', desc:'Ask anything about loans, EMIs, credit scores in plain language. Powered by real bank data.', icon:'AI', color:'#a5b4fc' },
  { route:'/recommend', eyebrow:'Smart Engine', title:'Loan Recommender', desc:'Enter your profile once. Engine scores all 10 banks and ranks the best match for you.', icon:'REC', color:'#34d399' },
  { route:'/goals', eyebrow:'Goal Setter', title:'Financial Goal Planner', desc:'Set a goal (house, car, retirement). We reverse-calculate your exact monthly savings target.', icon:'GOAL', color:'#fb923c' },
  { route:'/credit', eyebrow:'Credit Booster', title:'CIBIL Score Roadmap', desc:'Personalised month-by-month action plan to boost your credit score to your target.', icon:'CRED', color:'#22c55e' },
  { route:'/report-card', eyebrow:'Shareable Card', title:'FinDNA Report Card', desc:'Generate a beautiful PNG report card of your financial score — download or share instantly.', icon:'CARD', color:'#f9a8d4' },
  { route:'/leaderboard', eyebrow:'Community', title:'Global Leaderboard', desc:'Anonymous FinScore rankings with Diamond, Platinum, Gold, Silver and Bronze tiers.', icon:'DASH', color:'#eab308' },
]

export default function Home() {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, -80])
  const { updateStreak } = useStore()
  const { rbi, banks, source } = useBankRates()
  useEffect(() => { updateStreak() }, [])
  const goTo = (r) => { if (localStorage.getItem('loggedIn') === 'true') navigate(r); else navigate('/login') }
  const particles = Array.from({ length: 20 }, (_, i) => ({ left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, '--dur':`${2.5+Math.random()*3}s`, '--delay':`${Math.random()*4}s` }))

  return (
    <div style={{ background:'var(--bg-void)' }} className="overflow-x-hidden">
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0">{particles.map((p,i)=><div key={i} className="particle" style={p}/>)}</div>
      <div className="orb-cyan w-[700px] h-[700px] -top-56 -left-56 z-0"/>
      <div className="orb-purple w-[600px] h-[600px] top-[35%] -right-40 z-0"/>
      <div className="orb-pink w-[400px] h-[400px] bottom-0 left-1/3 z-0"/>
      <Navbar />

      {/* HERO */}
      <motion.section style={{ y: heroY }} className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 px-4 md:px-10 pt-20 pb-12 max-w-7xl mx-auto z-10">
        <div className="flex-1 text-center lg:text-left">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.8 }}>
            <div className="label-mono mb-5">India's Smartest Financial Platform</div>
            <h1 className="display-xl mb-6">
              <span style={{ color:'var(--text-primary)' }}>Decode Your </span>
              <span className="shimmer-text">Financial DNA</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed mb-8 max-w-xl" style={{ color:'var(--text-secondary)' }}>
              Real-time bank rates from 10 Indian banks. AI-powered loan eligibility. EMI intelligence. Biometric-secured and built for the future of fintech.
            </p>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl mb-8"
              style={{ background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.2)' }}>
              <div className="w-2 h-2 rounded-full glow-pulse" style={{ background:'#22c55e' }}/>
              <span className="text-sm" style={{ color:'var(--text-secondary)' }}>
                RBI Repo Rate: <span style={{ color:'var(--cyan)', fontWeight:700 }}>{rbi.repoRate}%</span>
                <span className="ml-3" style={{ color:'var(--text-muted)', fontSize:'11px' }}>• {source}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button onClick={()=>goTo('/eligibility')} className="btn-primary px-8 py-4 text-base glow-pulse">Analyze My FinDNA</button>
              <button onClick={()=>goTo("/compare")} className="btn-outline px-8 py-4 text-base">Compare 10 Banks</button>
            </div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity:0, scale:.85 }} animate={{ opacity:1, scale:1 }} transition={{ duration:1, delay:.3 }}
          className="flex-shrink-0 flex flex-col items-center gap-5 hidden lg:flex">
          <Globe3D size={typeof window !== 'undefined' && window.innerWidth < 768 ? 270 : 360} />
          <div className="glass rounded-2xl p-4 scanline-wrap" style={{ width:260 }}>
            <div className="label-mono mb-2 text-center" style={{ fontSize:'9px' }}>Live Financial Data</div>
            <DataStream cols={7} height={70}/>
          </div>
        </motion.div>
      </motion.section>

      {/* BANK RATE TICKER */}
      <div className="relative z-10 overflow-hidden py-5 border-y" style={{ borderColor:'rgba(34,211,238,0.08)', background:'rgba(4,15,26,0.8)' }}>
        <div className="label-mono text-center mb-3" style={{ color:'var(--text-muted)', fontSize:'9px' }}>Live Bank Rates — {source}</div>
        <div className="overflow-hidden" style={{ maskImage:'linear-gradient(90deg,transparent,black 8%,black 92%,transparent)' }}>
          <motion.div className="flex gap-5 w-max" animate={{ x:[0,-2200] }} transition={{ duration:28, repeat:Infinity, ease:'linear' }}>
            {[...banks,...banks].map((b,i)=>(
              <div key={i} className="flex items-center gap-3 flex-shrink-0 px-4 py-2 rounded-xl"
                style={{ background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.1)' }}>
                <span className="font-bold text-sm" style={{ color:'var(--cyan)', fontFamily:"'Space Grotesk',sans-serif" }}>{b.bank}</span>
                <span className="text-xs" style={{ color:'var(--text-secondary)' }}>Home {b.homeLoan.min}%</span>
                <span className="text-xs" style={{ color:'var(--text-muted)' }}>Personal {b.personalLoan.min}%</span>
                <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: b.type==='Public'?'rgba(34,211,238,0.1)':'rgba(129,140,248,0.1)', color: b.type==='Public'?'var(--cyan)':'var(--purple)', fontSize:'10px' }}>{b.type}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* STATS */}
      <section className="relative z-10 py-14 border-b" style={{ borderColor:'rgba(34,211,238,0.06)', background:'rgba(4,15,26,0.5)' }}>
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[{ val:10, suffix:' Banks', label:'Real Bank Data' },{ val:98, suffix:'%', label:'Accuracy Rate' },{ val:35, suffix:'+', label:'Platform Features' },{ val:100, suffix:'%', label:'Data Privacy' }].map((s,i)=>(
            <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }}>
              <div className="display-md" style={{ color:'var(--cyan)' }}><Counter target={s.val} suffix={s.suffix}/></div>
              <div className="mt-1 text-sm" style={{ color:'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28">
        <SectionHeader eyebrow="Platform Features" title="Everything in one place" subtitle="Six powerful tools built on real Indian bank data, AI scoring, and 3D financial visualization." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f,i)=>(
            <motion.div key={f.route} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }}>
              <TiltCard onClick={()=>goTo(f.route)} className="glass holo-card rounded-3xl p-7 cursor-pointer h-full" style={{ minHeight:240 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-xs font-bold" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30`, color: f.color, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '.05em' }}>{f.icon}</div>
                <div className="label-mono mb-2" style={{ color:f.color }}>{f.eyebrow}</div>
                <h3 className="display-sm mb-3" style={{ color:'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:'var(--text-secondary)' }}>{f.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold" style={{ color:f.color }}>
                  Open <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section className="relative z-10 py-20 border-y" style={{ borderColor:'rgba(34,211,238,0.06)', background:'rgba(4,15,26,0.6)' }}>
        <div className="max-w-6xl mx-auto px-5 md:px-10">
          <SectionHeader eyebrow="Security" title="Bank-grade protection" subtitle="Multiple layers of security keep your financial data private and safe."/>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label:'Biometric Auth', desc:'WebAuthn fingerprint and FaceID login support', color:'#22d3ee',
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg> },
              { label:'OTP Verification', desc:'Phone OTP via Firebase Auth for extra security', color:'#818cf8',
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01M8 6h8M8 10h8M8 14h4"/></svg> },
              { label:'Auto-Logout', desc:'15-min inactivity session timeout', color:'#22c55e',
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
              { label:'Login Activity', desc:'Track device and location of recent logins', color:'#eab308',
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            ].map((s,i)=>(
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }}
                className="glass rounded-2xl p-6 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:`${s.color}15`,border:`1px solid ${s.color}30`,color:s.color}}>{s.svg}</div>
                <div className="font-bold mb-2 text-sm" style={{ color:s.color, fontFamily:"'Space Grotesk',sans-serif" }}>{s.label}</div>
                <p className="text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t py-16 px-5 md:px-10" style={{ borderColor:'rgba(34,211,238,0.08)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'var(--cyan)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/><path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/></svg>
              </div>
              <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.3rem', color:'var(--cyan)' }}>FinSure</span>
            </div>
            <p className="text-sm max-w-xs" style={{ color:'var(--text-secondary)' }}>Real bank data. AI-powered intelligence. Built on React + Firebase + Three.js.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm">
            {[{ label:'Email', href:'mailto:balajimaninadar4712@gmail.com', text:'balajimaninadar4712@gmail.com' },{ label:'GitHub', href:'https://github.com/Balaji4723', text:'Balaji4723' },{ label:'Portfolio', href:'https://balaji4723.github.io/PORTFOLIO-WEBSITE/', text:'Portfolio Site' },{ label:'LinkedIn', href:'https://www.linkedin.com/in/nadar-balaji-mani-murugan-27218a360', text:'Nadar Balaji' }].map(c=>(
              <div key={c.label}><span style={{ color:'var(--text-muted)' }}>{c.label}: </span>
                <a href={c.href} target="_blank" rel="noreferrer" style={{ color:'var(--text-secondary)' }}
                  onMouseEnter={e=>e.target.style.color='var(--cyan)'} onMouseLeave={e=>e.target.style.color='var(--text-secondary)'}>{c.text}</a>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t flex justify-between text-xs" style={{ borderColor:'rgba(34,211,238,0.06)', color:'var(--text-muted)' }}>
          <span>FinSure Financial Intelligence Platform</span><span>React + Firebase + Three.js + Framer Motion</span>
        </div>
      </footer>
    </div>
  )
}
