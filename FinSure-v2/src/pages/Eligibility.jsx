import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, ScoreRing, LiquidBar, BackBtn, SliderInput, DNAHelix } from '../components/UI'
import { useStore } from '../store/useStore'
import { BADGE_DEFS } from '../utils/badges'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'

function ScoreBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(34,211,238,0.08)' }}>
        <motion.div className="h-1.5 rounded-full"
          initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1 }} style={{ background: color }} />
      </div>
    </div>
  )
}

export default function Eligibility() {
  const { addBadge } = useStore()
  const [salary, setSalary] = useState(50000)
  const [creditScore, setCreditScore] = useState(700)
  const [age, setAge] = useState(28)
  const [existingEMI, setExistingEMI] = useState(0)
  const [employmentType, setEmploymentType] = useState('Salaried')
  const [loanType, setLoanType] = useState('Home Loan')
  const [showResult, setShowResult] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Real-time scoring
  let incomeScore = 0
  if (salary >= 100000) incomeScore = 30; else if (salary >= 70000) incomeScore = 24
  else if (salary >= 50000) incomeScore = 18; else if (salary >= 30000) incomeScore = 12; else if (salary > 0) incomeScore = 6

  let creditPoints = 0
  if (creditScore >= 800) creditPoints = 30; else if (creditScore >= 750) creditPoints = 25
  else if (creditScore >= 700) creditPoints = 20; else if (creditScore >= 650) creditPoints = 15; else if (creditScore > 0) creditPoints = 8

  const emiRatio = salary > 0 ? Math.round((existingEMI / salary) * 100) : 0
  let emiPoints = 0
  if (emiRatio <= 20) emiPoints = 25; else if (emiRatio <= 35) emiPoints = 20
  else if (emiRatio <= 50) emiPoints = 12; else emiPoints = 5

  let agePoints = 0
  if (age >= 25 && age <= 45) agePoints = 10; else if ((age >= 21 && age < 25) || (age > 45 && age <= 55)) agePoints = 7; else if (age > 0) agePoints = 4

  const empPoints = employmentType === 'Salaried' ? 5 : employmentType === 'Business Owner' ? 4 : 3
  const totalScore = Math.min(incomeScore + creditPoints + emiPoints + agePoints + empPoints, 100)

  const statusColor = totalScore >= 80 ? '#22c55e' : totalScore >= 60 ? '#eab308' : '#ef4444'
  const status = totalScore >= 80 ? 'Premium Profile' : totalScore >= 60 ? 'Balanced Profile' : 'Needs Improvement'
  const personality = totalScore >= 80
    ? 'Strategic Borrower — Excellent candidate for premium loan products.'
    : totalScore >= 60 ? 'Growth Profile — Eligible for most standard loan products.'
    : 'Recovery Profile — Consider improving credit score and reducing existing liabilities.'

  const healthColor = emiRatio <= 30 ? '#22c55e' : emiRatio <= 50 ? '#eab308' : '#ef4444'
  const health = emiRatio <= 30 ? 'Stable' : emiRatio <= 50 ? 'Moderate Pressure' : 'High Pressure'

  const loanMultipliers = { 'Home Loan': 1.0, 'Personal Loan': 0.4, 'Education Loan': 0.6, 'Car Loan': 0.5 }
  const eligibleLoan = Math.round((salary - existingEMI) * 35 * (loanMultipliers[loanType] || 1))

  const saveReport = async () => {
    setSaving(true)
    try {
      await addDoc(collection(db, 'eligibilityReports'), {
        userEmail: auth.currentUser?.email,
        salary, creditScore, age, existingEMI, employmentType, loanType,
        readinessScore: totalScore, health, eligibleLoan, createdAt: new Date()
      })
      setSaved(true)
      addBadge(BADGE_DEFS.find(b => b.id === 'first_analysis'))
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-10 pt-20 pb-16">
        <div className="mb-8"><BackBtn to="/" /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="label-mono mb-3">FinDNA Analyzer</div>
          <h1 className="display-xl mb-4">Financial DNA Analysis</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Enter your financial profile to receive a real-time readiness score and loan eligibility assessment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 glass rounded-3xl p-6 md:p-10">
            <h2 className="display-md mb-8" style={{ color: 'var(--text-primary)' }}>Your Profile</h2>
            <div className="space-y-7">
              <SliderInput label="Monthly Salary" value={salary} onChange={setSalary} min={10000} max={500000} step={5000} prefix="₹" />
              <SliderInput label="Credit Score (CIBIL)" value={creditScore} onChange={setCreditScore} min={300} max={900} step={10} />
              <SliderInput label="Age" value={age} onChange={setAge} min={21} max={65} step={1} suffix=" yrs" />
              <SliderInput label="Existing Monthly EMI" value={existingEMI} onChange={setExistingEMI} min={0} max={200000} step={1000} prefix="₹" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-mono block mb-2">Employment</label>
                  <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="fin-input fin-select">
                    <option>Salaried</option>
                    <option>Self Employed</option>
                    <option>Business Owner</option>
                  </select>
                </div>
                <div>
                  <label className="label-mono block mb-2">Loan Type</label>
                  <select value={loanType} onChange={e => setLoanType(e.target.value)} className="fin-input fin-select">
                    <option>Home Loan</option>
                    <option>Personal Loan</option>
                    <option>Education Loan</option>
                    <option>Car Loan</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={() => setShowResult(true)} className="btn-primary w-full py-4 text-base mt-8">
              Analyze Financial DNA
            </button>
          </motion.div>

          {/* Live Score */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-5">
            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <div className="label-mono mb-4">Live FinDNA Score</div>
              <ScoreRing score={totalScore} size={170} />
              <div className="mt-4 font-bold text-lg" style={{ color: statusColor, fontFamily: "'Space Grotesk',sans-serif" }}>{status}</div>
              <div className="w-full mt-6 space-y-4">
                <ScoreBar label="Income" value={incomeScore} max={30} color="var(--cyan)" />
                <ScoreBar label="Credit Score" value={creditPoints} max={30} color="#818cf8" />
                <ScoreBar label="Debt Ratio" value={emiPoints} max={25} color="#22c55e" />
                <ScoreBar label="Age Profile" value={agePoints} max={10} color="#eab308" />
                <ScoreBar label="Employment" value={empPoints} max={5} color="#f472b6" />
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-3">Debt-to-Income Ratio</div>
              <LiquidBar value={emiRatio} max={100} color={healthColor} label={health} />
            </div>
          </motion.div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="mt-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass rounded-3xl p-7 scanline-wrap"
                  style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(8,24,40,0.95))' }}>
                  <div className="label-mono mb-3">Eligible Loan Amount</div>
                  <div className="text-4xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--cyan)' }}>
                    ₹{eligibleLoan.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{loanType}</div>
                </div>
                <div className="glass rounded-3xl p-7">
                  <div className="label-mono mb-3">Financial Health</div>
                  <div className="text-2xl font-bold mb-3" style={{ color: healthColor, fontFamily: "'Space Grotesk',sans-serif" }}>{health}</div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{personality}</p>
                </div>
                <div className="glass rounded-3xl p-7">
                  <div className="label-mono mb-4">Recommendations</div>
                  <div className="space-y-3">
                    {totalScore < 80 && creditScore < 750 && <div className="flex gap-2 text-sm"><span style={{ color: '#eab308' }}>→</span><span style={{ color: 'var(--text-secondary)' }}>Improve credit score by clearing outstanding payments.</span></div>}
                    {emiRatio > 40 && <div className="flex gap-2 text-sm"><span style={{ color: '#ef4444' }}>→</span><span style={{ color: 'var(--text-secondary)' }}>Reduce existing EMI obligations before taking a new loan.</span></div>}
                    {totalScore >= 80 && <div className="flex gap-2 text-sm"><span style={{ color: '#22c55e' }}>→</span><span style={{ color: 'var(--text-secondary)' }}>Excellent profile. You qualify for premium interest rates.</span></div>}
                    {salary < 30000 && salary > 0 && <div className="flex gap-2 text-sm"><span style={{ color: '#eab308' }}>→</span><span style={{ color: 'var(--text-secondary)' }}>A higher income would significantly expand loan eligibility.</span></div>}
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button onClick={saveReport} disabled={saving || saved}
                  className="btn-primary px-10 py-4 text-base flex items-center gap-3"
                  style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : saved ? 'Saved to History' : 'Save Report'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
