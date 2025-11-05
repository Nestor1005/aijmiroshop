import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'

const tables = {
  'aij-inventory': 'inventory',
  'aij-clients': 'clients',
  'aij-history': 'history',
  'aij-users': 'users',
}

export const cloudEnabled = () => hasSupabaseConfig()

export async function cloudList(key) {
  if (!cloudEnabled()) return null
  const table = tables[key]
  if (!table) return null
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function cloudUpsert(key, rows) {
  if (!cloudEnabled()) return null
  const table = tables[key]
  if (!table) return null
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw error
  return true
}

export async function cloudDelete(key, id) {
  if (!cloudEnabled()) return null
  const table = tables[key]
  if (!table) return null
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
  return true
}

export async function cloudReplaceAll(key, rows) {
  if (!cloudEnabled()) return null
  const table = tables[key]
  if (!table) return null
  // naive replace: delete all then insert
  const { error: delErr } = await supabase.from(table).delete().neq('id', '')
  if (delErr) throw delErr
  if (rows?.length) {
    const { error } = await supabase.from(table).insert(rows)
    if (error) throw error
  }
  return true
}
