import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useSessionTimeout } from './hooks/useBankRates'
import FinAIDrawer from './components/FinAIDrawer'

const Home         = lazy(() => import('./pages/Home'))
const Login        = lazy(() => import('./pages/Login'))
const Register     = lazy(() => import('./pages/Register'))
const Eligibility  = lazy(() => import('./pages/Eligibility'))
const EMI          = lazy(() => import('./pages/EMICalculator'))
const Policy       = lazy(() => import('./pages/Policy'))
const History      = lazy(() => import('./pages/History'))
const Compare      = lazy(() => import('./pages/Compare'))
const Tools        = lazy(() => import('./pages/Tools'))
const Recommend    = lazy(() => import('./pages/Recommend'))
const GoalSetter   = lazy(() => import('./pages/GoalSetter'))
const CreditBooster = lazy(() => import('./pages/CreditBooster'))
const ReportCard   = lazy(() => import('./pages/ReportCard'))

function Guard({ children }) {
  return localStorage.getItem('loggedIn') === 'true'
    ? children
    : <Navigate to="/login" replace />
}

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
      <div style={{ width:52, height:52, borderRadius:16, background:'var(--cyan)', boxShadow:'0 0 30px rgba(34,211,238,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
          <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
        </svg>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--cyan)', opacity:0.4,
            animation:`glowPulse 1.2s ${i*0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  </div>
)

function AppInner() {
  useSessionTimeout(15 * 60 * 1000)
  const loggedIn = localStorage.getItem('loggedIn') === 'true'

  return (
    <>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/eligibility"  element={<Guard><Eligibility /></Guard>} />
          <Route path="/emi"          element={<Guard><EMI /></Guard>} />
          <Route path="/policy"       element={<Guard><Policy /></Guard>} />
          <Route path="/history"      element={<Guard><History /></Guard>} />
          <Route path="/compare"      element={<Guard><Compare /></Guard>} />
          <Route path="/tools"        element={<Guard><Tools /></Guard>} />
          <Route path="/recommend"    element={<Guard><Recommend /></Guard>} />
          <Route path="/goals"        element={<Guard><GoalSetter /></Guard>} />
          <Route path="/credit"       element={<Guard><CreditBooster /></Guard>} />
          <Route path="/report-card"  element={<Guard><ReportCard /></Guard>} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* FinAI floating drawer — visible on all pages when logged in */}
      {loggedIn && <FinAIDrawer />}
    </>
  )
}

export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>
}
