import { useEffect, useMemo, useRef, useState } from 'react'
import { loadData, saveData, wipeData, uid } from '../../utils/dataManager'
import { useUI } from '../ui/UIProvider'
import { cloudEnabled, cloudList, cloudReplaceAll, cloudUpsert, cloudDelete, cloudSubscribe } from '../../services/cloudData'

const STORAGE_KEY = 'aij-clients'

export default function Clientes() {
  const { notify, confirm } = useUI()
  const [items, setItems] = useState(() => loadData(STORAGE_KEY, []))
  const [query, setQuery] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)

  const [form, setForm] = useState({ nombre: '', cedula: '', telefono: '', direccion: '' })
  const [editingId, setEditingId] = useState(null)
  const nameRef = useRef(null)

  const filtered = useMemo(() => {
    let data = items
    if (query) {
      const q = query.toLowerCase()
      data = data.filter((it) => [it.nombre, it.cedula, it.telefono, it.direccion].some((v) => String(v || '').toLowerCase().includes(q)))
    }
    return data
  }, [items, query])

  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const update = async (next) => {
    setItems(next)
    saveData(STORAGE_KEY, next)
  }

  const addItem = async () => {
    const nombre = (form.nombre || '').trim()
    if (!nombre) {
      notify({ type: 'error', message: 'Ingresa al menos el nombre del cliente.' })
      nameRef.current?.focus()
      return
    }
    if (editingId) {
      const idx = items.findIndex((x) => x.id === editingId)
      if (idx !== -1) {
        const next = [...items]
        next[idx] = { ...next[idx], ...form, nombre }
        await update(next)
        if (cloudEnabled()) {
          try { await cloudUpsert(STORAGE_KEY, next[idx]) } catch (e) { console.error('Cloud upsert (cliente):', e) }
        }
        notify({ type: 'success', message: 'Cliente actualizado.' })
      }
      setEditingId(null)
      setForm({ nombre: '', cedula: '', telefono: '', direccion: '' })
    } else {
      const nuevo = { id: uid('cli'), ...form, nombre }
      const nextList = [nuevo, ...items]
      await update(nextList)
      if (cloudEnabled()) {
        try { await cloudUpsert(STORAGE_KEY, nuevo) } catch (e) { console.error('Cloud upsert (cliente nuevo):', e) }
      }
      setForm({ nombre: '', cedula: '', telefono: '', direccion: '' })
      notify({ type: 'success', message: 'Cliente agregado.' })
    }
  }

  const onWipe = async () => {
    const ok = await confirm({ title: 'Vaciar clientes', message: 'Esta acción no se puede deshacer.', confirmText: 'Vaciar', cancelText: 'Cancelar' })
    if (ok) {
      await update([])
      wipeData(STORAGE_KEY)
      if (cloudEnabled()) {
        try { await cloudReplaceAll(STORAGE_KEY, []) } catch (e) { console.error('Cloud wipe (clientes):', e) }
      }
      notify({ type: 'warning', message: 'Listado de clientes vaciado.' })
    }
  }

  const onEdit = (it) => {
    setEditingId(it.id)
    setForm({
      nombre: it.nombre || '',
      cedula: it.cedula || '',
      telefono: it.telefono || '',
      direccion: it.direccion || '',
    })
    nameRef.current?.focus()
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setForm({ nombre: '', cedula: '', telefono: '', direccion: '' })
  }

  const onDelete = async (id) => {
    const ok = await confirm({ title: 'Eliminar cliente', message: '¿Deseas eliminar este cliente?', confirmText: 'Eliminar' })
    if (!ok) return
    const next = items.filter((x) => x.id !== id)
    await update(next)
    if (cloudEnabled()) {
      try { await cloudDelete(STORAGE_KEY, id) } catch (e) { console.error('Cloud delete (cliente):', e) }
    }
    notify({ type: 'warning', message: 'Cliente eliminado.' })
  }

  useEffect(() => {
    let cancelled = false
    async function loadCloud() {
      if (!cloudEnabled()) return
      try {
        const remote = await cloudList(STORAGE_KEY)
        const local = loadData(STORAGE_KEY, [])
        if (!cancelled && Array.isArray(remote)) {
          if ((remote?.length || 0) === 0 && (local?.length || 0) > 0) {
            // Primer uso en la nube: subir lo local
            try { await cloudReplaceAll(STORAGE_KEY, local) } catch {}
          } else {
            setItems(remote)
            saveData(STORAGE_KEY, remote)
          }
        }
      } catch (e) {
        console.error('Cloud load error (clientes):', e)
      }
    }
    loadCloud()
    // Realtime subscription
    let unsub = () => {}
    if (cloudEnabled()) {
      unsub = cloudSubscribe(STORAGE_KEY, ({ event, new: n, old }) => {
        setItems((prev) => {
          let next = prev
          if (event === 'INSERT' || event === 'UPDATE') {
            const idx = next.findIndex((x) => x.id === n.id)
            if (idx !== -1) { next = [...next]; next[idx] = { ...next[idx], ...n } }
            else { next = [n, ...next] }
          } else if (event === 'DELETE') {
            next = next.filter((x) => x.id !== (old?.id))
          }
          saveData(STORAGE_KEY, next)
          return next
        })
      })
    }
    return () => {
      cancelled = true
      try { unsub() } catch {}
    }
  }, [])

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Clientes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="px-3 py-2 bg-primary-600 text-white rounded-lg" onClick={addItem}>
            {editingId ? '💾 Guardar cambios' : '➕ Agregar cliente'}
          </button>
          {editingId && (
            <button type="button" className="px-3 py-2 bg-gray-100 rounded-lg" onClick={onCancelEdit}>Cancelar</button>
          )}
          <button type="button" className="px-3 py-2 bg-red-100 text-red-700 rounded-lg" onClick={onWipe}>🗑️ Vaciar clientes</button>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Nombre"
          value={form.nombre}
          ref={nameRef}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
        />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Cédula de identidad"
          value={form.cedula}
          onChange={(e) => setForm({ ...form, cedula: e.target.value })}
        />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Celular o teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Cédula</th>
              <th className="text-left p-2">Teléfono</th>
              <th className="text-left p-2">Dirección</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.nombre}</td>
                <td className="p-2">{it.cedula}</td>
                <td className="p-2">{it.telefono}</td>
                <td className="p-2">{it.direccion}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-blue-50 border-blue-300 text-blue-700" onClick={() => onEdit(it)}>Editar</button>
                    <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-red-50 border-red-300 text-red-700" onClick={() => onDelete(it.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span>Filas:</span>
          <select className="rounded border-gray-300" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}>
            {[5, 10, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
          <span>Página {page} de {pages}</span>
          <button disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
        </div>
      </div>
    </section>
  )
}
