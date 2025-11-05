import { useMemo, useState } from 'react'
import { loadData } from '../../utils/dataManager'
import { formatMoney } from '../../utils/formatNumbers'

const STORAGE_HISTORY = 'aij-history'

export default function Historial() {
  const [items] = useState(() => loadData(STORAGE_HISTORY, []))
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let data = items
    if (query) {
      const q = query.toLowerCase()
      data = data.filter((it) => [it.id, it.cliente, it.estado].some((v) => String(v || '').toLowerCase().includes(q)))
    }
    return data
  }, [items, query])

  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Historial</h3>
        <input className="rounded-lg border-gray-300" placeholder="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} />
      </header>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Nº ticket</th>
              <th className="text-left p-2">Cliente</th>
              <th className="text-left p-2">Fecha</th>
              <th className="text-right p-2">Total</th>
              <th className="text-left p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.id.slice(0, 6)}</td>
                <td className="p-2">{it.cliente}</td>
                <td className="p-2">{new Date(it.fecha).toLocaleString()}</td>
                <td className="p-2 text-right">{formatMoney(it.total)}</td>
                <td className="p-2">{it.estado}</td>
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
