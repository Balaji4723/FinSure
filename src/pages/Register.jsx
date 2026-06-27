import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState({ text: "", ok: false })
  const [loading, setLoading] = useState(false)

  const rules = [
    { label: "8+ characters", test: p => p.length >= 8 },
    { label: "Uppercase letter", test: p => /[A-Z]/.test(p) },
    { label: "Lowercase letter", test: p => /[a-z]/.test(p) },
    { label: "Number", test: p => /\d/.test(p) },
    { label: "Special character", test: p => /[@$!%*?&]/.test(p) },
  ]

  const strength = rules.filter(r => r.test(password)).length
  const strengthColor = strength <= 1 ? "#ef4444" : strength <= 3 ? "#eab308" : "#22c55e"
  const strengthLabel = strength <= 1 ? "Weak" : strength <= 3 ? "Moderate" : strength === 5 ? "Strong" : "Good"

  const handleRegister = async (e) => {
    e.preventDefault()
    if (strength < 5) { setMessage({ text: "Password does not meet all requirements.", ok: false }); return }
    if (password !== confirmPassword) { setMessage({ text: "Passwords do not match.", ok: false }); return }
    setLoading(true)
    setMessage({ text: "", ok: false })
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      localStorage.setItem("loggedIn", "true")
      setMessage({ text: "Account created. Redirecting...", ok: true })
      setTimeout(() => navigate("/"), 1500)
    } catch (error) {
      const msg = error.code === "auth/email-already-in-use"
        ? "An account with this email already exists."
        : error.code === "auth/invalid-email"
        ? "Please enter a valid email address."
        : "Registration failed. Please try again."
      setMessage({ text: msg, ok: false })
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = ({ open }) => open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-5 py-12 relative" style={{ background: "var(--bg-void)" }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-purple w-[500px] h-[500px] -top-32 -right-32 z-0" />
      <div className="orb-cyan w-[400px] h-[400px] -bottom-32 -left-32 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass rounded-3xl p-8 md:p-12 w-full max-w-md relative z-10"
        style={{ boxShadow: "0 0 80px rgba(139,92,246,0.08)" }}
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--cyan)", boxShadow: "0 0 30px rgba(34,211,238,0.4)" }}>
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
              <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
            </svg>
          </div>
        </div>

        <h1 className="display-md text-center mb-2" style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
          Create account
        </h1>
        <p className="text-center text-sm mb-10" style={{ color: "var(--text-secondary)" }}>
          Join FinSure to start your financial analysis
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label-mono block mb-2">Email</label>
            <input type="email" placeholder="you@example.com" required value={email}
              onChange={e => setEmail(e.target.value)} className="fin-input" />
          </div>

          <div>
            <label className="label-mono block mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Create a strong password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="fin-input" style={{ paddingRight: "52px" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--cyan)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              ><EyeIcon open={showPassword} /></button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength ? strengthColor : "rgba(34,211,238,0.1)" }} />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {rules.map(r => (
                      <span key={r.label} className="text-xs flex items-center gap-1"
                        style={{ color: r.test(password) ? "#22c55e" : "var(--text-muted)" }}>
                        <span>{r.test(password) ? "✓" : "·"}</span> {r.label}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold ml-2 flex-shrink-0" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <label className="label-mono block mb-2">Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} placeholder="Repeat your password" required
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="fin-input"
                style={{ paddingRight: "52px", borderColor: confirmPassword && confirmPassword !== password ? "rgba(239,68,68,0.5)" : undefined }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--cyan)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              ><EyeIcon open={showConfirm} /></button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs mt-1" style={{ color: "#f87171" }}>Passwords do not match</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-4"
            style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Creating account...
              </span>
            ) : "Create Account"}
          </button>
        </form>

        {message.text && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-5 px-4 py-3 rounded-xl text-sm text-center"
            style={{
              background: message.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${message.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: message.ok ? "var(--green)" : "#f87171"
            }}>
            {message.text}
          </motion.div>
        )}

        <p className="text-center text-sm mt-8" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--cyan)" }} className="font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Register
