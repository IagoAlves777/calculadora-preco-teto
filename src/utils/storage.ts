import type { Analysis } from '../types'

const STORAGE_KEY = 'dcf_v4'
const MILLION = 1_000_000

type LegacyAnalysis = Omit<Analysis, 'netDebt'> & { netDebt?: number; netDebtMillions?: number }

export const getAnalyses = (): Analysis[] => {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as LegacyAnalysis[]
  return data.map((item) => ({
    ...item,
    netDebt: item.netDebt ?? (item.netDebtMillions != null ? item.netDebtMillions * MILLION : 0),
  }))
}

export const saveAnalyses = (analyses: Analysis[]): void =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses))
