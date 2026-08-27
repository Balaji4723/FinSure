import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { onAuthStateChanged, updateProfile, signOut } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { PageShell, BackBtn } from '../components/UI'
import { useStore } from '../store/useStore'

export default function Profile() {
  const navigate = useNavigate()
  const { reportsCount } = useStore()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ loans: 0, emis: 0, eligibility: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/login'); return }
      setUser(u)
      try {
        const [r, e, m] = await Promise.all([
          getDocs(collection(db, 'reports')),
          getDocs(collection(db, 'eligibilityReports')),
          getDocs(collection(db, 'emiReports')),
        ])
        setStats({
          loans: r.docs.filter(d => d.data().userEmail === u.email).length,
          eligibility: e.docs.filter(d => d.data().userEmail === u.email).length,
          emis: m.docs.filter(d => d.data().userEmail === u.email).length,
        })
      } catch (err) { console.error(err) }
      setLoading(false)
    })
    return () => unsub()
  }, [navigate])

  const logout = async () => {
    await signOut(auth)
    localStorage.removeItem('loggedIn')
    navigate('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(34,211,238,0.3)', borderTopColor: 'var(--cyan)' }} />
    </div>
  )

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'FS'
  const joined = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="mb-8"><BackBtn /></div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-6">

          {/* Profile card */}
          <div className="glass rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6"
            style={{ background:'linear-gradient(135deg,rgba(34,211,238,0.05),rgba(8,24,40,0.95))' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background:'linear-gradient(135deg,var(--cyan),#818cf8)', fontSize:28, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, color:'#020a12' }}>
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xl font-bold mb-1" style={{ fontFamily:"'Space Grotesk',sans-serif", color:'var(--text-primary)' }}>
                {user?.displayName || user?.email?.split('@')[0] || 'FinSure User'}
              </div>
              <div className="text-sm mb-2" style={{ color:'var(--text-secondary)' }}>{user?.email}</div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-2 h-2 rounded-full" style={{ background:'#22c55e' }} />
                <span className="text-xs" style={{ color:'var(--text-muted)' }}>Active · Joined {joined}</span>
              </div>
            </div>
            <button onClick={logout} className="btn-danger px-5 py-2.5 text-sm flex-shrink-0">
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Loan Reports', val: stats.loans, color:'var(--cyan)' },
              { label:'EMI Plans', val: stats.emis, color:'#818cf8' },
              { label:'FinDNA Analyses', val: stats.eligibility, color:'#22c55e' },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold mb-1" style={{ fontFamily:"'Space Grotesk',sans-serif", color:s.color }}>{s.val}</div>
                <div className="text-xs" style={{ color:'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="glass rounded-3xl p-7">
            <div className="label-mono mb-5">Quick Access</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label:'FinDNA Analyzer', desc:'Check your loan eligibility', route:'/eligibility', color:'var(--cyan)' },
                { label:'EMI Calculator', desc:'Calculate monthly payments', route:'/emi', color:'#818cf8' },
                { label:'Report History', desc:'View all saved reports', route:'/history', color:'#22c55e' },
                { label:'Loan Recommender', desc:'Find your best bank match', route:'/recommend', color:'#eab308' },
                { label:'Goal Planner', desc:'Plan your financial goals', route:'/goals', color:'#fb923c' },
                { label:'Credit Booster', desc:'Improve your CIBIL score', route:'/credit', color:'#f472b6' },
              ].map(l => (
                <div key={l.route} onClick={() => navigate(l.route)}
                  className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{ background:'rgba(34,211,238,0.03)', border:'1px solid rgba(34,211,238,0.08)' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(34,211,238,0.07)'; e.currentTarget.style.borderColor=`${l.color}30` }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(34,211,238,0.03)'; e.currentTarget.style.borderColor='rgba(34,211,238,0.08)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:l.color }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color:'var(--text-primary)', fontFamily:"'Space Grotesk',sans-serif" }}>{l.label}</div>
                    <div className="text-xs" style={{ color:'var(--text-muted)' }}>{l.desc}</div>
                  </div>
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="glass rounded-3xl p-7">
            <div className="label-mono mb-5">Account Details</div>
            <div className="space-y-4">
              {[
                { label:'Email', val: user?.email },
                { label:'Account ID', val: user?.uid?.slice(0,12) + '...' },
                { label:'Email Verified', val: user?.emailVerified ? 'Yes' : 'No' },
                { label:'Auth Provider', val: 'Firebase Email/Password' },
                { label:'Session', val: 'Active · Auto-logout in 15 min' },
              ].map(d => (
                <div key={d.label} className="flex justify-between text-sm border-b pb-3"
                  style={{ borderColor:'rgba(34,211,238,0.06)' }}>
                  <span style={{ color:'var(--text-muted)' }}>{d.label}</span>
                  <span style={{ color:'var(--text-secondary)', fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>{d.val}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  )
}
