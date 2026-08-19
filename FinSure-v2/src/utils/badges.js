export const BADGE_DEFS = [
  { id: 'first_analysis', icon: 'A', label: 'First Analysis', desc: 'Ran your first FinDNA analysis', color: '#22d3ee' },
  { id: 'emi_master', icon: 'B', label: 'EMI Master', desc: 'Calculated 5 EMI scenarios', color: '#818cf8' },
  { id: 'debt_free_path', icon: 'C', label: 'Debt-Free Path', desc: 'Generated a debt elimination plan', color: '#22c55e' },
  { id: 'premium_profile', icon: 'D', label: 'Premium Profile', desc: 'Achieved FinDNA score above 80', color: '#eab308' },
  { id: 'comparison_pro', icon: 'E', label: 'Comparison Pro', desc: 'Compared 3 banks simultaneously', color: '#f472b6' },
  { id: 'streak_7', icon: 'F', label: '7-Day Streak', desc: 'Visited FinSure 7 days in a row', color: '#fb923c' },
  { id: 'goal_setter', icon: 'G', label: 'Goal Setter', desc: 'Set a financial goal', color: '#a78bfa' },
  { id: 'net_worth_tracker', icon: 'H', label: 'Net Worth Tracker', desc: 'Added assets and liabilities', color: '#34d399' },
  { id: 'tax_saver', icon: 'I', label: 'Tax Saver', desc: 'Ran a Section 80C calculation', color: '#fbbf24' },
  { id: 'risk_profiled', icon: 'J', label: 'Risk Profiled', desc: 'Completed the Risk Personality Quiz', color: '#60a5fa' },
  { id: 'report_sharer', icon: 'K', label: 'Report Sharer', desc: 'Shared your FinDNA report card', color: '#f9a8d4' },
  { id: 'credit_booster', icon: 'H', label: 'Credit Booster', desc: 'Generated a credit score roadmap', color: '#22c55e' },
  { id: 'leaderboard_top10', icon: 'L', label: 'Top 10', desc: 'Ranked in the global top 10', color: '#eab308' },
  { id: 'prepay_optimizer', icon: 'M', label: 'Prepay Optimizer', desc: 'Used the Prepayment Optimizer', color: '#4ade80' },
]

export function calcFinScore({ reportsCount, badges, streak, finScore }) {
  return Math.min(
    reportsCount * 10 + badges.length * 25 + streak * 5 + (finScore || 0),
    9999
  )
}

export function getPersonalityType(score) {
  if (score >= 80) return { type: 'Strategic Borrower', desc: 'You plan ahead and borrow intelligently.', color: '#22c55e' }
  if (score >= 60) return { type: 'Growth Seeker', desc: 'Building financial strength steadily.', color: '#eab308' }
  return { type: 'Recovery Builder', desc: 'On the path to financial improvement.', color: '#ef4444' }
}
