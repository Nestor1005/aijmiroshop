import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'

const tables = {
  'aij-inventory': 'inventory',
  'aij-clients': 'clients',
  'aij-history': 'history',
  'aij-users': 'users',
}

export const cloudEnabled = () => hasSupabaseConfig()

function toDb(key, row) {
  if (key === 'aij-history') {
    return {
      id: row.id,
      cliente: row.cliente ?? null,
      cliente_id: row.clienteId ?? row.cliente_id ?? null,
      fecha: row.fecha ?? new Date().toISOString(),
      items: row.items ?? [],
      subtotal: row.subtotal ?? 0,
      descuento: row.descuento ?? 0,
      total: row.total ?? 0,
      envio: row.envio ?? null,
      pago: row.pago ?? null,
      atendido_por: row.atendidoPor ?? row.atendido_por ?? null,
      estado: row.estado ?? 'Pendiente',
    }
  }
  // demás tablas usan mismas claves
  return row
}

function toApp(key, row) {
  if (key === 'aij-history') {
    return {
      id: row.id,
      cliente: row.cliente ?? null,
      clienteId: row.cliente_id ?? row.clienteId ?? null,
      fecha: row.fecha,
      items: row.items ?? [],
      subtotal: Number(row.subtotal ?? 0),
      descuento: Number(row.descuento ?? 0),
      total: Number(row.total ?? 0),
      envio: row.envio ?? null,
      pago: row.pago ?? null,
      atendidoPor: row.atendido_por ?? row.atendidoPor ?? null,
      estado: row.estado ?? 'Pendiente',
    }
  }
  return row
}

export async function cloudList(key) {
  if (!cloudEnabled()) return null
  const table = tables[key]
  if (!table) return null
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  if (error) throw error
  const rows = data || []
  return rows.map((r) => toApp(key, r))
}

export async function cloudUpsert(key, rows) {
  if (!cloudEnabled()) return null
  const table = tables[key]
  if (!table) return null
  const payload = Array.isArray(rows) ? rows.map((r) => toDb(key, r)) : toDb(key, rows)
  const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' })
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
    const payload = rows.map((r) => toDb(key, r))
    const { error } = await supabase.from(table).insert(payload)
    if (error) throw error
  }
  return true
}
