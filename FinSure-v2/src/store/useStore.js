import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Badges earned
      badges: [],
      addBadge: (badge) => {
        const existing = get().badges.find(b => b.id === badge.id)
        if (!existing) set({ badges: [...get().badges, { ...badge, earnedAt: new Date().toISOString() }] })
      },

      // Streak
      streak: 0,
      lastVisit: null,
      updateStreak: () => {
        const today = new Date().toDateString()
        const last = get().lastVisit
        if (last === today) return
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        set({
          streak: last === yesterday ? get().streak + 1 : 1,
          lastVisit: today
        })
      },

      // Financial goal
      goal: null,
      setGoal: (goal) => set({ goal }),

      // Net worth entries
      netWorth: { assets: [], liabilities: [] },
      setNetWorth: (nw) => set({ netWorth: nw }),

      // Risk profile
      riskProfile: null,
      setRiskProfile: (profile) => set({ riskProfile: profile }),

      // Bank rates cache
      bankRates: null,
      setBankRates: (rates) => set({ bankRates: rates }),
      ratesLastFetched: null,
      setRatesLastFetched: (t) => set({ ratesLastFetched: t }),

      // FinScore for leaderboard
      finScore: 0,
      setFinScore: (s) => set({ finScore: s }),

      // Reports count for gamification
      reportsCount: 0,
      incrementReports: () => set({ reportsCount: get().reportsCount + 1 }),

      // Session timeout
      lastActivity: Date.now(),
      updateActivity: () => set({ lastActivity: Date.now() }),
    }),
    { name: 'finsure-store', partialize: (s) => ({
      badges: s.badges, streak: s.streak, lastVisit: s.lastVisit,
      goal: s.goal, netWorth: s.netWorth, riskProfile: s.riskProfile,
      finScore: s.finScore, reportsCount: s.reportsCount
    })}
  )
)
