import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import Navbar from '../components/Navbar'
import { DataStream } from '../components/UI'
import { useStore } from '../store/useStore'
import { useBankRates } from '../hooks/useBankRates'

/* ─── SVG Icons ─── */
const ICONS = {
  dna: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 6 8 10 12 12s4 6 0 10M12 2c4 4 4 8 0 10s-4 6 0 10M8 4h8M8 20h8M6 9h12M6 15h12"/></svg>,
  emi: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M12 12v4M10 14h4"/></svg>,
  loan: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  compare: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  tools: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  recommend: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  goals: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  credit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  card: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  leaderboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
}

/* ─── Orbital features ─── */
const FEATURES = [
  { id:'emi',        label:'EMI',        title:'EMI Calculator',   desc:'Real-time amortisation with live sliders',      route:'/emi',         color:'#818cf8', icon:'emi',         orbit:1, angle:0,    speed:0.18 },
  { id:'dna',        label:'FinDNA',     title:'FinDNA Analyzer',  desc:'5-factor AI score + loan eligibility',          route:'/eligibility', color:'#22d3ee', icon:'dna',         orbit:1, angle:72,   speed:0.18 },
  { id:'loan',       label:'Loan',       title:'Loan Feasibility', desc:'Approval engine across 10 Indian banks',        route:'/policy',      color:'#22c55e', icon:'loan',        orbit:1, angle:144,  speed:0.18 },
  { id:'compare',    label:'Compare',    title:'Bank Comparison',  desc:'SBI vs HDFC vs ICICI — side by side',           route:'/compare',     color:'#eab308', icon:'compare',     orbit:1, angle:216,  speed:0.18 },
  { id:'recommend',  label:'Match',      title:'Loan Recommender', desc:'Best bank for your exact profile',              route:'/recommend',   color:'#34d399', icon:'recommend',   orbit:1, angle:288,  speed:0.18 },
  { id:'tools',      label:'Tools',      title:'Financial Tools',  desc:'Tax, SIP, Debt, Net Worth, Prepayment',         route:'/tools',       color:'#f472b6', icon:'tools',       orbit:2, angle:0,    speed:0.09 },
  { id:'goals',      label:'Goals',      title:'Goal Planner',     desc:'Reverse-calculate your monthly target',         route:'/goals',       color:'#fb923c', icon:'goals',       orbit:2, angle:60,   speed:0.09 },
  { id:'credit',     label:'CIBIL',      title:'Credit Booster',   desc:'Month-by-month score roadmap',                  route:'/credit',      color:'#a78bfa', icon:'credit',      orbit:2, angle:120,  speed:0.09 },
  { id:'dashboard',  label:'Dashboard',  title:'Your Dashboard',   desc:'Badges, streak, FinScore leaderboard',          route:'/dashboard',   color:'#60a5fa', icon:'dashboard',   orbit:2, angle:180,  speed:0.09 },
  { id:'card',       label:'Report',     title:'Report Card',      desc:'Shareable PNG of your FinDNA score',            route:'/report-card', color:'#f9a8d4', icon:'card',        orbit:2, angle:240,  speed:0.09 },
  { id:'leaderboard',label:'Rank',       title:'Leaderboard',      desc:'Anonymous global FinScore rankings',            route:'/leaderboard', color:'#fbbf24', icon:'leaderboard', orbit:2, angle:300,  speed:0.09 },
]

/* ─── Radii for each orbit ─── */
const ORBIT_R = { 1: 200, 2: 340 }
const ORBIT_R_MOBILE = { 1: 130, 2: 220 }

/* ─── 3D background sphere ─── */
function BgSphere() {
  const ref = useRef()
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.06
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.04) * 0.1
  })
  return (
    <group>
      <Stars radius={80} depth={40} count={2000} factor={3} fade speed={0.4} />
      <mesh ref={ref}>
        <sphereGeometry args={[1.6, 48, 48]} />
        <MeshDistortMaterial color="#0891b2" distort={0.25} speed={2}
          roughness={0.15} metalness={0.8} emissive="#012d3a" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[0.4, 0, 0.2]}>
        <sphereGeometry args={[1.75, 18, 18]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.06} />
      </mesh>
      {/* Orbit rings */}
      {[2.6, 4.3].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2.2, 0, i * 0.4]}>
          <torusGeometry args={[r, 0.012, 8, 120]} />
          <meshBasicMaterial color={i === 0 ? '#22d3ee' : '#818cf8'} transparent opacity={0.18} />
        </mesh>
      ))}
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 4, 4]} intensity={2} color="#22d3ee" />
      <pointLight position={[-4, -2, -4]} intensity={0.8} color="#818cf8" />
    </group>
  )
}

/* ─── Orbital planet node ─── */
function PlanetNode({ feature, angleDeg, isMobile, onClick, isActive }) {
  const r = (isMobile ? ORBIT_R_MOBILE : ORBIT_R)[feature.orbit]
  const rad = (angleDeg * Math.PI) / 180
  const x = Math.cos(rad) * r
  const y = Math.sin(rad) * r
  const size = isMobile ? 38 : 48

  return (
    <motion.div
      style={{ position:'absolute', left:'50%', top:'50%',
        transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        zIndex: isActive ? 20 : 10 }}
      whileHover={{ scale: 1.18 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type:'spring', stiffness:400, damping:20 }}>
      <button onClick={onClick} style={{ all:'unset', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
        {/* Planet circle */}
        <motion.div
          animate={isActive
            ? { boxShadow:`0 0 0 3px ${feature.color}, 0 0 30px ${feature.color}60`, scale:1.12 }
            : { boxShadow:`0 0 0 1px ${feature.color}50, 0 0 12px ${feature.color}25`, scale:1 }}
          transition={{ duration:0.3 }}
          style={{
            width:size, height:size, borderRadius:'50%',
            background:`radial-gradient(circle at 35% 35%, ${feature.color}40, ${feature.color}10)`,
            backdropFilter:'blur(8px)',
            border:`1px solid ${feature.color}60`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color: feature.color,
          }}>
          {ICONS[feature.icon]}
        </motion.div>
        {/* Label */}
        <span style={{
          fontSize: isMobile ? 9 : 10,
          fontFamily:"'Space Grotesk',sans-serif",
          fontWeight:700,
          color: isActive ? feature.color : 'var(--text-muted)',
          letterSpacing:'0.06em',
          textTransform:'uppercase',
          transition:'color 0.2s',
          whiteSpace:'nowrap',
        }}>{feature.label}</span>
      </button>
    </motion.div>
  )
}

/* ─── Animated orbit ring (SVG) ─── */
function OrbitRing({ r, dashed = false, color = 'rgba(34,211,238,0.12)' }) {
  const size = r * 2 + 8
  return (
    <div style={{ position:'absolute', left:'50%', top:'50%', transform:`translate(-50%,-50%)`, width:size, height:size, pointerEvents:'none', zIndex:1 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="1"
          strokeDasharray={dashed ? '4 8' : undefined} />
      </svg>
    </div>
  )
}

/* ─── Feature info panel ─── */
function FeaturePanel({ feature, onGo, onClose }) {
  if (!feature) return null
  return (
    <AnimatePresence>
      <motion.div
        key={feature.id}
        initial={{ opacity:0, scale:0.88, y:12 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.88, y:12 }}
        transition={{ type:'spring', stiffness:340, damping:26 }}
        style={{
          position:'absolute', bottom:'calc(50% - 200px)', left:'50%',
          transform:'translateX(-50%)',
          background:'rgba(4,15,26,0.95)',
          backdropFilter:'blur(20px)',
          border:`1px solid ${feature.color}40`,
          borderRadius:20,
          padding:'20px 24px',
          width: 260,
          boxShadow:`0 0 40px ${feature.color}20`,
          zIndex:30,
          pointerEvents:'auto',
        }}>
        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:10, right:10, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        {/* Icon */}
        <div style={{ width:40, height:40, borderRadius:12, background:`${feature.color}15`, border:`1px solid ${feature.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:feature.color, marginBottom:12 }}>
          {ICONS[feature.icon]}
        </div>
        <div style={{ fontSize:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:feature.color, marginBottom:6 }}>
          {feature.label}
        </div>
        <div style={{ fontSize:16, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:'var(--text-primary)', marginBottom:8, lineHeight:1.2 }}>
          {feature.title}
        </div>
        <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.55, marginBottom:16 }}>
          {feature.desc}
        </p>
        <button onClick={onGo}
          className="btn-primary" style={{ width:'100%', padding:'10px 0', fontSize:13 }}>
          Open {feature.title}
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Main Home ─── */
export default function Home() {
  const navigate = useNavigate()
  const { updateStreak } = useStore()
  const { rbi, banks, source } = useBankRates()
  const [angles, setAngles] = useState(() => Object.fromEntries(FEATURES.map(f => [f.id, f.angle])))
  const [active, setActive] = useState(null)
  const [paused, setPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const rafRef = useRef()
  const lastRef = useRef(performance.now())

  useEffect(() => { updateStreak() }, [])
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Animate orbits
  useEffect(() => {
    const tick = (now) => {
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      if (!paused) {
        setAngles(prev => {
          const next = { ...prev }
          FEATURES.forEach(f => { next[f.id] = (prev[f.id] + f.speed * dt * 60 * 0.25) % 360 })
          return next
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [paused])

  const goTo = (route) => {
    if (localStorage.getItem('loggedIn') === 'true') navigate(route)
    else navigate('/login')
  }

  const handlePlanetClick = (feature) => {
    setPaused(true)
    setActive(prev => prev?.id === feature.id ? null : feature)
  }

  const closePanel = () => { setActive(null); setPaused(false) }
  const canvasSize = isMobile ? 260 : 380

  return (
    <div style={{ background:'var(--bg-void)', minHeight:'100vh', overflow:'hidden' }}>
      <div className="grid-bg" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} />
      <Navbar />

      {/* ─── HERO: orbital section ─── */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>

        {/* Ambient orbs */}
        <div className="orb-cyan" style={{ width:500, height:500, top:-150, left:-150, zIndex:0 }} />
        <div className="orb-purple" style={{ width:400, height:400, bottom:-100, right:-100, zIndex:0 }} />

        {/* Hero text — top */}
        <motion.div initial={{ opacity:0, y:-24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.2 }}
          style={{ textAlign:'center', position:'relative', zIndex:10, padding:'90px 20px 0', maxWidth:600, margin:'0 auto' }}>
          <div style={{ fontSize:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--cyan)', marginBottom:14, opacity:0.8 }}>
            India's Smartest Financial Platform
          </div>
          <h1 className="display-xl" style={{ marginBottom:14, fontSize:'clamp(1.8rem,5vw,3.8rem)' }}>
            <span style={{ color:'var(--text-primary)' }}>Decode Your </span>
            <span className="shimmer-text">Financial DNA</span>
          </h1>
          {/* RBI live pill */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 16px', borderRadius:100, background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.2)', marginBottom:28 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'glowPulse 2s infinite' }} />
            <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
              RBI Repo: <strong style={{ color:'var(--cyan)' }}>{rbi.repoRate}%</strong>
              <span style={{ color:'var(--text-muted)', marginLeft:8, fontSize:10 }}>· Home loans from {Math.min(...banks.map(b=>b.homeLoan.min))}%</span>
            </span>
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:20 }}>
            <button onClick={() => goTo('/eligibility')} className="btn-primary glow-pulse" style={{ padding:'12px 28px', fontSize:14 }}>
              Analyze My FinDNA
            </button>
            <button onClick={() => goTo('/compare')} className="btn-outline" style={{ padding:'12px 28px', fontSize:14 }}>
              Compare 10 Banks
            </button>
          </div>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Click any planet to explore a feature</p>
        </motion.div>

        {/* ─── ORBITAL SYSTEM ─── */}
        <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ duration:1, delay:0.4 }}
          style={{ position:'relative', width: isMobile ? 480 : 760, height: isMobile ? 480 : 760, flexShrink:0, zIndex:10, marginTop: isMobile ? 20 : 0 }}>

          {/* Orbit ring 1 */}
          <OrbitRing r={(isMobile ? ORBIT_R_MOBILE : ORBIT_R)[1]} color="rgba(34,211,238,0.15)" />
          {/* Orbit ring 2 */}
          <OrbitRing r={(isMobile ? ORBIT_R_MOBILE : ORBIT_R)[2]} color="rgba(129,140,248,0.12)" dashed />

          {/* 3D Globe center */}
          <div style={{ position:'absolute', left:'50%', top:'50%', transform:`translate(-50%,-50%)`, width:canvasSize, height:canvasSize, zIndex:5 }}>
            <Canvas camera={{ position:[0,0,4.5], fov:45 }}>
              <BgSphere />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
            {/* Center label */}
            <div style={{ position:'absolute', bottom: isMobile ? -28 : -36, left:'50%', transform:'translateX(-50%)', textAlign:'center', pointerEvents:'none' }}>
              <div style={{ fontSize: isMobile ? 18 : 22, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, color:'var(--cyan)', letterSpacing:'-.02em' }}>FinSure</div>
              <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>Financial Intelligence</div>
            </div>
          </div>

          {/* Planet nodes */}
          {FEATURES.map(f => (
            <PlanetNode
              key={f.id}
              feature={f}
              angleDeg={angles[f.id]}
              isMobile={isMobile}
              isActive={active?.id === f.id}
              onClick={() => handlePlanetClick(f)}
            />
          ))}

          {/* Feature info panel */}
          {active && (
            <FeaturePanel
              feature={active}
              onGo={() => { goTo(active.route); closePanel() }}
              onClose={closePanel}
            />
          )}
        </motion.div>

        {/* Pause / resume hint */}
        <motion.button
          onClick={() => { setPaused(p => !p); if(active) setActive(null) }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }}
          style={{ position:'relative', zIndex:10, marginTop:16, background:'none', border:'1px solid rgba(34,211,238,0.15)', borderRadius:100, padding:'6px 18px', cursor:'pointer', color:'var(--text-muted)', fontSize:11, fontFamily:"'Space Grotesk',sans-serif", display:'flex', alignItems:'center', gap:8, transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(34,211,238,0.4)'; e.currentTarget.style.color='var(--cyan)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(34,211,238,0.15)'; e.currentTarget.style.color='var(--text-muted)' }}>
          {paused
            ? <><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M0 0v10l10-5z"/></svg> Resume orbits</>
            : <><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="0" y="0" width="3.5" height="10"/><rect x="6.5" y="0" width="3.5" height="10"/></svg> Pause orbits</>
          }
        </motion.button>

        {/* Scroll hint */}
        <motion.div animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:2.2 }}
          style={{ position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'var(--text-muted)', zIndex:10 }}>
          <span style={{ fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>Scroll</span>
          <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
            <rect x="1" y="1" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="5.5" y="4" width="3" height="5" rx="1.5" fill="currentColor"/>
          </svg>
        </motion.div>
      </section>

      {/* ─── BANK RATE TICKER ─── */}
      <div style={{ position:'relative', zIndex:10, borderTop:'1px solid rgba(34,211,238,0.08)', borderBottom:'1px solid rgba(34,211,238,0.08)', background:'rgba(4,15,26,0.85)', padding:'14px 0', overflow:'hidden' }}>
        <div style={{ fontSize:9, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', textAlign:'center', marginBottom:10 }}>
          Live Bank Rates · {source}
        </div>
        <div style={{ overflow:'hidden', maskImage:'linear-gradient(90deg,transparent,black 6%,black 94%,transparent)' }}>
          <motion.div style={{ display:'flex', gap:14, width:'max-content' }}
            animate={{ x:[0,-2200] }} transition={{ duration:28, repeat:Infinity, ease:'linear' }}>
            {[...banks,...banks].map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, padding:'5px 12px', borderRadius:10, background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.08)' }}>
                <span style={{ fontWeight:700, fontSize:12, color:'var(--cyan)', fontFamily:"'Space Grotesk',sans-serif" }}>{b.bank}</span>
                <span style={{ fontSize:11, color:'var(--text-secondary)' }}>Home {b.homeLoan.min}%</span>
                <span style={{ fontSize:10, color:'var(--text-muted)' }}>Personal {b.personalLoan.min}%</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── STATS STRIP ─── */}
      <section style={{ padding:'56px 20px', background:'rgba(4,15,26,0.5)', position:'relative', zIndex:10 }}>
        <div style={{ maxWidth:800, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'24px 40px', textAlign:'center' }} className="md-grid-4">
          {[
            { val:'10', label:'Real Indian Banks' },
            { val:'98%', label:'Accuracy Rate' },
            { val:'11', label:'Financial Tools' },
            { val:'100%', label:'Data Privacy' },
          ].map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'2.2rem', color:'var(--cyan)' }}>{s.val}</div>
              <div style={{ marginTop:4, fontSize:13, color:'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SECURITY STRIP ─── */}
      <section style={{ padding:'48px 20px', position:'relative', zIndex:10 }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ fontSize:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--cyan)', marginBottom:10 }}>Security</div>
            <h2 className="display-lg" style={{ color:'var(--text-primary)', fontSize:'clamp(1.4rem,3.5vw,2.2rem)' }}>Bank-grade protection</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }} className="md-grid-4">
            {[
              { label:'Biometric Auth', desc:'WebAuthn fingerprint & FaceID', color:'#22d3ee', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg> },
              { label:'OTP Verification', desc:'Phone OTP via Firebase Auth', color:'#818cf8', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01M8 6h8M8 10h4"/></svg> },
              { label:'Auto Logout', desc:'15-min inactivity timeout', color:'#22c55e', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
              { label:'Session Guard', desc:'Protected routes + token auth', color:'#eab308', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            ].map(s => (
              <div key={s.label} className="glass" style={{ borderRadius:18, padding:'20px 22px', display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${s.color}12`, border:`1px solid ${s.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:s.color, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ position:'relative', zIndex:10, borderTop:'1px solid rgba(34,211,238,0.08)', padding:'40px 20px 28px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', gap:24, marginBottom:28 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'var(--cyan)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/><path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/></svg>
                </div>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.15rem', color:'var(--cyan)' }}>FinSure</span>
              </div>
              <p style={{ fontSize:12, color:'var(--text-secondary)', maxWidth:260, lineHeight:1.6 }}>
                Real bank data. AI intelligence. React + Firebase + Three.js.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 40px', fontSize:12 }}>
              {[
                { l:'Email', h:'mailto:balajimaninadar4712@gmail.com', t:'balajimaninadar4712@gmail.com' },
                { l:'GitHub', h:'https://github.com/Balaji4723', t:'Balaji4723' },
                { l:'Portfolio', h:'https://balaji4723.github.io/PORTFOLIO-WEBSITE/', t:'Portfolio' },
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
          <div style={{ borderTop:'1px solid rgba(34,211,238,0.06)', paddingTop:16, display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', flexWrap:'wrap', gap:8 }}>
            <span>FinSure Financial Intelligence Platform</span>
            <span>React · Firebase · Three.js · Framer Motion</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
