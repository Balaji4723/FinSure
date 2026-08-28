import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, SliderInput, AnimNum, LiquidBar, BackBtn } from '../components/UI'
import { useStore } from '../store/useStore'
import { BADGE_DEFS } from '../utils/badges'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'
import jsPDF from 'jspdf'

function DonutChart({ principal, interest }) {
  const total = principal + interest
  if (total <= 0) return null
  const r = 54, c = 2 * Math.PI * r
  const pDash = (principal / total) * c
  const iDash = (interest / total) * c
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="16" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#818cf8" strokeWidth="16"
          strokeDasharray={`${iDash} ${c - iDash}`} strokeDashoffset={-pDash}
          className="progress-ring-circle" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--cyan)" strokeWidth="16"
          strokeDasharray={`${pDash} ${c - pDash}`}
          className="progress-ring-circle" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute text-center">
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Split</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>
          {total > 0 ? Math.round((principal / total) * 100) : 0}% P
        </div>
      </div>
    </div>
  )
}

export default function EMICalculator() {
  const { addBadge, incrementReports, userProfile } = useStore()
  const [loanAmount, setLoanAmount] = useState(userProfile?.desiredLoan || 500000)
  const [interestRate, setInterestRate] = useState(8.5)
  const [tenure, setTenure] = useState(20)
  const [monthlyIncome, setMonthlyIncome] = useState(userProfile?.salary || 50000)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const monthlyRate = interestRate / 12 / 100
  const months = tenure * 12
  const emi = months > 0 && monthlyRate > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : loanAmount / Math.max(months, 1)
  const finalEMI = isFinite(emi) ? Math.round(emi) : 0
  const totalPayable = finalEMI * months
  const totalInterest = Math.max(totalPayable - loanAmount, 0)
  const affordRatio = monthlyIncome > 0 ? Math.round((finalEMI / monthlyIncome) * 100) : 0
  const affordColor = affordRatio > 50 ? '#ef4444' : affordRatio > 30 ? '#eab308' : '#22c55e'
  const affordLabel = affordRatio > 50 ? 'High Burden' : affordRatio > 30 ? 'Manageable' : 'Comfortable'

  const insight = tenure >= 15
    ? 'Long tenure reduces monthly burden but significantly increases total interest. Consider prepaying when possible.'
    : interestRate >= 12
    ? 'High interest rate detected. Shop around for better rates or increase your down payment.'
    : 'Balanced loan profile. Your EMI-to-income ratio looks healthy for this loan structure.'

  const saveReport = async () => {
    if (loanAmount <= 0 || loanAmount > 100000000) return
    if (interestRate <= 0 || interestRate > 50) return
    if (tenure <= 0 || tenure > 30) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'emiReports'), {
        userEmail: auth.currentUser?.email,
        loanAmount, interestRate, tenure, monthlyIncome,
        monthlyEMI: finalEMI, totalInterest: Math.round(totalInterest),
        totalRepayment: Math.round(totalPayable), affordability: affordLabel,
        createdAt: new Date()
      })
      setSaved(true)
      addBadge(BADGE_DEFS.find(b => b.id === 'emi_master'))
      incrementReports()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    doc.setFillColor(2, 10, 18); doc.rect(0, 0, 210, 297, 'F')
    doc.setTextColor(34, 211, 238); doc.setFontSize(22); doc.text('FinSure EMI Report', 20, 28)
    doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 38)
    doc.setDrawColor(34, 211, 238); doc.setLineWidth(0.3); doc.line(20, 44, 190, 44)
    doc.setTextColor(240, 249, 255); doc.setFontSize(12)
    const rows = [
      ['Loan Amount', `Rs. ${loanAmount.toLocaleString('en-IN')}`],
      ['Interest Rate', `${interestRate}% p.a.`],
      ['Tenure', `${tenure} Years (${months} months)`],
      ['Monthly EMI', `Rs. ${finalEMI.toLocaleString('en-IN')}`],
      ['Total Interest', `Rs. ${Math.round(totalInterest).toLocaleString('en-IN')}`],
      ['Total Payable', `Rs. ${Math.round(totalPayable).toLocaleString('en-IN')}`],
      ['Affordability', affordLabel],
      ['Income Utilization', `${affordRatio}%`],
    ]
    rows.forEach(([k, v], i) => {
      const y = 58 + i * 16
      doc.setTextColor(148, 163, 184); doc.text(k, 20, y)
      doc.setTextColor(240, 249, 255); doc.text(v, 110, y)
    })
    doc.setFontSize(10); doc.setTextColor(71, 85, 105)
    doc.text(insight, 20, 210, { maxWidth: 170 })
    doc.text('FinSure Financial Intelligence Platform', 20, 270)
    doc.save('FinSure_EMI_Report.pdf')
  }

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-10 pt-20 pb-16">
        <div className="mb-8"><BackBtn to="/" /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="label-mono mb-3">EMI Planner</div>
          <h1 className="display-xl mb-4">EMI Calculator</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Instantly calculate monthly payments with real-time breakdown as you adjust your loan parameters.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sliders */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-6 md:p-10">
            <h2 className="display-md mb-8" style={{ color: 'var(--text-primary)' }}>Loan Parameters</h2>
            <div className="space-y-8">
              <SliderInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} min={50000} max={10000000} step={50000} prefix="₹" />
              <SliderInput label="Annual Interest Rate" value={interestRate} onChange={setInterestRate} min={5} max={24} step={0.1} suffix="%" sublabel="p.a." />
              <SliderInput label="Loan Tenure" value={tenure} onChange={setTenure} min={1} max={30} step={1} suffix=" Yr" />
              <SliderInput label="Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome} min={10000} max={1000000} step={5000} prefix="₹" />
            </div>
            {/* Quick presets */}
            <div className="mt-8">
              <div className="label-mono mb-3">Quick Presets</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Home Loan', amount: 5000000, rate: 8.5, ten: 20 },
                  { label: 'Car Loan', amount: 800000, rate: 9.5, ten: 5 },
                  { label: 'Personal', amount: 300000, rate: 14, ten: 3 },
                  { label: 'Education', amount: 1500000, rate: 9, ten: 10 },
                ].map(p => (
                  <button key={p.label} onClick={() => { setLoanAmount(p.amount); setInterestRate(p.rate); setTenure(p.ten) }}
                    className="btn-outline py-2.5 text-sm rounded-xl">{p.label}</button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-col gap-5">
            {/* EMI hero */}
            <div className="glass rounded-3xl p-6 md:p-10 scanline-wrap"
              style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(8,24,40,0.95))' }}>
              <div className="label-mono mb-3">Monthly EMI</div>
              <div className="text-5xl md:text-6xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--cyan)' }}>
                <AnimNum value={finalEMI} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>per month for {tenure} year{tenure > 1 ? 's' : ''}</p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5">
                <div className="label-mono mb-2" style={{ color: '#818cf8' }}>Total Interest</div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#a5b4fc' }}>
                  <AnimNum value={totalInterest} />
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="label-mono mb-2">Total Payable</div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--text-primary)' }}>
                  <AnimNum value={totalPayable} />
                </div>
              </div>
            </div>

            {/* Donut + affordability */}
            <div className="glass rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-6 mb-5">
                <DonutChart principal={loanAmount} interest={totalInterest} />
                <div className="space-y-3 flex-1">
                  {[
                    { label: 'Principal', color: 'var(--cyan)', pct: totalPayable > 0 ? Math.round((loanAmount / totalPayable) * 100) : 0 },
                    { label: 'Interest', color: '#818cf8', pct: totalPayable > 0 ? Math.round((totalInterest / totalPayable) * 100) : 0 },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span className="ml-auto font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="label-mono mb-2">Income Utilization</div>
              <LiquidBar value={affordRatio} max={100} color={affordColor} />
              <div className="flex justify-between mt-1 text-sm">
                <span style={{ color: affordColor, fontWeight: 600 }}>{affordLabel}</span>
                <span style={{ color: affordColor, fontWeight: 700 }}>{affordRatio}%</span>
              </div>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight}</p>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button onClick={saveReport} disabled={saving || saved}
            className="btn-primary px-8 py-4 text-base flex items-center gap-3" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : saved ? 'Saved to History' : 'Save Report'}
          </button>
          <button onClick={downloadPDF} className="btn-outline px-8 py-4 text-base flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Amortisation table */}
        <div className="glass rounded-3xl p-6 md:p-10 mt-8 overflow-x-auto">
          <h2 className="display-md mb-6" style={{ color: 'var(--text-primary)' }}>Yearly Amortisation Schedule</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(34,211,238,0.15)' }}>
                {['Year', 'Opening Balance', 'EMI Paid', 'Principal', 'Interest', 'Closing Balance'].map(h => (
                  <th key={h} className="label-mono text-left pb-3 pr-4" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(tenure, 30) }, (_, yr) => {
                let balance = loanAmount
                let openBal = 0, totalPrin = 0, totalInt = 0
                for (let y = 0; y <= yr; y++) {
                  openBal = balance; let yp = 0, yi = 0
                  for (let m = 0; m < 12 && (y * 12 + m) < months; m++) {
                    const ip = balance * monthlyRate
                    const pp = Math.min(finalEMI - ip, balance)
                    yi += ip; yp += pp; balance -= pp
                  }
                  if (y === yr) { totalPrin = yp; totalInt = yi }
                }
                return (
                  <tr key={yr} style={{ borderBottom: '1px solid rgba(34,211,238,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {[`Year ${yr + 1}`, `₹${Math.round(openBal).toLocaleString('en-IN')}`,
                      `₹${Math.round(finalEMI * Math.min(12, months - yr * 12)).toLocaleString('en-IN')}`,
                      `₹${Math.round(totalPrin).toLocaleString('en-IN')}`,
                      `₹${Math.round(totalInt).toLocaleString('en-IN')}`,
                      `₹${Math.max(0, Math.round(balance)).toLocaleString('en-IN')}`
                    ].map((v, ci) => (
                      <td key={ci} className="py-3 pr-4"
                        style={{ color: ci === 0 ? 'var(--cyan)' : ci === 4 ? '#a5b4fc' : 'var(--text-secondary)', fontFamily: ci > 0 ? "'Space Grotesk',sans-serif" : undefined, fontWeight: ci > 0 ? 500 : 400 }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  )
}
