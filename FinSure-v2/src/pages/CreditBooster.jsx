import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, LiquidBar, ScoreRing, BackBtn, SectionHeader, SliderInput } from '../components/UI'
import { useStore } from '../store/useStore'
import { BADGE_DEFS } from '../utils/badges'

const FACTORS = [
  { id: 'payment', label: 'Payment History', weight: 35, icon: 'PAY', desc: 'On-time payments are the single biggest factor.' },
  { id: 'utilization', label: 'Credit Utilization', weight: 30, icon: 'UTL', desc: 'How much of your credit limit you are using.' },
  { id: 'age', label: 'Credit Age', weight: 15, icon: 'AGE', desc: 'Average age of all your credit accounts.' },
  { id: 'mix', label: 'Credit Mix', weight: 10, icon: 'MIX', desc: 'Variety of credit types (loan, card, overdraft).' },
  { id: 'inquiries', label: 'New Inquiries', weight: 10, icon: 'INQ', desc: 'Hard pulls from recent loan/card applications.' },
]

function TimelineStep({ step, index, total }) {
  const colors = ['#ef4444', '#eab308', '#fb923c', '#22c55e', '#22d3ee']
  const color = colors[Math.min(index, colors.length - 1)]
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-5 relative">
      {/* Connector line */}
      {index < total - 1 && (
        <div className="absolute left-5 top-12 bottom-0 w-px" style={{ background: 'rgba(34,211,238,0.12)', zIndex: 0 }} />
      )}
      {/* Circle */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold z-10"
        style={{ background: `${color}20`, border: `2px solid ${color}60`, color, fontFamily: "'Space Grotesk',sans-serif" }}>
        {index + 1}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>{step.title}</div>
          <span className="text-xs px-2 py-0.5 rounded-lg font-semibold"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>{step.month}</span>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{step.action}</p>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold" style={{ color }}>+{step.gain} pts</div>
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(34,211,238,0.08)' }}>
            <motion.div className="h-1 rounded-full" initial={{ width: 0 }}
              animate={{ width: `${(step.gain / 50) * 100}%` }}
              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
              style={{ background: color }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function CreditBooster() {
  const { addBadge, userProfile } = useStore()
  const [currentScore, setCurrentScore] = useState(650)
  const [targetScore, setTargetScore] = useState(780)
  const [paymentHistory, setPaymentHistory] = useState('good') // good / fair / poor
  const [utilization, setUtilization] = useState(40)
  const [creditAge, setCreditAge] = useState(2)
  const [recentInquiries, setRecentInquiries] = useState(2)
  const [hasMix, setHasMix] = useState(false)
  const [result, setResult] = useState(null)

  const generate = () => {
    const gap = targetScore - currentScore
    const steps = []

    // Payment history actions
    if (paymentHistory === 'poor') {
      steps.push({ title: 'Clear all overdue payments', month: 'Month 1–2', action: 'Immediately pay all outstanding dues and set up auto-pay for every account. Even one missed payment can drag score down for 2 years.', gain: 30, priority: 1 })
    } else if (paymentHistory === 'fair') {
      steps.push({ title: 'Achieve 6-month clean payment record', month: 'Month 1–6', action: 'Set auto-debit mandates on all EMIs and credit cards. Zero missed payments for 6 months will show significant improvement.', gain: 20, priority: 1 })
    }

    // Utilization
    if (utilization > 30) {
      steps.push({ title: `Reduce credit utilization from ${utilization}% to below 30%`, month: 'Month 1–3', action: `Pay down credit card balances so total usage stays under 30% of limit. At ${utilization}% you are losing significant points. Paying ₹${Math.round((utilization - 30) / 100 * 50000).toLocaleString('en-IN')} off a ₹50,000 limit card would fix this.`, gain: 25, priority: 2 })
    }
    if (utilization > 50) {
      steps.push({ title: 'Request credit limit increase', month: 'Month 2', action: 'Call your bank and request a credit limit increase without using the extra credit. This reduces utilization ratio instantly without paying down debt.', gain: 10, priority: 2 })
    }

    // New inquiries
    if (recentInquiries > 2) {
      steps.push({ title: 'Freeze new credit applications for 6 months', month: 'Month 1–6', action: `You have ${recentInquiries} recent hard inquiries. Each one drops score by 5–10 pts. Avoid applying for any new loan or card. Inquiries age out after 12 months.`, gain: 15, priority: 3 })
    }

    // Credit mix
    if (!hasMix) {
      steps.push({ title: 'Add a secured credit card', month: 'Month 3', action: 'If you only have loans (no credit card) or only a card (no loan), adding a secured card or small personal loan diversifies your credit mix — a 10% weightage factor.', gain: 12, priority: 4 })
    }

    // Credit age
    if (creditAge < 3) {
      steps.push({ title: 'Keep oldest accounts open', month: 'Ongoing', action: `Your average credit age is ${creditAge} year${creditAge !== 1 ? 's' : ''}. Never close your oldest credit card even if unused — it anchors your credit age. Use it once a month for a small purchase.`, gain: 10, priority: 5 })
    }

    // Long term
    steps.push({ title: 'Dispute inaccuracies on CIBIL report', month: 'Month 1', action: 'Download your free CIBIL report at cibil.com. Check for wrong account details, duplicate entries, or settled accounts still showing as active. Dispute them — it takes 30 days and can add 20–40 pts.', gain: 20, priority: 1 })
    steps.push({ title: 'Maintain 12-month perfect record', month: 'Month 6–12', action: 'With consistent payments and low utilization, CIBIL score compounds. A 12-month clean record with under 30% utilization typically pushes most profiles above 750.', gain: 35, priority: 6 })

    steps.sort((a, b) => a.priority - b.priority)

    const projectedGain = steps.reduce((s, st) => s + st.gain, 0)
    const projectedScore = Math.min(currentScore + projectedGain, 900)
    const monthsNeeded = paymentHistory === 'poor' ? 18 : paymentHistory === 'fair' ? 12 : 9

    addBadge(BADGE_DEFS.find(b => b.id === 'credit_booster'))
    setResult({ steps, projectedScore, projectedGain, monthsNeeded })
  }

  const scoreColor = currentScore >= 750 ? '#22c55e' : currentScore >= 650 ? '#eab308' : '#ef4444'
  const targetColor = targetScore >= 750 ? '#22c55e' : targetScore >= 650 ? '#eab308' : '#ef4444'
  const scoreLabel = currentScore >= 750 ? 'Excellent' : currentScore >= 700 ? 'Good' : currentScore >= 650 ? 'Fair' : 'Poor'

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="label-mono mb-3">Credit Booster</div>
          <h1 className="display-xl mb-4">
            <span className="shimmer-text">Credit Score</span> Roadmap
          </h1>
          <p className="max-w-2xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
            Tell us your current credit situation. We generate a personalised month-by-month action plan to reach your target score.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Input */}
          <div className="lg:col-span-3 glass rounded-3xl p-7 md:p-10">
            <div className="label-mono mb-7">Your Credit Profile</div>
            <div className="space-y-7">
              <SliderInput label="Current CIBIL Score" value={currentScore} onChange={setCurrentScore} min={300} max={900} step={10} />
              <SliderInput label="Target Score" value={targetScore} onChange={setTargetScore} min={Math.min(currentScore + 50, 900)} max={900} step={10} />
              <SliderInput label="Credit Card Utilization" value={utilization} onChange={setUtilization} min={0} max={100} step={1} suffix="%" sublabel="of limit used" />
              <SliderInput label="Average Credit Age" value={creditAge} onChange={setCreditAge} min={0} max={20} step={1} suffix=" yrs" />
              <SliderInput label="Recent Hard Inquiries (12 months)" value={recentInquiries} onChange={setRecentInquiries} min={0} max={10} step={1} />

              <div>
                <label className="label-mono block mb-3">Payment History</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'good', label: 'Good', desc: 'No missed payments', color: '#22c55e' },
                    { val: 'fair', label: 'Fair', desc: '1–2 missed in 2 yrs', color: '#eab308' },
                    { val: 'poor', label: 'Poor', desc: 'Multiple missed / defaults', color: '#ef4444' },
                  ].map(o => (
                    <button key={o.val} onClick={() => setPaymentHistory(o.val)}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        background: paymentHistory === o.val ? `${o.color}15` : 'rgba(34,211,238,0.03)',
                        border: paymentHistory === o.val ? `1px solid ${o.color}50` : '1px solid rgba(34,211,238,0.1)',
                        cursor: 'pointer'
                      }}>
                      <div className="font-bold text-sm mb-0.5" style={{ color: paymentHistory === o.val ? o.color : 'var(--text-secondary)', fontFamily: "'Space Grotesk',sans-serif" }}>{o.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-4 px-5 rounded-2xl"
                style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>Have credit mix?</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Both a loan AND a credit card</div>
                </div>
                <button onClick={() => setHasMix(!hasMix)}
                  className="w-12 h-6 rounded-full transition-all flex items-center"
                  style={{ background: hasMix ? 'var(--cyan)' : 'rgba(34,211,238,0.15)', border: 'none', cursor: 'pointer', padding: '2px' }}>
                  <motion.div animate={{ x: hasMix ? 24 : 0 }} transition={{ duration: 0.2 }}
                    className="w-5 h-5 rounded-full" style={{ background: hasMix ? '#020a12' : 'rgba(34,211,238,0.5)' }} />
                </button>
              </div>
            </div>

            <button onClick={generate} className="btn-primary w-full py-4 text-base mt-8">
              Generate My Roadmap
            </button>
          </div>

          {/* Score preview */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass rounded-3xl p-7 flex flex-col items-center text-center">
              <div className="label-mono mb-5">Score Gap Analysis</div>
              <div className="flex items-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Current</div>
                  <ScoreRing score={Math.round((currentScore - 300) / 6)} size={120}
                    label={`${currentScore}`} />
                  <div className="mt-2 font-bold text-sm" style={{ color: scoreColor }}>{scoreLabel}</div>
                </div>
                <div className="text-2xl" style={{ color: 'var(--text-muted)' }}>→</div>
                <div className="text-center">
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Target</div>
                  <ScoreRing score={Math.round((targetScore - 300) / 6)} size={120}
                    label={`${targetScore}`} />
                  <div className="mt-2 font-bold text-sm" style={{ color: targetColor }}>
                    {targetScore >= 750 ? 'Excellent' : targetScore >= 700 ? 'Good' : 'Fair'}
                  </div>
                </div>
              </div>
              <div className="w-full p-4 rounded-2xl text-center"
                style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <div className="text-3xl font-bold" style={{ color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif" }}>
                  +{targetScore - currentScore} pts
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Gap to close</div>
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="glass rounded-3xl p-7">
              <div className="label-mono mb-5">CIBIL Score Factors</div>
              <div className="space-y-4">
                {FACTORS.map(f => (
                  <div key={f.id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                      <span style={{ color: 'var(--cyan)', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{f.weight}%</span>
                    </div>
                    <LiquidBar value={f.weight} max={35} color={f.weight >= 30 ? '#22d3ee' : f.weight >= 15 ? '#818cf8' : '#f472b6'} height={5} showPct={false} />
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="space-y-6">

              {/* Summary */}
              <div className="glass rounded-3xl p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
                style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.05),rgba(8,24,40,0.95))' }}>
                <div className="md:col-span-2">
                  <div className="label-mono mb-2">Your Personalised Roadmap</div>
                  <h2 className="display-md mb-3" style={{ color: 'var(--text-primary)' }}>
                    Reach <span style={{ color: '#22c55e' }}>{result.projectedScore}</span> in ~{result.monthsNeeded} months
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Following all {result.steps.length} steps below can add approximately{' '}
                    <strong style={{ color: 'var(--cyan)' }}>+{result.projectedGain} points</strong> to your CIBIL score.
                    Results vary based on individual credit history.
                  </p>
                </div>
                <div className="flex justify-center">
                  <ScoreRing score={Math.round((result.projectedScore - 300) / 6)} size={160}
                    label={`${result.projectedScore} projected`} />
                </div>
              </div>

              {/* Timeline steps */}
              <div className="glass rounded-3xl p-7 md:p-10">
                <div className="label-mono mb-8">Action Roadmap — Month by Month</div>
                <div className="space-y-2">
                  {result.steps.map((step, i) => (
                    <TimelineStep key={i} step={step} index={i} total={result.steps.length} />
                  ))}
                </div>
              </div>

              {/* What to avoid */}
              <div className="glass rounded-3xl p-7">
                <div className="label-mono mb-5" style={{ color: '#f87171' }}>What NOT to do</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: 'X', title: 'Close old credit cards', desc: 'Closing accounts reduces credit age and available limit — both hurt score.' },
                    { icon: 'X', title: 'Apply for multiple loans at once', desc: 'Each application is a hard inquiry. Multiple in short period signals financial distress.' },
                    { icon: 'X', title: 'Settle loans instead of paying in full', desc: '"Settled" status on CIBIL is worse than "Closed". Always pay the full outstanding amount.' },
                    { icon: 'X', title: 'Ignore CIBIL report errors', desc: 'Up to 30% of reports have errors. Unchecked errors silently pull your score down.' },
                  ].map(w => (
                    <div key={w.title} className="flex gap-3 p-4 rounded-2xl"
                      style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{w.icon}</span>
                      <div>
                        <div className="font-semibold text-sm mb-1" style={{ color: '#f87171', fontFamily: "'Space Grotesk',sans-serif" }}>{w.title}</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{w.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free resources */}
              <div className="glass rounded-3xl p-7">
                <div className="label-mono mb-5">Free Credit Resources</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'CIBIL Official', url: 'https://www.cibil.com', desc: 'Free annual credit report from the official CIBIL website.', tag: 'Free Annual Report' },
                    { name: 'Experian India', url: 'https://www.experian.in', desc: 'Another bureau — check for discrepancies across bureaus.', tag: 'Free Report' },
                    { name: 'RBI Grievance', url: 'https://cms.rbi.org.in', desc: 'If bank refuses to update CIBIL after repayment, file complaint here.', tag: 'Dispute Portal' },
                  ].map(r => (
                    <a key={r.name} href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <div className="p-5 rounded-2xl transition-all h-full"
                        style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.35)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.1)'}>
                        <div className="font-bold text-sm mb-1" style={{ color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif" }}>{r.name}</div>
                        <div className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.desc}</div>
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}>{r.tag}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
