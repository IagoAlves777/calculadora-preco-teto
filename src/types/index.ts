export interface Analysis {
  ticker: string
  intrinsicFormatted: string
  intrinsicValue: number
  currentPrice: string
  savedAt: string
  discountRatePct: number
  totalShares: number
  treasuryShares: number
  netDebt: number
  historicalProfits: number[]
  projectionGrowths: number[]
  perpetuityGrowthPct: number
  projectionYears: number
}


export interface DCFRow {
  year: number | 'perp'
  lucro: number
  vpl: number
  isHist: boolean
  isPerp: boolean
}

export interface DCFResult {
  rows: DCFRow[]
  projectedProfits: number[]
  presentValueFlows: number
  presentValueTerminal: number
  enterpriseValue: number
  intrinsicValuePerShare: number
  safetyMarginPct: number | null
  upsidePct: number | null
  impliedPriceToEarnings: string
}
