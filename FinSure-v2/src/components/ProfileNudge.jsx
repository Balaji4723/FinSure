import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function ProfileNudge() {
  const navigate = useNavigate()
  const { userProfile } = useStore()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Calculate completion
  const fields = [
    { key: 'salary', label: 'Monthly Salary', done: userProfile?.salary > 0 && userProfile?.salary !== 60000 },
    { key: 'creditScore', label: 'CIBIL Score', done: userProfile?.creditScore > 0 && userProfile?.creditScore !== 720 },
    { key: 'age', label: 'Age', done: userProfile?.age > 0 && userProfile?.age !== 30 },
    { key: 'existingEMI', label: 'Existing EMI', done: userProfile?.existingEMI >= 0 && userProfile?.existingEMI !== undefined },
    { key: 'employment', label: 'Employment', done: !!userProfile?.employment },
    { key: 'city', label: 'City', done: !!userProfile?.city && userProfile.city.length > 0 },
  ]
  const completed = fields.filter(f => f.done).length
  const pct = Math.round((completed / fields.length) * 100)
  const isComplete = pct === 100

  useEffect(() => {
    if (isComplete) return
    const alreadyDismissed = sessionStorage.getItem('profileNudgeDismissed')
    if (alreadyDismissed) return
    const loggedIn = localStorage.getItem('loggedIn') === 'true'
    if (!loggedIn) return
    const t = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(t)
  }, [isComplete])

  const dismiss = () => {
    setVisible(false)
    setDismissed(true)
    sessionStorage.setItem('profileNudgeDismissed', '1')
  }

  const goProfile = () => {
    dismiss()
    navigate('/profile')
  }

  if (isComplete || dismissed) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            zIndex: 300, width: '90%', maxWidth: 380,
          }}>
          <div style={{
            background: 'rgba(4,15,26,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(34,211,238,0.3)',
            borderRadius: 20,
            padding: '20px 22px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.1)',
          }}>
            {/* Close */}
            <button onClick={dismiss} style={{
              position: 'absolute', top: 12, right: 12,
              width: 26, height: 26, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg,var(--cyan),#818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#020a12" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  Complete your profile
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  Auto-fill all tools — save time every visit
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{completed} of {fields.length} fields done</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 60 ? '#22c55e' : 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif" }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(34,211,238,0.1)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,var(--cyan),#818cf8)' }}
                />
              </div>
            </div>

            {/* Missing fields */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {fields.filter(f => !f.done).map(f => (
                <span key={f.key} style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 20,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', fontFamily: "'Space Grotesk',sans-serif"
                }}>
                  {f.label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={goProfile} className="btn-primary" style={{ flex: 1, padding: '10px 0', fontSize: 13 }}>
                Complete Profile
              </button>
              <button onClick={dismiss} style={{
                padding: '10px 14px', borderRadius: 12, fontSize: 12,
                background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
