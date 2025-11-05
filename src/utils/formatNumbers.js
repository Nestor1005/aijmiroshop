/**
 * Formato numérico local: miles con punto y decimales con coma.
 * 1500.5 -> "1.500,50"
 */
export function formatMoney(value) {
  try {
    const n = Number(value || 0)
    return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } catch {
    return '0,00'
  }
}

/**
 * Parsea string con formato local a número JS.
 * "1.500,50" -> 1500.5
 */
export function parseMoney(str) {
  if (typeof str === 'number') return str
  if (!str) return 0
  const normalized = String(str).replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return isNaN(n) ? 0 : n
}
