import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ text: "", ok: false })
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", ok: false })
    try {
      await signInWithEmailAndPassword(auth, email, password)
      localStorage.setItem("loggedIn", "true")
      setMessage({ text: "Login successful. Redirecting...", ok: true })
      setTimeout(() => navigate("/"), 1200)
    } catch (error) {
      const msg = error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
        ? "Invalid email or password."
        : error.code === "auth/user-not-found"
        ? "No account found with this email."
        : error.code === "auth/too-many-requests"
        ? "Too many attempts. Please try again later."
        : "Login failed. Please try again."
      setMessage({ text: msg, ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative" style={{ background: "var(--bg-void)" }}>
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="orb-cyan w-[500px] h-[500px] -top-32 -left-32 z-0" />
      <div className="orb-purple w-[400px] h-[400px] -bottom-32 -right-32 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass rounded-3xl p-8 md:p-12 w-full max-w-md relative z-10"
        style={{ boxShadow: "0 0 80px rgba(34,211,238,0.08)" }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--cyan)", boxShadow: "0 0 30px rgba(34,211,238,0.4)" }}>
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
              <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
            </svg>
          </div>
        </div>

        <h1 className="display-md text-center mb-2" style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
          Welcome back
        </h1>
        <p className="text-center text-sm mb-10" style={{ color: "var(--text-secondary)" }}>
          Sign in to continue to FinSure
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label-mono block mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="fin-input"
            />
          </div>

          <div>
            <label className="label-mono block mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="fin-input"
                style={{ paddingRight: "52px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--cyan)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base mt-6"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 px-4 py-3 rounded-xl text-sm text-center"
            style={{
              background: message.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${message.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: message.ok ? "var(--green)" : "#f87171"
            }}
          >
            {message.text}
          </motion.div>
        )}

        <p className="text-center text-sm mt-8" style={{ color: "var(--text-secondary)" }}>
          No account yet?{" "}
          <Link to="/register" style={{ color: "var(--cyan)" }} className="font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Login
