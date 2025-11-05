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
  const s = String(str).trim()
  // Casos:
  // 1) "1.500,50" -> miles "." y decimales ","
  // 2) "1500,50"  -> decimales ","
  // 3) "1500.50"  -> decimales "."
  // 4) "1,500.50" -> miles "," y decimales "."
  let normalized = s
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    // Determinar cuál es decimal: último separador suele ser el decimal
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      // decimal = ","  → quitar puntos
      normalized = s.replace(/\./g, '').replace(',', '.')
    } else {
      // decimal = "."  → quitar comas
      normalized = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    // solo coma → decimal ","
    normalized = s.replace(/\./g, '').replace(',', '.')
  } else {
    // solo punto o sin separadores → decimal "." (no tocar)
    normalized = s
  }
  const n = Number(normalized)
  return isNaN(n) ? 0 : n
}
