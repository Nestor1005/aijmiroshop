import { useEffect, useState } from 'react'
import { loadData, saveData } from '../../utils/dataManager'
import { supabase, hasSupabaseConfig } from '../../lib/supabaseClient'
import { useUI } from '../ui/UIProvider'
import { SETTINGS_DEFAULTS } from '../../constants/settingsDefaults'

const STORAGE_SETTINGS = 'aij-settings'

export default function Configuracion() {
  const { notify } = useUI()
  const [form, setForm] = useState({
    ticketCompanyName: SETTINGS_DEFAULTS.ticketCompanyName,
    ticketEmail: SETTINGS_DEFAULTS.ticketEmail,
    ticketAddress: SETTINGS_DEFAULTS.ticketAddress,
    ticketRefsLine: SETTINGS_DEFAULTS.ticketRefsLine,
    ticketFooter: SETTINGS_DEFAULTS.ticketFooter,
  })
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('aij-supabase-url') || '')
  const [supabaseAnon, setSupabaseAnon] = useState(() => localStorage.getItem('aij-supabase-anon') || '')
  const [supaStatus, setSupaStatus] = useState('')

  useEffect(() => {
    const s = loadData(STORAGE_SETTINGS, SETTINGS_DEFAULTS)
    setForm((prev) => ({
      ...prev,
      ticketCompanyName: s.ticketCompanyName ?? prev.ticketCompanyName,
      ticketEmail: s.ticketEmail ?? prev.ticketEmail,
      ticketAddress: s.ticketAddress ?? prev.ticketAddress,
      ticketRefsLine: Array.isArray(s.ticketRefs) ? s.ticketRefs.join(', ') : (s.ticketRefsLine ?? ''),
      ticketFooter: s.ticketFooter ?? prev.ticketFooter,
    }))
  }, [])

  const onSave = () => {
    const current = loadData(STORAGE_SETTINGS, SETTINGS_DEFAULTS)
    const refs = (form.ticketRefsLine || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    const next = {
      ...current,
      ticketCompanyName: form.ticketCompanyName || SETTINGS_DEFAULTS.ticketCompanyName,
      ticketEmail: form.ticketEmail || SETTINGS_DEFAULTS.ticketEmail,
      ticketAddress: form.ticketAddress || SETTINGS_DEFAULTS.ticketAddress,
      ticketRefs: refs,
      ticketRefsLine: refs.join(', '),
      ticketFooter: form.ticketFooter || SETTINGS_DEFAULTS.ticketFooter,
    }
    saveData(STORAGE_SETTINGS, next)
    notify({ type: 'success', message: 'Configuración de ticket guardada.' })
  }

  const onSaveSupabase = async () => {
    localStorage.setItem('aij-supabase-url', supabaseUrl.trim())
    localStorage.setItem('aij-supabase-anon', supabaseAnon.trim())
    setSupaStatus('guardado')
    notify({ type: 'success', message: 'Credenciales de Supabase guardadas. Recarga para aplicar.' })
  }

  const onTestSupabase = async () => {
    try {
      setSupaStatus('probando')
      // crear un cliente temporal para probar
      const { createClient } = await import('@supabase/supabase-js')
      const tmp = createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: false } })
      const { data, error } = await tmp.from('inventory').select('id').limit(1)
      if (error) throw error
      setSupaStatus('ok')
      notify({ type: 'success', message: 'Conexión a Supabase OK.' })
    } catch (e) {
      setSupaStatus('error')
      notify({ type: 'error', message: 'Error al conectar a Supabase. Revisa URL/Key y esquema.' })
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Configuración</h3>
        <button type="button" className="px-3 py-2 rounded-lg bg-primary-600 text-white" onClick={onSave}>
          Guardar cambios
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2 p-4 rounded-lg border bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium">Conexión a Supabase</div>
              <div className="text-xs text-gray-600">Ingresa tu URL y Anon Key. Luego pulsa Guardar y (opcional) Probar.</div>
            </div>
            <div className="text-xs">Estado: {supaStatus || (hasSupabaseConfig() ? 'configurado' : 'sin configurar')}</div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            <input className="rounded-lg border-gray-300" placeholder="VITE_SUPABASE_URL" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} />
            <input className="rounded-lg border-gray-300" placeholder="VITE_SUPABASE_ANON_KEY" value={supabaseAnon} onChange={(e) => setSupabaseAnon(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button type="button" className="px-3 py-2 rounded-lg border" onClick={onSaveSupabase}>Guardar Supabase</button>
            <button type="button" className="px-3 py-2 rounded-lg border" onClick={onTestSupabase}>Probar conexión</button>
          </div>
          <div className="text-xs text-gray-600 mt-2">En producción con Vercel, define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Variables de Entorno.</div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Nombre de la empresa (encabezado)</label>
          <input className="w-full rounded-lg border-gray-300" value={form.ticketCompanyName} onChange={(e) => setForm({ ...form, ticketCompanyName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Correo (encabezado)</label>
          <input type="email" className="w-full rounded-lg border-gray-300" value={form.ticketEmail} onChange={(e) => setForm({ ...form, ticketEmail: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm text-gray-700">Dirección (encabezado)</label>
          <input className="w-full rounded-lg border-gray-300" value={form.ticketAddress} onChange={(e) => setForm({ ...form, ticketAddress: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm text-gray-700">Números de referencia (separados por coma)</label>
          <input
            className="w-full rounded-lg border-gray-300"
            placeholder="78615119, 63258974, 78945612"
            value={form.ticketRefsLine}
            onChange={(e) => setForm({ ...form, ticketRefsLine: e.target.value })}
          />
          <div className="text-xs text-gray-500">Se mostrará como: Cel: {form.ticketRefsLine || '78615119, 63258974, 78945612'}</div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm text-gray-700">Mensaje de pie (footer)</label>
          <input className="w-full rounded-lg border-gray-300" value={form.ticketFooter} onChange={(e) => setForm({ ...form, ticketFooter: e.target.value })} />
        </div>
      </div>
    </section>
  )
}
