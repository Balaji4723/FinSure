import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useSessionTimeout } from './hooks/useBankRates'

const Home         = lazy(() => import('./pages/Home'))
const Login        = lazy(() => import('./pages/Login'))
const Register     = lazy(() => import('./pages/Register'))
const Eligibility  = lazy(() => import('./pages/Eligibility'))
const EMI          = lazy(() => import('./pages/EMICalculator'))
const Policy       = lazy(() => import('./pages/Policy'))
const History      = lazy(() => import('./pages/History'))
const Compare      = lazy(() => import('./pages/Compare'))
const Tools        = lazy(() => import('./pages/Tools'))
const Dashboard    = lazy(() => import('./pages/Dashboard'))
const FinAI        = lazy(() => import('./pages/FinAI'))
const Recommend    = lazy(() => import('./pages/Recommend'))
const GoalSetter   = lazy(() => import('./pages/GoalSetter'))
const CreditBooster = lazy(() => import('./pages/CreditBooster'))
const ReportCard   = lazy(() => import('./pages/ReportCard'))
const Leaderboard  = lazy(() => import('./pages/Leaderboard'))

function Guard({ children }) {
  return localStorage.getItem('loggedIn') === 'true' ? children : <Navigate to="/login" replace />
}

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
    <div className="flex flex-col items-center gap-5">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--cyan)', boxShadow: '0 0 30px rgba(34,211,238,0.4)' }}>
        <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
          <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
        </svg>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--cyan)', opacity: 0.5 }} />
        ))}
      </div>
    </div>
  </div>
)

function AppInner() {
  useSessionTimeout(15 * 60 * 1000)
  return (
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
        <Route path="/dashboard"    element={<Guard><Dashboard /></Guard>} />
        <Route path="/ai"           element={<Guard><FinAI /></Guard>} />
        <Route path="/recommend"    element={<Guard><Recommend /></Guard>} />
        <Route path="/goals"        element={<Guard><GoalSetter /></Guard>} />
        <Route path="/credit"       element={<Guard><CreditBooster /></Guard>} />
        <Route path="/report-card"  element={<Guard><ReportCard /></Guard>} />
        <Route path="/leaderboard"  element={<Guard><Leaderboard /></Guard>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>
}
