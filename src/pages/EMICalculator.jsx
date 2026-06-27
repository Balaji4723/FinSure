import { useState, useEffect, useRef } from "react"
import translations from "../translations/translations"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import jsPDF from "jspdf"
import { auth } from "../firebase"
import { addDoc, collection } from "firebase/firestore"
import { db } from "../firebase"

/* ─── Animated number ─── */
function AnimatedNumber({ value, prefix = "₹", decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  useEffect(() => {
    const from = prevRef.current
    const to = Number(value) || 0
    prevRef.current = to
    if (from === to) return
    const dur = 800
    const start = performance.now()
    const frame = (now) => {
      const progress = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * ease)
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [value])
  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString("en-IN")
  return <span>{prefix}{formatted}</span>
}

/* ─── Donut chart ─── */
function DonutChart({ principal, interest }) {
  const total = principal + interest
  if (total <= 0) return null
  const r = 54
  const c = 2 * Math.PI * r
  const principalDash = (principal / total) * c
  const interestDash = (interest / total) * c
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="16"/>
        {/* Interest arc */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#818cf8" strokeWidth="16"
          strokeDasharray={`${interestDash} ${c - interestDash}`}
          strokeDashoffset={-principalDash}
          strokeLinecap="round" className="progress-ring-circle"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Principal arc */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--cyan)" strokeWidth="16"
          strokeDasharray={`${principalDash} ${c - principalDash}`}
          strokeDashoffset="0"
          strokeLinecap="round" className="progress-ring-circle"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {Math.round((principal / total) * 100)}% P
        </div>
      </div>
    </div>
  )
}

/* ─── Slider input ─── */
function SliderInput({ label, value, onChange, min, max, step = 1, prefix = "", suffix = "", sublabel }) {
  const pct = Math.min(((value - min) / (max - min)) * 100, 100)
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="label-mono">{label}</label>
        <span style={{ color: "var(--cyan)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "15px" }}>
          {prefix}{Number(value).toLocaleString("en-IN")}{suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%", appearance: "none", height: "4px", borderRadius: "2px", outline: "none", cursor: "pointer",
          background: `linear-gradient(to right, var(--cyan) 0%, var(--cyan) ${pct}%, rgba(34,211,238,0.15) ${pct}%, rgba(34,211,238,0.15) 100%)`
        }}
      />
      <div className="flex justify-between mt-1" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        <span>{prefix}{Number(min).toLocaleString("en-IN")}{suffix}</span>
        {sublabel && <span style={{ color: "var(--text-muted)" }}>{sublabel}</span>}
        <span>{prefix}{Number(max).toLocaleString("en-IN")}{suffix}</span>
      </div>
    </div>
  )
}

function EMICalculator() {
  const [language, setLanguage] = useState("en")
  const t = translations[language]

  const [loanAmount, setLoanAmount] = useState(500000)
  const [interestRate, setInterestRate] = useState(8.5)
  const [tenure, setTenure] = useState(5)
  const [monthlyIncome, setMonthlyIncome] = useState(50000)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Real-time EMI calculation
  const monthlyRate = interestRate / 12 / 100
  const months = tenure * 12
  const emi = months > 0 && monthlyRate > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : loanAmount / Math.max(months, 1)
  const finalEMI = isFinite(emi) ? Math.round(emi) : 0
  const totalPayable = finalEMI * months
  const totalInterest = Math.max(totalPayable - loanAmount, 0)
  const affordabilityRatio = monthlyIncome > 0 ? Math.round((finalEMI / monthlyIncome) * 100) : 0

  let affordColor = "#22c55e"
  let affordLabel = "Comfortable"
  let affordBar = "#22c55e"
  if (affordabilityRatio > 50) { affordColor = "#ef4444"; affordLabel = "High Burden"; affordBar = "#ef4444" }
  else if (affordabilityRatio > 30) { affordColor = "#eab308"; affordLabel = "Manageable"; affordBar = "#eab308" }

  const insight = tenure >= 15
    ? "Long tenure reduces your monthly burden but significantly increases total interest paid. Consider prepaying when possible."
    : interestRate >= 12
    ? "High interest rate detected. Shop around for better rates or consider a larger down payment to reduce the principal."
    : "Balanced loan profile. Your EMI-to-income ratio and total interest look healthy for this loan structure."

  const saveReport = async () => {
    setSaving(true)
    try {
      await addDoc(collection(db, "emiReports"), {
        userEmail: auth.currentUser?.email,
        loanAmount, interestRate, tenure, monthlyIncome,
        monthlyEMI: finalEMI,
        totalInterest: Math.round(totalInterest),
        totalRepayment: Math.round(totalPayable),
        affordability: affordLabel,
        createdAt: new Date()
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    doc.setFillColor(2, 10, 18)
    doc.rect(0, 0, 210, 297, "F")
    doc.setTextColor(34, 211, 238)
    doc.setFontSize(24); doc.text("FinSure EMI Report", 20, 28)
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 20, 40)
    doc.setDrawColor(34, 211, 238); doc.setLineWidth(0.3)
    doc.line(20, 46, 190, 46)
    doc.setTextColor(240, 249, 255); doc.setFontSize(13)
    const rows = [
      ["Loan Amount", `Rs. ${loanAmount.toLocaleString("en-IN")}`],
      ["Interest Rate", `${interestRate}% p.a.`],
      ["Loan Tenure", `${tenure} Years (${months} months)`],
      ["Monthly EMI", `Rs. ${finalEMI.toLocaleString("en-IN")}`],
      ["Total Interest", `Rs. ${Math.round(totalInterest).toLocaleString("en-IN")}`],
      ["Total Payable", `Rs. ${Math.round(totalPayable).toLocaleString("en-IN")}`],
      ["Affordability", affordLabel],
      ["Income Utilization", `${affordabilityRatio}%`],
    ]
    rows.forEach(([k, v], i) => {
      const y = 60 + i * 16
      doc.setTextColor(148, 163, 184); doc.text(k, 20, y)
      doc.setTextColor(240, 249, 255); doc.text(v, 110, y)
    })
    doc.setFontSize(10); doc.setTextColor(71, 85, 105)
    doc.text("FinSure Financial Intelligence Platform", 20, 260)
    doc.save("FinSure_EMI_Report.pdf")
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: "var(--bg-void)" }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-cyan w-[500px] h-[500px] -top-32 -left-32 z-0" />
      <div className="orb-purple w-[400px] h-[400px] bottom-0 -right-32 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 py-8 md:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <Link to="/">
            <button className="btn-outline px-5 py-2.5 text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M7 11L3 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
          </Link>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="fin-input fin-select text-sm" style={{ width: "auto", padding: "8px 40px 8px 14px", fontSize: "13px" }}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">Marathi</option>
          </select>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="label-mono mb-3">EMI Planner</div>
          <h1 className="display-xl mb-4">{t.emiTitle || "EMI Calculator"}</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t.emiSubtitle || "Instantly calculate monthly payments with real-time breakdown as you adjust your loan parameters."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* ─── LEFT: Sliders ─── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-7 md:p-10">
            <h2 className="display-md mb-8" style={{ color: "var(--text-primary)" }}>Loan Parameters</h2>
            <div className="space-y-8">
              <SliderInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount}
                min={50000} max={10000000} step={50000} prefix="₹" />
              <SliderInput label="Annual Interest Rate" value={interestRate} onChange={setInterestRate}
                min={5} max={24} step={0.1} suffix="%" sublabel="p.a." />
              <SliderInput label="Loan Tenure" value={tenure} onChange={setTenure}
                min={1} max={30} step={1} suffix=" Yr" />
              <SliderInput label="Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome}
                min={10000} max={1000000} step={5000} prefix="₹" />
            </div>

            {/* Quick presets */}
            <div className="mt-8">
              <div className="label-mono mb-3">Quick Presets</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Home Loan", amount: 5000000, rate: 8.5, ten: 20 },
                  { label: "Car Loan", amount: 800000, rate: 9.5, ten: 5 },
                  { label: "Personal", amount: 300000, rate: 14, ten: 3 },
                  { label: "Education", amount: 1500000, rate: 9, ten: 10 },
                ].map(p => (
                  <button key={p.label} onClick={() => { setLoanAmount(p.amount); setInterestRate(p.rate); setTenure(p.ten) }}
                    className="btn-outline py-2.5 text-sm rounded-xl">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ─── RIGHT: Results ─── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-col gap-5">
            {/* Monthly EMI hero card */}
            <div className="glass rounded-3xl p-7 md:p-10 scanline-wrapper" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(8,24,40,0.9) 100%)" }}>
              <div className="label-mono mb-3">Monthly EMI</div>
              <div className="text-5xl md:text-6xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--cyan)" }}>
                <AnimatedNumber value={finalEMI} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>per month for {tenure} year{tenure > 1 ? "s" : ""}</p>
            </div>

            {/* Breakdown row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5">
                <div className="label-mono mb-2" style={{ color: "#818cf8" }}>Total Interest</div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#a5b4fc" }}>
                  <AnimatedNumber value={totalInterest} />
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="label-mono mb-2">Total Payable</div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
                  <AnimatedNumber value={totalPayable} />
                </div>
              </div>
            </div>

            {/* Donut + breakdown */}
            <div className="glass rounded-3xl p-7 md:p-8">
              <div className="flex items-center gap-6 mb-6">
                <DonutChart principal={loanAmount} interest={totalInterest} />
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "var(--cyan)" }} />
                    <span style={{ color: "var(--text-secondary)" }}>Principal</span>
                    <span className="ml-auto font-semibold" style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {loanAmount > 0 && totalPayable > 0 ? Math.round((loanAmount / totalPayable) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#818cf8" }} />
                    <span style={{ color: "var(--text-secondary)" }}>Interest</span>
                    <span className="ml-auto font-semibold" style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {loanAmount > 0 && totalPayable > 0 ? Math.round((totalInterest / totalPayable) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Affordability bar */}
              <div className="label-mono mb-3">Affordability — Income Utilization</div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: affordColor, fontWeight: 600 }}>{affordLabel}</span>
                <span style={{ color: affordColor, fontWeight: 700 }}>{affordabilityRatio}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.1)" }}>
                <motion.div animate={{ width: `${Math.min(affordabilityRatio, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-2 rounded-full" style={{ background: affordBar }} />
              </div>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {insight}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mt-8">
          <button onClick={saveReport} disabled={saving || saved}
            className="btn-primary px-8 py-4 text-base flex items-center gap-3"
            style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? (
              <><svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>Saving...</>
            ) : saved ? "Saved to History" : "Save Report"}
          </button>
          <button onClick={downloadPDF} className="btn-outline px-8 py-4 text-base flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download PDF
          </button>
        </motion.div>

        {/* Amortisation table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-3xl p-7 md:p-10 mt-8 overflow-x-auto">
          <h2 className="display-md mb-6" style={{ color: "var(--text-primary)" }}>Yearly Amortisation Schedule</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(34,211,238,0.15)" }}>
                {["Year","Opening Balance","EMI Paid","Principal","Interest","Closing Balance"].map(h => (
                  <th key={h} className="label-mono text-left pb-3 pr-4" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(tenure, 30) }, (_, yr) => {
                let balance = loanAmount
                let openBal = 0
                let totalPrincipal = 0
                let totalInterestPaid = 0
                // calculate previous years
                for (let y = 0; y <= yr; y++) {
                  openBal = balance
                  let yearPrincipal = 0, yearInterest = 0
                  for (let m = 0; m < 12 && (y * 12 + m) < months; m++) {
                    const intPmt = balance * monthlyRate
                    const prinPmt = Math.min(finalEMI - intPmt, balance)
                    yearInterest += intPmt
                    yearPrincipal += prinPmt
                    balance -= prinPmt
                  }
                  if (y === yr) { totalPrincipal = yearPrincipal; totalInterestPaid = yearInterest }
                }
                return (
                  <tr key={yr} style={{ borderBottom: "1px solid rgba(34,211,238,0.05)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(34,211,238,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {[
                      `Year ${yr + 1}`,
                      `₹${Math.round(openBal).toLocaleString("en-IN")}`,
                      `₹${Math.round(finalEMI * Math.min(12, months - yr * 12)).toLocaleString("en-IN")}`,
                      `₹${Math.round(totalPrincipal).toLocaleString("en-IN")}`,
                      `₹${Math.round(totalInterestPaid).toLocaleString("en-IN")}`,
                      `₹${Math.max(0, Math.round(balance)).toLocaleString("en-IN")}`
                    ].map((v, ci) => (
                      <td key={ci} className="py-3 pr-4"
                        style={{ color: ci === 0 ? "var(--cyan)" : ci === 4 ? "#a5b4fc" : "var(--text-secondary)", fontFamily: ci > 0 ? "'Space Grotesk', sans-serif" : undefined, fontWeight: ci > 0 ? 500 : 400 }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}

export default EMICalculator
