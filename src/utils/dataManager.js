/**
 * Persistencia simple en localStorage, reemplazable por Supabase luego.
 */
export function loadData(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function wipeData(key) {
  localStorage.removeItem(key)
}

// Generador de IDs robusto (con fallback si randomUUID no está disponible)
export function uid(prefix = '') {
  const base = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return prefix ? `${prefix}_${base}` : base
}
