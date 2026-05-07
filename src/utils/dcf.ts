import type { DCFResult, DCFRow } from '../types'

const CURRENT_YEAR = new Date().getFullYear()
const HISTORICAL_YEARS_COUNT = 5
const PERCENTAGE_BASE = 100
const MIN_TERMINAL_DISCOUNT_YEARS = 1

export const HISTORICAL_YEARS = Array.from(
  { length: HISTORICAL_YEARS_COUNT },
  (_, index) => CURRENT_YEAR - HISTORICAL_YEARS_COUNT + index,
)
export const BASE_PROJECTION_YEAR = CURRENT_YEAR - 1

export interface DCFCalculationParams {
  discountRatePct: number
  historicalProfits: number[]
  projectionYears: number
  projectionGrowths: number[]
  perpetuityGrowthPct: number
  manualProfits: number[]
  isProfitManual: boolean[]
  totalShares: number
  treasuryShares: number
  netDebt: number
  currentPrice: number
}

export const calculateDCF = (params: DCFCalculationParams): DCFResult => {
  const discountRate = params.discountRatePct / PERCENTAGE_BASE
  const sharesOutstanding = Math.max(params.totalShares - params.treasuryShares, 1)
  const netDebt = params.netDebt

  const historicalRows: DCFRow[] = params.historicalProfits.map((profit, index) => ({
    year: HISTORICAL_YEARS[index],
    lucro: profit,
    vpl: 0,
    isHist: true,
    isPerp: false,
  }))

  const initialProfit = params.historicalProfits.at(-1) ?? 0

  const { lastProfit, presentValueFlows, projectedProfits, projectionRows } =
    Array.from({ length: params.projectionYears }, (_, index) => index).reduce(
      ({ lastProfit, presentValueFlows, projectedProfits, projectionRows }, index) => {
        const currentProfit =
          params.isProfitManual[index] === true
            ? (params.manualProfits[index] ?? lastProfit)
            : lastProfit * (1 + params.projectionGrowths[index] / PERCENTAGE_BASE)

        const discountedValue = currentProfit / Math.pow(1 + discountRate, index + 1)

        return {
          lastProfit: currentProfit,
          presentValueFlows: presentValueFlows + discountedValue,
          projectedProfits: [...projectedProfits, currentProfit],
          projectionRows: [
            ...projectionRows,
            {
              year: BASE_PROJECTION_YEAR + index + 1,
              lucro: currentProfit,
              vpl: discountedValue,
              isHist: false,
              isPerp: false,
            },
          ],
        }
      },
      {
        lastProfit: initialProfit,
        presentValueFlows: 0,
        projectedProfits: [] as number[],
        projectionRows: [] as DCFRow[],
      },
    )

  const perpetuityRate = params.perpetuityGrowthPct / PERCENTAGE_BASE
  let presentValueTerminal = 0
  const terminalRows: DCFRow[] = []

  if (discountRate > perpetuityRate) {
    const terminalValue = (lastProfit * (1 + perpetuityRate)) / (discountRate - perpetuityRate)
    const terminalDiscountYears = Math.max(params.projectionYears - 1, MIN_TERMINAL_DISCOUNT_YEARS)
    presentValueTerminal = terminalValue / Math.pow(1 + discountRate, terminalDiscountYears)
    terminalRows.push({
      year: 'perp',
      lucro: terminalValue,
      vpl: presentValueTerminal,
      isHist: false,
      isPerp: true,
    })
  }

  const enterpriseValue = presentValueFlows + presentValueTerminal - netDebt
  const intrinsicValuePerShare = enterpriseValue / sharesOutstanding
  const safetyMarginPct =
    params.currentPrice > 0 && intrinsicValuePerShare > 0
      ? (1 - params.currentPrice / intrinsicValuePerShare) * PERCENTAGE_BASE
      : null
  const upsidePct =
    params.currentPrice > 0
      ? (intrinsicValuePerShare / params.currentPrice - 1) * PERCENTAGE_BASE
      : null
  const earningsPerShare = (params.historicalProfits.at(-1) ?? 0) / sharesOutstanding
  const impliedPriceToEarnings =
    earningsPerShare > 0 ? (intrinsicValuePerShare / earningsPerShare).toFixed(1) : '—'

  return {
    rows: [...historicalRows, ...projectionRows, ...terminalRows],
    projectedProfits,
    presentValueFlows,
    presentValueTerminal,
    enterpriseValue,
    intrinsicValuePerShare,
    safetyMarginPct,
    upsidePct,
    impliedPriceToEarnings,
  }
}
