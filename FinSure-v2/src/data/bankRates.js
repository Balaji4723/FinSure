// Real bank rates — RBI MPC August 2026 + official bank rate cards
export const RBI_RATES = {
  repoRate: 5.75,
  reverseRepoRate: 3.35,
  crr: 4.0,
  slr: 18.0,
  source: "RBI MPC August 2026",
  lastUpdated: "2026-08-07"
}

export const LOAN_TYPE_KEY = {
  'Home Loan': 'homeLoan',
  'Personal Loan': 'personalLoan',
  'Car Loan': 'carLoan',
  'Education Loan': 'educationLoan',
}

export const BANK_DATA = [
  {
    bank: "SBI", fullName: "State Bank of India", type: "Public", rating: 4.2, minCreditScore: 650,
    processingFee: "0.35% (max ₹10,000)", maxTenure: 30, color: "#1a3c6e", accent: "#4a90d9",
    homeLoan: { min: 7.90, max: 9.35 }, personalLoan: { min: 10.90, max: 13.85 },
    carLoan: { min: 8.20, max: 9.75 }, educationLoan: { min: 7.85, max: 10.80 },
    features: ["Zero prepayment charges", "Doorstep service", "Lowest rates for women", "PMAY eligible"]
  },
  {
    bank: "HDFC", fullName: "HDFC Bank", type: "Private", rating: 4.4, minCreditScore: 700,
    processingFee: "0.50% (min ₹3,000)", maxTenure: 30, color: "#003366", accent: "#0066cc",
    homeLoan: { min: 8.10, max: 9.45 }, personalLoan: { min: 10.25, max: 22.00 },
    carLoan: { min: 8.30, max: 10.40 }, educationLoan: { min: 9.00, max: 13.25 },
    features: ["Fastest approval 48hrs", "Pre-approved offers", "Flexible EMI", "Digital process"]
  },
  {
    bank: "ICICI", fullName: "ICICI Bank", type: "Private", rating: 4.3, minCreditScore: 700,
    processingFee: "0.50% + GST", maxTenure: 30, color: "#b5060a", accent: "#e8460a",
    homeLoan: { min: 8.15, max: 9.65 }, personalLoan: { min: 10.35, max: 15.75 },
    carLoan: { min: 8.40, max: 10.00 }, educationLoan: { min: 8.50, max: 12.00 },
    features: ["Instant disbursal", "iMobile tracking", "Balance transfer", "Top-up loan"]
  },
  {
    bank: "Axis", fullName: "Axis Bank", type: "Private", rating: 4.1, minCreditScore: 680,
    processingFee: "1% (min ₹5,000)", maxTenure: 30, color: "#97144d", accent: "#c8185e",
    homeLoan: { min: 8.15, max: 9.80 }, personalLoan: { min: 10.75, max: 21.50 },
    carLoan: { min: 8.20, max: 10.75 }, educationLoan: { min: 9.20, max: 13.50 },
    features: ["Shubh Aarambh scheme", "Part-payment allowed", "Step-up EMI", "NRI loans"]
  },
  {
    bank: "Kotak", fullName: "Kotak Mahindra Bank", type: "Private", rating: 4.0, minCreditScore: 700,
    processingFee: "0.25%–1.00%", maxTenure: 20, color: "#c8102e", accent: "#ff4444",
    homeLoan: { min: 8.15, max: 9.40 }, personalLoan: { min: 10.49, max: 22.00 },
    carLoan: { min: 8.25, max: 9.75 }, educationLoan: { min: 9.50, max: 15.50 },
    features: ["Zero-fee account", "Instant personal loan", "Kotak app", "Pre-closure free"]
  },
  {
    bank: "PNB", fullName: "Punjab National Bank", type: "Public", rating: 3.9, minCreditScore: 650,
    processingFee: "0.35% (max ₹15,000)", maxTenure: 30, color: "#1a4d2e", accent: "#2d8a4e",
    homeLoan: { min: 7.80, max: 9.85 }, personalLoan: { min: 10.90, max: 16.45 },
    carLoan: { min: 8.20, max: 9.50 }, educationLoan: { min: 7.80, max: 11.30 },
    features: ["PM Awas Yojana", "SC/ST special rates", "Rural housing", "Low income eligible"]
  },
  {
    bank: "BOB", fullName: "Bank of Baroda", type: "Public", rating: 3.8, minCreditScore: 650,
    processingFee: "0.50% (max ₹15,000)", maxTenure: 30, color: "#f47920", accent: "#f9a14a",
    homeLoan: { min: 7.80, max: 10.15 }, personalLoan: { min: 10.55, max: 17.75 },
    carLoan: { min: 8.20, max: 10.00 }, educationLoan: { min: 7.70, max: 10.65 },
    features: ["Overdraft facility", "Plot purchase loan", "Joint loan option", "Baroda Advantage"]
  },
  {
    bank: "Canara", fullName: "Canara Bank", type: "Public", rating: 3.7, minCreditScore: 650,
    processingFee: "0.50% (max ₹10,000)", maxTenure: 30, color: "#00529b", accent: "#0077cc",
    homeLoan: { min: 7.80, max: 10.75 }, personalLoan: { min: 11.90, max: 15.50 },
    carLoan: { min: 8.15, max: 9.65 }, educationLoan: { min: 7.75, max: 10.85 },
    features: ["PMAY urban rural", "Women special rate", "Canara home suraksha", "Flexible tenure"]
  },
  {
    bank: "IDBI", fullName: "IDBI Bank", type: "Public", rating: 3.6, minCreditScore: 650,
    processingFee: "0.50% (max ₹10,000)", maxTenure: 30, color: "#003087", accent: "#004db3",
    homeLoan: { min: 7.95, max: 10.50 }, personalLoan: { min: 11.50, max: 15.75 },
    carLoan: { min: 8.25, max: 10.00 }, educationLoan: { min: 8.40, max: 12.00 },
    features: ["PMAY scheme", "NRI home loans", "Pradhan Mantri", "Low processing fee"]
  },
  {
    bank: "Union", fullName: "Union Bank of India", type: "Public", rating: 3.7, minCreditScore: 650,
    processingFee: "0.50% (max ₹15,000)", maxTenure: 30, color: "#1e5fa8", accent: "#2e7fd4",
    homeLoan: { min: 7.75, max: 9.95 }, personalLoan: { min: 10.70, max: 15.90 },
    carLoan: { min: 8.15, max: 9.55 }, educationLoan: { min: 7.80, max: 11.45 },
    features: ["Union Awas scheme", "Flexible repayment", "Women concessional", "Green home loan"]
  },
]
