import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PageShell, ScoreRing, LiquidBar, BackBtn, SliderInput } from '../components/UI'
import { useStore } from '../store/useStore'
import { BADGE_DEFS, getPersonalityType } from '../utils/badges'
import { auth } from '../firebase'

function buildCanvas(data) {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 480
  const ctx = canvas.getContext('2d')

  // Background
  const bg = ctx.createLinearGradient(0, 0, 800, 480)
  bg.addColorStop(0, '#020a12')
  bg.addColorStop(1, '#040f1a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 800, 480)

  // Grid dots
  ctx.fillStyle = 'rgba(34,211,238,0.04)'
  for (let x = 0; x < 800; x += 30) {
    for (let y = 0; y < 480; y += 30) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Glow orb top-left
  const orb = ctx.createRadialGradient(0, 0, 0, 0, 0, 300)
  orb.addColorStop(0, 'rgba(34,211,238,0.12)')
  orb.addColorStop(1, 'transparent')
  ctx.fillStyle = orb
  ctx.fillRect(0, 0, 300, 300)

  // Glow orb bottom-right
  const orb2 = ctx.createRadialGradient(800, 480, 0, 800, 480, 250)
  orb2.addColorStop(0, 'rgba(129,140,248,0.1)')
  orb2.addColorStop(1, 'transparent')
  ctx.fillStyle = orb2
  ctx.fillRect(500, 230, 300, 250)

  // Card border
  ctx.strokeStyle = 'rgba(34,211,238,0.2)'
  ctx.lineWidth = 1
  ctx.strokeRect(20, 20, 760, 440)

  // Logo hex
  ctx.fillStyle = '#22d3ee'
  ctx.beginPath()
  const hx = 60, hy = 65, hr = 22
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = hx + hr * Math.cos(angle)
    const py = hy + hr * Math.sin(angle)
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()

  // FinSure text
  ctx.font = 'bold 22px "Space Grotesk", system-ui, sans-serif'
  ctx.fillStyle = '#22d3ee'
  ctx.fillText('FinSure', 90, 72)

  // FinDNA Report Card label
  ctx.font = '11px "Space Grotesk", system-ui, sans-serif'
  ctx.fillStyle = 'rgba(34,211,238,0.6)'
  ctx.fillText('FINDNA REPORT CARD', 90, 90)

  // Divider
  ctx.strokeStyle = 'rgba(34,211,238,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40, 105)
  ctx.lineTo(760, 105)
  ctx.stroke()

  // Score circle
  const cx = 130, cy = 240, r = 80
  ctx.strokeStyle = 'rgba(34,211,238,0.08)'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5)
  ctx.stroke()

  const scoreColor = data.score >= 80 ? '#22c55e' : data.score >= 60 ? '#eab308' : '#ef4444'
  const dash = (data.score / 100) * (2 * Math.PI * r)
  ctx.strokeStyle = scoreColor
  ctx.lineWidth = 14
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (data.score / 100) * Math.PI * 2)
  ctx.stroke()

  // Score text
  ctx.font = 'bold 42px "Space Grotesk", system-ui, sans-serif'
  ctx.fillStyle = scoreColor
  ctx.textAlign = 'center'
  ctx.fillText(data.score, cx, cy + 8)
  ctx.font = '12px "Space Grotesk", system-ui, sans-serif'
  ctx.fillStyle = 'rgba(148,163,184,0.8)'
  ctx.fillText('/ 100', cx, cy + 28)
  ctx.textAlign = 'left'

  // Status label
  ctx.font = 'bold 15px "Space Grotesk", system-ui, sans-serif'
  ctx.fillStyle = scoreColor
  ctx.textAlign = 'center'
  ctx.fillText(data.status, cx, cy + 52)
  ctx.textAlign = 'left'

  // Right panel - metrics
  const rx = 280
  const metrics = [
    { label: 'MONTHLY SALARY', val: `₹${Number(data.salary).toLocaleString('en-IN')}` },
    { label: 'CREDIT SCORE', val: data.creditScore },
    { label: 'EMI BURDEN', val: `${data.emiRatio}%` },
    { label: 'ELIGIBLE LOAN', val: `₹${Number(data.eligibleLoan).toLocaleString('en-IN')}` },
    { label: 'PERSONALITY', val: data.personality },
  ]
  metrics.forEach((m, i) => {
    const y = 135 + i * 64
    // Metric box
    ctx.strokeStyle = 'rgba(34,211,238,0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(rx, y, 230, 50)
    ctx.fillStyle = 'rgba(34,211,238,0.03)'
    ctx.fillRect(rx, y, 230, 50)
    ctx.font = '9px "Space Grotesk", system-ui, sans-serif'
    ctx.fillStyle = 'rgba(34,211,238,0.6)'
    ctx.fillText(m.label, rx + 12, y + 16)
    ctx.font = 'bold 15px "Space Grotesk", system-ui, sans-serif'
    ctx.fillStyle = '#f0f9ff'
    ctx.fillText(m.val, rx + 12, y + 36)
  })

  // Bars panel
  const bx = 540
  const bars = [
    { label: 'Income Score', val: data.incomeScore, max: 30, color: '#22d3ee' },
    { label: 'Credit Score', val: data.creditScorePoints, max: 30, color: '#818cf8' },
    { label: 'Debt Ratio', val: data.emiPoints, max: 25, color: '#22c55e' },
    { label: 'Age Factor', val: data.agePoints, max: 10, color: '#eab308' },
    { label: 'Employment', val: data.empPoints, max: 5, color: '#f472b6' },
  ]
  bars.forEach((b, i) => {
    const y = 135 + i * 64
    ctx.font = '9px "Space Grotesk", system-ui, sans-serif'
    ctx.fillStyle = 'rgba(148,163,184,0.7)'
    ctx.fillText(b.label.toUpperCase(), bx, y + 14)
    // Bar bg
    ctx.fillStyle = 'rgba(34,211,238,0.06)'
    ctx.beginPath()
    ctx.roundRect(bx, y + 22, 200, 8, 4)
    ctx.fill()
    // Bar fill
    ctx.fillStyle = b.color
    ctx.beginPath()
    ctx.roundRect(bx, y + 22, (b.val / b.max) * 200, 8, 4)
    ctx.fill()
    // Score
    ctx.font = 'bold 11px "Space Grotesk", system-ui, sans-serif'
    ctx.fillStyle = b.color
    ctx.fillText(`${b.val}/${b.max}`, bx + 208, y + 31)
  })

  // Footer
  ctx.fillStyle = 'rgba(34,211,238,0.08)'
  ctx.fillRect(20, 420, 760, 40)
  ctx.font = '10px "Space Grotesk", system-ui, sans-serif'
  ctx.fillStyle = 'rgba(71,85,105,1)'
  ctx.fillText('fin-sure-jade.vercel.app  •  Powered by React + Firebase  •  Real bank data  •  Not financial advice', 40, 444)
  ctx.fillStyle = 'rgba(34,211,238,0.5)'
  ctx.fillText(`Generated ${new Date().toLocaleDateString('en-IN')}`, 640, 444)

  return canvas
}

export default function ReportCard() {
  const { addBadge, riskProfile } = useStore()
  const canvasRef = useRef()
  const [salary, setSalary] = useState(60000)
  const [creditScore, setCreditScore] = useState(720)
  const [age, setAge] = useState(30)
  const [existingEMI, setExistingEMI] = useState(5000)
  const [employment, setEmployment] = useState('Salaried')
  const [generated, setGenerated] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  // Real-time score calculation
  let incomeScore = 0
  if (salary >= 100000) incomeScore = 30; else if (salary >= 70000) incomeScore = 24
  else if (salary >= 50000) incomeScore = 18; else if (salary >= 30000) incomeScore = 12; else incomeScore = 6

  let creditScorePoints = 0
  if (creditScore >= 800) creditScorePoints = 30; else if (creditScore >= 750) creditScorePoints = 25
  else if (creditScore >= 700) creditScorePoints = 20; else if (creditScore >= 650) creditScorePoints = 15; else creditScorePoints = 8

  const emiRatio = salary > 0 ? Math.round((existingEMI / salary) * 100) : 0
  let emiPoints = 0
  if (emiRatio <= 20) emiPoints = 25; else if (emiRatio <= 35) emiPoints = 20
  else if (emiRatio <= 50) emiPoints = 12; else emiPoints = 5

  const ag = age
  let agePoints = 0
  if (ag >= 25 && ag <= 45) agePoints = 10; else if ((ag >= 21 && ag < 25) || (ag > 45 && ag <= 55)) agePoints = 7; else agePoints = 4

  const empPoints = employment === 'Salaried' ? 5 : employment === 'Business Owner' ? 4 : 3
  const totalScore = Math.min(incomeScore + creditScorePoints + emiPoints + agePoints + empPoints, 100)
  const status = totalScore >= 80 ? 'Premium Profile' : totalScore >= 60 ? 'Balanced Profile' : 'Needs Improvement'
  const eligibleLoan = Math.round((salary - existingEMI) * 35)
  const personality = getPersonalityType(totalScore)

  const generate = () => {
    const data = {
      score: totalScore, status, salary, creditScore, emiRatio,
      eligibleLoan, personality: personality.type,
      incomeScore, creditScorePoints, emiPoints, agePoints, empPoints
    }
    const canvas = buildCanvas(data)
    const ctx = canvasRef.current.getContext('2d')
    canvasRef.current.width = 800
    canvasRef.current.height = 480
    ctx.drawImage(canvas, 0, 0)
    setGenerated(true)
    addBadge(BADGE_DEFS.find(b => b.id === 'report_sharer'))
  }

  const download = () => {
    const link = document.createElement('a')
    link.download = 'FinSure_FinDNA_Report_Card.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('Check out my FinDNA score on FinSure! fin-sure-jade.vercel.app')
      setShareMsg('Link copied!')
      setTimeout(() => setShareMsg(''), 2000)
    } catch { setShareMsg('Could not copy') }
  }

  const shareNative = async () => {
    if (!navigator.share) { copyLink(); return }
    try {
      const blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/png'))
      const file = new File([blob], 'FinDNA_Report.png', { type: 'image/png' })
      await navigator.share({ title: 'My FinDNA Report Card', text: `I scored ${totalScore}/100 on FinSure! Check out your financial DNA too.`, files: [file], url: 'https://fin-sure-jade.vercel.app' })
    } catch { download() }
  }

  return (
    <PageShell>
      <Navbar />
      <div className="max-w-5xl mx-auto px-5 md:px-10 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10"><BackBtn /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="label-mono mb-3">Shareable Report</div>
          <h1 className="display-xl mb-4">Your <span className="shimmer-text">FinDNA Card</span></h1>
          <p className="max-w-2xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
            Generate a beautiful shareable report card from your financial DNA score. Download as image or share directly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Inputs */}
          <div className="glass rounded-3xl p-7 md:p-10">
            <div className="label-mono mb-7">Enter Your Details</div>
            <div className="space-y-6">
              <SliderInput label="Monthly Salary" value={salary} onChange={setSalary} min={15000} max={500000} step={5000} prefix="₹" />
              <SliderInput label="CIBIL Score" value={creditScore} onChange={setCreditScore} min={300} max={900} step={10} />
              <SliderInput label="Age" value={age} onChange={setAge} min={21} max={65} step={1} suffix=" yrs" />
              <SliderInput label="Existing Monthly EMI" value={existingEMI} onChange={setExistingEMI} min={0} max={100000} step={1000} prefix="₹" />
              <div>
                <label className="label-mono block mb-2">Employment</label>
                <select value={employment} onChange={e => setEmployment(e.target.value)} className="fin-input fin-select">
                  <option>Salaried</option><option>Self Employed</option><option>Business Owner</option>
                </select>
              </div>
            </div>
            <button onClick={generate} className="btn-primary w-full py-4 text-base mt-8">
              Generate Report Card
            </button>
          </div>

          {/* Live preview score */}
          <div className="glass rounded-3xl p-7 flex flex-col items-center justify-center text-center scanline-wrap"
            style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.04),rgba(8,24,40,0.95))' }}>
            <div className="label-mono mb-5">Live Preview</div>
            <ScoreRing score={totalScore} size={180} />
            <div className="mt-4 font-bold text-xl" style={{ color: totalScore >= 80 ? '#22c55e' : totalScore >= 60 ? '#eab308' : '#ef4444', fontFamily: "'Space Grotesk',sans-serif" }}>
              {status}
            </div>
            <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{personality.type}</div>
            <div className="mt-6 w-full space-y-3">
              {[
                { label: 'Income', val: incomeScore, max: 30, color: '#22d3ee' },
                { label: 'Credit', val: creditScorePoints, max: 30, color: '#818cf8' },
                { label: 'Debt', val: emiPoints, max: 25, color: '#22c55e' },
              ].map(b => (
                <LiquidBar key={b.label} label={b.label} value={b.val} max={b.max} color={b.color} />
              ))}
            </div>
          </div>
        </div>

        {/* Canvas output */}
        {generated && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="glass rounded-3xl p-5 mb-5 overflow-auto">
              <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={download} className="btn-primary px-8 py-4 text-base flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download PNG
              </button>
              <button onClick={shareNative} className="btn-outline px-8 py-4 text-base flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share Card
              </button>
              <button onClick={copyLink} className="btn-outline px-8 py-4 text-base">
                {shareMsg || 'Copy Link'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Hidden canvas for pre-generation */}
        {!generated && <canvas ref={canvasRef} style={{ display: 'none' }} />}
      </div>
    </PageShell>
  )
}
