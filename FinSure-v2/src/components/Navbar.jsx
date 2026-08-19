import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'FinDNA', href: '/eligibility' },
  { label: 'EMI', href: '/emi' },
  { label: 'Compare', href: '/compare' },
  { label: 'Recommend', href: '/recommend' },
  { label: 'Tools', href: '/tools' },
  { label: 'FinAI', href: '/ai', highlight: true },
  { label: 'Goals', href: '/goals' },
  { label: 'Credit', href: '/credit' },
  { label: 'Report Card', href: '/report-card' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'History', href: '/history' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true')
  const { streak, badges } = useStore()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const logout = () => {
    localStorage.removeItem('loggedIn')
    setLoggedIn(false)
    navigate('/')
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{ background: scrolled ? 'rgba(2,10,18,0.96)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? '1px solid rgba(34,211,238,0.08)' : 'none' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" style={{ textDecoration: 'none' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--cyan)', boxShadow: '0 0 20px rgba(34,211,238,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
              <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.35rem', color: 'var(--cyan)', letterSpacing: '-.02em' }}>FinSure</span>
        </Link>

        {/* Desktop links — scrollable on medium screens */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV.map(n => {
            const active = location.pathname === n.href
            return (
              <Link key={n.href} to={n.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  style={{ color: active ? 'var(--cyan)' : n.highlight ? '#a5b4fc' : 'var(--text-secondary)', background: active ? 'rgba(34,211,238,0.1)' : 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => !active && (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => !active && (e.currentTarget.style.color = n.highlight ? '#a5b4fc' : 'var(--text-secondary)')}>
                  {n.highlight && <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--purple)',display:'inline-block',marginRight:4 }}></span>}
                  {n.label}
                  {active && <div className="w-1 h-1 rounded-full" style={{ background: 'var(--cyan)' }} />}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          {loggedIn && streak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c' }}>
              <svg width="12" height="14" viewBox="0 0 12 16" fill="#fb923c"><path d="M6 0C3 4 1 6 1 9a5 5 0 0010 0C11 6 9 4 6 0zm0 14a3 3 0 01-3-3c0-2 2-4 3-6 1 2 3 4 3 6a3 3 0 01-3 3z"/></svg>{streak}
            </div>
          )}
          {loggedIn && (
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', color: '#eab308', cursor: 'pointer' }}>
                Badges {badges.length}
              </div>
            </Link>
          )}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          {!loggedIn ? (
            <>
              <Link to="/login"><button className="btn-outline px-4 py-2 text-sm">Login</button></Link>
              <Link to="/register"><button className="btn-primary px-4 py-2 text-sm glow-pulse">Register</button></Link>
            </>
          ) : (
            <button onClick={logout} className="btn-danger px-4 py-2 text-sm">Logout</button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <div className="flex flex-col gap-1.5 w-6">
            {[0,1,2].map(i => (
              <span key={i} className="block h-0.5 transition-all duration-300" style={{
                background: 'var(--cyan)', width: i === 1 ? (menuOpen ? '100%' : '75%') : '100%',
                transform: menuOpen ? (i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'scaleX(0)') : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1
              }} />
            ))}
          </div>
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden"
            style={{ background: 'rgba(2,10,18,0.98)', borderBottom: '1px solid rgba(34,211,238,0.1)' }}>
            <div className="px-5 py-5 flex flex-col gap-0.5 max-h-96 overflow-y-auto">
              {NAV.map(n => (
                <Link key={n.href} to={n.href} style={{ textDecoration: 'none' }}>
                  <div className="py-3 px-3 rounded-xl text-sm font-medium border-b flex items-center gap-2"
                    style={{ color: location.pathname === n.href ? 'var(--cyan)' : n.highlight ? '#a5b4fc' : 'var(--text-secondary)', borderColor: 'rgba(34,211,238,0.06)', background: location.pathname === n.href ? 'rgba(34,211,238,0.06)' : 'transparent' }}>
                    {n.label}
                  </div>
                </Link>
              ))}
              <div className="flex gap-3 mt-4 pt-2">
                {!loggedIn ? (
                  <>
                    <Link to="/login" className="flex-1"><button className="btn-outline w-full py-3 text-sm">Login</button></Link>
                    <Link to="/register" className="flex-1"><button className="btn-primary w-full py-3 text-sm">Register</button></Link>
                  </>
                ) : (
                  <button onClick={logout} className="btn-danger w-full py-3 text-sm">Logout</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
