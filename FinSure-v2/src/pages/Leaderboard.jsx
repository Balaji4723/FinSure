import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, LiquidBar, BackBtn, SectionHeader, Spinner } from '../components/UI'
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useStore } from '../store/useStore'
import { calcFinScore } from '../utils/badges'

const MEDALS = ['1st', '2nd', '3rd']
const TIER_COLORS = { Diamond: '#22d3ee', Platinum: '#a5b4fc', Gold: '#eab308', Silver: '#94a3b8', Bronze: '#f97316' }

function getTier(score) {
  if (score >= 5000) return 'Diamond'
  if (score >= 3000) return 'Platinum'
  if (score >= 1500) return 'Gold'
  if (score >= 500) return 'Silver'
  return 'Bronze'
}

function anonymise(email) {
  if (!email) return 'Anonymous'
  const [user] = email.split('@')
  if (user.length <= 3) return user[0] + '***'
  return user.slice(0, 2) + '***' + user.slice(-1)
}

export default function Leaderboard() {
  const { badges, streak, reportsCount } = useStore()
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)
  const [userEntry, setUserEntry] = useState(null)
  const [userRank, setUserRank] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all') // all | weekly | monthly

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return }

      try {
        // Fetch all leaderboard entries
        const snap = await getDocs(collection(db, 'leaderboard'))
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 50)

        setBoard(entries)

        // Check if user already submitted
        const userDoc = await getDoc(doc(db, 'leaderboard', user.uid))
        if (userDoc.exists()) {
          setSubmitted(true)
          const rank = entries.findIndex(e => e.id === user.uid) + 1
          setUserRank(rank)
          setUserEntry(userDoc.data())
        }
      } catch (err) { console.error(err) }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const submitScore = async () => {
    const user = auth.currentUser
    if (!user) return
    setSubmitting(true)

    try {
      // Calculate real score
      const rSnap = await getDocs(collection(db, 'reports'))
      const eSnap = await getDocs(collection(db, 'eligibilityReports'))
      const mSnap = await getDocs(collection(db, 'emiReports'))
      const total = [rSnap, eSnap, mSnap].reduce((s, snap) =>
        s + snap.docs.filter(d => d.data().userEmail === user.email).length, 0)

      const score = calcFinScore({ reportsCount: total, badges, streak, finScore: 0 })
      const entry = {
        name: anonymise(user.email),
        email: user.email,
        score,
        badges: badges.length,
        streak,
        reports: total,
        tier: getTier(score),
        submittedAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'leaderboard', user.uid), entry)

      // Refresh board
      const snap = await getDocs(collection(db, 'leaderboard'))
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.score - a.score).slice(0, 50)
      setBoard(entries)
      const rank = entries.findIndex(e => e.id === user.uid) + 1
      setUserRank(rank)
      setUserEntry(entry)
      setSubmitted(true)
    } catch (err) { console.error(err) }
    setSubmitting(false)
  }

  const maxScore = board.length ? board[0].score : 1

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-4xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>
        <SectionHeader eyebrow="Community" title="FinScore Leaderboard"
          subtitle="Anonymous global ranking of FinSure users by their financial activity score." />

        {/* User's own entry */}
        {userEntry && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 mb-8"
            style={{ border: '1px solid rgba(34,211,238,0.4)', background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(8,24,40,0.95))' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="label-mono mb-1">Your Position</div>
                <div className="display-md" style={{ color: 'var(--text-primary)' }}>
                  Rank #{userRank}
                  <span className="ml-3 text-base font-normal" style={{ color: 'var(--text-muted)' }}>
                    out of {board.length} users
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="font-bold text-sm" style={{ color: '#eab308', fontFamily: "'Space Grotesk',sans-serif" }}>{entry.rank <= 3 ? ['1st','2nd','3rd'][entry.rank-1] : `#${entry.rank}`}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>FinScore</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm" style={{ color: '#eab308', fontFamily: "'Space Grotesk',sans-serif" }}>{entry.rank <= 3 ? ['1st','2nd','3rd'][entry.rank-1] : `#${entry.rank}`}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Tier</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm" style={{ color: '#eab308', fontFamily: "'Space Grotesk',sans-serif" }}>{entry.rank <= 3 ? ['1st','2nd','3rd'][entry.rank-1] : `#${entry.rank}`}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Badges</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <LiquidBar value={userEntry.score} max={maxScore} color="var(--cyan)" label="Score vs #1" />
            </div>
          </motion.div>
        )}

        {/* Submit CTA */}
        {!submitted && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-7 mb-8 flex flex-col md:flex-row items-center justify-between gap-5"
            style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
            <div>
              <div className="font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>
                Join the Leaderboard
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Submit your anonymous FinScore to see where you rank globally. Only your score, badges and streak are shared — never personal data.
              </p>
            </div>
            <button onClick={submitScore} disabled={submitting}
              className="btn-primary px-8 py-3 text-sm flex items-center gap-3 flex-shrink-0">
              {submitting ? <><Spinner />Calculating...</> : 'Submit My Score'}
            </button>
          </motion.div>
        )}

        {/* How score is calculated */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="label-mono mb-3">How FinScore is Calculated</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Reports Saved', pts: '10 pts each', color: 'var(--cyan)' },
              { label: 'Badges Earned', pts: '25 pts each', color: '#eab308' },
              { label: 'Daily Streak', pts: '5 pts/day', color: '#fb923c' },
            ].map(f => (
              <div key={f.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                <div className="font-bold" style={{ color: f.color, fontFamily: "'Space Grotesk',sans-serif" }}>{f.pts}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard table */}
        {loading ? (
          <div className="glass rounded-3xl p-12 text-center">
            <Spinner />
            <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading leaderboard...</p>
          </div>
        ) : board.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.2)'}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="1.5"><path d="M12 15l-3 6h6l-3-6zM5 3h14l-3 9H8L5 3z"/><path d="M8 3C8 8 5 10 5 10h14s-3-2-3-7"/></svg></div>
            <div className="font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>Be the first on the leaderboard!</div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Submit your score above to claim the #1 spot.</p>
          </div>
        ) : (
          <div className="glass rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b grid grid-cols-12 gap-4"
              style={{ borderColor: 'rgba(34,211,238,0.1)', background: 'rgba(34,211,238,0.03)' }}>
              {['Rank', 'User', 'Tier', 'Reports', 'Badges', 'Streak', 'FinScore'].map(h => (
                <div key={h} className="label-mono col-span-2 first:col-span-1" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{h}</div>
              ))}
            </div>

            {board.map((entry, i) => {
              const isUser = entry.email === auth.currentUser?.email
              const tier = getTier(entry.score)
              const tierColor = TIER_COLORS[tier]
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-6 py-4 border-b grid grid-cols-12 gap-4 items-center transition-all"
                  style={{
                    borderColor: 'rgba(34,211,238,0.05)',
                    background: isUser ? 'rgba(34,211,238,0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => !isUser && (e.currentTarget.style.background = 'rgba(34,211,238,0.02)')}
                  onMouseLeave={e => !isUser && (e.currentTarget.style.background = 'transparent')}>

                  {/* Rank */}
                  <div className="col-span-1 font-bold text-center"
                    style={{ fontFamily: "'Space Grotesk',sans-serif", color: i < 3 ? '#eab308' : 'var(--text-muted)', fontSize: i < 3 ? '18px' : '14px' }}>
                    {i < 3 ? MEDALS[i] : `#${i + 1}`}
                  </div>

                  {/* Name */}
                  <div className="col-span-2">
                    <div className="font-semibold text-sm" style={{ color: isUser ? 'var(--cyan)' : 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>
                      {entry.name}{isUser && ' (You)'}
                    </div>
                    <div className="mt-1">
                      <LiquidBar value={entry.score} max={maxScore} color={isUser ? 'var(--cyan)' : tierColor} height={3} showPct={false} />
                    </div>
                  </div>

                  {/* Tier */}
                  <div className="col-span-2">
                    <span className="text-xs px-2 py-1 rounded-lg font-bold"
                      style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}>
                      {tier}
                    </span>
                  </div>

                  {/* Reports */}
                  <div className="col-span-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: "'Space Grotesk',sans-serif" }}>
                    {entry.reports || 0}
                  </div>

                  {/* Badges */}
                  <div className="col-span-2 text-sm font-semibold" style={{ color: '#eab308', fontFamily: "'Space Grotesk',sans-serif" }}>
                    {entry.badges || 0} bdg
                  </div>

                  {/* Streak */}
                  <div className="col-span-1 text-sm" style={{ color: '#fb923c', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>
                    {entry.streak || 0}
                  </div>

                  {/* Score */}
                  <div className="col-span-2 font-bold text-sm" style={{ color: isUser ? 'var(--cyan)' : tierColor, fontFamily: "'Space Grotesk',sans-serif" }}>
                    {entry.score.toLocaleString()}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Tier guide */}
        <div className="glass rounded-3xl p-6 mt-6">
          <div className="label-mono mb-4">Tier Guide</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { tier: 'Bronze', range: '0–499', icon: 'BR' },
              { tier: 'Silver', range: '500–1,499', icon: 'SL' },
              { tier: 'Gold', range: '1,500–2,999', icon: 'GD' },
              { tier: 'Platinum', range: '3,000–4,999', icon: 'PT' },
              { tier: 'Diamond', range: '5,000+', icon: 'DM' },
            ].map(t => (
              <div key={t.tier} className="text-center p-3 rounded-xl"
                style={{ background: `${TIER_COLORS[t.tier]}10`, border: `1px solid ${TIER_COLORS[t.tier]}25` }}>
                <div className="text-sm font-bold mb-1" style={{ fontFamily: "'Space Grotesk',sans-serif", color: TIER_COLORS[t.tier] }}>{t.icon}</div>
                <div className="font-bold text-sm" style={{ color: TIER_COLORS[t.tier], fontFamily: "'Space Grotesk',sans-serif" }}>{t.tier}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.range}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
