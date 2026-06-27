import { useState } from "react"
import translations from "../translations/translations"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import jsPDF from "jspdf"
import { auth } from "../firebase"
import { addDoc, collection } from "firebase/firestore"
import { db } from "../firebase"

/* ─── Approval gauge ─── */
function ApprovalGauge({ value, color }) {
  const r = 56, c = 2 * Math.PI * r
  // Semi-circle: only use half
  const semi = c / 2
  const dash = (value / 100) * semi
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 90, overflow: "hidden" }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", top: 0 }}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="14"
          strokeDasharray={`${semi} ${c - semi}`} strokeDashoffset={`${c * 0.25}`} />
        <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={`${c * 0.25}`}
          strokeLinecap="round" className="progress-ring-circle"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color }}>{value}%</div>
      </div>
    </div>
  )
}

const RATES = { home: 8.5, personal: 14, education: 9, car: 10 }

function Policy() {
  const [language, setLanguage] = useState("en")
  const t = translations[language]
  const [loanType, setLoanType] = useState("")
  const [salary, setSalary] = useState("")
  const [loanAmount, setLoanAmount] = useState("")
  const [existingEmi, setExistingEmi] = useState("")
  const [tenure, setTenure] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  // Real-time preview (before full analysis)
  const previewRate = RATES[loanType] || 10
  const previewMonthlyRate = previewRate / 12 / 100
  const previewMonths = Number(tenure) * 12
  const previewEmi = previewMonths > 0 && Number(loanAmount) > 0
    ? Math.round((Number(loanAmount) * previewMonthlyRate * Math.pow(1 + previewMonthlyRate, previewMonths)) / (Math.pow(1 + previewMonthlyRate, previewMonths) - 1))
    : 0
  const previewRatio = Number(salary) > 0 ? Math.round(((previewEmi + Number(existingEmi)) / Number(salary)) * 100) : 0

  const analyzeLoan = async () => {
    if (!loanType || !salary || !loanAmount || !tenure) return
    setLoading(true)
    const interest = RATES[loanType] || 10
    const mRate = interest / 12 / 100
    const months = Number(tenure) * 12
    const emi = Math.round((Number(loanAmount) * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1))
    const totalLiability = emi + Number(existingEmi)
    const ratio = Math.round((totalLiability / Number(salary)) * 100)
    let approval, risk, insight, color, banks

    if (ratio <= 35) {
      approval = 90; risk = "Low Financial Risk"; color = "#22c55e"
      insight = "Strong financial profile. Debt-to-income ratio is within ideal lending limits. Most banks will approve this application."
      banks = [
        { name: "SBI", reason: "Best suited for salaried applicants. Competitive home loan and education loan rates.", rate: `${interest}%`, tag: "Best Rate" },
        { name: "HDFC Bank", reason: "Fast digital processing. Flexible repayment with prepayment options.", rate: `${(interest + 0.6).toFixed(1)}%`, tag: "Fast Approval" },
        { name: "ICICI Bank", reason: "Excellent online account management. Pre-approved offers available.", rate: `${(interest + 0.9).toFixed(1)}%`, tag: "Digital First" },
      ]
    } else if (ratio <= 50) {
      approval = 70; risk = "Moderate Financial Pressure"; color = "#eab308"
      insight = "Moderate repayment burden detected. Approval is likely with a stable income track record. Consider reducing existing EMIs or increasing the down payment."
      banks = [
        { name: "ICICI Bank", reason: "Good for moderate profiles with digital verification and flexible EMI structures.", rate: `${(interest + 0.9).toFixed(1)}%`, tag: "" },
        { name: "Axis Bank", reason: "Flexible repayment structures for applicants with moderate debt obligations.", rate: `${(interest + 1.2).toFixed(1)}%`, tag: "" },
        { name: "Kotak Mahindra", reason: "Considers alternate income sources. Good for business owners.", rate: `${(interest + 1.4).toFixed(1)}%`, tag: "" },
      ]
    } else {
      approval = 45; risk = "High Financial Risk"; color = "#ef4444"
      insight = "High repayment burden relative to income. Standard bank approval unlikely. Consider a smaller loan amount, longer tenure, or co-applicant to strengthen the application."
      banks = [
        { name: "NBFC Lenders", reason: "Higher approval rate for borderline profiles, but expect elevated interest rates.", rate: "11%+", tag: "Higher Risk" },
        { name: "Private Banks", reason: "May consider if you have a strong repayment history. Documentation-intensive.", rate: `${(interest + 2).toFixed(1)}%`, tag: "" },
      ]
    }

    const reportData = {
      userEmail: auth.currentUser?.email,
      loanType, salary: Number(salary), loanAmount: Number(loanAmount),
      existingEmi: Number(existingEmi), tenure: Number(tenure),
      emi, approval, ratio, risk, insight, createdAt: new Date()
    }
    try { await addDoc(collection(db, "reports"), reportData) } catch (err) { console.error(err) }
    setResult({ emi, approval, ratio, risk, insight, color, banks, interest })
    setLoading(false)
  }

  const downloadReport = () => {
    if (!result) return
    const doc = new jsPDF()
    doc.setFillColor(2, 10, 18)
    doc.rect(0, 0, 210, 297, "F")
    doc.setTextColor(34, 211, 238)
    doc.setFontSize(22); doc.text("FinSure Loan Feasibility Report", 20, 28)
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 20, 38)
    doc.setDrawColor(34, 211, 238); doc.setLineWidth(0.3)
    doc.line(20, 44, 190, 44)
    doc.setTextColor(240, 249, 255); doc.setFontSize(12)
    const rows = [
      ["Loan Type", loanType.toUpperCase()],
      ["Monthly Salary", `Rs. ${Number(salary).toLocaleString("en-IN")}`],
      ["Loan Amount", `Rs. ${Number(loanAmount).toLocaleString("en-IN")}`],
      ["Existing EMI", `Rs. ${Number(existingEmi).toLocaleString("en-IN")}`],
      ["Tenure", `${tenure} Years`],
      ["Estimated EMI", `Rs. ${result.emi.toLocaleString("en-IN")}`],
      ["Approval Probability", `${result.approval}%`],
      ["EMI Burden Ratio", `${result.ratio}%`],
      ["Risk Assessment", result.risk],
    ]
    rows.forEach(([k, v], i) => {
      const y = 58 + i * 16
      doc.setTextColor(148, 163, 184); doc.text(k, 20, y)
      doc.setTextColor(240, 249, 255); doc.text(v, 100, y)
    })
    doc.setFontSize(10); doc.setTextColor(71, 85, 105)
    doc.text(result.insight, 20, 210, { maxWidth: 170 })
    doc.text("FinSure Financial Intelligence Platform", 20, 270)
    doc.save("FinSure_Loan_Report.pdf")
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  const allFilled = loanType && salary && loanAmount && tenure

  return (
    <div className="min-h-screen text-white relative" style={{ background: "var(--bg-void)" }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-cyan w-[500px] h-[500px] -top-32 -left-32 z-0" />
      <div className="orb-purple w-[400px] h-[400px] -bottom-32 -right-32 z-0" />

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
          <div className="label-mono mb-3">Loan Analyzer</div>
          <h1 className="display-xl mb-4">Loan Feasibility Analyzer</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Analyze repayment pressure, approval probability, and get personalized bank recommendations in seconds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
          {/* ─── Inputs ─── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 glass rounded-3xl p-7 md:p-10">
            <h2 className="display-md mb-8" style={{ color: "var(--text-primary)" }}>Loan Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-mono block mb-2">Loan Type</label>
                <select value={loanType} onChange={e => setLoanType(e.target.value)} className="fin-input fin-select">
                  <option value="">Select loan type</option>
                  <option value="home">Home Loan ({RATES.home}%)</option>
                  <option value="personal">Personal Loan ({RATES.personal}%)</option>
                  <option value="education">Education Loan ({RATES.education}%)</option>
                  <option value="car">Car Loan ({RATES.car}%)</option>
                </select>
              </div>
              {[
                { label: "Monthly Salary", ph: "e.g. 60000", set: setSalary, val: salary },
                { label: "Loan Amount", ph: "e.g. 2000000", set: setLoanAmount, val: loanAmount },
                { label: "Existing Monthly EMI", ph: "0 if none", set: setExistingEmi, val: existingEmi },
                { label: "Tenure (Years)", ph: "e.g. 10", set: setTenure, val: tenure },
              ].map(f => (
                <div key={f.label}>
                  <label className="label-mono block mb-2">{f.label}</label>
                  <input type="number" placeholder={f.ph} value={f.val}
                    onChange={e => f.set(e.target.value)} className="fin-input" />
                </div>
              ))}
            </div>
            <button onClick={analyzeLoan} disabled={loading || !allFilled}
              className="btn-primary w-full py-4 text-base mt-8 flex items-center justify-center gap-3"
              style={{ opacity: (!allFilled || loading) ? 0.6 : 1 }}>
              {loading ? (
                <><svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>Analyzing...</>
              ) : "Analyze Financial Feasibility"}
            </button>
          </motion.div>

          {/* ─── Live Preview ─── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-5">
            <div className="glass rounded-3xl p-7">
              <div className="label-mono mb-4">Live Preview</div>
              <div className="space-y-5">
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Estimated Monthly EMI</div>
                  <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--cyan)" }}>
                    {previewEmi > 0 ? `₹${previewEmi.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>EMI Burden Ratio</div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.08)" }}>
                    <motion.div animate={{ width: `${Math.min(previewRatio, 100)}%` }}
                      transition={{ duration: 0.5 }} className="h-2 rounded-full"
                      style={{ background: previewRatio > 50 ? "#ef4444" : previewRatio > 35 ? "#eab308" : "#22c55e" }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span style={{ color: "var(--text-muted)" }}>0%</span>
                    <span style={{ color: previewRatio > 50 ? "#ef4444" : previewRatio > 35 ? "#eab308" : "#22c55e", fontWeight: 600 }}>{previewRatio}%</span>
                    <span style={{ color: "var(--text-muted)" }}>100%</span>
                  </div>
                </div>
                {loanType && (
                  <div className="flex justify-between text-sm pt-2 border-t" style={{ borderColor: "rgba(34,211,238,0.08)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Interest Rate</span>
                    <span style={{ color: "var(--cyan)", fontWeight: 600 }}>{RATES[loanType]}% p.a.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Risk thresholds guide */}
            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-4">Risk Thresholds</div>
              <div className="space-y-3">
                {[
                  { range: "0–35%", label: "Low Risk", color: "#22c55e", note: "High approval probability" },
                  { range: "35–50%", label: "Moderate", color: "#eab308", note: "Conditional approval" },
                  { range: "50%+", label: "High Risk", color: "#ef4444", note: "Likely rejection" },
                ].map(r => (
                  <div key={r.range} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: r.color }} />
                    <div>
                      <span style={{ color: r.color, fontWeight: 600 }}>{r.range} — {r.label}</span>
                      <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>{r.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Full Results ─── */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}
              className="mt-8 space-y-6">
              {/* Metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Approval gauge */}
                <div className="glass rounded-3xl p-8 flex flex-col items-center text-center">
                  <div className="label-mono mb-4">Approval Probability</div>
                  <ApprovalGauge value={result.approval} color={result.color} />
                  <div className="mt-4 font-bold" style={{ color: result.color, fontFamily: "'Space Grotesk', sans-serif" }}>{result.risk}</div>
                </div>

                {/* Key metrics */}
                <div className="glass rounded-3xl p-8">
                  <div className="label-mono mb-5">Loan Metrics</div>
                  <div className="space-y-5">
                    {[
                      { label: "Estimated EMI", val: `₹${result.emi.toLocaleString("en-IN")}`, color: "var(--cyan)" },
                      { label: "EMI Burden Ratio", val: `${result.ratio}%`, color: result.color },
                      { label: "Interest Rate", val: `${result.interest}% p.a.`, color: "var(--text-primary)" },
                      { label: "Tenure", val: `${tenure} Years`, color: "var(--text-primary)" },
                    ].map(m => (
                      <div key={m.label} className="flex justify-between text-sm">
                        <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                        <span style={{ color: m.color, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{m.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Burden bars */}
                  <div className="mt-6 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: "var(--text-muted)" }}>Approval Probability</span>
                        <span style={{ color: result.color }}>{result.approval}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.08)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${result.approval}%` }}
                          transition={{ duration: 1.2 }} className="h-1.5 rounded-full" style={{ background: result.color }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: "var(--text-muted)" }}>EMI Burden</span>
                        <span style={{ color: result.color }}>{result.ratio}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.08)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(result.ratio, 100)}%` }}
                          transition={{ duration: 1.2 }} className="h-1.5 rounded-full" style={{ background: result.color }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insight */}
                <div className="glass rounded-3xl p-8">
                  <div className="label-mono mb-5">Assessment</div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>{result.insight}</p>
                  <div className="space-y-3 text-sm">
                    <p style={{ color: "var(--text-secondary)" }}>Banks prefer EMI-to-income ratio below 40% for standard approvals.</p>
                    <p style={{ color: "var(--text-secondary)" }}>Stable employment history and lower liabilities improve probability significantly.</p>
                  </div>
                </div>
              </div>

              {/* Bank recommendations */}
              <div className="glass rounded-3xl p-8">
                <div className="label-mono mb-6">Suggested Banking Profiles</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {result.banks.map((bank, i) => (
                    <motion.div key={i} whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.15 }}
                      className="rounded-2xl p-6 cursor-default"
                      style={{ background: "rgba(4,15,26,0.9)", border: "1px solid rgba(34,211,238,0.1)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--cyan)" }}>{bank.name}</h3>
                        {bank.tag && <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(34,211,238,0.1)", color: "var(--cyan)" }}>{bank.tag}</span>}
                      </div>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{bank.reason}</p>
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Rate: <span style={{ color: "var(--cyan)" }}>{bank.rate}</span></div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Download */}
              <div className="flex justify-center">
                <button onClick={downloadReport} className="btn-primary px-10 py-4 text-base flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  {downloaded ? "Downloaded" : "Download Full Report"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Policy
