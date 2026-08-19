import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Spinner } from '../components/UI'
import { useStore } from '../store/useStore'

const RULES = [
  { label:'8+ characters', test: p => p.length >= 8 },
  { label:'Uppercase letter', test: p => /[A-Z]/.test(p) },
  { label:'Lowercase letter', test: p => /[a-z]/.test(p) },
  { label:'Number', test: p => /\d/.test(p) },
  { label:'Special char (@$!%*?&)', test: p => /[@$!%*?&]/.test(p) },
]

export default function Register() {
  const navigate = useNavigate()
  const { updateStreak, updateActivity } = useStore()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [cpw, setCpw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: false })
  const [loading, setLoading] = useState(false)

  const strength = RULES.filter(r => r.test(pw)).length
  const sColor = strength <= 1 ? '#ef4444' : strength <= 3 ? '#eab308' : '#22c55e'
  const sLabel = ['', 'Weak', 'Weak', 'Moderate', 'Good', 'Strong'][strength]

  const handleRegister = async (e) => {
    e.preventDefault()
    if (strength < 5) { setMsg({ text: 'Password does not meet all requirements.', ok: false }); return }
    if (pw !== cpw) { setMsg({ text: 'Passwords do not match.', ok: false }); return }
    setLoading(true); setMsg({ text: '', ok: false })
    try {
      await createUserWithEmailAndPassword(auth, email, pw)
      localStorage.setItem('loggedIn', 'true')
      updateStreak(); updateActivity()
      setMsg({ text: 'Account created. Welcome to FinSure!', ok: true })
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      const m = err.code === 'auth/email-already-in-use' ? 'An account with this email already exists.'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
        : 'Registration failed. Please try again.'
      setMsg({ text: m, ok: false })
    } finally { setLoading(false) }
  }

  const Eye = ({ open }) => open
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div className="min-h-screen flex items-center justify-center p-5 py-12 relative" style={{ background: 'var(--bg-void)' }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-purple w-[500px] h-[500px] -top-32 -right-32 z-0" />
      <div className="orb-pink w-[400px] h-[400px] -bottom-32 -left-32 z-0" />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass holo-card rounded-3xl p-8 md:p-12 w-full max-w-md relative z-10"
        style={{ boxShadow: '0 0 80px rgba(129,140,248,0.08)' }}>

        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,var(--cyan),var(--purple))', boxShadow: '0 0 40px rgba(129,140,248,0.4)' }}>
            <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
              <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
            </svg>
          </div>
        </div>

        <h1 className="display-md text-center mb-1" style={{ color: 'var(--text-primary)' }}>Create account</h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Join FinSure to start your financial analysis</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label-mono block mb-2">Email</label>
            <input type="email" placeholder="you@example.com" required value={email}
              onChange={e => setEmail(e.target.value)} className="fin-input" />
          </div>
          <div>
            <label className="label-mono block mb-2">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Create a strong password" required
                value={pw} onChange={e => setPw(e.target.value)}
                className="fin-input" style={{ paddingRight: 52 }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Eye open={showPw} />
              </button>
            </div>
            {/* Strength meter */}
            {pw.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-400"
                      style={{ background: i <= strength ? sColor : 'rgba(34,211,238,0.08)' }} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {RULES.map(r => (
                    <span key={r.label} className="text-xs flex items-center gap-1"
                      style={{ color: r.test(pw) ? '#22c55e' : 'var(--text-muted)' }}>
                      <span style={{marginRight:4,color:r.test(pw)?'#22c55e':'var(--text-muted)'}}>{r.test(pw)?'+':'-'}</span>{r.label}
                    </span>
                  ))}
                  <span className="ml-auto text-xs font-bold" style={{ color: sColor }}>{sLabel}</span>
                </div>
              </motion.div>
            )}
          </div>
          <div>
            <label className="label-mono block mb-2">Confirm Password</label>
            <input type="password" placeholder="Repeat your password" required value={cpw}
              onChange={e => setCpw(e.target.value)} className="fin-input"
              style={{ borderColor: cpw && cpw !== pw ? 'rgba(239,68,68,0.5)' : undefined }} />
            {cpw && cpw !== pw && <p className="text-xs mt-1" style={{ color: '#f87171' }}>Passwords do not match</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2 flex items-center justify-center gap-3">
            {loading ? <><Spinner />Creating account...</> : 'Create Account'}
          </button>
        </form>

        {msg.text && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-5 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.ok ? '#22c55e' : '#f87171' }}>
            {msg.text}
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-2 mt-6">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Biometric login available after registration</span>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
