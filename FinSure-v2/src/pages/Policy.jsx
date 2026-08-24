import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, SliderInput, LiquidBar, BackBtn, AnimNum } from '../components/UI'
import { BANK_DATA } from '../data/bankRates'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'
import jsPDF from 'jspdf'

const RATES = { home: 8.5, personal: 14, education: 9, car: 10 }

function ApprovalGauge({ value, color }) {
  const r = 56, c = 2 * Math.PI * r, semi = c / 2
  const dash = (value / 100) * semi
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 90, overflow: 'hidden' }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute', top: 0 }}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="14"
          strokeDasharray={`${semi} ${c - semi}`} strokeDashoffset={`${c * 0.25}`} />
        <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={`${c * 0.25}`}
          strokeLinecap="round" className="progress-ring-circle"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color}80)` }} />
      </svg>
      <div className="absolute bottom-0 text-center">
        <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color }}>{value}%</div>
      </div>
    </div>
  )
}

export default function Policy() {
  const [loanType, setLoanType] = useState('')
  const [salary, setSalary] = useState(60000)
  const [loanAmount, setLoanAmount] = useState(2000000)
  const [existingEmi, setExistingEmi] = useState(0)
  const [tenure, setTenure] = useState(10)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  // Live preview
  const previewRate = RATES[loanType] || 10
  const pMR = previewRate / 12 / 100
  const pMonths = tenure * 12
  const previewEMI = pMonths > 0 && loanAmount > 0
    ? Math.round((loanAmount * pMR * Math.pow(1 + pMR, pMonths)) / (Math.pow(1 + pMR, pMonths) - 1))
    : 0
  const previewRatio = salary > 0 ? Math.round(((previewEMI + existingEmi) / salary) * 100) : 0

  const analyzeLoan = async () => {
    if (!loanType) return
    if (salary <= 0 || salary > 10000000) return
    if (loanAmount <= 0 || loanAmount > 100000000) return
    if (tenure <= 0 || tenure > 30) return
    setLoading(true)
    const interest = RATES[loanType] || 10
    const mRate = interest / 12 / 100
    const months = tenure * 12
    const emi = Math.round((loanAmount * mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1))
    const totalLiability = emi + existingEmi
    const ratio = Math.round((totalLiability / salary) * 100)
    let approval, risk, insight, color, banks

    if (ratio <= 35) {
      approval = 90; risk = 'Low Financial Risk'; color = '#22c55e'
      insight = 'Strong financial profile. Debt-to-income ratio is within ideal lending limits. Most banks will approve this application.'
      banks = [
        { name: 'SBI', reason: 'Best suited for salaried applicants. Competitive rates with zero prepayment charges.', rate: `${interest}%`, tag: 'Best Rate' },
        { name: 'HDFC Bank', reason: 'Fast digital processing. Flexible repayment with prepayment options.', rate: `${(interest + 0.6).toFixed(1)}%`, tag: 'Fast Approval' },
        { name: 'ICICI Bank', reason: 'Excellent online account management. Pre-approved offers available.', rate: `${(interest + 0.9).toFixed(1)}%`, tag: 'Digital First' },
      ]
    } else if (ratio <= 50) {
      approval = 70; risk = 'Moderate Financial Pressure'; color = '#eab308'
      insight = 'Moderate repayment burden. Approval is likely with stable income track record. Consider reducing existing EMIs or increasing down payment.'
      banks = [
        { name: 'ICICI Bank', reason: 'Good for moderate profiles with digital verification.', rate: `${(interest + 0.9).toFixed(1)}%`, tag: '' },
        { name: 'Axis Bank', reason: 'Flexible repayment structures for moderate debt obligations.', rate: `${(interest + 1.2).toFixed(1)}%`, tag: '' },
        { name: 'Kotak Mahindra', reason: 'Considers alternate income sources. Good for business owners.', rate: `${(interest + 1.4).toFixed(1)}%`, tag: '' },
      ]
    } else {
      approval = 45; risk = 'High Financial Risk'; color = '#ef4444'
      insight = 'High repayment burden. Standard bank approval unlikely. Consider a smaller loan amount, longer tenure, or co-applicant.'
      banks = [
        { name: 'NBFC Lenders', reason: 'Higher approval rate for borderline profiles but elevated interest rates.', rate: '11%+', tag: 'Higher Risk' },
        { name: 'Private Banks', reason: 'May consider if you have strong repayment history. Documentation-intensive.', rate: `${(interest + 2).toFixed(1)}%`, tag: '' },
      ]
    }

    try {
      await addDoc(collection(db, 'reports'), {
        userEmail: auth.currentUser?.email,
        loanType, salary, loanAmount, existingEmi, tenure,
        emi, approval, ratio, risk, insight, createdAt: new Date()
      })
    } catch (err) { console.error(err) }

    setResult({ emi, approval, ratio, risk, insight, color, banks, interest })
    setLoading(false)
  }

  const downloadReport = () => {
    if (!result) return
    const doc = new jsPDF()
    doc.setFillColor(2, 10, 18); doc.rect(0, 0, 210, 297, 'F')
    doc.setTextColor(34, 211, 238); doc.setFontSize(22); doc.text('FinSure Loan Feasibility Report', 20, 28)
    doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 38)
    doc.setDrawColor(34, 211, 238); doc.setLineWidth(0.3); doc.line(20, 44, 190, 44)
    doc.setTextColor(240, 249, 255); doc.setFontSize(12)
    const rows = [
      ['Loan Type', loanType.toUpperCase()],
      ['Monthly Salary', `Rs. ${salary.toLocaleString('en-IN')}`],
      ['Loan Amount', `Rs. ${loanAmount.toLocaleString('en-IN')}`],
      ['Existing EMI', `Rs. ${existingEmi.toLocaleString('en-IN')}`],
      ['Tenure', `${tenure} Years`],
      ['Estimated EMI', `Rs. ${result.emi.toLocaleString('en-IN')}`],
      ['Approval Probability', `${result.approval}%`],
      ['EMI Burden Ratio', `${result.ratio}%`],
      ['Risk Assessment', result.risk],
    ]
    rows.forEach(([k, v], i) => {
      const y = 58 + i * 16
      doc.setTextColor(148, 163, 184); doc.text(k, 20, y)
      doc.setTextColor(240, 249, 255); doc.text(v, 100, y)
    })
    doc.setFontSize(10); doc.setTextColor(71, 85, 105)
    doc.text(result.insight, 20, 220, { maxWidth: 170 })
    doc.text('FinSure Financial Intelligence Platform', 20, 270)
    doc.save('FinSure_Loan_Report.pdf')
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-10 pt-20 pb-16">
        <div className="mb-8"><BackBtn to="/" /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="label-mono mb-3">Loan Analyzer</div>
          <h1 className="display-xl mb-4">Loan Feasibility Analyzer</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Analyze repayment pressure, approval probability, and get personalized bank recommendations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 glass rounded-3xl p-6 md:p-10">
            <h2 className="display-md mb-8" style={{ color: 'var(--text-primary)' }}>Loan Details</h2>
            <div className="space-y-7">
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
              <SliderInput label="Monthly Salary" value={salary} onChange={setSalary} min={15000} max={500000} step={5000} prefix="₹" />
              <SliderInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} min={100000} max={10000000} step={100000} prefix="₹" />
              <SliderInput label="Existing Monthly EMI" value={existingEmi} onChange={setExistingEmi} min={0} max={100000} step={1000} prefix="₹" />
              <SliderInput label="Tenure" value={tenure} onChange={setTenure} min={1} max={30} step={1} suffix=" Years" />
            </div>
            <button onClick={analyzeLoan} disabled={loading || !loanType}
              className="btn-primary w-full py-4 text-base mt-8 flex items-center justify-center gap-3"
              style={{ opacity: (!loanType || loading) ? 0.6 : 1 }}>
              {loading ? 'Analyzing...' : 'Analyze Financial Feasibility'}
            </button>
          </motion.div>

          {/* Live Preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-5">
            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-4">Live Preview</div>
              <div className="space-y-5">
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Estimated Monthly EMI</div>
                  <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--cyan)' }}>
                    {previewEMI > 0 ? `₹${previewEMI.toLocaleString('en-IN')}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>EMI Burden Ratio</div>
                  <LiquidBar value={previewRatio} max={100}
                    color={previewRatio > 50 ? '#ef4444' : previewRatio > 35 ? '#eab308' : '#22c55e'} />
                  <div className="flex justify-between mt-1 text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>0%</span>
                    <span style={{ color: previewRatio > 50 ? '#ef4444' : previewRatio > 35 ? '#eab308' : '#22c55e', fontWeight: 700 }}>{previewRatio}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>100%</span>
                  </div>
                </div>
                {loanType && <div className="flex justify-between text-sm pt-2 border-t" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rate</span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{RATES[loanType]}% p.a.</span>
                </div>}
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="label-mono mb-4">Risk Thresholds</div>
              {[
                { range: '0–35%', label: 'Low Risk', color: '#22c55e', note: 'High approval probability' },
                { range: '35–50%', label: 'Moderate', color: '#eab308', note: 'Conditional approval' },
                { range: '50%+', label: 'High Risk', color: '#ef4444', note: 'Likely rejection' },
              ].map(r => (
                <div key={r.range} className="flex items-start gap-3 text-sm py-2 border-b" style={{ borderColor: 'rgba(34,211,238,0.06)' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: r.color }} />
                  <div>
                    <span style={{ color: r.color, fontWeight: 600 }}>{r.range} — {r.label}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{r.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Full Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass rounded-3xl p-8 flex flex-col items-center text-center">
                  <div className="label-mono mb-4">Approval Probability</div>
                  <ApprovalGauge value={result.approval} color={result.color} />
                  <div className="mt-4 font-bold" style={{ color: result.color, fontFamily: "'Space Grotesk',sans-serif" }}>{result.risk}</div>
                </div>
                <div className="glass rounded-3xl p-8">
                  <div className="label-mono mb-5">Loan Metrics</div>
                  <div className="space-y-4">
                    {[
                      { label: 'Estimated EMI', val: `₹${result.emi.toLocaleString('en-IN')}`, color: 'var(--cyan)' },
                      { label: 'EMI Burden Ratio', val: `${result.ratio}%`, color: result.color },
                      { label: 'Interest Rate', val: `${result.interest}% p.a.`, color: 'var(--text-primary)' },
                      { label: 'Tenure', val: `${tenure} Years`, color: 'var(--text-primary)' },
                    ].map(m => (
                      <div key={m.label} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                        <span style={{ color: m.color, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{m.val}</span>
                      </div>
                    ))}
                    <LiquidBar value={result.approval} max={100} color={result.color} label="Approval Chance" />
                  </div>
                </div>
                <div className="glass rounded-3xl p-8">
                  <div className="label-mono mb-4">Assessment</div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.insight}</p>
                </div>
              </div>

              {/* Bank recommendations */}
              <div className="glass rounded-3xl p-7 md:p-10">
                <div className="label-mono mb-6">Suggested Banking Profiles</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {result.banks.map((bank, i) => (
                    <motion.div key={i} whileHover={{ y: -4 }} transition={{ duration: 0.15 }}
                      className="rounded-2xl p-6" style={{ background: 'rgba(4,15,26,0.9)', border: '1px solid rgba(34,211,238,0.1)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--cyan)' }}>{bank.name}</h3>
                        {bank.tag && <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}>{bank.tag}</span>}
                      </div>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{bank.reason}</p>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Rate: <span style={{ color: 'var(--cyan)' }}>{bank.rate}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={downloadReport} className="btn-primary px-10 py-4 text-base flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  {downloaded ? 'Downloaded' : 'Download Full Report'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
