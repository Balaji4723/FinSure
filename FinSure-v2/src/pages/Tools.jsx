import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, SliderInput, AnimNum, LiquidBar, BackBtn, SectionHeader } from '../components/UI'
import { useStore } from '../store/useStore'
import { BADGE_DEFS } from '../utils/badges'

/* ── Tax Calculator (Sec 80C + 24B) ── */
function TaxCalculator() {
  const { addBadge } = useStore()
  const [loanAmount, setLoanAmount] = useState(3000000)
  const [rate, setRate] = useState(8.5)
  const [salary, setSalary] = useState(1200000)
  const [ran, setRan] = useState(false)

  const months = 12, mRate = rate / 12 / 100, emi = months > 0 && mRate > 0
    ? Math.round((loanAmount * mRate * Math.pow(1+mRate,240)) / (Math.pow(1+mRate,240)-1)) : 0
  const annualEMI = emi * 12
  const principalFirstYear = Math.round(annualEMI * 0.35)
  const interestFirstYear = Math.round(annualEMI * 0.65)
  const sec80C = Math.min(principalFirstYear, 150000)
  const sec24B = Math.min(interestFirstYear, 200000)
  const totalDeduction = sec80C + sec24B
  const taxSlab = salary > 1500000 ? 0.30 : salary > 1200000 ? 0.20 : salary > 900000 ? 0.15 : salary > 600000 ? 0.10 : 0.05
  const taxSaving = Math.round(totalDeduction * taxSlab)

  const calculate = () => {
    setRan(true)
    addBadge(BADGE_DEFS.find(b => b.id === 'tax_saver'))
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-7 md:p-10">
        <div className="label-mono mb-6">Section 80C + 24B Tax Calculator</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SliderInput label="Home Loan Amount" value={loanAmount} onChange={setLoanAmount} min={500000} max={10000000} step={100000} prefix="₹" />
          <SliderInput label="Interest Rate" value={rate} onChange={setRate} min={7} max={15} step={0.1} suffix="%" sublabel="p.a." />
          <SliderInput label="Annual Income" value={salary} onChange={setSalary} min={300000} max={5000000} step={50000} prefix="₹" />
        </div>
        <button onClick={calculate} className="btn-primary px-8 py-3 text-sm">Calculate Tax Savings</button>
      </div>

      <AnimatePresence>
        {ran && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { label:'Section 80C Deduction', val:`₹${sec80C.toLocaleString('en-IN')}`, color:'var(--cyan)', note:'On principal repayment (max ₹1.5L)' },
              { label:'Section 24B Deduction', val:`₹${sec24B.toLocaleString('en-IN')}`, color:'#818cf8', note:'On interest paid (max ₹2L)' },
              { label:'Total Tax Deduction', val:`₹${totalDeduction.toLocaleString('en-IN')}`, color:'#22c55e', note:'Combined 80C + 24B' },
              { label:'Estimated Tax Saved', val:`₹${taxSaving.toLocaleString('en-IN')}`, color:'#eab308', note:`At ${(taxSlab*100).toFixed(0)}% tax slab` },
            ].map(m => (
              <div key={m.label} className="glass rounded-2xl p-6">
                <div className="label-mono mb-2" style={{ color:'var(--text-muted)', fontSize:'9px' }}>{m.label}</div>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily:"'Space Grotesk',sans-serif", color:m.color }}>{m.val}</div>
                <div className="text-xs" style={{ color:'var(--text-muted)' }}>{m.note}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Prepayment Optimizer ── */
function PrepaymentOptimizer() {
  const { addBadge } = useStore()
  const [loan, setLoan] = useState(3000000)
  const [rate, setRate] = useState(8.5)
  const [tenure, setTenure] = useState(20)
  const [extra, setExtra] = useState(5000)
  const [ran, setRan] = useState(false)

  const months = tenure * 12, mRate = rate / 12 / 100
  const emi = Math.round((loan * mRate * Math.pow(1+mRate,months)) / (Math.pow(1+mRate,months)-1))
  const totalNormal = emi * months
  const totalInterestNormal = totalNormal - loan

  // Calculate with prepayment
  let bal = loan, monthsPaid = 0, totalPaid = 0
  while (bal > 0 && monthsPaid < months) {
    const intPmt = bal * mRate
    const prinPmt = Math.min(emi + extra - intPmt, bal)
    bal -= prinPmt
    totalPaid += emi + extra
    monthsPaid++
  }
  const interestSaved = totalInterestNormal - (totalPaid - loan)
  const yearsSaved = Math.round((months - monthsPaid) / 12 * 10) / 10

  const calculate = () => {
    setRan(true)
    addBadge(BADGE_DEFS.find(b => b.id === 'prepay_optimizer'))
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-7 md:p-10">
        <div className="label-mono mb-6">Prepayment Optimizer</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <SliderInput label="Loan Amount" value={loan} onChange={setLoan} min={500000} max={10000000} step={100000} prefix="₹" />
          <SliderInput label="Interest Rate" value={rate} onChange={setRate} min={7} max={20} step={0.1} suffix="%" />
          <SliderInput label="Tenure" value={tenure} onChange={setTenure} min={5} max={30} step={1} suffix=" Yrs" />
          <SliderInput label="Extra Monthly Payment" value={extra} onChange={setExtra} min={500} max={50000} step={500} prefix="₹" />
        </div>
        <button onClick={calculate} className="btn-primary px-8 py-3 text-sm">Show Savings</button>
      </div>

      <AnimatePresence>
        {ran && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label:'Monthly EMI', val:`₹${emi.toLocaleString('en-IN')}`, color:'var(--cyan)' },
              { label:'With Extra Payment', val:`₹${(emi+extra).toLocaleString('en-IN')}`, color:'#818cf8' },
              { label:'Interest Saved', val:`₹${Math.round(interestSaved).toLocaleString('en-IN')}`, color:'#22c55e' },
              { label:'Loan Closes', val:`${yearsSaved} yrs earlier`, color:'#eab308' },
            ].map(m => (
              <div key={m.label} className="glass rounded-2xl p-6 text-center scanline-wrap">
                <div className="label-mono mb-2" style={{ color:'var(--text-muted)', fontSize:'9px' }}>{m.label}</div>
                <div className="text-2xl font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif", color:m.color }}>{m.val}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Retirement SIP Projector ── */
function RetirementCalc() {
  const [monthly, setMonthly] = useState(10000)
  const [returnRate, setReturnRate] = useState(12)
  const [years, setYears] = useState(30)

  const months = years * 12, r = returnRate / 12 / 100
  const corpus = Math.round(monthly * ((Math.pow(1+r, months) - 1) / r) * (1+r))
  const invested = monthly * months
  const gains = corpus - invested

  return (
    <div className="glass rounded-3xl p-7 md:p-10">
      <div className="label-mono mb-6">Retirement SIP Projector</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SliderInput label="Monthly SIP" value={monthly} onChange={setMonthly} min={500} max={100000} step={500} prefix="₹" />
        <SliderInput label="Expected Return" value={returnRate} onChange={setReturnRate} min={6} max={24} step={0.5} suffix="%" sublabel="p.a." />
        <SliderInput label="Investment Period" value={years} onChange={setYears} min={5} max={40} step={1} suffix=" Yrs" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label:'Total Invested', val:`₹${invested.toLocaleString('en-IN')}`, color:'var(--cyan)' },
          { label:'Estimated Gains', val:`₹${gains.toLocaleString('en-IN')}`, color:'#22c55e' },
          { label:'Retirement Corpus', val:`₹${corpus.toLocaleString('en-IN')}`, color:'#eab308' },
        ].map(m => (
          <div key={m.label} className="rounded-2xl p-6 text-center" style={{ background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.1)' }}>
            <div className="label-mono mb-2" style={{ color:'var(--text-muted)', fontSize:'9px' }}>{m.label}</div>
            <div className="text-2xl font-bold" style={{ fontFamily:"'Space Grotesk',sans-serif", color:m.color }}>{m.val}</div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <LiquidBar value={gains} max={corpus} color="#22c55e" label="Gains vs Corpus" />
      </div>
    </div>
  )
}

/* ── Debt Snowball / Avalanche ── */
function DebtPlanner() {
  const { addBadge } = useStore()
  const [debts, setDebts] = useState([
    { id:1, name:'Credit Card', balance:50000, rate:36, minPay:2000 },
    { id:2, name:'Personal Loan', balance:200000, rate:14, minPay:5000 },
    { id:3, name:'Car Loan', balance:400000, rate:9, minPay:8000 },
  ])
  const [method, setMethod] = useState('avalanche')
  const [extraPay, setExtraPay] = useState(5000)

  const sorted = method === 'avalanche'
    ? [...debts].sort((a,b) => b.rate - a.rate)
    : [...debts].sort((a,b) => a.balance - b.balance)

  const totalDebt = debts.reduce((s,d) => s+d.balance, 0)
  const totalMin = debts.reduce((s,d) => s+d.minPay, 0)

  return (
    <div className="glass rounded-3xl p-7 md:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="label-mono">Debt Elimination Planner</div>
        <div className="flex gap-2">
          {['avalanche', 'snowball'].map(m => (
            <button key={m} onClick={() => { setMethod(m); addBadge(BADGE_DEFS.find(b=>b.id==='debt_free_path')) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${method===m?'btn-primary':'btn-outline'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm" style={{ color:'var(--text-secondary)' }}>
        {method==='avalanche' ? 'Avalanche: Pay highest interest rate first — mathematically optimal, saves most money.' : 'Snowball: Pay smallest balance first — psychologically motivating, faster wins.'}
      </p>
      <SliderInput label="Extra Monthly Payment" value={extraPay} onChange={setExtraPay} min={0} max={30000} step={500} prefix="₹" />
      <div className="space-y-3">
        {sorted.map((d, i) => (
          <div key={d.id} className={`flex items-center gap-5 p-4 rounded-2xl transition-all ${i===0?'border':'border'}`}
            style={{ background:i===0?'rgba(34,211,238,0.06)':'rgba(34,211,238,0.02)', borderColor:i===0?'rgba(34,211,238,0.3)':'rgba(34,211,238,0.08)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background:i===0?'var(--cyan)':'rgba(34,211,238,0.1)', color:i===0?'#020a12':'var(--cyan)' }}>{i+1}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm" style={{ color:'var(--text-primary)', fontFamily:"'Space Grotesk',sans-serif" }}>{d.name}</div>
              <LiquidBar value={d.balance} max={Math.max(...debts.map(x=>x.balance))} color={i===0?'var(--cyan)':'rgba(34,211,238,0.4)'} height={4} showPct={false} />
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-sm" style={{ color:'var(--cyan)', fontFamily:"'Space Grotesk',sans-serif" }}>₹{d.balance.toLocaleString('en-IN')}</div>
              <div className="text-xs" style={{ color:i===0?'#ef4444':'var(--text-muted)' }}>{d.rate}% p.a.</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-5 text-sm pt-2">
        <span style={{ color:'var(--text-muted)' }}>Total debt: <strong style={{ color:'var(--text-primary)' }}>₹{totalDebt.toLocaleString('en-IN')}</strong></span>
        <span style={{ color:'var(--text-muted)' }}>Monthly commitment: <strong style={{ color:'var(--cyan)' }}>₹{(totalMin+extraPay).toLocaleString('en-IN')}</strong></span>
      </div>
    </div>
  )
}

/* ── Net Worth Tracker ── */
function NetWorthTracker() {
  const { netWorth, setNetWorth, addBadge } = useStore()
  const [assets, setAssets] = useState(netWorth.assets.length ? netWorth.assets : [
    { id:1, label:'Savings Account', value:200000 },
    { id:2, label:'Mutual Funds', value:500000 },
    { id:3, label:'Property', value:5000000 },
  ])
  const [liabilities, setLiabilities] = useState(netWorth.liabilities.length ? netWorth.liabilities : [
    { id:1, label:'Home Loan', value:3000000 },
    { id:2, label:'Car Loan', value:300000 },
  ])

  const totalA = assets.reduce((s,a) => s+a.value, 0)
  const totalL = liabilities.reduce((s,l) => s+l.value, 0)
  const netW = totalA - totalL

  const save = () => { setNetWorth({ assets, liabilities }); addBadge(BADGE_DEFS.find(b=>b.id==='net_worth_tracker')) }

  const update = (list, setList, id, field, val) => setList(list.map(i => i.id===id ? {...i,[field]:val} : i))

  return (
    <div className="glass rounded-3xl p-7 md:p-10">
      <div className="label-mono mb-6">Net Worth Tracker</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div>
          <div className="text-sm font-semibold mb-3" style={{ color:'#22c55e' }}>Assets</div>
          {assets.map(a => (
            <div key={a.id} className="flex gap-3 mb-3">
              <input value={a.label} onChange={e=>update(assets,setAssets,a.id,'label',e.target.value)}
                className="fin-input flex-1" style={{ padding:'10px 14px', fontSize:'13px' }} />
              <input type="number" value={a.value} onChange={e=>update(assets,setAssets,a.id,'value',Number(e.target.value))}
                className="fin-input w-32" style={{ padding:'10px 14px', fontSize:'13px' }} />
            </div>
          ))}
        </div>
        <div>
          <div className="text-sm font-semibold mb-3" style={{ color:'#ef4444' }}>Liabilities</div>
          {liabilities.map(l => (
            <div key={l.id} className="flex gap-3 mb-3">
              <input value={l.label} onChange={e=>update(liabilities,setLiabilities,l.id,'label',e.target.value)}
                className="fin-input flex-1" style={{ padding:'10px 14px', fontSize:'13px' }} />
              <input type="number" value={l.value} onChange={e=>update(liabilities,setLiabilities,l.id,'value',Number(e.target.value))}
                className="fin-input w-32" style={{ padding:'10px 14px', fontSize:'13px' }} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[
          { label:'Total Assets', val:`₹${totalA.toLocaleString('en-IN')}`, color:'#22c55e' },
          { label:'Total Liabilities', val:`₹${totalL.toLocaleString('en-IN')}`, color:'#ef4444' },
          { label:'Net Worth', val:`₹${netW.toLocaleString('en-IN')}`, color:netW>=0?'var(--cyan)':'#ef4444' },
        ].map(m=>(
          <div key={m.label} className="rounded-2xl p-5 text-center" style={{ background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.1)' }}>
            <div className="label-mono mb-1" style={{ fontSize:'9px', color:'var(--text-muted)' }}>{m.label}</div>
            <div className="text-xl font-bold" style={{ color:m.color, fontFamily:"'Space Grotesk',sans-serif" }}>{m.val}</div>
          </div>
        ))}
      </div>
      <button onClick={save} className="btn-primary px-8 py-3 text-sm">Save Net Worth</button>
    </div>
  )
}

const TOOL_TABS = [
  { id:'tax', label:'Tax Savings', icon:'TAX', component: TaxCalculator },
  { id:'prepay', label:'Prepay Optimizer', icon:'PRE', component: PrepaymentOptimizer },
  { id:'sip', label:'Retirement SIP', icon:'SIP', component: RetirementCalc },
  { id:'debt', label:'Debt Planner', icon:'DBT', component: DebtPlanner },
  { id:'networth', label:'Net Worth', icon:'NW', component: NetWorthTracker },
]

export default function Tools() {
  const [active, setActive] = useState('tax')
  const ActiveTool = TOOL_TABS.find(t => t.id === active)?.component

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>
        <SectionHeader eyebrow="Smart Tools" title="Financial Power Tools" subtitle="Five specialized calculators built on real formulas and real data." />

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 rounded-2xl" style={{ background:'rgba(8,24,40,0.8)', border:'1px solid rgba(34,211,238,0.1)' }}>
          {TOOL_TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background:active===t.id?'var(--cyan)':'transparent', color:active===t.id?'#020a12':'var(--text-secondary)', border:'none', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>
              t.label
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:.25 }}>
            {ActiveTool && <ActiveTool />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
