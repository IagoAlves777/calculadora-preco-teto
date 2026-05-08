const ONE_BILLION = 1_000_000_000
const ONE_MILLION = 1_000_000
const ONE_THOUSAND = 1_000
const PT_BR_LOCALE = 'pt-BR'
const DECIMAL_PLACES_TWO = 2
const DECIMAL_PLACES_ONE = 1

export const formatToBRL = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '—'
  return 'R$ ' + value.toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_TWO, maximumFractionDigits: DECIMAL_PLACES_TWO })
}

export const formatCompact = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '—'
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (absValue >= ONE_BILLION)
    return sign + 'R$ ' + (absValue / ONE_BILLION).toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_TWO, maximumFractionDigits: DECIMAL_PLACES_TWO }) + ' bi'
  if (absValue >= ONE_MILLION)
    return sign + 'R$ ' + (absValue / ONE_MILLION).toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_ONE, maximumFractionDigits: DECIMAL_PLACES_ONE }) + ' mi'
  if (absValue >= ONE_THOUSAND)
    return sign + 'R$ ' + (absValue / ONE_THOUSAND).toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_ONE, maximumFractionDigits: DECIMAL_PLACES_ONE }) + ' mil'
  return formatToBRL(value)
}

export const formatMoneyMask = (value: number): string =>
  value == null ? '' : value.toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_TWO, maximumFractionDigits: DECIMAL_PLACES_TWO })

export const parseCurrencyInput = (raw: string): number => {
  if (!raw) return 0
  return parseFloat(raw.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0
}

export const formatNumber = (value: number): string =>
  value == null ? '—' : value.toLocaleString(PT_BR_LOCALE)

export const formatCompactNumber = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '—'
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (absValue >= ONE_BILLION)
    return sign + (absValue / ONE_BILLION).toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_TWO, maximumFractionDigits: DECIMAL_PLACES_TWO }) + ' bi'
  if (absValue >= ONE_MILLION)
    return sign + (absValue / ONE_MILLION).toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_ONE, maximumFractionDigits: DECIMAL_PLACES_ONE }) + ' mi'
  if (absValue >= ONE_THOUSAND)
    return sign + (absValue / ONE_THOUSAND).toLocaleString(PT_BR_LOCALE, { minimumFractionDigits: DECIMAL_PLACES_ONE, maximumFractionDigits: DECIMAL_PLACES_ONE }) + ' mil'
  return value.toLocaleString(PT_BR_LOCALE)
}

export const formatPercent = (value: number, showSign = false): string =>
  `${showSign && value >= 0 ? '+' : ''}${value.toFixed(DECIMAL_PLACES_ONE)}%`
