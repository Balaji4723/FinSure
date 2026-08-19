import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, SliderInput, AnimNum, LiquidBar, SectionHeader, BackBtn } from '../components/UI'
import { BANK_DATA, LOAN_TYPE_KEY } from '../data/bankRates'
import { useBankRates } from '../hooks/useBankRates'
import { useStore } from '../store/useStore'
import { BADGE_DEFS } from '../utils/badges'

function calcEMI(principal, annualRate, months) {
  const r = annualRate / 12 / 100
  if (r === 0) return principal / months
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

export default function Compare() {
  const { banks, source } = useBankRates()
  const { addBadge } = useStore()
  const [loanType, setLoanType] = useState('Home Loan')
  const [amount, setAmount] = useState(2000000)
  const [tenure, setTenure] = useState(20)
  const [selectedBanks, setSelectedBanks] = useState(['SBI', 'HDFC', 'ICICI'])
  const key = LOAN_TYPE_KEY[loanType]

  const toggleBank = (bank) => {
    if (selectedBanks.includes(bank)) {
      if (selectedBanks.length > 1) setSelectedBanks(prev => prev.filter(b => b !== bank))
    } else {
      if (selectedBanks.length < 3) {
        const next = [...selectedBanks, bank]
        setSelectedBanks(next)
        if (next.length === 3) addBadge(BADGE_DEFS.find(b => b.id === 'comparison_pro'))
      }
    }
  }

  const comparisons = selectedBanks.map(bname => {
    const b = banks.find(x => x.bank === bname)
    if (!b) return null
    const rate = b[key].min
    const months = tenure * 12
    const emi = Math.round(calcEMI(amount, rate, months))
    const total = emi * months
    const interest = total - amount
    return { ...b, rate, emi, total, interest, months }
  }).filter(Boolean)

  const best = comparisons.length ? comparisons.reduce((a, b) => a.emi < b.emi ? a : b) : null
  const maxEMI = Math.max(...comparisons.map(c => c.emi), 1)

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="label-mono mb-3">Bank Comparison Engine</div>
          <h1 className="display-xl mb-4">Compare <span className="shimmer-text">10 Banks</span> Live</h1>
          <p className="max-w-2xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
            Real published rates from 10 Indian banks. Select up to 3 and compare side by side.
            <br /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Source: {source}</span>
          </p>
        </motion.div>

        {/* Controls */}
        <div className="glass rounded-3xl p-7 md:p-10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="label-mono block mb-2">Loan Type</label>
              <select value={loanType} onChange={e => setLoanType(e.target.value)} className="fin-input fin-select">
                {Object.keys(LOAN_TYPE_KEY).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <SliderInput label="Loan Amount" value={amount} onChange={setAmount} min={100000} max={10000000} step={100000} prefix="₹" />
            <SliderInput label="Tenure" value={tenure} onChange={setTenure} min={1} max={30} step={1} suffix=" Yrs" />
          </div>

          {/* Bank selector pills */}
          <div className="label-mono mb-4">Select up to 3 Banks</div>
          <div className="flex flex-wrap gap-3">
            {banks.map(b => {
              const sel = selectedBanks.includes(b.bank)
              return (
                <motion.button key={b.bank} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => toggleBank(b.bank)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  style={{
                    background: sel ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.04)',
                    border: sel ? '1px solid rgba(34,211,238,0.5)' : '1px solid rgba(34,211,238,0.1)',
                    color: sel ? 'var(--cyan)' : 'var(--text-secondary)',
                    boxShadow: sel ? '0 0 16px rgba(34,211,238,0.2)' : 'none',
                    cursor: 'pointer'
                  }}>
                  {sel && <span style={{fontWeight:700}}>+</span>}
                  {b.bank}
                  <span className="text-xs" style={{ color: sel ? 'var(--cyan)' : 'var(--text-muted)', opacity: .7 }}>
                    {b[key].min}%
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Comparison cards */}
        <AnimatePresence mode="popLayout">
          {comparisons.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {comparisons.map((c, i) => (
                <motion.div key={c.bank} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass holo-card rounded-3xl p-7 relative overflow-hidden"
                  style={{ border: c.bank === best?.bank ? '1px solid rgba(34,211,238,0.5)' : undefined,
                    boxShadow: c.bank === best?.bank ? '0 0 40px rgba(34,211,238,0.15)' : undefined }}>
                  {c.bank === best?.bank && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.3)' }}>
                      Best Rate
                    </div>
                  )}
                  <div className="label-mono mb-1" style={{ color: c.type === 'Public' ? 'var(--cyan)' : 'var(--purple)' }}>{c.type} Bank</div>
                  <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--text-primary)' }}>{c.bank}</h3>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{c.fullName}</p>

                  <div className="text-4xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--cyan)' }}>
                    ₹<AnimNum value={c.emi} prefix="" />
                  </div>
                  <div className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>per month @ {c.rate}% p.a.</div>

                  <LiquidBar value={c.emi} max={maxEMI} color={c.bank === best?.bank ? '#22d3ee' : '#818cf8'} label="EMI Relative" />

                  <div className="mt-6 space-y-3">
                    {[
                      ['Interest Rate', `${c.rate}%`],
                      ['Total Interest', `₹${Math.round(c.interest).toLocaleString('en-IN')}`],
                      ['Total Payable', `₹${Math.round(c.total).toLocaleString('en-IN')}`],
                      ['Processing Fee', c.processingFee],
                      ['Max Tenure', `${c.maxTenure} yrs`],
                      ['Min CIBIL', c.minCreditScore],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm border-b pb-2" style={{ borderColor: 'rgba(34,211,238,0.06)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <div className="label-mono mb-2" style={{ fontSize: '9px' }}>Features</div>
                    <div className="space-y-1.5">
                      {c.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{color:'var(--green)',fontWeight:700}}>+</span> {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating stars */}
                  <div className="flex items-center gap-2 mt-5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{color:s<=Math.round(c.rating)?'#eab308':'rgba(234,179,8,0.2)',fontSize:'12px',fontFamily:"'Space Grotesk',sans-serif"}}>*</span>
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.rating}/5</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary table */}
        {comparisons.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-7 md:p-10 overflow-x-auto">
            <div className="label-mono mb-6">Comparison Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(34,211,238,0.15)' }}>
                  {['Bank', 'Rate', 'Monthly EMI', 'Total Interest', 'Total Cost', 'Processing Fee'].map(h => (
                    <th key={h} className="label-mono text-left pb-3 pr-5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisons.map(c => (
                  <tr key={c.bank} style={{ borderBottom: '1px solid rgba(34,211,238,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="py-4 pr-5 font-bold" style={{ color: c.bank === best?.bank ? 'var(--cyan)' : 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>
                      {c.bank} {c.bank === best?.bank && <span style={{color:'var(--cyan)'}}>*</span>}
                    </td>
                    <td className="py-4 pr-5" style={{ color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif" }}>{c.rate}%</td>
                    <td className="py-4 pr-5" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>₹{c.emi.toLocaleString('en-IN')}</td>
                    <td className="py-4 pr-5" style={{ color: '#a5b4fc', fontFamily: "'Space Grotesk',sans-serif" }}>₹{Math.round(c.interest).toLocaleString('en-IN')}</td>
                    <td className="py-4 pr-5" style={{ color: 'var(--text-secondary)', fontFamily: "'Space Grotesk',sans-serif" }}>₹{Math.round(c.total).toLocaleString('en-IN')}</td>
                    <td className="py-4 pr-5" style={{ color: 'var(--text-secondary)' }}>{c.processingFee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {best && (
              <div className="mt-6 px-5 py-4 rounded-2xl" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Best deal: <strong style={{ color: 'var(--cyan)' }}>{best.fullName}</strong> saves you{' '}
                  <strong style={{ color: '#22c55e' }}>
                    ₹{Math.round(Math.max(...comparisons.map(c => c.interest)) - best.interest).toLocaleString('en-IN')}
                  </strong>{' '}in total interest vs the highest-rate option.
                </span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageShell>
  )
}
