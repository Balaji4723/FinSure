import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "../firebase"

const TABS = ["All", "Loan Reports", "Eligibility", "EMI Plans"]

function Badge({ label, color }) {
  const colors = {
    "Low Financial Risk": { bg: "rgba(34,197,94,0.1)", text: "#22c55e", border: "rgba(34,197,94,0.2)" },
    "Moderate Financial Pressure": { bg: "rgba(234,179,8,0.1)", text: "#eab308", border: "rgba(234,179,8,0.2)" },
    "High Financial Risk": { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
    "Comfortable": { bg: "rgba(34,197,94,0.1)", text: "#22c55e", border: "rgba(34,197,94,0.2)" },
    "Manageable": { bg: "rgba(234,179,8,0.1)", text: "#eab308", border: "rgba(234,179,8,0.2)" },
    "High Burden": { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  }
  const style = colors[label] || { bg: "rgba(34,211,238,0.1)", text: "var(--cyan)", border: "rgba(34,211,238,0.2)" }
  return (
    <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
      {label}
    </span>
  )
}

function ReportCard({ report, type, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const date = report.createdAt?.toDate?.()
    ? new Date(report.createdAt.toDate()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—"

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="label-mono" style={{ color: "var(--cyan)", fontSize: "10px" }}>
                {type === "loan" ? "Loan Report" : type === "emi" ? "EMI Plan" : "Eligibility"}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{date}</span>
            </div>
            <div className="display-md mt-1 truncate" style={{ color: "var(--text-primary)", fontSize: "1.1rem" }}>
              {type === "loan" ? `${report.loanType?.toUpperCase() || "—"} Loan`
                : type === "emi" ? "EMI Planning Report"
                : `${report.loanType || "Eligibility"} Analysis`}
            </div>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0">
            {type === "loan" && <Badge label={report.risk} />}
            {type === "emi" && <Badge label={report.affordability} />}
            <button onClick={() => onDelete(report.id)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Key metrics preview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {type === "loan" && [
            { label: "Salary", val: `₹${Number(report.salary).toLocaleString("en-IN")}` },
            { label: "EMI", val: `₹${Number(report.emi).toLocaleString("en-IN")}` },
            { label: "Approval", val: `${report.approval}%` },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
              <div style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginTop: "2px" }}>{m.val}</div>
            </div>
          ))}
          {type === "emi" && [
            { label: "Loan", val: `₹${Number(report.loanAmount).toLocaleString("en-IN")}` },
            { label: "Monthly EMI", val: `₹${Number(report.monthlyEMI).toLocaleString("en-IN")}` },
            { label: "Rate", val: `${report.interestRate}%` },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
              <div style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginTop: "2px" }}>{m.val}</div>
            </div>
          ))}
          {type === "eligibility" && [
            { label: "Score", val: `${report.readinessScore}/100` },
            { label: "Eligible Amt", val: `₹${Number(report.eligibleLoan).toLocaleString("en-IN")}` },
            { label: "Credit", val: report.creditScore || "—" },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
              <div style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginTop: "2px" }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm flex items-center gap-1.5 transition-colors"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--cyan)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
          {expanded ? "Show less" : "Show more"}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-6 pb-6 border-t pt-5" style={{ borderColor: "rgba(34,211,238,0.08)" }}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {type === "loan" && [
                  ["Loan Amount", `₹${Number(report.loanAmount).toLocaleString("en-IN")}`],
                  ["Existing EMI", `₹${Number(report.existingEmi).toLocaleString("en-IN")}`],
                  ["Tenure", `${report.tenure} Years`],
                  ["EMI Ratio", `${report.ratio}%`],
                ].map(([k, v]) => (
                  <div key={k}><span style={{ color: "var(--text-muted)" }}>{k}: </span><span style={{ color: "var(--text-secondary)" }}>{v}</span></div>
                ))}
                {type === "emi" && [
                  ["Tenure", `${report.tenure} Years`],
                  ["Total Repayment", `₹${Number(report.totalRepayment).toLocaleString("en-IN")}`],
                  ["Income", `₹${Number(report.monthlyIncome).toLocaleString("en-IN")}`],
                ].map(([k, v]) => (
                  <div key={k}><span style={{ color: "var(--text-muted)" }}>{k}: </span><span style={{ color: "var(--text-secondary)" }}>{v}</span></div>
                ))}
                {type === "eligibility" && [
                  ["Salary", `₹${Number(report.salary).toLocaleString("en-IN")}`],
                  ["Age", report.age || "—"],
                  ["Employment", report.employmentType || "—"],
                  ["Health", report.health || "—"],
                ].map(([k, v]) => (
                  <div key={k}><span style={{ color: "var(--text-muted)" }}>{k}: </span><span style={{ color: "var(--text-secondary)" }}>{v}</span></div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptyState({ label }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
        </svg>
      </div>
      <h3 className="font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>No {label} found</h3>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Run an analysis and save your results — they will appear here.</p>
    </div>
  )
}

function History() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [emiReports, setEmiReports] = useState([])
  const [eligibilityReports, setEligibilityReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate("/login"); return }
      try {
        const email = user.email
        const [rSnap, eSnap, elSnap] = await Promise.all([
          getDocs(collection(db, "reports")),
          getDocs(collection(db, "emiReports")),
          getDocs(collection(db, "eligibilityReports")),
        ])
        setReports(rSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.userEmail === email))
        setEmiReports(eSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.userEmail === email))
        setEligibilityReports(elSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.userEmail === email))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    })
    return () => unsub()
  }, [navigate])

  const deleteReport = async (id, collectionName, setter) => {
    try {
      await deleteDoc(doc(db, collectionName, id))
      setter(prev => prev.filter(r => r.id !== id))
    } catch (err) { console.error(err) }
  }

  const totalCount = reports.length + emiReports.length + eligibilityReports.length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-void)" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-t-transparent mx-auto mb-6 animate-spin" style={{ borderColor: "rgba(34,211,238,0.3)", borderTopColor: "var(--cyan)" }} />
        <p style={{ color: "var(--text-secondary)" }}>Loading your reports...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-white relative" style={{ background: "var(--bg-void)" }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-purple w-[500px] h-[500px] -top-32 -left-32 z-0" />
      <div className="orb-cyan w-[400px] h-[400px] -bottom-32 -right-32 z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-10 py-8 md:py-14">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link to="/"><button className="btn-outline px-5 py-2.5 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M7 11L3 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </button></Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="label-mono mb-3">Financial History</div>
          <h1 className="display-xl mb-3">Report History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            {totalCount} saved report{totalCount !== 1 ? "s" : ""} across all tools
          </p>
        </motion.div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { count: reports.length, label: "Loan Reports", color: "var(--cyan)" },
            { count: eligibilityReports.length, label: "Eligibility", color: "#818cf8" },
            { count: emiReports.length, label: "EMI Plans", color: "#22c55e" },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-5 text-center">
              <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>{s.count}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(8,24,40,0.8)", border: "1px solid rgba(34,211,238,0.1)" }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: activeTab === tab ? "var(--cyan)" : "transparent",
                  color: activeTab === tab ? "#020a12" : "var(--text-secondary)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  border: "none", cursor: "pointer"
                }}>
                {tab}
              </button>
            ))}
          </div>
          <input placeholder="Search reports..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="fin-input flex-1" style={{ padding: "10px 16px" }} />
        </div>

        {/* Reports */}
        <div className="space-y-4">
          {(activeTab === "All" || activeTab === "Loan Reports") && (
            <>
              {activeTab === "All" && reports.length > 0 && <div className="label-mono mb-3">Loan Reports</div>}
              {reports.length === 0 && activeTab === "Loan Reports"
                ? <EmptyState label="Loan Reports" />
                : reports
                    .filter(r => !searchQuery || r.loanType?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(r => <ReportCard key={r.id} report={r} type="loan" onDelete={id => deleteReport(id, "reports", setReports)} />)
              }
            </>
          )}
          {(activeTab === "All" || activeTab === "Eligibility") && (
            <>
              {activeTab === "All" && eligibilityReports.length > 0 && <div className="label-mono mt-6 mb-3">Eligibility Reports</div>}
              {eligibilityReports.length === 0 && activeTab === "Eligibility"
                ? <EmptyState label="Eligibility Reports" />
                : eligibilityReports
                    .map(r => <ReportCard key={r.id} report={r} type="eligibility" onDelete={id => deleteReport(id, "eligibilityReports", setEligibilityReports)} />)
              }
            </>
          )}
          {(activeTab === "All" || activeTab === "EMI Plans") && (
            <>
              {activeTab === "All" && emiReports.length > 0 && <div className="label-mono mt-6 mb-3">EMI Plans</div>}
              {emiReports.length === 0 && activeTab === "EMI Plans"
                ? <EmptyState label="EMI Plans" />
                : emiReports
                    .map(r => <ReportCard key={r.id} report={r} type="emi" onDelete={id => deleteReport(id, "emiReports", setEmiReports)} />)
              }
            </>
          )}
          {totalCount === 0 && activeTab === "All" && <EmptyState label="reports" />}
        </div>
      </div>
    </div>
  )
}

export default History
