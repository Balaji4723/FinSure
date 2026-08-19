// Real bank rates — RBI MPC June 2025 + official bank rate cards
export const RBI_RATES = {
  repoRate: 6.25, reverseRepoRate: 3.35, crr: 4.0, slr: 18.0,
  source: "RBI MPC June 2025", lastUpdated: "2025-06-06"
}

export const BANK_DATA = [
  {
    bank: "SBI", fullName: "State Bank of India", type: "Public", rating: 4.2, minCreditScore: 650,
    processingFee: "0.35% (max ₹10,000)", maxTenure: 30, color: "#1a3c6e", accent: "#4a90d9",
    homeLoan: { min: 8.50, max: 9.85 }, personalLoan: { min: 11.45, max: 14.50 },
    carLoan: { min: 8.75, max: 10.25 }, educationLoan: { min: 8.15, max: 11.15 },
    features: ["Zero prepayment charges", "Doorstep service", "Lowest rates for women", "PMAY eligible"]
  },
  {
    bank: "HDFC", fullName: "HDFC Bank", type: "Private", rating: 4.4, minCreditScore: 700,
    processingFee: "0.50% (min ₹3,000)", maxTenure: 30, color: "#003366", accent: "#0066cc",
    homeLoan: { min: 8.70, max: 9.95 }, personalLoan: { min: 10.75, max: 24.00 },
    carLoan: { min: 8.80, max: 10.90 }, educationLoan: { min: 9.50, max: 13.75 },
    features: ["Fastest approval 48hrs", "Pre-approved offers", "Flexible EMI", "Digital process"]
  },
  {
    bank: "ICICI", fullName: "ICICI Bank", type: "Private", rating: 4.3, minCreditScore: 700,
    processingFee: "0.50% + GST", maxTenure: 30, color: "#b5060a", accent: "#e8460a",
    homeLoan: { min: 8.75, max: 10.05 }, personalLoan: { min: 10.85, max: 16.25 },
    carLoan: { min: 8.90, max: 10.50 }, educationLoan: { min: 9.00, max: 12.50 },
    features: ["Instant disbursal", "iMobile tracking", "Balance transfer", "Top-up loan"]
  },
  {
    bank: "Axis", fullName: "Axis Bank", type: "Private", rating: 4.1, minCreditScore: 680,
    processingFee: "1% (min ₹5,000)", maxTenure: 30, color: "#97144d", accent: "#c8185e",
    homeLoan: { min: 8.75, max: 10.30 }, personalLoan: { min: 11.25, max: 22.00 },
    carLoan: { min: 8.70, max: 11.25 }, educationLoan: { min: 9.70, max: 14.00 },
    features: ["Shubh Aarambh scheme", "Part-payment allowed", "Step-up EMI", "NRI loans"]
  },
  {
    bank: "Kotak", fullName: "Kotak Mahindra Bank", type: "Private", rating: 4.0, minCreditScore: 700,
    processingFee: "0.25%–1.00%", maxTenure: 20, color: "#c8102e", accent: "#ff4444",
    homeLoan: { min: 8.75, max: 9.85 }, personalLoan: { min: 10.99, max: 24.00 },
    carLoan: { min: 8.75, max: 10.00 }, educationLoan: { min: 10.00, max: 16.00 },
    features: ["Zero-fee account", "Instant personal loan", "Kotak app", "Pre-closure free"]
  },
  {
    bank: "PNB", fullName: "Punjab National Bank", type: "Public", rating: 3.9, minCreditScore: 650,
    processingFee: "0.35% (max ₹15,000)", maxTenure: 30, color: "#1a4d2e", accent: "#2d8a4e",
    homeLoan: { min: 8.40, max: 10.25 }, personalLoan: { min: 11.40, max: 16.95 },
    carLoan: { min: 8.70, max: 9.85 }, educationLoan: { min: 8.30, max: 11.80 },
    features: ["PM Awas Yojana", "SC/ST special rates", "Rural housing", "Low income eligible"]
  },
  {
    bank: "BOB", fullName: "Bank of Baroda", type: "Public", rating: 3.8, minCreditScore: 650,
    processingFee: "0.50% (max ₹15,000)", maxTenure: 30, color: "#f47920", accent: "#f9a14a",
    homeLoan: { min: 8.40, max: 10.65 }, personalLoan: { min: 11.05, max: 18.75 },
    carLoan: { min: 8.70, max: 10.50 }, educationLoan: { min: 8.15, max: 11.15 },
    features: ["Overdraft facility", "Plot purchase loan", "Joint loan option", "Baroda Advantage"]
  },
  {
    bank: "Canara", fullName: "Canara Bank", type: "Public", rating: 3.7, minCreditScore: 650,
    processingFee: "0.50% (max ₹10,000)", maxTenure: 30, color: "#00529b", accent: "#0077cc",
    homeLoan: { min: 8.40, max: 11.25 }, personalLoan: { min: 12.40, max: 16.00 },
    carLoan: { min: 8.70, max: 10.80 }, educationLoan: { min: 8.50, max: 12.00 },
    features: ["Senior citizen discount", "Green home discount", "Pension loan", "Canara Nivas"]
  },
  {
    bank: "IDBI", fullName: "IDBI Bank", type: "Public", rating: 3.8, minCreditScore: 660,
    processingFee: "0.50% (max ₹10,000)", maxTenure: 30, color: "#00736a", accent: "#00a99d",
    homeLoan: { min: 8.55, max: 10.85 }, personalLoan: { min: 12.00, max: 18.00 },
    carLoan: { min: 8.80, max: 10.70 }, educationLoan: { min: 8.30, max: 12.50 },
    features: ["Home loan top-up", "Property search help", "PMAY eligible", "Balance transfer"]
  },
  {
    bank: "Union", fullName: "Union Bank of India", type: "Public", rating: 3.9, minCreditScore: 650,
    processingFee: "0.50% (max ₹15,000)", maxTenure: 30, color: "#8b0000", accent: "#cc2200",
    homeLoan: { min: 8.35, max: 10.90 }, personalLoan: { min: 11.20, max: 14.20 },
    carLoan: { min: 8.60, max: 10.00 }, educationLoan: { min: 8.05, max: 11.75 },
    features: ["Lowest home loan rate", "Women special rate", "Union Miles scheme", "Agri loans"]
  }
]

export const LOAN_TYPE_KEY = {
  "Home Loan": "homeLoan", "Personal Loan": "personalLoan",
  "Car Loan": "carLoan", "Education Loan": "educationLoan"
}
