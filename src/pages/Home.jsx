import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import translations from "../translations/translations"

/* ─── Animated counter ─── */
function Counter({ target, duration = 1.8, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0
        const step = target / (duration * 60)
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(start))
        }, 1000 / 60)
        observer.disconnect()
        return () => clearInterval(timer)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ─── Floating particle ─── */
function Particle({ style }) {
  return <div className="particle" style={style} />
}

/* ─── 3D tilt card ─── */
function TiltCard({ children, className = "", onClick }) {
  const ref = useRef(null)
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    ref.current.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`
  }
  const handleLeave = () => {
    ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)"
  }
  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      style={{ transition: "transform 0.15s ease", willChange: "transform" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState("en")
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const t = translations[language]
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, -80])
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem("loggedIn") === "true")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleProtectedRoute = (route) => {
    if (localStorage.getItem("loggedIn") === "true") navigate(route)
    else navigate("/login")
    setMenuOpen(false)
  }

  const particles = Array.from({ length: 18 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    "--dur": `${2.5 + Math.random() * 3}s`,
    "--delay": `${Math.random() * 3}s`,
    opacity: Math.random() * 0.6 + 0.2
  }))

  const navLinks = [
    { label: "Home", action: () => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false) } },
    { label: t.policies, action: () => handleProtectedRoute("/policy") },
    { label: t.history, action: () => handleProtectedRoute("/history") },
    { label: t.contact, action: () => { document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false) } },
  ]

  return (
    <div className="bg-void relative overflow-x-hidden" style={{ background: "var(--bg-void)" }}>
      {/* Grid background */}
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />

      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {particles.map((p, i) => <Particle key={i} style={p} />)}
      </div>

      {/* Orbs */}
      <div className="orb-cyan w-[600px] h-[600px] -top-48 -left-48 z-0" />
      <div className="orb-purple w-[500px] h-[500px] top-[40%] -right-32 z-0" />
      <div className="orb-cyan w-[400px] h-[400px] bottom-0 left-1/3 z-0" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />

      {/* ─── NAVBAR ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(2,10,18,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(34,211,238,0.08)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--cyan)", boxShadow: "0 0 20px rgba(34,211,238,0.5)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
                <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--cyan)", letterSpacing: "-0.02em" }}>
              FinSure
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <button key={l.label} onClick={l.action} className="text-sm font-medium transition-colors duration-200" style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => e.target.style.color = "var(--cyan)"}
                onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}
              >{l.label}</button>
            ))}
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="fin-input fin-select text-sm"
              style={{ width: "auto", padding: "8px 40px 8px 14px", fontSize: "13px" }}>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">Marathi</option>
            </select>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!loggedIn ? (
              <>
                <Link to="/login">
                  <button className="btn-outline px-5 py-2.5 text-sm">Login</button>
                </Link>
                <Link to="/register">
                  <button className="btn-primary px-5 py-2.5 text-sm glow-pulse">Register</button>
                </Link>
              </>
            ) : (
              <button onClick={() => { localStorage.removeItem("loggedIn"); setLoggedIn(false); navigate("/"); }} className="btn-danger px-5 py-2.5 text-sm">
                Logout
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden z-50 p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <div className="flex flex-col gap-1.5 w-6">
              {[0, 1, 2].map(i => (
                <span key={i} className="block h-0.5 transition-all duration-300" style={{
                  background: "var(--cyan)",
                  width: i === 1 ? (menuOpen ? "100%" : "75%") : "100%",
                  transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(5px,5px)" : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "scaleX(0)") : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1
                }} />
              ))}
            </div>
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden" style={{ background: "rgba(2,10,18,0.98)", borderBottom: "1px solid rgba(34,211,238,0.1)" }}>
              <div className="px-5 py-6 flex flex-col gap-4">
                {navLinks.map(l => (
                  <button key={l.label} onClick={l.action} className="text-left py-2 text-base font-medium transition-colors" style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => e.target.style.color = "var(--cyan)"}
                    onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}
                  >{l.label}</button>
                ))}
                <select value={language} onChange={e => { setLanguage(e.target.value); }}
                  className="fin-input fin-select text-sm mt-2">
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="mr">Marathi</option>
                </select>
                <div className="flex gap-3 mt-2">
                  {!loggedIn ? (
                    <>
                      <Link to="/login" className="flex-1"><button className="btn-outline w-full py-3 text-sm">Login</button></Link>
                      <Link to="/register" className="flex-1"><button className="btn-primary w-full py-3 text-sm">Register</button></Link>
                    </>
                  ) : (
                    <button onClick={() => { localStorage.removeItem("loggedIn"); setLoggedIn(false); navigate("/"); setMenuOpen(false) }} className="btn-danger w-full py-3 text-sm">Logout</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO ─── */}
      <motion.section style={{ y: heroY }} className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <div className="label-mono mb-6" style={{ color: "var(--cyan)", opacity: 0.8 }}>Financial Intelligence Platform</div>

          <h1 className="display-xl mb-6 max-w-5xl mx-auto">
            <span style={{ color: "var(--text-primary)" }}>Decode Your</span>{" "}
            <span className="shimmer-text">Financial DNA</span>
          </h1>

          <p className="max-w-2xl mx-auto mb-10 text-base md:text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t.subtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => handleProtectedRoute("/eligibility")} className="btn-primary px-8 py-4 text-base">
              Analyze My Profile
            </button>
            <button onClick={() => handleProtectedRoute("/emi")} className="btn-outline px-8 py-4 text-base">
              EMI Calculator
            </button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Scroll</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="6.5" y="5" width="3" height="6" rx="1.5" fill="currentColor"/>
          </svg>
        </motion.div>
      </motion.section>

      {/* ─── STATS STRIP ─── */}
      <section className="relative z-10 border-y py-10" style={{ borderColor: "rgba(34,211,238,0.08)", background: "rgba(4,15,26,0.6)" }}>
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: 98, suffix: "%", label: "Accuracy Rate" },
            { val: 3, prefix: "", suffix: " Tools", label: "Financial Tools" },
            { val: 500, suffix: "+", label: "Data Points Analyzed" },
            { val: 100, suffix: "%", label: "Secure & Private" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="display-md" style={{ color: "var(--cyan)", fontFamily: "'Space Grotesk', sans-serif" }}>
                <Counter target={s.val} prefix={s.prefix || ""} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FEATURE CARDS ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="label-mono mb-4">Core Features</div>
          <h2 className="display-lg" style={{ color: "var(--text-primary)" }}>Everything you need to borrow smart</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              route: "/eligibility",
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="var(--cyan)" strokeWidth="1.5"/>
                  <path d="M10 16l4 4 8-8" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="16" cy="10" r="2" fill="var(--cyan)" opacity="0.5"/>
                </svg>
              ),
              eyebrow: "FinDNA Score",
              title: t.eligibility,
              desc: t.findnaDesc,
              accent: "var(--cyan)",
              delay: 0
            },
            {
              route: "/emi",
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="3" y="8" width="26" height="18" rx="3" stroke="var(--cyan)" strokeWidth="1.5"/>
                  <path d="M8 16h4M14 16h2M18 16h6" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 13h26" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.4"/>
                  <path d="M8 20h8" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                </svg>
              ),
              eyebrow: "EMI Planner",
              title: t.emi,
              desc: t.emiDesc,
              accent: "#818cf8",
              delay: 0.1
            },
            {
              route: "/policy",
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 4h14l6 6v18H6V4Z" stroke="var(--cyan)" strokeWidth="1.5"/>
                  <path d="M20 4v6h6" stroke="var(--cyan)" strokeWidth="1.5"/>
                  <path d="M10 14h12M10 18h8M10 22h6" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                </svg>
              ),
              eyebrow: "Loan Analyzer",
              title: t.policy,
              desc: t.lendingDesc,
              accent: "#22c55e",
              delay: 0.2
            },
          ].map((card) => (
            <motion.div key={card.route} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: card.delay }}>
              <TiltCard
                onClick={() => handleProtectedRoute(card.route)}
                className="glass rounded-3xl p-7 md:p-9 cursor-pointer h-full scanline-wrapper"
                style={{ "--accent": card.accent }}
              >
                <div className="mb-6 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `rgba(34,211,238,0.08)`, border: "1px solid rgba(34,211,238,0.15)" }}>
                  {card.icon}
                </div>
                <div className="label-mono mb-3" style={{ color: card.accent, opacity: 0.9 }}>{card.eyebrow}</div>
                <h3 className="display-md mb-4" style={{ color: "var(--text-primary)" }}>{card.title}</h3>
                <p className="leading-relaxed" style={{ color: "var(--text-secondary)", fontSize: "15px" }}>{card.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--cyan)" }}>
                  Open Tool
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 py-20 md:py-28" style={{ background: "rgba(4,15,26,0.5)" }}>
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="label-mono mb-4">Process</div>
            <h2 className="display-lg" style={{ color: "var(--text-primary)" }}>Three steps to financial clarity</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Enter Your Profile", desc: "Provide salary, credit score, age and existing obligations." },
              { step: "02", title: "AI Analysis Runs", desc: "Our scoring engine processes your financial DNA in real time." },
              { step: "03", title: "Get Your Report", desc: "Receive eligibility score, EMI breakdown and bank recommendations." },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative">
                {i < 2 && <div className="hidden md:block absolute top-6 left-full w-full h-px z-0" style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.3), transparent)" }} />}
                <div className="relative z-10">
                  <div className="text-7xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "rgba(34,211,238,0.08)", lineHeight: 1 }}>{s.step}</div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER / CONTACT ─── */}
      <footer id="contact" className="relative z-10 border-t py-16 px-5 md:px-10" style={{ borderColor: "rgba(34,211,238,0.08)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--cyan)" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#020a12" strokeWidth="1.8" fill="none"/>
                    <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="#020a12"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "var(--cyan)" }}>FinSure</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: "var(--text-secondary)" }}>
                Built on React and Firebase. Intelligent financial analysis for smarter borrowing decisions.
              </p>
            </div>
            <div className="space-y-3">
              <div className="label-mono mb-5">Contact</div>
              {[
                { label: "Email", href: "mailto:balajimaninadar4712@gmail.com", text: "balajimaninadar4712@gmail.com" },
                { label: "Portfolio", href: "https://balaji4723.github.io/PORTFOLIO-WEBSITE/", text: "Balaji4723" },
                { label: "LinkedIn", href: "https://www.linkedin.com/in/nadar-balaji-mani-murugan-27218a360", text: "Nadar Balaji Mani Murugan" },
              ].map((c) => (
                <div key={c.label} className="flex gap-4 text-sm">
                  <span style={{ color: "var(--text-muted)", width: "60px", flexShrink: 0 }}>{c.label}</span>
                  <a href={c.href} target="_blank" rel="noreferrer" className="transition-colors break-all"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => e.target.style.color = "var(--cyan)"}
                    onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}
                  >{c.text}</a>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs" style={{ borderColor: "rgba(34,211,238,0.06)", color: "var(--text-muted)" }}>
            <span>Built with React + Firebase + Framer Motion</span>
            <span>FinSure Financial Intelligence Platform</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
