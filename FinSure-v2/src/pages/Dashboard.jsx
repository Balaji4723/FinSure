import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, ScoreRing, LiquidBar, BackBtn, SectionHeader } from '../components/UI'
import { useStore } from '../store/useStore'
import { BADGE_DEFS, calcFinScore, getPersonalityType } from '../utils/badges'
import { collection, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase'

/* ── Risk quiz ── */
const QUIZ = [
  { q:'How would you react if your investments dropped 20%?', opts:['Sell immediately','Wait and watch','Buy more','Excited — opportunity!'] },
  { q:'What is your primary financial goal?', opts:['Safety of capital','Steady income','Long-term growth','Maximum returns'] },
  { q:'How long can you lock up your money?', opts:['Less than 1 year','1–3 years','3–7 years','7+ years'] },
  { q:'How much of your income goes to EMIs?', opts:['More than 50%','30–50%','15–30%','Less than 15%'] },
  { q:'How stable is your income source?', opts:['Very unstable','Somewhat stable','Mostly stable','Very stable — salaried'] },
]

function RiskQuiz({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])

  const answer = (idx) => {
    const next = [...answers, idx]
    setAnswers(next)
    if (step < QUIZ.length - 1) setStep(step + 1)
    else {
      const score = Math.round((next.reduce((s,a) => s+a, 0) / (QUIZ.length * 3)) * 100)
      onComplete(score)
    }
  }

  return (
    <div className="glass rounded-3xl p-8 md:p-10">
      <div className="label-mono mb-2">Risk Personality Quiz</div>
      <div className="text-xs mb-6" style={{ color:'var(--text-muted)' }}>Question {step+1} of {QUIZ.length}</div>
      <div className="h-1 rounded-full mb-8" style={{ background:'rgba(34,211,238,0.08)' }}>
        <motion.div animate={{ width:`${((step)/QUIZ.length)*100}%` }}
          className="h-1 rounded-full" style={{ background:'var(--cyan)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-6" style={{ color:'var(--text-primary)', fontFamily:"'Space Grotesk',sans-serif" }}>
        {QUIZ[step].q}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUIZ[step].opts.map((opt, i) => (
          <motion.button key={opt} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
            onClick={() => answer(i)}
            className="p-4 rounded-2xl text-sm text-left transition-all"
            style={{ background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.15)', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(34,211,238,0.1)';e.currentTarget.style.color='var(--text-primary)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(34,211,238,0.04)';e.currentTarget.style.color='var(--text-secondary)'}}>
            <span style={{ color:'var(--cyan)', marginRight:8, fontWeight:700 }}>{['A','B','C','D'][i]}.</span>{opt}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/* ── Leaderboard ── */
function Leaderboard({ userScore, userBadges }) {
  const mockBoard = [
    { rank:1, name:'User A***', score:2840, badges:12 },
    { rank:2, name:'User B***', score:2650, badges:10 },
    { rank:3, name:'User C***', score:2200, badges:9 },
    { rank:4, name:'You', score:userScore, badges:userBadges, isUser:true },
    { rank:5, name:'User D***', score:1800, badges:7 },
  ].sort((a,b) => b.score - a.score).map((u,i) => ({...u, rank:i+1}))

  return (
    <div className="glass rounded-3xl p-7">
      <div className="label-mono mb-5">FinScore Leaderboard</div>
      <div className="space-y-3">
        {mockBoard.map(u => (
          <div key={u.rank} className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all"
            style={{ background:u.isUser?'rgba(34,211,238,0.08)':'rgba(34,211,238,0.02)', border:u.isUser?'1px solid rgba(34,211,238,0.3)':'1px solid transparent' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background:u.rank<=3?['#eab308','#94a3b8','#f97316'][u.rank-1]:'rgba(34,211,238,0.1)', color:u.rank<=3?'#020a12':'var(--cyan)', fontFamily:"'Space Grotesk',sans-serif" }}>
              {u.rank<=3 ? ['1st','2nd','3rd'][u.rank-1] : u.rank}
            </div>
            <div className="flex-1"><div className="text-sm font-semibold" style={{ color:u.isUser?'var(--cyan)':'var(--text-primary)', fontFamily:"'Space Grotesk',sans-serif" }}>{u.name}</div></div>
            <div className="text-xs" style={{ color:'var(--text-muted)' }}>{u.badges} badges</div>
            <div className="font-bold" style={{ color:u.isUser?'var(--cyan)':'var(--text-secondary)', fontFamily:"'Space Grotesk',sans-serif" }}>{u.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { badges, streak, finScore, setFinScore, reportsCount, riskProfile, setRiskProfile, addBadge } = useStore()
  const [quizDone, setQuizDone] = useState(!!riskProfile)
  const [loading, setLoading] = useState(true)
  const [totalReports, setTotalReports] = useState(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return }
      try {
        const [r,e,m] = await Promise.all([
          getDocs(collection(db,'reports')), getDocs(collection(db,'eligibilityReports')), getDocs(collection(db,'emiReports'))
        ])
        const total = [r,e,m].reduce((s,snap) => s + snap.docs.filter(d=>d.data().userEmail===user.email).length, 0)
        setTotalReports(total)
        const score = calcFinScore({ reportsCount:total, badges, streak, finScore })
        setFinScore(score)
      } catch(err) { console.error(err) }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleQuizComplete = (score) => {
    setRiskProfile(score)
    setQuizDone(true)
    addBadge(BADGE_DEFS.find(b=>b.id==='risk_profiled'))
  }

  const personality = riskProfile ? getPersonalityType(riskProfile) : null
  const displayScore = calcFinScore({ reportsCount:totalReports, badges, streak, finScore })

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>
        <SectionHeader eyebrow="Your Journey" title="Financial Dashboard" subtitle="Track your progress, badges, risk profile and FinScore." />

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {[
            { label:'FinScore', val:displayScore.toLocaleString(), color:'var(--cyan)', big:true },
            { label:'Day Streak', val:streak, color:'#fb923c', icon:'STK' },
            { label:'Badges Earned', val:badges.length, color:'#eab308', icon:'BD' },
            { label:'Reports Saved', val:totalReports, color:'#818cf8', icon:'RPT' },
          ].map(m=>(
            <div key={m.label} className="glass holo-card rounded-2xl p-5 text-center">
              {m.icon && <div className="text-xs font-bold mb-1 px-2 py-0.5 rounded" style={{ fontFamily: "'Space Grotesk',sans-serif", color: m.color, background: `${m.color}15` }}>{m.icon}</div>}
              <div className="font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif", color:m.color, fontSize:m.big?'2.2rem':'1.8rem' }}>{m.val}</div>
              <div className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Risk profile / quiz */}
          <div className="lg:col-span-2">
            {!quizDone ? (
              <RiskQuiz onComplete={handleQuizComplete} />
            ) : (
              <div className="glass rounded-3xl p-8 h-full">
                <div className="label-mono mb-4">Risk Profile Result</div>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ScoreRing score={riskProfile} size={160} label="/ 100" />
                  <div>
                    <div className="text-2xl font-bold mb-2" style={{ color:personality?.color, fontFamily:"'Space Grotesk',sans-serif" }}>{personality?.type}</div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color:'var(--text-secondary)' }}>{personality?.desc}</p>
                    <LiquidBar value={riskProfile} max={100} color={personality?.color} label="Risk Tolerance" />
                    <button onClick={()=>setQuizDone(false)} className="btn-outline px-5 py-2 text-sm mt-4">Retake Quiz</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Streak tracker */}
          <div className="glass rounded-3xl p-7">
            <div className="label-mono mb-5">Activity Streak</div>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif", color:'#fb923c' }}>
                <svg width="14" height="16" viewBox="0 0 12 16" fill="#fb923c"><path d="M6 0C3 4 1 6 1 9a5 5 0 0010 0C11 6 9 4 6 0zm0 14a3 3 0 01-3-3c0-2 2-4 3-6 1 2 3 4 3 6a3 3 0 01-3 3z"/></svg> {streak}
              </div>
              <div className="text-sm mt-1" style={{ color:'var(--text-muted)' }}>day{streak !== 1 ? 's' : ''} in a row</div>
            </div>
            <LiquidBar value={Math.min(streak,30)} max={30} color="#fb923c" label="Toward 30-day milestone" />
            <div className="grid grid-cols-7 gap-1 mt-5">
              {Array.from({length:28},(_, i)=>(
                <div key={i} className="w-full aspect-square rounded-sm"
                  style={{ background:i<streak?'#fb923c':'rgba(251,146,60,0.1)' }}/>
              ))}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="glass rounded-3xl p-7 mb-6">
          <div className="label-mono mb-5">Achievement Badges ({badges.length}/{BADGE_DEFS.length})</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {BADGE_DEFS.map(def => {
              const earned = badges.find(b=>b.id===def.id)
              return (
                <motion.div key={def.id} whileHover={{ scale:1.05 }}
                  className="flex flex-col items-center text-center p-4 rounded-2xl transition-all"
                  style={{ background:earned?`${def.color}15`:'rgba(34,211,238,0.02)', border:`1px solid ${earned?def.color+'30':'rgba(34,211,238,0.06)'}`, opacity:earned?1:0.35 }}>
                  <div className="text-2xl mb-2" style={{ filter: "grayscale(0.2)" }}>{def.icon}</div>
                  <div className="text-xs font-semibold" style={{ color:earned?def.color:'var(--text-muted)', fontFamily:"'Space Grotesk',sans-serif" }}>{def.label}</div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <Leaderboard userScore={displayScore} userBadges={badges.length} />
      </div>
    </PageShell>
  )
}
