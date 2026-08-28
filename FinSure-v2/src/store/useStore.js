import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // ── USER FINANCIAL PROFILE (auto-fills all tools) ──
      userProfile: {
        salary: 60000,
        creditScore: 720,
        age: 30,
        existingEMI: 0,
        employment: 'Salaried',
        city: '',
        loanType: 'Home Loan',
        desiredLoan: 2500000,
      },
      setUserProfile: (data) => set({ userProfile: { ...get().userProfile, ...data } }),

      // Reports count
      reportsCount: 0,
      incrementReports: () => set({ reportsCount: get().reportsCount + 1 }),

      // Risk profile
      riskProfile: null,
      setRiskProfile: (p) => set({ riskProfile: p }),

      // Goal
      goal: null,
      setGoal: (g) => set({ goal: g }),

      // Net worth
      netWorth: { assets: [], liabilities: [] },
      setNetWorth: (nw) => set({ netWorth: nw }),

      // Bank rates cache
      bankRates: null,
      bankRatesLastFetch: null,
      setBankRates: (rates) => set({ bankRates: rates, bankRatesLastFetch: Date.now() }),

      // FinScore
      finScore: 0,
      setFinScore: (s) => set({ finScore: s }),

      // Stubs for compatibility
      updateStreak: () => {},
      updateActivity: () => {},
      addBadge: () => {},
      streak: 0,
      badges: [],
    }),
    {
      name: 'finsure-store',
      partialize: (state) => ({
        userProfile: state.userProfile,
        reportsCount: state.reportsCount,
        riskProfile: state.riskProfile,
        goal: state.goal,
        netWorth: state.netWorth,
        bankRates: state.bankRates,
        bankRatesLastFetch: state.bankRatesLastFetch,
        finScore: state.finScore,
      })
    }
  )
)
