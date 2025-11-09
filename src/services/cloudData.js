import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'

const tables = {
  'aij-inventory': 'inventory',
  'aij-clients': 'clients',
  'aij-history': 'history',
  'aij-users': 'users',
  'aij-settings': 'settings',
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
  if (key === 'aij-settings') {
    return {
      id: row.id || 'global',
      ticket_company_name: row.ticketCompanyName ?? row.ticket_company_name ?? null,
      ticket_email: row.ticketEmail ?? row.ticket_email ?? null,
      ticket_address: row.ticketAddress ?? row.ticket_address ?? null,
      ticket_refs: Array.isArray(row.ticketRefs) ? row.ticketRefs : (Array.isArray(row.ticket_refs) ? row.ticket_refs : []),
      ticket_footer: row.ticketFooter ?? row.ticket_footer ?? null,
      updated_at: row.updated_at ?? new Date().toISOString(),
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
  if (key === 'aij-settings') {
    return {
      id: row.id || 'global',
      ticketCompanyName: row.ticket_company_name ?? row.ticketCompanyName ?? null,
      ticketEmail: row.ticket_email ?? row.ticketEmail ?? null,
      ticketAddress: row.ticket_address ?? row.ticketAddress ?? null,
      ticketRefs: Array.isArray(row.ticket_refs) ? row.ticket_refs : (Array.isArray(row.ticketRefs) ? row.ticketRefs : []),
      ticketFooter: row.ticket_footer ?? row.ticketFooter ?? null,
      updated_at: row.updated_at ?? null,
    }
  }
  return row
}

export async function cloudList(key) {
  if (!cloudEnabled()) return null
  const table = tables[key]
  if (!table) return null
  const orderBy =
    table === 'history' ? 'fecha' :
    table === 'inventory' ? 'created_at' :
    table === 'clients' ? 'created_at' :
    table === 'users' ? 'created_at' : 'id'
  const query = supabase.from(table).select('*')
  const { data, error } = await query.order(orderBy, { ascending: false })
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

// Realtime subscription for ultra-fast cross-device sync
export function cloudSubscribe(key, handler) {
  if (!cloudEnabled()) return () => {}
  const table = tables[key]
  if (!table) return () => {}
  const channel = supabase
    .channel(`realtime:${table}:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      const evt = payload.eventType
      const newRow = payload.new ? toApp(key, payload.new) : null
      const oldRow = payload.old ? toApp(key, payload.old) : null
      try { handler({ event: evt, new: newRow, old: oldRow }) } catch {}
    })
    .subscribe()

  return () => {
    try { supabase.removeChannel(channel) } catch {}
  }
}
