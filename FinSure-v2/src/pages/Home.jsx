import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, MeshDistortMaterial, OrbitControls } from '@react-three/drei'
import Navbar from '../components/Navbar'
import { DataStream } from '../components/UI'
import { useStore } from '../store/useStore'
import { useBankRates } from '../hooks/useBankRates'

/* ─── SVG Icons ─── */
const ICONS = {
  dna:        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2C8 6 8 10 12 12s4 6 0 10M12 2c4 4 4 8 0 10s-4 6 0 10M8 4h8M8 20h8M6 9h12M6 15h12"/></svg>,
  emi:        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M12 12v4M10 14h4"/></svg>,
  loan:       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  compare:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  tools:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  recommend:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  goals:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  credit:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  dashboard:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  card:       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  leaderboard:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
}

/* ─── Bubble definitions — position, depth, size ─── */
const BUBBLES = [
  // depth 1 = closest (moves most with mouse), depth 3 = furthest (moves least)
  { id:'dna',        label:'FinDNA',      title:'FinDNA Analyzer',   desc:'5-factor AI score + loan eligibility in real time.',     route:'/eligibility', color:'#22d3ee', icon:'dna',         x:12,  y:18,  size:160, depth:1, shape:'circle' },
  { id:'emi',        label:'EMI',         title:'EMI Calculator',    desc:'Live sliders update amortisation table instantly.',       route:'/emi',         color:'#818cf8', icon:'emi',         x:72,  y:12,  size:140, depth:2, shape:'circle' },
  { id:'loan',       label:'Loan',        title:'Loan Feasibility',  desc:'Approval probability across 10 real Indian banks.',      route:'/policy',      color:'#22c55e', icon:'loan',        x:85,  y:55,  size:130, depth:1, shape:'circle' },
  { id:'compare',    label:'Compare',     title:'Bank Comparison',   desc:'SBI, HDFC, ICICI and 7 more — side by side.',           route:'/compare',     color:'#eab308', icon:'compare',     x:60,  y:80,  size:150, depth:3, shape:'circle' },
  { id:'recommend',  label:'Match',       title:'Loan Recommender',  desc:'Enter profile once. Best bank ranked for you.',          route:'/recommend',   color:'#34d399', icon:'recommend',   x:8,   y:72,  size:120, depth:2, shape:'circle' },
  { id:'tools',      label:'Tools',       title:'Financial Tools',   desc:'Tax, SIP, Debt planner, Net worth, Prepayment.',         route:'/tools',       color:'#f472b6', icon:'tools',       x:40,  y:88,  size:110, depth:1, shape:'pill' },
  { id:'goals',      label:'Goals',       title:'Goal Planner',      desc:'Reverse-calculate monthly savings for any goal.',        route:'/goals',       color:'#fb923c', icon:'goals',       x:22,  y:55,  size:100, depth:3, shape:'pill' },
  { id:'credit',     label:'CIBIL',       title:'Credit Booster',    desc:'Month-by-month roadmap to your target CIBIL score.',     route:'/credit',      color:'#a78bfa', icon:'credit',      x:78,  y:30,  size:105, depth:2, shape:'pill' },
  { id:'dashboard',  label:'Dashboard',   title:'Your Dashboard',    desc:'Badges, streaks, FinScore and full journey tracking.',   route:'/dashboard',   color:'#60a5fa', icon:'dashboard',   x:48,  y:22,  size:115, depth:3, shape:'circle' },
  { id:'card',       label:'Report',      title:'Report Card',       desc:'Shareable PNG of your FinDNA score — download or share.',route:'/report-card', color:'#f9a8d4', icon:'card',        x:88,  y:80,  size:95,  depth:1, shape:'pill' },
  { id:'leaderboard',label:'Rank',        title:'Leaderboard',       desc:'Anonymous global FinScore rankings with 5 tiers.',       route:'/leaderboard', color:'#fbbf24', icon:'leaderboard', x:30,  y:8,   size:100, depth:2, shape:'pill' },
]

/* ─── 3D mini globe for center ─── */
function MiniGlobe() {
  const ref = useRef()
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.15
  })
  return (
    <group>
      <Stars radius={60} depth={30} count={1200} factor={3} fade speed={0.5} />
      <mesh ref={ref}>
        <sphereGeometry args={[1.3, 40, 40]} />
        <MeshDistortMaterial color="#0891b2" distort={0.22} speed={2.2}
          roughness={0.1} metalness={0.85} emissive="#012d3a" emissiveIntensity={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.45, 14, 14]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.055} />
      </mesh>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} intensity={2.2} color="#22d3ee" />
      <pointLight position={[-3, -2, -3]} intensity={0.8} color="#818cf8" />
    </group>
  )
}

/* ─── Single bubble ─── */
function Bubble({ bubble, mouseX, mouseY, onClick, isExpanded }) {
  const parallaxStrength = (4 - bubble.depth) * 12 // depth 1=24px, 2=12px, 3=0px
  const tx = useSpring(useMotionValue(0), { stiffness: 80 - bubble.depth * 20, damping: 20 })
  const ty = useSpring(useMotionValue(0), { stiffness: 80 - bubble.depth * 20, damping: 20 })

  useEffect(() => {
    const unsub1 = mouseX.on('change', v => tx.set(v * parallaxStrength))
    const unsub2 = mouseY.on('change', v => ty.set(v * parallaxStrength))
    return () => { unsub1(); unsub2() }
  }, [mouseX, mouseY, parallaxStrength])

  const isPill = bubble.shape === 'pill'
  const floatDuration = 3 + bubble.depth * 1.2
  const floatAmt = 8 + bubble.depth * 4

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        x: tx,
        y: ty,
        zIndex: isExpanded ? 50 : bubble.depth === 1 ? 15 : bubble.depth === 2 ? 12 : 10,
        willChange: 'transform',
      }}
      animate={!isExpanded ? { y: [0, -floatAmt, 0] } : {}}
      transition={!isExpanded ? { duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay: bubble.depth * 0.4 } : {}}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onClick(bubble)}
        style={{
          width: isPill ? 'auto' : bubble.size,
          height: isPill ? 'auto' : bubble.size,
          padding: isPill ? '14px 22px' : undefined,
          borderRadius: isPill ? 100 : '50%',
          background: `radial-gradient(circle at 30% 30%, ${bubble.color}22, ${bubble.color}08)`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: `1px solid ${bubble.color}35`,
          boxShadow: `0 8px 32px ${bubble.color}18, inset 0 1px 0 ${bubble.color}20`,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: isPill ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isPill ? 8 : 6,
          transition: 'box-shadow 0.25s',
          userSelect: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 12px 48px ${bubble.color}35, inset 0 1px 0 ${bubble.color}30, 0 0 0 1px ${bubble.color}40`}
        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 8px 32px ${bubble.color}18, inset 0 1px 0 ${bubble.color}20`}>
        {/* Shine overlay */}
        <div style={{ position: 'absolute', top: '8%', left: '15%', width: '40%', height: '25%', borderRadius: '50%', background: `radial-gradient(ellipse, ${bubble.color}25, transparent)`, pointerEvents: 'none' }} />
        {/* Icon */}
        <div style={{ color: bubble.color, opacity: 0.9, display: 'flex', flexShrink: 0 }}>
          {ICONS[bubble.icon]}
        </div>
        {/* Label */}
        <span style={{
          fontSize: isPill ? 11 : 10,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          color: bubble.color,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>{bubble.label}</span>
      </motion.div>
    </motion.div>
  )
}

/* ─── Expanded feature overlay ─── */
function ExpandedBubble({ bubble, onClose, onGo }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,10,18,0.7)', backdropFilter: 'blur(12px)' }}>
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.75, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: 420,
          background: `radial-gradient(ellipse at 20% 20%, ${bubble.color}18, rgba(4,15,26,0.98))`,
          backdropFilter: 'blur(30px)',
          border: `1px solid ${bubble.color}40`,
          borderRadius: 28,
          padding: '36px 32px',
          boxShadow: `0 0 80px ${bubble.color}20, 0 30px 80px rgba(0,0,0,0.5)`,
          position: 'relative',
        }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        {/* Large icon */}
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `${bubble.color}18`, border: `1px solid ${bubble.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: bubble.color, marginBottom: 20 }}>
          <div style={{ transform: 'scale(1.4)' }}>{ICONS[bubble.icon]}</div>
        </div>
        <div style={{ fontSize: 11, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: bubble.color, marginBottom: 10 }}>{bubble.label}</div>
        <h2 style={{ fontSize: 26, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{bubble.title}</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 28 }}>{bubble.desc}</p>
        {/* Glowing CTA */}
        <button onClick={onGo} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15, boxShadow: `0 0 30px ${bubble.color}40` }}>
          Open {bubble.title}
        </button>
        {/* Decorative shine */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: `linear-gradient(90deg, transparent, ${bubble.color}50, transparent)`, borderRadius: 1 }} />
      </motion.div>
    </motion.div>
  )
}

/* ─── Main Home ─── */
export default function Home() {
  const navigate = useNavigate()
  const { updateStreak } = useStore()
  const { rbi, banks, source } = useBankRates()
  const [active, setActive] = useState(null)
  const containerRef = useRef()

  // Smooth mouse motion values
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mouseX = useSpring(rawX, { stiffness: 40, damping: 18 })
  const mouseY = useSpring(rawY, { stiffness: 40, damping: 18 })

  useEffect(() => { updateStreak() }, [])

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [rawX, rawY])

  // Touch support for mobile parallax
  const handleTouchMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = e.touches[0]
    rawX.set((t.clientX - rect.left) / rect.width - 0.5)
    rawY.set((t.clientY - rect.top) / rect.height - 0.5)
  }, [rawX, rawY])

  const goTo = (route) => {
    if (localStorage.getItem('loggedIn') === 'true') navigate(route)
    else navigate('/login')
  }

  const handleBubbleClick = (bubble) => setActive(bubble)
  const handleClose = () => setActive(null)
  const handleGo = () => { goTo(active.route); setActive(null) }

  return (
    <div style={{ background: 'var(--bg-void)', minHeight: '100vh', overflowX: 'hidden' }}>
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <Navbar />

      {/* ─── HERO: Floating Islands ─── */}
      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', cursor: 'default' }}>

        {/* Deep background orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div className="orb-cyan" style={{ width: 600, height: 600, top: -150, left: -150 }} />
          <div className="orb-purple" style={{ width: 500, height: 500, bottom: -100, right: -100 }} />
          <div className="orb-pink" style={{ width: 300, height: 300, top: '30%', left: '40%' }} />
        </div>

        {/* Particle layer */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className="particle" style={{
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 13 + 8) % 90}%`,
              '--dur': `${2.5 + i % 3}s`,
              '--delay': `${(i * 0.35) % 2.8}s`,
            }} />
          ))}
        </div>

        {/* Center: hero text + globe */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 8, pointerEvents: 'none' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            style={{ textAlign: 'center', padding: '0 20px', pointerEvents: 'auto' }}>
            {/* Mini globe */}
            <div style={{ width: 120, height: 120, margin: '0 auto 20px' }}>
              <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                <MiniGlobe />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
              </Canvas>
            </div>
            <div style={{ fontSize: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 12, opacity: 0.8 }}>
              India's Smartest Financial Platform
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.8rem)', lineHeight: 1.04, letterSpacing: '-0.04em', marginBottom: 14 }}>
              <span style={{ color: 'var(--text-primary)' }}>Decode Your </span>
              <span className="shimmer-text">Financial DNA</span>
            </h1>
            {/* RBI pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'glowPulse 2s infinite' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                RBI Repo <strong style={{ color: 'var(--cyan)' }}>{rbi.repoRate}%</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 10 }}>· Home loans from {Math.min(...banks.map(b => b.homeLoan.min))}%</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => goTo('/eligibility')} className="btn-primary glow-pulse" style={{ padding: '11px 26px', fontSize: 14 }}>
                Analyze My FinDNA
              </button>
              <button onClick={() => goTo('/compare')} className="btn-outline" style={{ padding: '11px 26px', fontSize: 14 }}>
                Compare 10 Banks
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 14 }}>
              Click any floating bubble to explore a feature
            </p>
          </motion.div>
        </div>

        {/* ── FLOATING BUBBLES ── */}
        {BUBBLES.map((bubble, i) => (
          <motion.div key={bubble.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.07, type: 'spring', stiffness: 160, damping: 18 }}>
            <Bubble
              bubble={bubble}
              mouseX={mouseX}
              mouseY={mouseY}
              onClick={handleBubbleClick}
              isExpanded={active?.id === bubble.id}
            />
          </motion.div>
        ))}

        {/* Scroll hint */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}
          style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: 'var(--text-muted)', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
            <rect x="1" y="1" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="5.5" y="4" width="3" height="5" rx="1.5" fill="currentColor"/>
          </svg>
        </motion.div>
      </section>

      {/* Expanded bubble overlay */}
      <AnimatePresence>
        {active && <ExpandedBubble bubble={active} onClose={handleClose} onGo={handleGo} />}
      </AnimatePresence>

      {/* ─── BANK TICKER ─── */}
      <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(34,211,238,0.08)', borderBottom: '1px solid rgba(34,211,238,0.08)', background: 'rgba(4,15,26,0.88)', padding: '13px 0', overflow: 'hidden' }}>
        <div style={{ fontSize: 9, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 9 }}>
          Live Bank Rates · {source}
        </div>
        <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg,transparent,black 6%,black 94%,transparent)' }}>
          <motion.div style={{ display: 'flex', gap: 14, width: 'max-content' }}
            animate={{ x: [0, -2200] }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>
            {[...banks, ...banks].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '5px 14px', borderRadius: 10, background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif" }}>{b.bank}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Home {b.homeLoan.min}%</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Personal {b.personalLoan.min}%</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── STATS ─── */}
      <section style={{ padding: '56px 20px', background: 'rgba(4,15,26,0.5)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px 40px', textAlign: 'center' }} className="md-grid-4">
          {[
            { val: '10', label: 'Real Indian Banks' },
            { val: '98%', label: 'Accuracy Rate' },
            { val: '11', label: 'Financial Tools' },
            { val: '100%', label: 'Data Privacy' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '2.2rem', color: 'var(--cyan)' }}>{s.val}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section style={{ padding: '48px 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 10 }}>Security</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.4rem,3.5vw,2.2rem)', color: 'var(--text-primary)' }}>Bank-grade protection</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }} className="md-grid-4">
            {[
              { label: 'Biometric Auth', desc: 'WebAuthn fingerprint & FaceID', color: '#22d3ee', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg> },
              { label: 'OTP Verification', desc: 'Phone OTP via Firebase Auth', color: '#818cf8', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01M8 6h8M8 10h4"/></svg> },
              { label: 'Auto Logout', desc: '15-min inactivity timeout', color: '#22c55e', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
              { label: 'Session Guard', desc: 'Protected routes + token auth', color: '#eab308', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            ].map(s => (
              <div key={s.label} className="glass" style={{ borderRadius: 18, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: s.color, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(34,211,238,0.08)', padding: '40px 20px 28px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/><path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/></svg>
                </div>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.15rem', color: 'var(--cyan)' }}>FinSure</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.6 }}>Real bank data. AI intelligence. React + Firebase + Three.js.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 40px', fontSize: 12 }}>
              {[
                { l: 'Email', h: 'mailto:balajimaninadar4712@gmail.com', t: 'balajimaninadar4712@gmail.com' },
                { l: 'GitHub', h: 'https://github.com/Balaji4723', t: 'Balaji4723' },
                { l: 'Portfolio', h: 'https://balaji4723.github.io/PORTFOLIO-WEBSITE/', t: 'Portfolio' },
                { l: 'LinkedIn', h: 'https://www.linkedin.com/in/nadar-balaji-mani-murugan-27218a360', t: 'Nadar Balaji' },
              ].map(c => (
                <div key={c.l}><span style={{ color: 'var(--text-muted)' }}>{c.l}: </span>
                  <a href={c.h} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = 'var(--cyan)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>{c.t}</a>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(34,211,238,0.06)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 8 }}>
            <span>FinSure Financial Intelligence Platform</span>
            <span>React · Firebase · Three.js · Framer Motion</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
