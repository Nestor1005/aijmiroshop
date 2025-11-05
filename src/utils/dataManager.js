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
