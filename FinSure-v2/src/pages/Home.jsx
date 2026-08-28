import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, MeshDistortMaterial, OrbitControls } from '@react-three/drei'
import Navbar from '../components/Navbar'
import { useStore } from '../store/useStore'
import { useBankRates } from '../hooks/useBankRates'

/* ─── palette ─── */
const C = {
  cyan:   '#22d3ee',
  purple: '#818cf8',
  green:  '#22c55e',
  yellow: '#eab308',
  pink:   '#f472b6',
  orange: '#fb923c',
}

/* ─── 3D Globe ─── */
function Globe({ distort = 0.2, color = '#0891b2', size = 1.4 }) {
  const ref = useRef()
  useFrame(({ clock }) => { ref.current.rotation.y = clock.getElapsedTime() * 0.14 })
  return (
    <group>
      <Stars radius={70} depth={35} count={1500} factor={3} fade speed={0.5} />
      <mesh ref={ref}>
        <sphereGeometry args={[size, 48, 48]} />
        <MeshDistortMaterial color={color} distort={distort} speed={2}
          roughness={0.1} metalness={0.85} emissive="#012030" emissiveIntensity={0.4} />
      </mesh>
      <mesh><sphereGeometry args={[size * 1.08, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.05} /></mesh>
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 4, 4]} intensity={2.2} color="#22d3ee" />
      <pointLight position={[-3, -2, -3]} intensity={0.8} color="#818cf8" />
    </group>
  )
}

/* ─── Section wrapper that snaps + fades in ─── */
function Chapter({ children, bg = 'transparent', minH = '100vh', id }) {
  const ref = useRef()
  const inView = useInView(ref, { margin: '-20% 0px -20% 0px' })
  return (
    <section ref={ref} id={id}
      style={{ minHeight: minH, background: bg, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}>
        {children}
      </motion.div>
    </section>
  )
}

/* ─── Big number counter ─── */
function BigNum({ value, suffix = '', label, color = C.cyan }) {
  const ref = useRef()
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = parseFloat(value)
    const dur = 1600
    const startTime = performance.now()
    const tick = (now) => {
      const p = Math.min((now - startTime) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setN(Math.floor(end * ease))
      if (p < 1) requestAnimationFrame(tick)
      else setN(end)
    }
    requestAnimationFrame(tick)
  }, [inView, value])
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
        fontSize: 'clamp(2.5rem,6vw,5rem)', color, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {n}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>{label}</div>
    </div>
  )
}

/* ─── Feature cinematic section ─── */
function FeatureSection({ title, eyebrow, desc, color, visual, reverse = false, cta, onCta, bullets }) {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  return (
    <div ref={ref} style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px',
      display: 'flex', flexDirection: 'column', gap: 60 }}>
      <div style={{ display: 'flex', flexDirection: reverse ? 'row-reverse' : 'row',
        alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
        {/* Text */}
        <motion.div style={{ flex: '1 1 320px' }}
          initial={{ opacity: 0, x: reverse ? 40 : -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}>
          <div style={{ fontSize: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', color, marginBottom: 14, opacity: 0.9 }}>
            {eyebrow}
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
            fontSize: 'clamp(1.8rem,4vw,3rem)', lineHeight: 1.08, letterSpacing: '-0.03em',
            color: 'var(--text-primary)', marginBottom: 18 }}>
            {title}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24 }}>
            {desc}
          </p>
          {bullets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {bullets.map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{b}</span>
                </div>
              ))}
            </div>
          )}
          {cta && (
            <button onClick={onCta} className="btn-primary"
              style={{ padding: '13px 28px', fontSize: 14, boxShadow: `0 0 28px ${color}35` }}>
              {cta}
            </button>
          )}
        </motion.div>
        {/* Visual */}
        <motion.div style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center' }}
          initial={{ opacity: 0, x: reverse ? -40 : 40, scale: 0.9 }}
          animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ duration: 0.75, delay: 0.2 }}>
          {visual}
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Score ring visual ─── */
function ScoreVisual({ score = 78, color = C.cyan }) {
  const r = 80, c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}20, transparent 70%)`, filter: 'blur(12px)' }} />
      <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'absolute' }}>
        <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="14" />
        <circle cx="110" cy="110" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${dash.toFixed(1)} ${(c - dash).toFixed(1)}`}
          strokeLinecap="round" className="progress-ring-circle"
          style={{ filter: `drop-shadow(0 0 10px ${color}80)` }} />
      </svg>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
          fontSize: 42, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>FinDNA Score</div>
      </div>
    </div>
  )
}

/* ─── EMI visual ─── */
function EMIVisual() {
  const bars = [
    { label: 'Principal', pct: 62, color: C.cyan },
    { label: 'Interest', pct: 38, color: C.purple },
  ]
  return (
    <div className="glass" style={{ borderRadius: 24, padding: '28px 32px', width: '100%', maxWidth: 320 }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
        EMI Breakdown
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
        fontSize: 36, color: C.cyan, marginBottom: 4 }}>₹24,180</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>per month · 20 yrs · 8.5%</div>
      {bars.map(b => (
        <div key={b.label} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
            <span style={{ color: b.color, fontWeight: 700 }}>{b.pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(34,211,238,0.08)', overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', borderRadius: 3, background: b.color }}
              initial={{ width: 0 }} whileInView={{ width: `${b.pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }} viewport={{ once: true }} />
          </div>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(34,211,238,0.1)', paddingTop: 16, marginTop: 8,
        display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>Total payable</span>
        <span style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>₹58.0L</span>
      </div>
    </div>
  )
}

/* ─── Bank comparison visual ─── */
function BankVisual({ banks }) {
  const top3 = banks.slice(0, 3)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
      {top3.map((b, i) => (
        <motion.div key={b.bank}
          initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
          className="glass" style={{ borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: i === 0 ? `1px solid ${C.cyan}40` : '1px solid rgba(34,211,238,0.08)',
            boxShadow: i === 0 ? `0 0 20px ${C.cyan}12` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {i === 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.cyan }} />}
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: 15, color: i === 0 ? C.cyan : 'var(--text-primary)' }}>{b.bank}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              color: i === 0 ? C.cyan : 'var(--text-secondary)' }}>{b.homeLoan.min}%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>home loan</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Floating particle bg ─── */
function ParticleBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} className="particle" style={{
          left: `${(i * 17 + 5) % 95}%`,
          top: `${(i * 13 + 8) % 90}%`,
          '--dur': `${2.5 + i % 3}s`,
          '--delay': `${(i * 0.35) % 2.8}s`,
        }} />
      ))}
    </div>
  )
}

/* ─── Progress dots sidebar ─── */
function ProgressDots({ sections, active }) {
  return (
    <div style={{ position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
      zIndex: 100, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sections.map((s, i) => (
        <motion.div key={s.id}
          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
          title={s.label}
          style={{ cursor: 'pointer' }}
          whileHover={{ scale: 1.4 }}>
          <div style={{
            width: i === active ? 10 : 6,
            height: i === active ? 10 : 6,
            borderRadius: '50%',
            background: i === active ? s.color : 'rgba(255,255,255,0.15)',
            boxShadow: i === active ? `0 0 10px ${s.color}80` : 'none',
            transition: 'all 0.3s',
          }} />
        </motion.div>
      ))}
    </div>
  )
}

const SECTIONS = [
  { id: 's0', label: 'Home',     color: C.cyan   },
  { id: 's1', label: 'FinDNA',   color: C.cyan   },
  { id: 's2', label: 'EMI',      color: C.purple },
  { id: 's3', label: 'Banks',    color: C.yellow },
  { id: 's4', label: 'Tools',    color: C.pink   },
  { id: 's5', label: 'Security', color: C.green  },
  { id: 's6', label: 'Launch',   color: C.orange },
]

/* ─── MAIN ─── */
export default function Home() {
  const navigate = useNavigate()
  const { updateStreak } = useStore()
  const { rbi, banks } = useBankRates()
  const [activeSection, setActiveSection] = useState(0)
  const containerRef = useRef()

  useEffect(() => { updateStreak() }, [])

  // Track active section for progress dots
  useEffect(() => {
    const observers = SECTIONS.map((s, i) => {
      const el = document.getElementById(s.id)
      if (!el) return null
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) setActiveSection(i)
      }, { threshold: 0.4 })
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  const goTo = (route) => {
    if (localStorage.getItem('loggedIn') === 'true') navigate(route)
    else navigate('/login')
  }

  const { scrollYProgress } = useScroll({ target: containerRef })
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <div ref={containerRef} style={{ background: 'var(--bg-void)' }}>
      {/* Scroll progress bar */}
      <motion.div style={{ position: 'fixed', top: 0, left: 0, height: 2, background: `linear-gradient(90deg, ${C.cyan}, ${C.purple}, ${C.pink})`, zIndex: 1000, width: progressWidth }} />

      {/* Nav + progress dots */}
      <Navbar />
      <ProgressDots sections={SECTIONS} active={activeSection} />

      {/* ══════════════════════════════════════════════
          S0 — HERO
      ══════════════════════════════════════════════ */}
      <section id="s0" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <ParticleBg />
        <div className="orb-cyan" style={{ width: 600, height: 600, top: -200, left: -200, zIndex: 0 }} />
        <div className="orb-purple" style={{ width: 500, height: 500, bottom: -150, right: -150, zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, width: '100%', margin: '0 auto',
          padding: '100px 32px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Globe */}
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ width: 'clamp(200px,40vw,340px)', height: 'clamp(200px,40vw,340px)', marginBottom: 32 }}>
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
              <Globe />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
          </motion.div>

          {/* Text */}
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }} style={{ textAlign: 'center' }}>

            <div style={{ fontSize: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: C.cyan, marginBottom: 16, opacity: 0.8 }}>
              India's Smartest Financial Platform
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
              fontSize: 'clamp(2.4rem,7vw,5.5rem)', lineHeight: 1.03, letterSpacing: '-0.04em',
              marginBottom: 20 }}>
              <span style={{ color: 'var(--text-primary)' }}>Decode Your{' '}</span>
              <span className="shimmer-text">Financial DNA</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7,
              maxWidth: 540, margin: '0 auto 28px' }}>
              Real-time rates from 10 Indian banks. AI-powered eligibility. Biometric security. Scroll to explore.
            </p>

            {/* RBI pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px',
              borderRadius: 100, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', marginBottom: 32 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'glowPulse 2s infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                RBI Repo Rate <strong style={{ color: C.cyan }}>{rbi.repoRate}%</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
                  · Home loans from {Math.min(...banks.map(b => b.homeLoan.min))}%
                </span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => goTo('/eligibility')} className="btn-primary glow-pulse"
                style={{ padding: '14px 32px', fontSize: 15 }}>
                Analyze My FinDNA
              </button>
              <button onClick={() => document.getElementById('s1')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-outline" style={{ padding: '14px 32px', fontSize: 15 }}>
                Explore Platform
              </button>
            </div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}
            style={{ position: 'absolute', bottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
              <rect x="1" y="1" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="5.5" y="4" width="3" height="5" rx="1.5" fill="currentColor"/>
            </svg>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S1 — FINDNA
      ══════════════════════════════════════════════ */}
      <section id="s1" style={{ background: 'rgba(4,15,26,0.6)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb-cyan" style={{ width: 400, height: 400, top: -100, right: -100, zIndex: 0 }} />
        <FeatureSection
          eyebrow="FinDNA Analyzer · AI-Powered"
          title="Know your loan eligibility before you apply"
          desc="Our 5-factor scoring engine analyzes your salary, credit score, age, EMI burden, and employment type in real time. Get a FinDNA score from 0–100 and know exactly which banks will approve you — before you walk in."
          color={C.cyan}
          bullets={[
            'Real-time score updates as you adjust sliders',
            'Eligible loan amount calculated per loan type',
            'Saves to Firebase — access anytime in History',
          ]}
          cta="Analyze My Profile"
          onCta={() => goTo('/eligibility')}
          visual={<ScoreVisual score={78} color={C.cyan} />}
        />
      </section>

      {/* ══════════════════════════════════════════════
          S2 — EMI
      ══════════════════════════════════════════════ */}
      <section id="s2" style={{ background: 'rgba(8,4,26,0.5)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb-purple" style={{ width: 400, height: 400, bottom: -80, left: -80, zIndex: 0 }} />
        <FeatureSection
          eyebrow="EMI Calculator · Live Amortisation"
          title="See exactly where every rupee goes"
          desc="Adjust loan amount, interest rate, and tenure with live sliders. Watch the EMI, total interest, and amortisation table update instantly. Download a full PDF report or save to Firebase with one click."
          color={C.purple}
          reverse
          bullets={[
            'Amortisation table — year by year breakdown',
            'Affordability ratio — EMI vs monthly income',
            'Quick presets: Home, Car, Personal, Education',
          ]}
          cta="Calculate My EMI"
          onCta={() => goTo('/emi')}
          visual={<EMIVisual />}
        />
      </section>

      {/* ══════════════════════════════════════════════
          S3 — BANK RATES
      ══════════════════════════════════════════════ */}
      <section id="s3" style={{ background: 'rgba(4,15,10,0.5)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb-cyan" style={{ width: 350, height: 350, top: -80, left: -80, zIndex: 0,
          background: 'radial-gradient(circle,rgba(34,197,94,0.12) 0%,transparent 70%)' }} />
        <FeatureSection
          eyebrow="10 Real Indian Banks · Published Rates"
          title="Compare SBI, HDFC, ICICI and 7 more"
          desc="Real published rates from RBI and official bank rate cards — June 2025. Select up to 3 banks, set your loan amount and tenure, and compare EMI, total interest, processing fee and eligibility requirements side by side."
          color={C.yellow}
          bullets={[
            'SBI · HDFC · ICICI · Axis · Kotak · PNB · BOB · Canara · IDBI · Union Bank',
            'Best-rate highlight with interest savings summary',
            'Real-time comparison table with PDF export',
          ]}
          cta="Compare Banks"
          onCta={() => goTo('/compare')}
          visual={<BankVisual banks={banks} />}
        />
      </section>

      {/* ══════════════════════════════════════════════
          S4 — TOOLS + AI
      ══════════════════════════════════════════════ */}
      <section id="s4" style={{ background: 'rgba(20,4,26,0.5)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb-pink" style={{ width: 380, height: 380, top: -60, right: -60, zIndex: 0 }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
          <Chapter id="s4inner">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase', color: C.pink, marginBottom: 14 }}>
                Platform Tools
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
                fontSize: 'clamp(1.8rem,4vw,3rem)', letterSpacing: '-0.03em',
                color: 'var(--text-primary)', marginBottom: 14 }}>
                Eight tools. One platform.
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
                Everything from tax savings to CIBIL roadmaps — all backed by real data and AI intelligence.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
              {[
                { title:'Loan Recommender',  desc:'Best bank ranked for your exact profile', route:'/recommend',   color:C.cyan   },
                { title:'Goal Planner',       desc:'Monthly savings to reach any life goal',  route:'/goals',       color:C.yellow },
                { title:'CIBIL Booster',      desc:'Month-by-month credit score roadmap',     route:'/credit',      color:C.green  },
                { title:'Tax Calculator',     desc:'Section 80C + 24B home loan deductions',  route:'/tools',       color:C.purple },
                { title:'Debt Planner',       desc:'Snowball or avalanche debt strategy',      route:'/tools',       color:C.pink   },
                { title:'Retirement SIP',     desc:'Compound interest corpus projector',       route:'/tools',       color:C.orange },
                { title:'Report Card',        desc:'Shareable PNG of your FinDNA score',      route:'/report-card', color:C.cyan   },
              ].map((t, i) => (
                <motion.div key={t.title}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.45 }} viewport={{ once: true }}
                  onClick={() => goTo(t.route)}
                  whileHover={{ y: -6, scale: 1.02 }}
                  style={{ borderRadius: 18, padding: '22px 20px', cursor: 'pointer',
                    background: `radial-gradient(ellipse at top left, ${t.color}10, rgba(8,24,40,0.8))`,
                    border: `1px solid ${t.color}20`, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${t.color}45`; e.currentTarget.style.boxShadow = `0 0 24px ${t.color}15` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${t.color}20`; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ fontSize: 11, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: t.color, marginBottom: 8 }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.desc}</div>
                </motion.div>
              ))}
            </div>
          </Chapter>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S5 — SECURITY + STATS
      ══════════════════════════════════════════════ */}
      <section id="s5" style={{ background: 'rgba(4,26,10,0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '32px 40px', marginBottom: 72 }} className="md-grid-4">
            {[
              { value: 10, suffix: '', label: 'Real Indian Banks' },
              { value: 98, suffix: '%', label: 'Accuracy Rate'    },
              { value: 11, suffix: '', label: 'Financial Tools'   },
              { value: 100, suffix: '%', label: 'Data Privacy'    },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 200 }}>
                <BigNum value={s.value} suffix={s.suffix} label={s.label}
                  color={[C.cyan, C.purple, C.green, C.yellow][i]} />
              </motion.div>
            ))}
          </div>
          {/* Security */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: C.green, marginBottom: 12 }}>Security</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
              fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              Bank-grade protection
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }} className="md-grid-4">
            {[
              { label:'Biometric Auth',  desc:'WebAuthn fingerprint & FaceID', color:C.cyan,   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3"/></svg> },
              { label:'OTP Login',       desc:'Phone OTP via Firebase Auth',   color:C.purple, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01M8 6h8"/></svg> },
              { label:'Auto Logout',     desc:'15-min inactivity timeout',     color:C.green,  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
              { label:'Session Guard',   desc:'Protected routes + token auth', color:C.yellow, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            ].map(s => (
              <div key={s.label} className="glass" style={{ borderRadius: 16, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}12`,
                  border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: s.color, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S6 — FINAL CTA
      ══════════════════════════════════════════════ */}
      <section id="s6" style={{ position: 'relative', background: 'rgba(4,15,26,0.8)', padding: '56px 32px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'24px 40px', textAlign:'center', marginBottom:48 }} className="md-grid-4">
            {[
              { val:'10', label:'Real Indian Banks', color:C.cyan },
              { val:'6.25%', label:'RBI Repo Rate', color:C.yellow },
              { val:'11', label:'Financial Tools', color:C.green },
              { val:'100%', label:'Data Privacy', color:C.purple },
            ].map((s,i) => (
              <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.1 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(1.8rem,4vw,3rem)', color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
          <div style={{ borderTop:'1px solid rgba(34,211,238,0.08)', paddingTop:40, display:'flex', flexWrap:'wrap', justifyContent:'space-between', gap:24 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'var(--cyan)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/><path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/></svg>
                </div>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'var(--cyan)' }}>FinSure</span>
              </div>
              <p style={{ fontSize:12, color:'var(--text-secondary)', maxWidth:260, lineHeight:1.6 }}>
                Real bank data. AI intelligence. React + Firebase + Three.js.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 40px', fontSize:12, alignContent:'start' }}>
              {[
                { l:'Email', h:'mailto:balajimaninadar4712@gmail.com', t:'balajimaninadar4712@gmail.com' },
                { l:'GitHub', h:'https://github.com/Balaji4723', t:'Balaji4723' },
                { l:'Portfolio', h:'https://balaji4723.github.io/PORTFOLIO-WEBSITE/', t:'Portfolio' },
                { l:'LinkedIn', h:'https://www.linkedin.com/in/nadar-balaji-mani-murugan-27218a360', t:'Nadar Balaji' },
              ].map(c => (
                <div key={c.l}><span style={{ color:'var(--text-muted)' }}>{c.l}: </span>
                  <a href={c.h} target="_blank" rel="noreferrer"
                    style={{ color:'var(--text-secondary)', textDecoration:'none' }}
                    onMouseEnter={e=>e.target.style.color='var(--cyan)'}
                    onMouseLeave={e=>e.target.style.color='var(--text-secondary)'}>{c.t}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bank ticker ── */}
      <div style={{ borderTop: '1px solid rgba(34,211,238,0.08)', background: 'rgba(4,15,26,0.9)', padding: '12px 0', overflow: 'hidden' }}>
        <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg,transparent,black 6%,black 94%,transparent)' }}>
          <motion.div style={{ display: 'flex', gap: 14, width: 'max-content' }}
            animate={{ x: [0, -2000] }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>
            {[...banks, ...banks].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                padding: '5px 14px', borderRadius: 10, background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: C.cyan, fontFamily: "'Space Grotesk',sans-serif" }}>{b.bank}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Home {b.homeLoan.min}%</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Personal {b.personalLoan.min}%</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(34,211,238,0.08)', padding: '36px 32px 28px', background: 'rgba(2,10,18,0.95)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/><path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/></svg>
            </div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: C.cyan }}>FinSure</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>React · Firebase · Three.js · Framer Motion</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { l:'Email', h:'mailto:balajimaninadar4712@gmail.com' },
              { l:'GitHub', h:'https://github.com/Balaji4723' },
              { l:'Portfolio', h:'https://balaji4723.github.io/PORTFOLIO-WEBSITE/' },
            ].map(c => (
              <a key={c.l} href={c.h} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = C.cyan}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>{c.l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
