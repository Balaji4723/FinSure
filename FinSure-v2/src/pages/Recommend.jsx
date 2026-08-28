import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, ScoreRing, LiquidBar, SliderInput, BackBtn, SectionHeader, AnimNum } from '../components/UI'
import { BANK_DATA, LOAN_TYPE_KEY } from '../data/bankRates'
import { useStore } from '../store/useStore'
import { BADGE_DEFS } from '../utils/badges'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'

function calcEMI(p, r, m) {
  const mr = r / 12 / 100
  if (mr === 0) return p / m
  return (p * mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1)
}

function ScoreBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(34,211,238,0.08)' }}>
        <motion.div className="h-1.5 rounded-full"
          initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: [.4, 0, .2, 1] }}
          style={{ background: color }} />
      </div>
    </div>
  )
}

export default function Recommend() {
  const { addBadge, userProfile } = useStore()
  const [salary, setSalary] = useState(userProfile?.salary || 60000)
  const [creditScore, setCreditScore] = useState(userProfile?.creditScore || 720)
  const [age, setAge] = useState(userProfile?.age || 30)
  const [existingEMI, setExistingEMI] = useState(userProfile?.existingEMI || 0)
  const [loanType, setLoanType] = useState(userProfile?.loanType || 'Home Loan')
  const [desiredAmount, setDesiredAmount] = useState(userProfile?.desiredLoan || 2500000)
  const [employment, setEmployment] = useState(userProfile?.employment || 'Salaried')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    setLoading(true)
    const key = LOAN_TYPE_KEY[loanType]

    // Score each bank against user profile
    const scored = BANK_DATA.map(bank => {
      let score = 0
      const rate = bank[key].min
      const months = loanType === 'Home Loan' ? 240 : loanType === 'Education Loan' ? 120 : loanType === 'Car Loan' ? 60 : 36
      const emi = Math.round(calcEMI(desiredAmount, rate, months))
      const emiRatio = Math.round(((emi + existingEMI) / salary) * 100)
      const totalInterest = emi * months - desiredAmount
      const totalCost = emi * months

      // Credit score eligibility
      if (creditScore < bank.minCreditScore) return null

      // EMI affordability — must be under 60%
      if (emiRatio > 60) return null

      // Score: lower rate = higher score
      score += Math.max(0, 30 - (rate - 8) * 5)
      // Credit score match
      if (creditScore >= 800) score += 25
      else if (creditScore >= 750) score += 20
      else if (creditScore >= 700) score += 15
      else score += 8
      // EMI comfort
      if (emiRatio <= 30) score += 20
      else if (emiRatio <= 40) score += 14
      else if (emiRatio <= 50) score += 8
      // Employment bonus
      if (employment === 'Salaried') score += 10
      else if (employment === 'Business Owner') score += 7
      else score += 5
      // Age bonus
      if (age >= 25 && age <= 45) score += 8
      else if (age > 45 && age <= 55) score += 5
      else score += 2
      // Bank rating
      score += bank.rating * 2
      // Tenure bonus
      if (bank.maxTenure >= (months / 12)) score += 5

      const approvalChance = Math.min(Math.round(score * 1.2), 98)
      return { ...bank, score: Math.round(score), rate, emi, emiRatio, totalInterest, totalCost, months, approvalChance }
    }).filter(Boolean).sort((a, b) => b.score - a.score)

    // Overall eligibility score
    let eligScore = 0
    const sal = salary
    if (sal >= 100000) eligScore += 30; else if (sal >= 70000) eligScore += 24; else if (sal >= 50000) eligScore += 18; else if (sal >= 30000) eligScore += 12; else eligScore += 6
    if (creditScore >= 800) eligScore += 30; else if (creditScore >= 750) eligScore += 25; else if (creditScore >= 700) eligScore += 20; else if (creditScore >= 650) eligScore += 15; else eligScore += 8
    const emiR = salary > 0 ? Math.round((existingEMI / salary) * 100) : 0
    if (emiR <= 20) eligScore += 25; else if (emiR <= 35) eligScore += 18; else if (emiR <= 50) eligScore += 10; else eligScore += 4
    if (age >= 25 && age <= 45) eligScore += 10; else if (age > 45 && age <= 55) eligScore += 7; else eligScore += 3
    if (employment === 'Salaried') eligScore += 5; else if (employment === 'Business Owner') eligScore += 4; else eligScore += 3
    eligScore = Math.min(eligScore, 100)

    const maxEligible = scored.length > 0
      ? Math.round((salary - existingEMI) * 0.5 * (loanType === 'Home Loan' ? 60 : loanType === 'Education Loan' ? 80 : 40))
      : 0
    const canAfford = desiredAmount <= maxEligible

    await new Promise(r => setTimeout(r, 800)) // UX delay for analysis feel

    try {
      await addDoc(collection(db, 'recommendations'), {
        userEmail: auth.currentUser?.email,
        salary, creditScore, age, existingEMI, loanType, desiredAmount, employment,
        eligScore, topBank: scored[0]?.bank || null, banksEligible: scored.length,
        createdAt: new Date()
      })
    } catch (e) { /* silent */ }

    addBadge(BADGE_DEFS.find(b => b.id === 'first_analysis'))
    if (eligScore >= 80) addBadge(BADGE_DEFS.find(b => b.id === 'premium_profile'))

    setResult({ scored, eligScore, maxEligible, canAfford, emiR })
    setLoading(false)
  }

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="label-mono mb-3">Smart Engine</div>
          <h1 className="display-xl mb-4">Loan <span className="shimmer-text">Recommendation Engine</span></h1>
          <p className="max-w-2xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
            Fill your profile. Our engine scores all 10 banks against your exact situation and ranks them — best match first.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 glass rounded-3xl p-7 md:p-10">
            <div className="label-mono mb-8">Your Financial Profile</div>
            <div className="space-y-7">
              <SliderInput label="Monthly Salary" value={salary} onChange={setSalary} min={15000} max={500000} step={5000} prefix="₹" />
              <SliderInput label="Credit Score (CIBIL)" value={creditScore} onChange={setCreditScore} min={300} max={900} step={10} />
              <SliderInput label="Age" value={age} onChange={setAge} min={21} max={65} step={1} suffix=" yrs" />
              <SliderInput label="Existing Monthly EMI" value={existingEMI} onChange={setExistingEMI} min={0} max={100000} step={1000} prefix="₹" />
              <SliderInput label="Desired Loan Amount" value={desiredAmount} onChange={setDesiredAmount} min={100000} max={10000000} step={100000} prefix="₹" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-mono block mb-2">Loan Type</label>
                  <select value={loanType} onChange={e => setLoanType(e.target.value)} className="fin-input fin-select">
                    {Object.keys(LOAN_TYPE_KEY).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-mono block mb-2">Employment</label>
                  <select value={employment} onChange={e => setEmployment(e.target.value)} className="fin-input fin-select">
                    <option>Salaried</option>
                    <option>Self Employed</option>
                    <option>Business Owner</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={analyze} disabled={loading}
              className="btn-primary w-full py-4 text-base mt-8 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Analyzing 10 banks...
                </>
              ) : 'Find My Best Match'}
            </button>
          </motion.div>

          {/* Live score preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 space-y-5">
            <div className="glass rounded-3xl p-7">
              <div className="label-mono mb-5">Live Profile Score</div>
              {(() => {
                let s = 0
                if (salary >= 100000) s += 30; else if (salary >= 70000) s += 24; else if (salary >= 50000) s += 18; else if (salary >= 30000) s += 12; else s += 6
                if (creditScore >= 800) s += 30; else if (creditScore >= 750) s += 25; else if (creditScore >= 700) s += 20; else if (creditScore >= 650) s += 15; else s += 8
                const emiR = salary > 0 ? Math.round((existingEMI / salary) * 100) : 0
                if (emiR <= 20) s += 25; else if (emiR <= 35) s += 18; else if (emiR <= 50) s += 10; else s += 4
                if (age >= 25 && age <= 45) s += 10; else if (age > 45 && age <= 55) s += 7; else s += 3
                if (employment === 'Salaried') s += 5; else s += 4
                s = Math.min(s, 100)
                const color = s >= 80 ? '#22c55e' : s >= 60 ? '#eab308' : '#ef4444'
                const label = s >= 80 ? 'Premium Profile' : s >= 60 ? 'Balanced Profile' : 'Needs Improvement'
                return (
                  <div className="flex flex-col items-center gap-4">
                    <ScoreRing score={s} size={150} />
                    <div className="font-bold" style={{ color, fontFamily: "'Space Grotesk',sans-serif" }}>{label}</div>
                    <div className="w-full space-y-3">
                      <ScoreBar label="Income" value={salary >= 100000 ? 30 : salary >= 50000 ? 18 : 8} max={30} color="var(--cyan)" />
                      <ScoreBar label="Credit Score" value={creditScore >= 800 ? 30 : creditScore >= 700 ? 20 : 12} max={30} color="#818cf8" />
                      <ScoreBar label="Debt Ratio" value={existingEMI === 0 ? 25 : salary > 0 && (existingEMI/salary) <= 0.2 ? 25 : 10} max={25} color="#22c55e" />
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-4">Credit Score Guide</div>
              {[
                { range: '750–900', label: 'Excellent', color: '#22c55e', banks: 'All 10 banks' },
                { range: '700–749', label: 'Good', color: '#eab308', banks: 'HDFC, ICICI, Axis, Kotak' },
                { range: '650–699', label: 'Fair', color: '#fb923c', banks: 'SBI, PNB, BOB, Canara' },
                { range: 'Below 650', label: 'Poor', color: '#ef4444', banks: 'NBFC only' },
              ].map(r => (
                <div key={r.range} className="flex items-center gap-3 py-2 border-b text-sm" style={{ borderColor: 'rgba(34,211,238,0.06)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span style={{ color: r.color, fontWeight: 600, width: 70 }}>{r.range}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{r.banks}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="mt-8 space-y-6">

              {/* Summary bar */}
              <div className="glass rounded-3xl p-7 flex flex-col md:flex-row items-center justify-between gap-6"
                style={{ background: result.eligScore >= 70 ? 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(8,24,40,0.9))' : 'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(8,24,40,0.9))' }}>
                <div>
                  <div className="label-mono mb-1">Analysis Complete</div>
                  <h2 className="display-md" style={{ color: 'var(--text-primary)' }}>
                    {result.scored.length} bank{result.scored.length !== 1 ? 's' : ''} matched your profile
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Max eligible: <strong style={{ color: 'var(--cyan)' }}>₹{result.maxEligible.toLocaleString('en-IN')}</strong>
                    {!result.canAfford && <span style={{ color: '#f87171' }}> — desired amount exceeds this</span>}
                  </p>
                </div>
                <ScoreRing score={result.eligScore} size={120} />
              </div>

              {/* Bank cards ranked */}
              {result.scored.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {result.scored.slice(0, 6).map((b, i) => (
                    <motion.div key={b.bank} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass holo-card rounded-3xl p-7 relative"
                      style={{ border: i === 0 ? '1px solid rgba(34,211,238,0.4)' : undefined, boxShadow: i === 0 ? '0 0 30px rgba(34,211,238,0.12)' : undefined }}>
                      {i === 0 && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: 'var(--cyan)', color: '#020a12' }}>Best Match</div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--text-primary)' }}>{b.bank}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.fullName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}>#{i + 1} Rank</div>
                        </div>
                      </div>

                      <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--cyan)' }}>
                        ₹{b.emi.toLocaleString('en-IN')}
                        <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mo</span>
                      </div>
                      <div className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>@ {b.rate}% p.a. · {b.months / 12} years</div>

                      <LiquidBar value={b.approvalChance} max={100} color={b.approvalChance >= 80 ? '#22c55e' : '#eab308'} label="Approval Chance" />

                      <div className="mt-5 space-y-2">
                        {[
                          ['Interest Rate', `${b.rate}%`],
                          ['EMI Burden', `${b.emiRatio}% of income`],
                          ['Total Interest', `₹${Math.round(b.totalInterest).toLocaleString('en-IN')}`],
                          ['Processing Fee', b.processingFee],
                          ['Min CIBIL', b.minCreditScore],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs border-b pb-1.5" style={{ borderColor: 'rgba(34,211,238,0.06)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                            <span style={{ color: 'var(--text-secondary)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 space-y-1">
                        {b.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color:'#22c55e',fontWeight:700 }}>+</span> {f}
                          </div>
                        ))}
                      </div>

                      {/* Match score bar */}
                      <div className="mt-5">
                        <LiquidBar value={b.score} max={100} color={i === 0 ? 'var(--cyan)' : '#818cf8'} label="Match Score" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-3xl p-12 text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{background:'rgba(34,211,238,0.08)',border:'1px solid rgba(34,211,238,0.2)'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>
                  <div className="display-sm mb-3" style={{ color: 'var(--text-primary)' }}>No banks matched your current profile</div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Try improving your credit score above {Math.min(...BANK_DATA.map(b => b.minCreditScore))}, reducing existing EMIs, or lowering the desired loan amount.
                  </p>
                </div>
              )}

              {/* Anomaly alerts */}
              {(result.emiR > 50 || creditScore < 650 || (result.maxEligible < desiredAmount)) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="glass rounded-3xl p-7" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
                  <div className="label-mono mb-4" style={{ color: '#f87171' }}>Anomaly Alerts</div>
                  <div className="space-y-3">
                    {result.emiR > 50 && (
                      <div className="flex items-start gap-3 text-sm">
                        <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:11px;font-weight:700;font-family:'Space Grotesk',sans-serif">!</div>
                        <div>
                          <div className="font-semibold mb-0.5" style={{ color: '#f87171' }}>High Debt Burden ({result.emiR}%)</div>
                          <div style={{ color: 'var(--text-secondary)' }}>Your existing EMI uses {result.emiR}% of income. Lenders prefer below 40%. Consider closing smaller debts first.</div>
                        </div>
                      </div>
                    )}
                    {creditScore < 650 && (
                      <div className="flex items-start gap-3 text-sm">
                        <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:11px;font-weight:700;font-family:'Space Grotesk',sans-serif">!</div>
                        <div>
                          <div className="font-semibold mb-0.5" style={{ color: '#eab308' }}>Low Credit Score ({creditScore})</div>
                          <div style={{ color: 'var(--text-secondary)' }}>Below 650 significantly limits bank options. Clear outstanding dues and avoid new credit inquiries to improve score in 3–6 months.</div>
                        </div>
                      </div>
                    )}
                    {result.maxEligible < desiredAmount && (
                      <div className="flex items-start gap-3 text-sm">
                        <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:11px;font-weight:700;font-family:'Space Grotesk',sans-serif">!</div>
                        <div>
                          <div className="font-semibold mb-0.5" style={{ color: '#f87171' }}>Loan Amount Exceeds Eligibility</div>
                          <div style={{ color: 'var(--text-secondary)' }}>You are eligible for up to ₹{result.maxEligible.toLocaleString('en-IN')} but requested ₹{desiredAmount.toLocaleString('en-IN')}. Consider a co-applicant or larger down payment.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
