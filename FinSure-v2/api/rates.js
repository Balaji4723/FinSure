import { BANK_DATA, RBI_RATES } from '../src/data/bankRates.js'
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*')
  res.setHeader('Cache-Control','s-maxage=3600,stale-while-revalidate')
  res.status(200).json({ success:true, banks:BANK_DATA, rbi:RBI_RATES, source:'RBI MPC June 2025 + Official Bank Rate Cards', lastUpdated:new Date().toISOString() })
}
