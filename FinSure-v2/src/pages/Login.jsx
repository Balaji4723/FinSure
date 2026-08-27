import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { DNAHelix, Spinner } from '../components/UI'

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: false })
  const [loading, setLoading] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const { updateStreak, updateActivity } = useStore()

  useEffect(() => {
    if (params.get('timeout')) setMsg({ text: 'Session expired due to inactivity. Please sign in again.', ok: false })
    if (window.PublicKeyCredential) setBiometricAvailable(true)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    // Input validation
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg({ text: 'Please enter a valid email address.', ok: false }); return
    }
    if (!password || password.length < 6 || password.length > 128) {
      setMsg({ text: 'Password must be between 6 and 128 characters.', ok: false }); return
    }
    setLoading(true); setMsg({ text: '', ok: false })
    try {
      await signInWithEmailAndPassword(auth, email, password)
      localStorage.setItem('loggedIn', 'true')
      updateStreak(); updateActivity()
      setMsg({ text: 'Login successful. Redirecting...', ok: true })
      setTimeout(() => navigate('/'), 1000)
    } catch (err) {
      const m = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' ? 'Invalid email or password.'
        : err.code === 'auth/user-not-found' ? 'No account found with this email.'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.'
        : 'Login failed. Please try again.'
      setMsg({ text: m, ok: false })
    } finally { setLoading(false) }
  }

  const handleBiometric = async () => {
    try {
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        }
      })
      if (cred) {
        localStorage.setItem('loggedIn', 'true')
        updateStreak(); updateActivity()
        navigate('/')
      }
    } catch (err) {
      setMsg({ text: 'Biometric auth failed or not registered. Use email/password.', ok: false })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative" style={{ background: 'var(--bg-void)' }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-cyan w-[500px] h-[500px] -top-32 -left-32 z-0" />
      <div className="orb-purple w-[400px] h-[400px] -bottom-32 -right-32 z-0" />

      {/* DNA helix decorations */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 opacity-30 hidden lg:block z-0">
        <DNAHelix height={400} />
      </div>
      <div className="fixed right-8 top-1/2 -translate-y-1/2 opacity-30 hidden lg:block z-0">
        <DNAHelix height={400} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [.25, .46, .45, .94] }}
        className="glass holo-card rounded-3xl p-8 md:p-12 w-full max-w-md relative z-10"
        style={{ boxShadow: '0 0 80px rgba(34,211,238,0.08)' }}>

        {/* Back button */}
        <button onClick={() => navigate('/')}
          style={{ position:'absolute', top:16, left:20, display:'flex', alignItems:'center', gap:6,
            color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontSize:13 }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--cyan)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 7H3M7 11L3 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--cyan)', boxShadow: '0 0 40px rgba(34,211,238,0.5)' }}>
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none" />
              <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12" />
            </svg>
          </motion.div>
        </div>

        <h1 className="display-md text-center mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Sign in to your FinSure account</p>

        {/* Biometric button */}
        {biometricAvailable && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleBiometric}
            className="w-full py-3 rounded-2xl mb-5 flex items-center justify-center gap-3 text-sm font-semibold transition-all"
            style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.25)', color: 'var(--cyan)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.06)'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/>
              <path d="M12 8v4l3 3"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Sign in with Biometrics
          </motion.button>
        )}

        {biometricAvailable && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(34,211,238,0.1)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(34,211,238,0.1)' }} />
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label-mono block mb-2">Email</label>
            <input type="email" placeholder="you@example.com" required value={email}
              onChange={e => setEmail(e.target.value)} className="fin-input" />
          </div>
          <div>
            <label className="label-mono block mb-2">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Your password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="fin-input" style={{ paddingRight: 52 }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2 flex items-center justify-center gap-3">
            {loading ? <><Spinner />Signing in...</> : 'Sign In'}
          </button>
        </form>

        {msg.text && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-5 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.ok ? '#22c55e' : '#f87171' }}>
            {msg.text}
          </motion.div>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>256-bit encrypted · Firebase Auth · Session protected</span>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          No account yet?{' '}
          <Link to="/register" style={{ color: 'var(--cyan)', fontWeight: 600 }}>Create one</Link>
        </p>
      </motion.div>
    </div>
  )
}
