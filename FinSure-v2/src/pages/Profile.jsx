import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { onAuthStateChanged, updateProfile, sendEmailVerification, signOut } from 'firebase/auth'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Navbar from '../components/Navbar'
import { PageShell, BackBtn, LiquidBar } from '../components/UI'

const TOOLS = [
  { label:'FinDNA Analyzer', desc:'AI loan eligibility score', route:'/eligibility', color:'#22d3ee' },
  { label:'EMI Calculator', desc:'Monthly payment breakdown', route:'/emi', color:'#818cf8' },
  { label:'Loan Feasibility', desc:'Approval probability engine', route:'/policy', color:'#22c55e' },
  { label:'Bank Comparison', desc:'10 banks side by side', route:'/compare', color:'#eab308' },
  { label:'Loan Recommender', desc:'Best bank for your profile', route:'/recommend', color:'#34d399' },
  { label:'Financial Tools', desc:'Tax, SIP, Debt, Net Worth', route:'/tools', color:'#f472b6' },
  { label:'Goal Planner', desc:'Reverse-calculate savings', route:'/goals', color:'#fb923c' },
  { label:'Credit Booster', desc:'CIBIL score roadmap', route:'/credit', color:'#a78bfa' },
  { label:'Report Card', desc:'Shareable FinDNA PNG', route:'/report-card', color:'#60a5fa' },
  { label:'History', desc:'All saved reports', route:'/history', color:'#94a3b8' },
]

function StatCard({ val, label, color, icon }) {
  return (
    <div className="glass rounded-2xl p-5 text-center" style={{ border:`1px solid ${color}18` }}>
      <div style={{ width:36, height:36, borderRadius:10, background:`${color}12`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', color }}>
        {icon}
      </div>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.8rem', color, lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:5 }}>{label}</div>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { userProfile, setUserProfile } = useStore()
  const [profileForm, setProfileForm] = useState(userProfile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ loans:0, emis:0, eligibility:0, goals:0 })
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifyMsg, setVerifyMsg] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate('/login'); return }
      setUser(u)
      try {
        const [r, e, m, g] = await Promise.all([
          getDocs(collection(db, 'reports')),
          getDocs(collection(db, 'eligibilityReports')),
          getDocs(collection(db, 'emiReports')),
          getDocs(collection(db, 'goals')),
        ])
        const filterMine = (snap) => snap.docs.filter(d => d.data().userEmail === u.email)
        const loans = filterMine(r), elis = filterMine(e), emis = filterMine(m), goals = filterMine(g)
        setStats({ loans:loans.length, emis:emis.length, eligibility:elis.length, goals:goals.length })

        // Recent activity
        const recent = [
          ...loans.map(d => ({ type:'Loan Report', data:d.data(), id:d.id, route:'/history' })),
          ...elis.map(d => ({ type:'FinDNA Analysis', data:d.data(), id:d.id, route:'/history' })),
          ...emis.map(d => ({ type:'EMI Plan', data:d.data(), id:d.id, route:'/history' })),
        ].sort((a,b) => (b.data.createdAt?.seconds||0) - (a.data.createdAt?.seconds||0)).slice(0,5)
        setRecentReports(recent)
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

  const sendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser)
      setVerifyMsg('Verification email sent! Check your inbox.')
      setTimeout(() => setVerifyMsg(''), 4000)
    } catch { setVerifyMsg('Could not send email. Try again.') }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-void)' }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor:'rgba(34,211,238,0.3)', borderTopColor:'var(--cyan)' }} />
    </div>
  )

  const initials = user?.email?.slice(0,2).toUpperCase() || 'FS'
  const username = user?.displayName || user?.email?.split('@')[0] || 'FinSure User'
  const joined = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : '—'
  const totalReports = stats.loans + stats.emis + stats.eligibility

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-10 pt-24 pb-16">
        <div className="mb-8"><BackBtn /></div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-6">

          {/* Profile hero */}
          <div className="glass rounded-3xl overflow-hidden"
            style={{ background:'linear-gradient(135deg,rgba(34,211,238,0.05),rgba(8,24,40,0.97))', border:'1px solid rgba(34,211,238,0.15)' }}>
            {/* Header bar */}
            <div style={{ height:6, background:'linear-gradient(90deg,var(--cyan),#818cf8,#f472b6)' }} />
            <div className="p-7 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div style={{ width:80, height:80, borderRadius:20, background:'linear-gradient(135deg,var(--cyan),#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:28, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, color:'#020a12', boxShadow:'0 0 30px rgba(34,211,238,0.3)' }}>
                {initials}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'var(--text-primary)', marginBottom:4 }}>
                  {username}
                </div>
                <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:8 }}>{user?.email}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', color:'var(--cyan)' }}>
                    Member since {joined}
                  </span>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background: user?.emailVerified ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${user?.emailVerified ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, color: user?.emailVerified ? '#22c55e' : '#f87171', display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background: user?.emailVerified ? '#22c55e' : '#f87171' }} />
                    {user?.emailVerified ? 'Email Verified' : 'Email Unverified'}
                  </span>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(34,211,238,0.05)', border:'1px solid rgba(34,211,238,0.1)', color:'var(--text-muted)' }}>
                    {totalReports} report{totalReports !== 1 ? 's' : ''} saved
                  </span>
                </div>
                {!user?.emailVerified && (
                  <div className="mt-3">
                    <button onClick={sendVerification} style={{ fontSize:12, color:'var(--cyan)', background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:8, padding:'5px 12px', cursor:'pointer' }}>
                      Send Verification Email
                    </button>
                    {verifyMsg && <span style={{ fontSize:12, color:'#22c55e', marginLeft:10 }}>{verifyMsg}</span>}
                  </div>
                )}
              </div>
              <button onClick={logout} className="btn-danger px-5 py-2.5 text-sm flex-shrink-0 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard val={stats.loans} label="Loan Reports" color="#22d3ee"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} />
            <StatCard val={stats.eligibility} label="FinDNA Analyses" color="#818cf8"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 6 8 10 12 12s4 6 0 10M12 2c4 4 4 8 0 10"/></svg>} />
            <StatCard val={stats.emis} label="EMI Plans" color="#22c55e"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 12v4M10 14h4"/></svg>} />
            <StatCard val={stats.goals} label="Goals Set" color="#eab308"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} />
          </div>

          {/* Recent activity + Tools side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Recent reports */}
            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-5">Recent Activity</div>
              {recentReports.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>
                  No reports yet. Start by analyzing your FinDNA.
                  <div className="mt-4">
                    <Link to="/eligibility"><button className="btn-primary px-5 py-2.5 text-sm">Analyze Now</button></Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((r,i) => (
                    <Link key={i} to={r.route} style={{ textDecoration:'none' }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{ background:'rgba(34,211,238,0.03)', border:'1px solid rgba(34,211,238,0.07)' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(34,211,238,0.07)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(34,211,238,0.03)'}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--cyan)', flexShrink:0 }} />
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:"'Space Grotesk',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.type}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                            {r.data.createdAt?.toDate?.()
                              ? new Date(r.data.createdAt.toDate()).toLocaleDateString('en-IN')
                              : 'Saved'}
                          </div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Account details */}
            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-5">Account Details</div>
              <div className="space-y-3">
                {[
                  { label:'Email', val:user?.email },
                  { label:'Account ID', val:user?.uid?.slice(0,16)+'...' },
                  { label:'Verified', val:user?.emailVerified ? 'Yes' : 'No — check inbox' },
                  { label:'Joined', val:joined },
                  { label:'Auth Method', val:'Email & Password' },
                  { label:'Session', val:'Auto-logout after 15 min' },
                  { label:'Data Storage', val:'Firebase Firestore' },
                  { label:'Encryption', val:'256-bit · Firebase' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between items-start text-sm border-b pb-2.5"
                    style={{ borderColor:'rgba(34,211,238,0.06)' }}>
                    <span style={{ color:'var(--text-muted)', flexShrink:0 }}>{d.label}</span>
                    <span style={{ color:'var(--text-secondary)', fontFamily:"'Space Grotesk',sans-serif", fontWeight:500, fontSize:12, textAlign:'right', wordBreak:'break-all', maxWidth:'60%' }}>{d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial profile form */}
          <div className="glass rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="label-mono mb-1">Financial Profile</div>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>Save once — all tools auto-fill with your details</p>
              </div>
              {profileSaved && (
                <span style={{ fontSize:12, color:'#22c55e', display:'flex', alignItems:'center', gap:5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  Saved
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key:'salary', label:'Monthly Salary', type:'number', prefix:'₹', placeholder:'60000' },
                { key:'creditScore', label:'CIBIL Score', type:'number', placeholder:'720', min:300, max:900 },
                { key:'age', label:'Age', type:'number', placeholder:'30', min:18, max:70 },
                { key:'existingEMI', label:'Existing Monthly EMI', type:'number', prefix:'₹', placeholder:'0' },
                { key:'desiredLoan', label:'Desired Loan Amount', type:'number', prefix:'₹', placeholder:'2500000' },
                { key:'city', label:'City', type:'text', placeholder:'Mumbai' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label-mono block mb-2" style={{ fontSize:'9px' }}>{f.label}</label>
                  <div style={{ position:'relative' }}>
                    {f.prefix && (
                      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:13 }}>₹</span>
                    )}
                    <input
                      type={f.type}
                      value={profileForm[f.key] || ''}
                      onChange={e => setProfileForm(prev => ({ ...prev, [f.key]: f.type==='number' ? Number(e.target.value) : e.target.value }))}
                      placeholder={f.placeholder}
                      min={f.min} max={f.max}
                      className="fin-input"
                      style={{ paddingLeft: f.prefix ? 28 : undefined }}
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="label-mono block mb-2" style={{ fontSize:'9px' }}>Employment Type</label>
                <select value={profileForm.employment} onChange={e => setProfileForm(prev => ({ ...prev, employment:e.target.value }))} className="fin-input fin-select">
                  <option>Salaried</option>
                  <option>Self Employed</option>
                  <option>Business Owner</option>
                </select>
              </div>
              <div>
                <label className="label-mono block mb-2" style={{ fontSize:'9px' }}>Preferred Loan Type</label>
                <select value={profileForm.loanType} onChange={e => setProfileForm(prev => ({ ...prev, loanType:e.target.value }))} className="fin-input fin-select">
                  <option>Home Loan</option>
                  <option>Personal Loan</option>
                  <option>Car Loan</option>
                  <option>Education Loan</option>
                </select>
              </div>
            </div>
            <button onClick={() => { setUserProfile(profileForm); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000) }}
              className="btn-primary px-8 py-3 text-sm mt-5 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Profile
            </button>
          </div>

          {/* Tools grid */}
          <div className="glass rounded-3xl p-6">
            <div className="label-mono mb-5">All Platform Tools</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {TOOLS.map(t => (
                <div key={t.route} onClick={() => navigate(t.route)}
                  className="rounded-2xl p-4 cursor-pointer transition-all"
                  style={{ background:`${t.color}08`, border:`1px solid ${t.color}18`, textAlign:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${t.color}14`;e.currentTarget.style.borderColor=`${t.color}40`}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${t.color}08`;e.currentTarget.style.borderColor=`${t.color}18`}}>
                  <div style={{ fontSize:11, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:t.color, marginBottom:4, lineHeight:1.2 }}>{t.label}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', lineHeight:1.3 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </PageShell>
  )
}
