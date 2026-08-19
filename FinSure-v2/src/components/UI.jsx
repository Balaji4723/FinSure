import { useRef, useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, OrbitControls, Stars, Float, Text3D } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Animated number ─── */
export function AnimNum({ value, prefix = '₹', decimals = 0, className = '' }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current, to = Number(value) || 0
    prev.current = to
    if (from === to) return
    const dur = 900, start = performance.now()
    const raf = (now) => {
      const p = Math.min((now - start) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (to - from) * e)
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [value])
  const fmt = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-IN')
  return <span className={className}>{prefix}{fmt}</span>
}

/* ─── Liquid progress bar ─── */
export function LiquidBar({ value, max = 100, color = 'var(--cyan)', height = 8, label, showPct = true }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      {(label || showPct) && (
        <div className="flex justify-between text-xs mb-2">
          {label && <span style={{ color: 'var(--text-secondary)' }}>{label}</span>}
          {showPct && <span style={{ color, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="liquid-bar rounded-full" style={{ background: 'rgba(34,211,238,0.08)', height }}>
        <motion.div className="liquid-bar-fill rounded-full" initial={{ width: 0 }}
          animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: [.4, 0, .2, 1] }}
          style={{ background: color, height: '100%' }} />
      </div>
    </div>
  )
}

/* ─── Score ring ─── */
export function ScoreRing({ score, size = 180, strokeWidth = 14, label = '/ 100' }) {
  const r = (size / 2) - strokeWidth - 4
  const c = 2 * Math.PI * r
  const dash = (score / 100) * c
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash.toFixed(1)} ${(c - dash).toFixed(1)}`}
          strokeLinecap="round" className="progress-ring-circle"
          style={{ filter: `drop-shadow(0 0 8px ${color}70)`, transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color, fontSize: size * 0.22 }}>{score}</div>
        <div style={{ fontSize: size * 0.07, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      </div>
    </div>
  )
}

/* ─── Donut chart ─── */
export function DonutChart({ slices, size = 160 }) {
  const r = size * 0.34, c = 2 * Math.PI * r
  const total = slices.reduce((a, s) => a + s.value, 0)
  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth={size*0.1} />
      {slices.map((s, i) => {
        const dash = (s.value / total) * c
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth={size*0.1}
            strokeDasharray={`${dash.toFixed(2)} ${(c - dash).toFixed(2)}`}
            strokeDashoffset={(-offset).toFixed(2)} strokeLinecap="butt"
            className="progress-ring-circle"
            style={{ transition: `stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1) ${i * 0.15}s` }} />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

/* ─── Badge card ─── */
export function BadgeCard({ badge, size = 'md' }) {
  const isLg = size === 'lg'
  return (
    <motion.div whileHover={{ scale: 1.05, y: -4 }} className={`glass holo-card rounded-2xl flex flex-col items-center text-center badge-pop ${isLg ? 'p-6' : 'p-4'}`}
      style={{ border: `1px solid ${badge.color}30`, boxShadow: `0 0 20px ${badge.color}15` }}>
      <div className={`${isLg ? 'text-4xl mb-3' : 'text-3xl mb-2'}`}>{badge.icon}</div>
      <div className="font-bold text-sm" style={{ color: badge.color, fontFamily: "'Space Grotesk',sans-serif" }}>{badge.label}</div>
      {isLg && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{badge.desc}</div>}
      {badge.earnedAt && <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{new Date(badge.earnedAt).toLocaleDateString('en-IN')}</div>}
    </motion.div>
  )
}

/* ─── 3D Globe inner ─── */
function GlobeMesh() {
  const meshRef = useRef()
  const ringRef = useRef()
  useFrame(({ clock }) => {
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.18
    ringRef.current.rotation.z = clock.getElapsedTime() * 0.06
    meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.08
  })
  return (
    <group>
      <Stars radius={80} depth={40} count={3000} factor={4} fade speed={0.6} />
      {/* Main globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.4, 64, 64]} />
        <MeshDistortMaterial color="#0891b2" distort={0.18} speed={2.5} roughness={0.1} metalness={0.8}
          emissive="#022d3d" emissiveIntensity={0.4} wireframe={false} />
      </mesh>
      {/* Wireframe overlay */}
      <mesh rotation={[0.4, 0, 0.3]}>
        <sphereGeometry args={[1.55, 20, 20]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08} />
      </mesh>
      {/* Orbit ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[2.1, 0.02, 8, 100]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </mesh>
      {/* Second ring */}
      <mesh rotation={[Math.PI / 4, 0.5, 0]}>
        <torusGeometry args={[1.9, 0.015, 8, 80]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.3} />
      </mesh>
      {/* Floating data points */}
      {[
        [1.4, 0.6, 0.8], [-1.2, 0.9, 0.5], [0.7, -1.3, 0.9],
        [-0.8, -0.7, 1.3], [1.0, 1.1, -0.9], [-1.4, 0.2, -0.7]
      ].map((pos, i) => (
        <Float key={i} speed={1.5 + i * 0.3} rotationIntensity={0.3} floatIntensity={0.4}>
          <mesh position={pos}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#22d3ee' : '#818cf8'} />
          </mesh>
        </Float>
      ))}
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 4, 4]} intensity={2} color="#22d3ee" />
      <pointLight position={[-4, -2, -4]} intensity={1} color="#818cf8" />
    </group>
  )
}

export function Globe3D({ size = 320 }) {
  return (
    <div style={{ width: size, height: size }} className="cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <GlobeMesh />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  )
}

/* ─── DNA Helix SVG animation ─── */
export function DNAHelix({ height = 300 }) {
  const points = 14
  return (
    <div style={{ height, width: 80, position: 'relative', overflow: 'hidden' }}>
      <svg width="80" height={height} viewBox={`0 0 80 ${height}`}>
        {Array.from({ length: points }, (_, i) => {
          const y = (i / (points - 1)) * (height - 20) + 10
          const phase = (i / points) * Math.PI * 4
          const x1 = 40 + Math.sin(phase) * 28
          const x2 = 40 + Math.sin(phase + Math.PI) * 28
          const c = i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#818cf8' : '#f472b6'
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
              <circle cx={x1} cy={y} r={4} fill={c} opacity={0.9} style={{ filter: `drop-shadow(0 0 4px ${c})` }}>
                <animate attributeName="cy" values={`${y};${y-4};${y}`} dur={`${1.5 + i * 0.1}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={x2} cy={y} r={4} fill={c} opacity={0.7} style={{ filter: `drop-shadow(0 0 4px ${c})` }}>
                <animate attributeName="cy" values={`${y};${y+4};${y}`} dur={`${1.5 + i * 0.1}s`} repeatCount="indefinite" />
              </circle>
            </g>
          )
        })}
        {/* Spine lines */}
        {Array.from({ length: points - 1 }, (_, i) => {
          const y1 = (i / (points - 1)) * (height - 20) + 10
          const y2 = ((i + 1) / (points - 1)) * (height - 20) + 10
          const x1a = 40 + Math.sin((i / points) * Math.PI * 4) * 28
          const x2a = 40 + Math.sin(((i + 1) / points) * Math.PI * 4) * 28
          const x1b = 40 + Math.sin((i / points) * Math.PI * 4 + Math.PI) * 28
          const x2b = 40 + Math.sin(((i + 1) / points) * Math.PI * 4 + Math.PI) * 28
          return (
            <g key={i}>
              <line x1={x1a} y1={y1} x2={x2a} y2={y2} stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
              <line x1={x1b} y1={y1} x2={x2b} y2={y2} stroke="rgba(129,140,248,0.4)" strokeWidth="1.5" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ─── Matrix data stream ─── */
export function DataStream({ cols = 6, height = 200 }) {
  const chars = '₹%@#ABCD0123456789LOAN EMI CIBIL RATE DEBT'.split('')
  const streams = useMemo(() => Array.from({ length: cols }, (_, i) => ({
    id: i, chars: Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]),
    dur: 1.5 + Math.random() * 2, delay: Math.random() * 2, opacity: 0.3 + Math.random() * 0.5
  })), [cols])
  return (
    <div className="flex gap-2 overflow-hidden" style={{ height }}>
      {streams.map(s => (
        <div key={s.id} className="flex flex-col gap-1 overflow-hidden" style={{ opacity: s.opacity }}>
          {s.chars.map((ch, j) => (
            <span key={j} className="mono text-xs block"
              style={{
                color: 'rgba(34,211,238,0.7)', textShadow: '0 0 6px rgba(34,211,238,0.8)',
                animation: `dataFall ${s.dur}s linear ${s.delay + j * 0.1}s infinite`
              }}>
              {ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── Slider with track ─── */
export function SliderInput({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '', sublabel }) {
  const pct = Math.min(((value - min) / (max - min)) * 100, 100)
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="label-mono">{label}</label>
        <span style={{ color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px' }}>
          {prefix}{Number(value).toLocaleString('en-IN')}{suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', background:
            `linear-gradient(to right,var(--cyan) 0%,var(--cyan) ${pct}%,rgba(34,211,238,0.12) ${pct}%,rgba(34,211,238,0.12) 100%)`
        }} />
      <div className="flex justify-between mt-1" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>{prefix}{Number(min).toLocaleString('en-IN')}{suffix}</span>
        {sublabel && <span>{sublabel}</span>}
        <span>{prefix}{Number(max).toLocaleString('en-IN')}{suffix}</span>
      </div>
    </div>
  )
}

/* ─── Page shell ─── */
export function PageShell({ children, orbs = true }) {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-void)' }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      {orbs && <>
        <div className="orb-cyan w-96 h-96 -top-32 -left-32 z-0" />
        <div className="orb-purple w-80 h-80 top-1/2 -right-24 z-0" />
        <div className="orb-pink w-64 h-64 bottom-0 left-1/4 z-0" />
      </>}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ─── Back button ─── */
export function BackBtn({ to = '/' }) {
  return (
    <button onClick={() => window.history.back()}
      className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M11 7H3M7 11L3 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  )
}

/* ─── Tilt card ─── */
export function TiltCard({ children, className = '', onClick, style }) {
  const ref = useRef()
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`
  }
  const onLeave = () => { ref.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) scale(1)' }
  return (
    <div ref={ref} className={`tilt-card ${className}`} onClick={onClick} style={{ transition: 'transform .15s ease', ...style }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

/* ─── Spinner ─── */
export function Spinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Section header ─── */
export function SectionHeader({ eyebrow, title, subtitle, center = true }) {
  return (
    <div className={`mb-12 ${center ? 'text-center' : ''}`}>
      {eyebrow && <div className="label-mono mb-3">{eyebrow}</div>}
      <h2 className="display-lg mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {subtitle && <p className={`text-base leading-relaxed ${center ? 'max-w-2xl mx-auto' : 'max-w-3xl'}`} style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
    </div>
  )
}

/* ─── Metric tile ─── */
export function MetricTile({ label, value, color = 'var(--cyan)', prefix = '', suffix = '', animated = true, className = '' }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="label-mono mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color }}>
        {animated
          ? <AnimNum value={Number(String(value).replace(/[^0-9.]/g, '')) || 0} prefix={prefix} />
          : `${prefix}${value}${suffix}`}
      </div>
    </div>
  )
}
