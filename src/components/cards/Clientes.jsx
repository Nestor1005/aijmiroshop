import { useMemo, useState } from 'react'
import { loadData, saveData, wipeData } from '../../utils/dataManager'

const STORAGE_KEY = 'aij-clients'

export default function Clientes() {
  const [items, setItems] = useState(() => loadData(STORAGE_KEY, []))
  const [query, setQuery] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)

  const [form, setForm] = useState({ nombre: '', cedula: '', telefono: '', direccion: '' })

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

  const update = (next) => {
    setItems(next)
    saveData(STORAGE_KEY, next)
  }

  const addItem = () => {
    if (!form.nombre) return
    const nuevo = { id: crypto.randomUUID(), ...form }
    update([nuevo, ...items])
    setForm({ nombre: '', cedula: '', telefono: '', direccion: '' })
  }

  const onWipe = () => {
    if (confirm('¿Vaciar clientes?')) {
      update([])
      wipeData(STORAGE_KEY)
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Clientes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="px-3 py-2 bg-primary-600 text-white rounded-lg" onClick={addItem}>➕ Agregar cliente</button>
          <button type="button" className="px-3 py-2 bg-red-100 text-red-700 rounded-lg" onClick={onWipe}>🗑️ Vaciar clientes</button>
        </div>
      </header>

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <input className="rounded-lg border-gray-300" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input className="rounded-lg border-gray-300" placeholder="Cédula de identidad" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
        <input className="rounded-lg border-gray-300" placeholder="Celular o teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        <input className="rounded-lg border-gray-300" placeholder="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
      </div>

      <div className="mb-4">
        <input className="rounded-lg border-gray-300 w-full" placeholder="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Cédula</th>
              <th className="text-left p-2">Teléfono</th>
              <th className="text-left p-2">Dirección</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.nombre}</td>
                <td className="p-2">{it.cedula}</td>
                <td className="p-2">{it.telefono}</td>
                <td className="p-2">{it.direccion}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">Sin resultados</td>
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
