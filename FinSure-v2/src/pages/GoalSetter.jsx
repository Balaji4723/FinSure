import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, LiquidBar, SliderInput, BackBtn, SectionHeader, AnimNum } from '../components/UI'
import { useStore } from '../store/useStore'
import { BADGE_DEFS } from '../utils/badges'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'

const GOAL_TYPES = [
  { id: 'house', label: 'Buy a House', icon: 'HOM', defaultAmount: 5000000, defaultYears: 5 },
  { id: 'car', label: 'Buy a Car', icon: 'CAR', defaultAmount: 800000, defaultYears: 3 },
  { id: 'education', label: 'Higher Education', icon: 'EDU', defaultAmount: 1500000, defaultYears: 4 },
  { id: 'wedding', label: 'Wedding', icon: 'WED', defaultAmount: 1000000, defaultYears: 3 },
  { id: 'business', label: 'Start a Business', icon: 'BIZ', defaultAmount: 2000000, defaultYears: 4 },
  { id: 'retirement', label: 'Retirement Corpus', icon: 'RET', defaultAmount: 10000000, defaultYears: 25 },
  { id: 'travel', label: 'International Travel', icon: 'TRV', defaultAmount: 300000, defaultYears: 2 },
  { id: 'emergency', label: 'Emergency Fund', icon: 'EMG', defaultAmount: 500000, defaultYears: 2 },
]

function Milestone({ label, amount, month, total, color }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b" style={{ borderColor: 'rgba(34,211,238,0.06)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: `${color}20`, color, border: `1px solid ${color}40`, fontFamily: "'Space Grotesk',sans-serif" }}>
        M{month}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>{label}</div>
        <LiquidBar value={amount} max={total} color={color} height={4} showPct={false} />
      </div>
      <div className="text-sm font-bold flex-shrink-0" style={{ color, fontFamily: "'Space Grotesk',sans-serif" }}>
        ₹{amount.toLocaleString('en-IN')}
      </div>
    </div>
  )
}

export default function GoalSetter() {
  const { goal, setGoal, addBadge } = useStore()
  const [selectedType, setSelectedType] = useState(goal?.type || null)
  const [goalAmount, setGoalAmount] = useState(goal?.amount || 5000000)
  const [years, setYears] = useState(goal?.years || 5)
  const [currentSavings, setCurrentSavings] = useState(goal?.currentSavings || 0)
  const [expectedReturn, setExpectedReturn] = useState(8)
  const [customLabel, setCustomLabel] = useState('')
  const [result, setResult] = useState(null)

  const calculate = async () => {
    const months = years * 12
    const r = expectedReturn / 12 / 100
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + r, months)
    const remainingGoal = Math.max(goalAmount - futureValueOfCurrentSavings, 0)
    const monthlyNeeded = r > 0
      ? Math.round((remainingGoal * r) / (Math.pow(1 + r, months) - 1))
      : Math.round(remainingGoal / months)

    const totalInvested = monthlyNeeded * months + currentSavings
    const totalGains = goalAmount - totalInvested
    const isAchievable = monthlyNeeded < goalAmount * 0.5

    // Quarterly milestones
    const milestones = []
    let accumulated = currentSavings
    for (let q = 1; q <= Math.min(years * 4, 20); q++) {
      for (let m = 0; m < 3; m++) {
        accumulated = accumulated * (1 + r) + monthlyNeeded
      }
      if (q % Math.ceil(years * 4 / 5) === 0 || q === years * 4) {
        milestones.push({
          label: `${Math.floor(q * 3 / 12)} yr ${(q * 3) % 12 === 0 ? '' : (q * 3) % 12 + ' mo'}`.trim(),
          month: q * 3,
          amount: Math.min(Math.round(accumulated), goalAmount)
        })
      }
    }

    const goalData = {
      type: selectedType, label: customLabel || GOAL_TYPES.find(g => g.id === selectedType)?.label || 'Custom Goal',
      amount: goalAmount, years, currentSavings, expectedReturn, monthlyNeeded, createdAt: new Date().toISOString()
    }
    setGoal(goalData)
    addBadge(BADGE_DEFS.find(b => b.id === 'goal_setter'))

    try {
      await addDoc(collection(db, 'goals'), {
        userEmail: auth.currentUser?.email, ...goalData, createdAt: new Date()
      })
    } catch (e) { /* silent */ }

    setResult({ monthlyNeeded, totalInvested, totalGains, isAchievable, milestones, futureValueOfCurrentSavings: Math.round(futureValueOfCurrentSavings) })
  }

  const typeInfo = GOAL_TYPES.find(g => g.id === selectedType)

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="label-mono mb-3">Financial Goal Setter</div>
          <h1 className="display-xl mb-4">Plan Your <span className="shimmer-text">Financial Future</span></h1>
          <p className="max-w-2xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
            Set a goal, and we reverse-calculate exactly how much you need to save every month to reach it.
          </p>
        </motion.div>

        {/* Goal type selector */}
        <div className="glass rounded-3xl p-7 md:p-10 mb-6">
          <div className="label-mono mb-5">Choose Your Goal</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {GOAL_TYPES.map(g => (
              <motion.button key={g.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedType(g.id); setGoalAmount(g.defaultAmount); setYears(g.defaultYears) }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                style={{
                  background: selectedType === g.id ? 'rgba(34,211,238,0.12)' : 'rgba(34,211,238,0.04)',
                  border: selectedType === g.id ? '1px solid rgba(34,211,238,0.5)' : '1px solid rgba(34,211,238,0.1)',
                  cursor: 'pointer', boxShadow: selectedType === g.id ? '0 0 20px rgba(34,211,238,0.15)' : 'none'
                }}>
                <span className="text-xs font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{g.icon}</span>
                <span className="text-xs font-semibold text-center" style={{ color: selectedType === g.id ? 'var(--cyan)' : 'var(--text-secondary)', fontFamily: "'Space Grotesk',sans-serif" }}>{g.label}</span>
              </motion.button>
            ))}
          </div>

          {selectedType && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <label className="label-mono block mb-2">Custom Goal Name (optional)</label>
                <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                  placeholder={typeInfo?.label || 'My Goal'}
                  className="fin-input" style={{ maxWidth: 400 }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderInput label="Goal Amount" value={goalAmount} onChange={setGoalAmount}
                  min={100000} max={50000000} step={100000} prefix="₹" />
                <SliderInput label="Time to Achieve" value={years} onChange={setYears}
                  min={1} max={30} step={1} suffix=" Years" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderInput label="Current Savings" value={currentSavings} onChange={setCurrentSavings}
                  min={0} max={5000000} step={10000} prefix="₹" />
                <SliderInput label="Expected Return" value={expectedReturn} onChange={setExpectedReturn}
                  min={4} max={20} step={0.5} suffix="%" sublabel="p.a. on investments" />
              </div>
              <button onClick={calculate} className="btn-primary px-10 py-4 text-base">
                Calculate My Plan
              </button>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="space-y-6">

              {/* Hero monthly number */}
              <div className="glass rounded-3xl p-8 md:p-12 text-center scanline-wrap"
                style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(8,24,40,0.95))' }}>
                <div className="label-mono mb-3">Monthly Savings Required</div>
                <div className="display-xl mb-3" style={{ color: 'var(--cyan)' }}>
                  ₹<AnimNum value={result.monthlyNeeded} prefix="" />
                </div>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                  per month for {years} year{years !== 1 ? 's' : ''} to reach{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>₹{goalAmount.toLocaleString('en-IN')}</strong>
                </p>
                {!result.isAchievable && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                    Warning: Very aggressive savings target. Consider extending the timeline or reducing the goal.
                  </div>
                )}
              </div>

              {/* Breakdown cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { label: 'Monthly SIP', val: `₹${result.monthlyNeeded.toLocaleString('en-IN')}`, color: 'var(--cyan)' },
                  { label: 'From Current Savings', val: `₹${result.futureValueOfCurrentSavings.toLocaleString('en-IN')}`, color: '#818cf8' },
                  { label: 'Total Invested', val: `₹${result.totalInvested.toLocaleString('en-IN')}`, color: '#eab308' },
                  { label: 'Gains (Returns)', val: `₹${Math.max(0, Math.round(result.totalGains)).toLocaleString('en-IN')}`, color: '#22c55e' },
                ].map(m => (
                  <div key={m.label} className="glass rounded-2xl p-6 text-center">
                    <div className="label-mono mb-2" style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{m.label}</div>
                    <div className="text-xl font-bold" style={{ color: m.color, fontFamily: "'Space Grotesk',sans-serif" }}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Progress timeline */}
              <div className="glass rounded-3xl p-7 md:p-10">
                <div className="label-mono mb-6">Goal Progress Timeline</div>
                {result.milestones.map((m, i) => (
                  <Milestone key={i} label={m.label} amount={m.amount} month={m.month}
                    total={goalAmount} color={i < result.milestones.length * 0.33 ? '#818cf8' : i < result.milestones.length * 0.66 ? '#eab308' : '#22c55e'} />
                ))}
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,211,238,0.2)', border: '1px solid rgba(34,211,238,0.5)' }}>
                    <span style={{ fontSize: "12px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>{typeInfo?.icon || 'GOAL'}</span>
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif" }}>Goal Achieved!</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>₹{goalAmount.toLocaleString('en-IN')} in {years} year{years !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="ml-auto text-2xl font-bold" style={{ color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif" }}>
                    ₹{goalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Smart tips */}
              <div className="glass rounded-3xl p-7">
                <div className="label-mono mb-4">Smart Tips for Your Goal</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Increase SIP annually', desc: `Increase your monthly saving by 10% each year to reach your goal 1-2 years earlier.` },
                    { title: 'Invest lump sums', desc: `Any bonus or windfall invested immediately compounds significantly over ${years} years.` },
                    { title: 'Lock it in', desc: `Consider ELSS, PPF, or recurring deposits to prevent impulse withdrawals from your goal fund.` },
                  ].map(t => (
                    <div key={t.title} className="p-5 rounded-2xl" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{background:'rgba(34,211,238,0.1)',border:'1px solid rgba(34,211,238,0.2)'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5"><path d="M12 2v20M2 12h20"/></svg></div>
                      <div className="font-semibold mb-2 text-sm" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>{t.title}</div>
                      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t.desc}</div>
                    </div>
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
