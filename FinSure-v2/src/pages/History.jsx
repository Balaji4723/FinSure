import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase'
import Navbar from '../components/Navbar'
import { PageShell, BackBtn, LiquidBar } from '../components/UI'

const TABS = ['All', 'Loan Reports', 'Eligibility', 'EMI Plans']

function Badge({ label }) {
  const styles = {
    'Low Financial Risk': { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
    'Moderate Financial Pressure': { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.2)' },
    'High Financial Risk': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
    'Comfortable': { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
    'Manageable': { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.2)' },
    'High Burden': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  }
  const s = styles[label] || { bg: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: 'rgba(34,211,238,0.2)' }
  return (
    <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{label}</span>
  )
}

function ReportCard({ report, type, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const date = report.createdAt?.toDate?.()
    ? new Date(report.createdAt.toDate()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const title = type === 'loan' ? `${report.loanType?.toUpperCase() || '—'} Loan`
    : type === 'emi' ? 'EMI Planning Report'
    : `${report.loanType || 'Eligibility'} Analysis`

  const typeLabel = type === 'loan' ? 'Loan Report' : type === 'emi' ? 'EMI Plan' : 'Eligibility'
  const typeColor = type === 'loan' ? 'var(--cyan)' : type === 'emi' ? '#818cf8' : '#22c55e'

  const metrics = type === 'loan'
    ? [{ l: 'Salary', v: `₹${Number(report.salary).toLocaleString('en-IN')}` }, { l: 'EMI', v: `₹${Number(report.emi).toLocaleString('en-IN')}` }, { l: 'Approval', v: `${report.approval}%` }]
    : type === 'emi'
    ? [{ l: 'Loan', v: `₹${Number(report.loanAmount).toLocaleString('en-IN')}` }, { l: 'Monthly EMI', v: `₹${Number(report.monthlyEMI).toLocaleString('en-IN')}` }, { l: 'Rate', v: `${report.interestRate}%` }]
    : [{ l: 'Score', v: `${report.readinessScore}/100` }, { l: 'Eligible', v: `₹${Number(report.eligibleLoan).toLocaleString('en-IN')}` }, { l: 'CIBIL', v: report.creditScore || '—' }]

  const details = type === 'loan'
    ? [['Loan Amount', `₹${Number(report.loanAmount).toLocaleString('en-IN')}`], ['Existing EMI', `₹${Number(report.existingEmi).toLocaleString('en-IN')}`], ['Tenure', `${report.tenure} Yrs`], ['EMI Ratio', `${report.ratio}%`]]
    : type === 'emi'
    ? [['Tenure', `${report.tenure} Yrs`], ['Total Repayment', `₹${Number(report.totalRepayment).toLocaleString('en-IN')}`], ['Income', `₹${Number(report.monthlyIncome).toLocaleString('en-IN')}`]]
    : [['Salary', `₹${Number(report.salary).toLocaleString('en-IN')}`], ['Age', report.age || '—'], ['Employment', report.employmentType || '—'], ['Health', report.health || '—']]

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="glass rounded-2xl overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="label-mono" style={{ color: typeColor, fontSize: '10px' }}>{typeLabel}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{date}</span>
            </div>
            <div className="font-bold text-base" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0">
            {type === 'loan' && report.risk && <Badge label={report.risk} />}
            {type === 'emi' && report.affordability && <Badge label={report.affordability} />}
            <button onClick={() => onDelete(report.id)}
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {metrics.map(m => (
            <div key={m.l} className="rounded-xl p-3" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
              <div style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, marginTop: 2, fontSize: '14px' }}>{m.v}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="mt-4 text-xs flex items-center gap-1.5 transition-colors"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          {expanded ? 'Show less' : 'Show more'}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 md:px-6 pb-5 border-t pt-4" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {details.map(([k, v]) => (
                  <div key={k}><span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Empty({ label }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
        style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
        </svg>
      </div>
      <h3 className="font-semibold mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif", color: 'var(--text-primary)' }}>No {label} yet</h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Run an analysis and save — results appear here.</p>
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [emiReports, setEmiReports] = useState([])
  const [eligibilityReports, setEligibilityReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return }
      try {
        const email = user.email
        const [rSnap, eSnap, mSnap] = await Promise.all([
          getDocs(collection(db, 'reports')),
          getDocs(collection(db, 'emiReports')),
          getDocs(collection(db, 'eligibilityReports')),
        ])
        setReports(rSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.userEmail === email))
        setEmiReports(mSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.userEmail === email))
        setEligibilityReports(eSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.userEmail === email))
      } catch (err) { console.error(err) }
      setLoading(false)
    })
    return () => unsub()
  }, [navigate])

  const del = async (id, col, setter) => {
    try { await deleteDoc(doc(db, col, id)); setter(prev => prev.filter(r => r.id !== id)) }
    catch (err) { console.error(err) }
  }

  const total = reports.length + emiReports.length + eligibilityReports.length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(34,211,238,0.3)', borderTopColor: 'var(--cyan)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading your reports...</p>
      </div>
    </div>
  )

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-10 pt-20 pb-16">
        <div className="mb-8"><BackBtn to="/" /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="label-mono mb-3">Financial History</div>
          <h1 className="display-xl mb-2">Report History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{total} saved report{total !== 1 ? 's' : ''} across all tools</p>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { count: reports.length, label: 'Loan Reports', color: 'var(--cyan)' },
            { count: eligibilityReports.length, label: 'Eligibility', color: '#818cf8' },
            { count: emiReports.length, label: 'EMI Plans', color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: s.color }}>{s.count}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'rgba(8,24,40,0.8)', border: '1px solid rgba(34,211,238,0.1)', flexShrink: 0 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                style={{ background: activeTab === tab ? 'var(--cyan)' : 'transparent', color: activeTab === tab ? '#020a12' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}>
                {tab}
              </button>
            ))}
          </div>
          <input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)}
            className="fin-input flex-1" style={{ padding: '10px 16px' }} />
        </div>

        {/* Reports */}
        <div className="space-y-4">
          {(activeTab === 'All' || activeTab === 'Loan Reports') && <>
            {activeTab === 'All' && reports.length > 0 && <div className="label-mono mb-2">Loan Reports</div>}
            {reports.length === 0 && activeTab === 'Loan Reports' ? <Empty label="Loan Reports" />
              : reports.filter(r => !search || r.loanType?.toLowerCase().includes(search.toLowerCase()))
                .map(r => <ReportCard key={r.id} report={r} type="loan" onDelete={id => del(id, 'reports', setReports)} />)}
          </>}
          {(activeTab === 'All' || activeTab === 'Eligibility') && <>
            {activeTab === 'All' && eligibilityReports.length > 0 && <div className="label-mono mt-5 mb-2">Eligibility Reports</div>}
            {eligibilityReports.length === 0 && activeTab === 'Eligibility' ? <Empty label="Eligibility Reports" />
              : eligibilityReports.map(r => <ReportCard key={r.id} report={r} type="eligibility" onDelete={id => del(id, 'eligibilityReports', setEligibilityReports)} />)}
          </>}
          {(activeTab === 'All' || activeTab === 'EMI Plans') && <>
            {activeTab === 'All' && emiReports.length > 0 && <div className="label-mono mt-5 mb-2">EMI Plans</div>}
            {emiReports.length === 0 && activeTab === 'EMI Plans' ? <Empty label="EMI Plans" />
              : emiReports.map(r => <ReportCard key={r.id} report={r} type="emi" onDelete={id => del(id, 'emiReports', setEmiReports)} />)}
          </>}
          {total === 0 && activeTab === 'All' && <Empty label="reports" />}
        </div>
      </div>
    </PageShell>
  )
}
