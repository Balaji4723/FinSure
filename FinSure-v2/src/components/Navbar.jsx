import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'

// Only primary nav — everything else in the 3-dot menu
const PRIMARY = [
  { label: 'Home', href: '/' },
  { label: 'FinAI', href: '/ai' },
]

const MENU_GROUPS = [
  {
    title: 'Analysis',
    links: [
      { label: 'FinDNA Analyzer', href: '/eligibility' },
      { label: 'EMI Calculator', href: '/emi' },
      { label: 'Loan Feasibility', href: '/policy' },
      { label: 'Loan Comparison', href: '/compare' },
      { label: 'Loan Recommender', href: '/recommend' },
    ]
  },
  {
    title: 'Tools',
    links: [
      { label: 'Financial Tools', href: '/tools' },
      { label: 'Goal Planner', href: '/goals' },
      { label: 'Credit Booster', href: '/credit' },
      { label: 'FinDNA Report Card', href: '/report-card' },
    ]
  },
  {
    title: 'You',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'History', href: '/history' },
    ]
  },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true')
  const { streak } = useStore()
  const menuRef = useRef()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const logout = () => {
    localStorage.removeItem('loggedIn')
    setLoggedIn(false)
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(2,10,18,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(34,211,238,0.08)' : 'none',
      }}>
      <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" style={{ textDecoration: 'none' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--cyan)', boxShadow: '0 0 18px rgba(34,211,238,0.5)' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
              <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--cyan)', letterSpacing: '-.02em' }}>
            FinSure
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Primary links — only on desktop */}
          <div className="hidden md:flex items-center gap-1">
            {PRIMARY.map(n => (
              <Link key={n.href} to={n.href} style={{ textDecoration: 'none' }}>
                <div className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: location.pathname === n.href ? 'var(--cyan)' : 'var(--text-secondary)',
                    background: location.pathname === n.href ? 'rgba(34,211,238,0.08)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (location.pathname !== n.href) e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { if (location.pathname !== n.href) e.currentTarget.style.color = 'var(--text-secondary)' }}
                >{n.label}</div>
              </Link>
            ))}
          </div>

          {/* Streak badge */}
          {loggedIn && streak > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c' }}>
              <svg width="11" height="13" viewBox="0 0 12 16" fill="#fb923c">
                <path d="M6 0C3 4 1 6 1 9a5 5 0 0010 0C11 6 9 4 6 0zm0 14a3 3 0 01-3-3c0-2 2-4 3-6 1 2 3 4 3 6a3 3 0 01-3 3z"/>
              </svg>
              {streak}
            </div>
          )}

          {/* Auth buttons */}
          {!loggedIn ? (
            <>
              <Link to="/login"><button className="btn-outline px-4 py-2 text-sm">Login</button></Link>
              <Link to="/register"><button className="btn-primary px-4 py-2 text-sm">Register</button></Link>
            </>
          ) : (
            <button onClick={logout} className="btn-danger px-4 py-2 text-sm">Logout</button>
          )}

          {/* 3-dot menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="flex flex-col items-center justify-center gap-1 w-9 h-9 rounded-xl transition-all"
              style={{
                background: menuOpen ? 'rgba(34,211,238,0.12)' : 'rgba(34,211,238,0.06)',
                border: '1px solid rgba(34,211,238,0.2)',
                cursor: 'pointer',
              }}
              aria-label="Open navigation menu">
              {[0,1,2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full"
                  style={{ background: menuOpen ? 'var(--cyan)' : 'var(--text-secondary)' }} />
              ))}
            </button>

            {/* Dropdown mega menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute right-0 top-12 glass rounded-2xl overflow-hidden"
                  style={{
                    width: 320,
                    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.15)',
                    zIndex: 100,
                  }}>

                  {/* Header */}
                  <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
                    <div className="label-mono" style={{ color: 'var(--text-muted)' }}>Navigate</div>
                  </div>

                  {/* Groups */}
                  <div className="p-4 space-y-5 max-h-96 overflow-y-auto">
                    {MENU_GROUPS.map(group => (
                      <div key={group.title}>
                        <div className="label-mono mb-2" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{group.title}</div>
                        <div className="space-y-0.5">
                          {group.links.map(link => {
                            const active = location.pathname === link.href
                            return (
                              <Link key={link.href} to={link.href} style={{ textDecoration: 'none' }}>
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                                  style={{
                                    background: active ? 'rgba(34,211,238,0.1)' : 'transparent',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(34,211,238,0.05)' }}
                                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                                  {/* Active indicator */}
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: active ? 'var(--cyan)' : 'rgba(34,211,238,0.2)' }} />
                                  <span className="text-sm font-medium"
                                    style={{ color: active ? 'var(--cyan)' : 'var(--text-secondary)' }}>
                                    {link.label}
                                  </span>
                                  {active && (
                                    <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6h8M6 2l4 4-4 4" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer - mobile auth */}
                  <div className="px-4 pb-4 md:hidden border-t pt-4" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
                    {!loggedIn ? (
                      <div className="flex gap-3">
                        <Link to="/login" className="flex-1"><button className="btn-outline w-full py-2.5 text-sm">Login</button></Link>
                        <Link to="/register" className="flex-1"><button className="btn-primary w-full py-2.5 text-sm">Register</button></Link>
                      </div>
                    ) : (
                      <button onClick={logout} className="btn-danger w-full py-2.5 text-sm">Logout</button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  )
}
