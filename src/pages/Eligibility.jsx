import { useState } from "react"
import translations from "../translations/translations"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { auth } from "../firebase"
import { addDoc, collection } from "firebase/firestore"
import { db } from "../firebase"

/* ─── Circular progress ring ─── */
function ScoreRing({ score }) {
  const r = 64, c = 2 * Math.PI * r
  const dash = (score / 100) * c
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444"
  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="14"/>
        {/* Track segments */}
        {[0.3, 0.6, 0.8].map((threshold, i) => (
          <circle key={i} cx="90" cy="90" r={r} fill="none"
            stroke={i === 0 ? "rgba(239,68,68,0.15)" : i === 1 ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.12)"}
            strokeWidth="14"
            strokeDasharray={`${(threshold * c).toFixed(1)} ${c}`}
            strokeDashoffset={0}
            className="progress-ring-circle" />
        ))}
        {/* Score arc */}
        <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${dash.toFixed(1)} ${(c - dash).toFixed(1)}`}
          strokeDashoffset={0} strokeLinecap="round" className="progress-ring-circle"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease", filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color }}>
          {score}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>/ 100</div>
      </div>
    </div>
  )
}

/* ─── Score bar ─── */
function ScoreBar({ label, value, max, color = "var(--cyan)" }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(34,211,238,0.08)" }}>
        <motion.div className="h-1.5 rounded-full"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ background: color }} />
      </div>
    </div>
  )
}

function Eligibility() {
  const [language, setLanguage] = useState("en")
  const t = translations[language]
  const [salary, setSalary] = useState("")
  const [creditScore, setCreditScore] = useState("")
  const [age, setAge] = useState("")
  const [existingLoan, setExistingLoan] = useState("")
  const [employmentType, setEmploymentType] = useState("Salaried")
  const [loanType, setLoanType] = useState("Home Loan")
  const [showResult, setShowResult] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Real-time scoring ───
  let salaryScore = 0
  const sal = Number(salary)
  if (sal >= 100000) salaryScore = 30
  else if (sal >= 70000) salaryScore = 24
  else if (sal >= 50000) salaryScore = 18
  else if (sal >= 30000) salaryScore = 12
  else if (sal > 0) salaryScore = 6

  let creditScorePoints = 0
  const cs = Number(creditScore)
  if (cs >= 800) creditScorePoints = 30
  else if (cs >= 750) creditScorePoints = 25
  else if (cs >= 700) creditScorePoints = 20
  else if (cs >= 650) creditScorePoints = 15
  else if (cs > 0) creditScorePoints = 8

  const emiRatio = sal > 0 ? Math.round((Number(existingLoan) / sal) * 100) : 0
  let emiPoints = 0
  if (emiRatio <= 20) emiPoints = 25
  else if (emiRatio <= 35) emiPoints = 20
  else if (emiRatio <= 50) emiPoints = 12
  else emiPoints = 5

  let agePoints = 0
  const ag = Number(age)
  if (ag >= 25 && ag <= 45) agePoints = 10
  else if ((ag >= 21 && ag < 25) || (ag > 45 && ag <= 55)) agePoints = 7
  else if (ag > 0) agePoints = 4

  const empPoints = employmentType === "Salaried" ? 5 : employmentType === "Business Owner" ? 4 : 3

  const readinessScore = Math.min(Math.max(salaryScore + creditScorePoints + emiPoints + agePoints + empPoints, 0), 100)

  const statusColor = readinessScore >= 80 ? "#22c55e" : readinessScore >= 60 ? "#eab308" : "#ef4444"
  const status = readinessScore >= 80 ? t.premiumDNA || "Premium Profile" : readinessScore >= 60 ? t.balancedDNA || "Balanced Profile" : t.riskDNA || "Needs Improvement"
  const personality = readinessScore >= 80 ? t.strategicBorrower || "Strategic Borrower — Excellent candidate for premium loan products." : readinessScore >= 60 ? t.growthProfile || "Growth Profile — Eligible for most standard loan products." : t.recoveryProfile || "Recovery Profile — Consider improving credit score and reducing existing liabilities."
  const health = emiRatio <= 30 ? t.stableDNA || "Stable" : emiRatio <= 50 ? t.moderatePressure || "Moderate Pressure" : t.criticalPressure || "High Pressure"
  const healthColor = emiRatio <= 30 ? "#22c55e" : emiRatio <= 50 ? "#eab308" : "#ef4444"
  const eligibleLoan = sal > 0 ? Math.round((sal - Number(existingLoan)) * 35) : 0

  // Multiplier by loan type
  const loanMultipliers = { "Home Loan": 1.0, "Personal Loan": 0.4, "Education Loan": 0.6, "Car Loan": 0.5 }
  const adjustedLoan = Math.round(eligibleLoan * (loanMultipliers[loanType] || 1.0))

  const saveReport = async () => {
    setSaving(true)
    try {
      await addDoc(collection(db, "eligibilityReports"), {
        userEmail: auth.currentUser?.email,
        salary: sal, creditScore: cs, age: ag,
        existingLoan: Number(existingLoan),
        employmentType, loanType,
        readinessScore, health, eligibleLoan: adjustedLoan,
        createdAt: new Date()
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: "var(--bg-void)" }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-purple w-[500px] h-[500px] -top-32 -right-32 z-0" />
      <div className="orb-cyan w-[400px] h-[400px] bottom-0 -left-32 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 py-8 md:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <Link to="/"><button className="btn-outline px-5 py-2.5 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M7 11L3 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </button></Link>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="fin-input fin-select text-sm" style={{ width: "auto", padding: "8px 40px 8px 14px", fontSize: "13px" }}>
            <option value="en">English</option><option value="hi">हिंदी</option><option value="mr">Marathi</option>
          </select>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="label-mono mb-3">FinDNA Analyzer</div>
          <h1 className="display-xl mb-4">{t.eligibilityTitle || "Financial DNA Analysis"}</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t.eligibilitySubtitle || "Enter your financial profile to receive a real-time readiness score and loan eligibility assessment."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
          {/* ─── Inputs (3 cols) ─── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 glass rounded-3xl p-7 md:p-10">
            <h2 className="display-md mb-8" style={{ color: "var(--text-primary)" }}>Your Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: "Monthly Salary", placeholder: "e.g. 50000", setter: setSalary, value: salary, type: "number" },
                { label: "Credit Score (300–900)", placeholder: "e.g. 750", setter: setCreditScore, value: creditScore, type: "number" },
                { label: "Age", placeholder: "e.g. 28", setter: setAge, value: age, type: "number" },
                { label: "Existing Monthly EMI", placeholder: "0 if none", setter: setExistingLoan, value: existingLoan, type: "number" },
              ].map(f => (
                <div key={f.label}>
                  <label className="label-mono block mb-2">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={f.value}
                    onChange={e => f.setter(e.target.value)} className="fin-input" />
                </div>
              ))}
              <div>
                <label className="label-mono block mb-2">Employment Type</label>
                <select value={employmentType} onChange={e => setEmploymentType(e.target.value)}
                  className="fin-input fin-select">
                  <option>Salaried</option>
                  <option>Self Employed</option>
                  <option>Business Owner</option>
                </select>
              </div>
              <div>
                <label className="label-mono block mb-2">Loan Type</label>
                <select value={loanType} onChange={e => setLoanType(e.target.value)}
                  className="fin-input fin-select">
                  <option>Home Loan</option>
                  <option>Personal Loan</option>
                  <option>Education Loan</option>
                  <option>Car Loan</option>
                </select>
              </div>
            </div>
            <button onClick={() => setShowResult(true)}
              className="btn-primary w-full py-4 text-base mt-8">
              Analyze Financial DNA
            </button>
          </motion.div>

          {/* ─── Live score (2 cols) ─── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-5">
            {/* Ring */}
            <div className="glass rounded-3xl p-7 flex flex-col items-center">
              <div className="label-mono mb-4">Live FinDNA Score</div>
              <ScoreRing score={readinessScore} />
              <div className="mt-4 text-center">
                <div className="font-bold text-lg" style={{ color: statusColor, fontFamily: "'Space Grotesk', sans-serif" }}>{status}</div>
              </div>

              {/* Score breakdown bars */}
              <div className="w-full mt-6 space-y-4">
                <ScoreBar label="Income" value={salaryScore} max={30} />
                <ScoreBar label="Credit Score" value={creditScorePoints} max={30} color="#818cf8" />
                <ScoreBar label="Debt Ratio" value={emiPoints} max={25} color="#22c55e" />
                <ScoreBar label="Age Profile" value={agePoints} max={10} color="#eab308" />
                <ScoreBar label="Employment" value={empPoints} max={5} color="#f472b6" />
              </div>
            </div>

            {/* EMI burden quick view */}
            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-3">Debt-to-Income</div>
              <div className="flex justify-between mb-2">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>EMI Ratio</span>
                <span className="font-bold" style={{ color: healthColor, fontFamily: "'Space Grotesk', sans-serif" }}>{emiRatio}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.08)" }}>
                <motion.div animate={{ width: `${Math.min(emiRatio, 100)}%` }}
                  transition={{ duration: 0.8 }} className="h-2 rounded-full"
                  style={{ background: healthColor }} />
              </div>
              <div className="mt-2 text-sm" style={{ color: healthColor }}>{health}</div>
            </div>
          </motion.div>
        </div>

        {/* ─── Results ─── */}
        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Eligible loan amount */}
              <div className="glass rounded-3xl p-8 scanline-wrapper" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(8,24,40,0.9) 100%)" }}>
                <div className="label-mono mb-3">Eligible Loan Amount</div>
                <div className="text-4xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--cyan)" }}>
                  ₹{adjustedLoan.toLocaleString("en-IN")}
                </div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{loanType}</div>
              </div>

              {/* Financial health */}
              <div className="glass rounded-3xl p-8">
                <div className="label-mono mb-3">Financial Health</div>
                <div className="text-2xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: healthColor }}>{health}</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{personality}</p>
              </div>

              {/* Recommendations */}
              <div className="glass rounded-3xl p-8">
                <div className="label-mono mb-4">Recommendations</div>
                <div className="space-y-3">
                  {readinessScore < 80 && cs < 750 && (
                    <div className="flex gap-3 text-sm">
                      <span style={{ color: "#eab308", flexShrink: 0 }}>→</span>
                      <span style={{ color: "var(--text-secondary)" }}>Improve credit score by clearing outstanding payments.</span>
                    </div>
                  )}
                  {emiRatio > 40 && (
                    <div className="flex gap-3 text-sm">
                      <span style={{ color: "#ef4444", flexShrink: 0 }}>→</span>
                      <span style={{ color: "var(--text-secondary)" }}>Reduce existing EMI obligations before taking a new loan.</span>
                    </div>
                  )}
                  {readinessScore >= 80 && (
                    <div className="flex gap-3 text-sm">
                      <span style={{ color: "#22c55e", flexShrink: 0 }}>→</span>
                      <span style={{ color: "var(--text-secondary)" }}>Excellent profile. You qualify for premium interest rates.</span>
                    </div>
                  )}
                  {sal < 30000 && sal > 0 && (
                    <div className="flex gap-3 text-sm">
                      <span style={{ color: "#eab308", flexShrink: 0 }}>→</span>
                      <span style={{ color: "var(--text-secondary)" }}>A higher income would significantly expand your loan eligibility.</span>
                    </div>
                  )}
                  {(ag < 21 || ag > 55) && ag > 0 && (
                    <div className="flex gap-3 text-sm">
                      <span style={{ color: "#818cf8", flexShrink: 0 }}>→</span>
                      <span style={{ color: "var(--text-secondary)" }}>Age factor reduces lender confidence slightly. Shorter tenures recommended.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save button */}
              <div className="md:col-span-3 flex justify-center">
                <button onClick={saveReport} disabled={saving || saved}
                  className="btn-primary px-10 py-4 text-base flex items-center gap-3"
                  style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? (
                    <><svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>Saving...</>
                  ) : saved ? "Saved to History" : "Save Eligibility Report"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Eligibility
