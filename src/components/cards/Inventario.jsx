import { useMemo, useRef, useState } from 'react'
import { exportToXLSX, importFromXLSX } from '../../utils/exportExcel'
import { formatMoney, parseMoney } from '../../utils/formatNumbers'
import { loadData, saveData, wipeData, uid } from '../../utils/dataManager'
import { useUI } from '../ui/UIProvider'

const STORAGE_KEY = 'aij-inventory'

export default function Inventario() {
  const { notify, confirm } = useUI()
  const [items, setItems] = useState(() => loadData(STORAGE_KEY, []))
  const [query, setQuery] = useState('')
  const [minStock, setMinStock] = useState('')
  const [maxStock, setMaxStock] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)

  const [form, setForm] = useState({
    nombre: '',
    color: '',
    stock: '',
    costo: '',
    precio: '',
    categoria: '',
  })
  const nameRef = useRef(null)

  const filtered = useMemo(() => {
    let data = items
    if (query) {
      const q = query.toLowerCase()
      data = data.filter((it) =>
        [it.nombre, it.color, it.categoria].some((v) => String(v || '').toLowerCase().includes(q))
      )
    }
    if (minStock !== '') data = data.filter((it) => Number(it.stock || 0) >= Number(minStock))
    if (maxStock !== '') data = data.filter((it) => Number(it.stock || 0) <= Number(maxStock))
    return data
  }, [items, query, minStock, maxStock])

  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const update = (next) => {
    setItems(next)
    saveData(STORAGE_KEY, next)
  }

  const addItem = () => {
    const nombre = (form.nombre || '').trim()
    if (!nombre) {
      notify({ type: 'error', message: 'Ingresa al menos el nombre del producto.' })
      // Enfocar el campo para facilitar la corrección
      nameRef.current?.focus()
      return
    }
    const nuevo = {
      id: uid('prod'),
      nombre,
      color: form.color,
      stock: Number(form.stock || 0),
      costo: parseMoney(form.costo),
      precio: parseMoney(form.precio),
      categoria: form.categoria,
    }
    update([nuevo, ...items])
    setForm({ nombre: '', color: '', stock: '', costo: '', precio: '', categoria: '' })
    notify({ type: 'success', message: 'Producto agregado al inventario.' })
  }

  const onImport = async (file) => {
    const data = await importFromXLSX(file)
    if (Array.isArray(data)) update(data)
  }

  const onExport = () => exportToXLSX(items, 'inventario.xlsx')
  const onDownloadTemplate = () => {
    const template = [
      { nombre: 'Ejemplo', color: 'Rojo', stock: 10, costo: 1000.5, precio: 1500.75, categoria: 'General' },
    ]
    exportToXLSX(template, 'formato_inventario.xlsx')
  }

  const onWipe = async () => {
    const ok = await confirm({ title: 'Vaciar inventario', message: 'Esta acción no se puede deshacer.', confirmText: 'Vaciar', cancelText: 'Cancelar' })
    if (ok) {
      update([])
      wipeData(STORAGE_KEY)
      notify({ type: 'warning', message: 'Inventario vaciado.' })
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Inventario</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="px-3 py-2 bg-primary-600 text-white rounded-lg" onClick={addItem}>➕ Agregar producto</button>
          <label className="px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
            📥 Importar (.xlsx)
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => e.target.files[0] && onImport(e.target.files[0])} />
          </label>
          <button type="button" className="px-3 py-2 bg-gray-100 rounded-lg" onClick={onExport}>📤 Exportar (.xlsx)</button>
          <button type="button" className="px-3 py-2 bg-gray-100 rounded-lg" onClick={onDownloadTemplate}>📄 Descargar formato</button>
          <button type="button" className="px-3 py-2 bg-red-100 text-red-700 rounded-lg" onClick={onWipe}>🗑️ Vaciar inventario</button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          type="number"
          placeholder="Stock mínimo"
          value={minStock}
          onChange={(e) => setMinStock(e.target.value)}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          type="number"
          placeholder="Stock máximo"
          value={maxStock}
          onChange={(e) => setMaxStock(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-6 gap-3 mb-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Nombre del producto"
          value={form.nombre}
          ref={nameRef}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
        />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Color"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
        />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Costo (Bs.)"
          value={form.costo}
          onChange={(e) => setForm({ ...form, costo: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
        />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Precio (Bs.)"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
        />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Categoría"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        />
      </div>

      {/* Tabla */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Producto</th>
              <th className="text-left p-2">Color</th>
              <th className="text-right p-2">Stock</th>
              <th className="text-right p-2">Costo</th>
              <th className="text-right p-2">Precio</th>
              <th className="text-left p-2">Categoría</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.nombre}</td>
                <td className="p-2">{it.color}</td>
                <td className="p-2 text-right">{it.stock}</td>
                <td className="p-2 text-right">{formatMoney(it.costo)}</td>
                <td className="p-2 text-right">{formatMoney(it.precio)}</td>
                <td className="p-2">{it.categoria}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
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
