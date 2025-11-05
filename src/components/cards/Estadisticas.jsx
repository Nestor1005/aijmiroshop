import { useEffect, useMemo, useRef, useState } from 'react'
import { loadData, saveData } from '../../utils/dataManager'
import { formatMoney } from '../../utils/formatNumbers'

const STORAGE_HISTORY = 'aij-history'
const STORAGE_PRODUCTS = 'aij-inventory'
const STORAGE_CLIENTS = 'aij-clients'
const STORAGE_SETTINGS = 'aij-settings'

function fmtDateShort(d) {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

export default function Estadisticas() {
  const [range, setRange] = useState('30') // 7, 30, 90, all
  const [lowStock, setLowStock] = useState(() => {
    const s = loadData(STORAGE_SETTINGS, {})
    return Number(s.lowStockThreshold ?? 5)
  })

  const history = loadData(STORAGE_HISTORY, [])
  const products = loadData(STORAGE_PRODUCTS, [])
  const clients = loadData(STORAGE_CLIENTS, [])

  const now = new Date()
  const start = useMemo(() => {
    if (range === 'all') return new Date(0)
    const days = Number(range)
    const d = new Date(now)
    d.setDate(d.getDate() - days + 1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [range])

  const scoped = useMemo(() => {
    return history.filter((t) => {
      const dt = new Date(t.fecha)
      return dt >= start
    })
  }, [history, start])

  const completed = scoped.filter((t) => t.estado === 'Completado')
  const pending = scoped.filter((t) => t.estado !== 'Completado')

  const totalSales = completed.reduce((acc, t) => acc + Number(t.total || 0), 0)
  const avgTicket = completed.length ? totalSales / completed.length : 0

  const invValorCosto = products.reduce((acc, p) => acc + Number(p.stock || 0) * Number(p.costo || 0), 0)
  const invValorVenta = products.reduce((acc, p) => acc + Number(p.stock || 0) * Number(p.precio || 0), 0)
  const bajoStock = products
    .filter((p) => Number(p.stock || 0) <= Number(lowStock))
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 5)

  const topProductos = useMemo(() => {
    const map = new Map()
    for (const t of completed) {
      for (const it of t.items || []) {
        const key = it.id || it.name
        const prev = map.get(key) || { id: it.id, nombre: it.name, qty: 0, ingresos: 0 }
        prev.qty += Number(it.qty || 0)
        prev.ingresos += Number(it.qty || 0) * Number(it.price || 0)
        map.set(key, prev)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [completed])

  const seriesDias = useMemo(() => {
    // Construir lista de días desde start hasta hoy
    const out = []
    const cursor = new Date(start)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(0, 0, 0, 0)
    while (cursor <= end) {
      const label = fmtDateShort(cursor)
      out.push({ label, key: cursor.toISOString().slice(0, 10), total: 0 })
      cursor.setDate(cursor.getDate() - 0 + 1)
    }
    for (const t of completed) {
      const dayKey = new Date(t.fecha).toISOString().slice(0, 10)
      const bucket = out.find((d) => d.key === dayKey)
      if (bucket) bucket.total += Number(t.total || 0)
    }
    return out
  }, [completed, start])

  const maxDia = seriesDias.reduce((m, d) => Math.max(m, d.total), 0) || 1
  // Configuración responsive para el gráfico de barras
  const barWidth = 12 // px en móvil (w-3)
  const barWidthSm = 18 // px en >= sm (w-4.5 aprox)
  const gapPx = 4 // Tailwind gap-1
  const paddingPx = 24 // p-3 en el contenedor interior
  const chartWidthMobile = seriesDias.length * (barWidth + gapPx) + paddingPx * 2
  const labelStep = Math.max(1, Math.ceil(seriesDias.length / 12)) // máx ~12 etiquetas visibles en móvil

  // Auto-scroll al final (hoy) cuando cambia la serie o el rango
  const scrollRef = useRef(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      // scroll al extremo derecho para ver la fecha más reciente
      el.scrollLeft = el.scrollWidth
    }
  }, [seriesDias, range])

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Estadísticas</h3>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span>Período:</span>
            <select className="rounded border-gray-300" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7">7 días</option>
              <option value="30">30 días</option>
              <option value="90">90 días</option>
              <option value="all">Todo</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>Umbral bajo stock:</span>
            <input
              type="number"
              min={0}
              className="w-20 rounded border-gray-300"
              value={lowStock}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value || 0))
                setLowStock(v)
                // Persistir en settings
                const cur = loadData(STORAGE_SETTINGS, {})
                saveData(STORAGE_SETTINGS, { ...cur, lowStockThreshold: v })
              }}
            />
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="p-4 rounded-lg border bg-gray-50">
          <div className="text-xs text-gray-500">Ventas (Completadas)</div>
          <div className="text-xl font-semibold">Bs. {formatMoney(totalSales)}</div>
        </div>
        <div className="p-4 rounded-lg border bg-gray-50">
          <div className="text-xs text-gray-500">Tickets completados</div>
          <div className="text-xl font-semibold">{completed.length}</div>
        </div>
        <div className="p-4 rounded-lg border bg-gray-50">
          <div className="text-xs text-gray-500">Tickets pendientes</div>
          <div className="text-xl font-semibold">{pending.length}</div>
        </div>
        <div className="p-4 rounded-lg border bg-gray-50">
          <div className="text-xs text-gray-500">Ticket promedio</div>
          <div className="text-xl font-semibold">Bs. {formatMoney(avgTicket)}</div>
        </div>
      </div>

      {/* Inventario y clientes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-lg border">
          <div className="text-sm font-medium mb-2">Inventario</div>
          <div className="text-xs text-gray-500">Valor al costo</div>
          <div className="text-lg font-semibold">Bs. {formatMoney(invValorCosto)}</div>
          <div className="mt-2 text-xs text-gray-500">Valor potencial (precio)</div>
          <div className="text-lg font-semibold">Bs. {formatMoney(invValorVenta)}</div>
        </div>
        <div className="p-4 rounded-lg border">
          <div className="text-sm font-medium mb-2">Clientes</div>
          <div className="text-2xl font-semibold">{clients.length}</div>
          <div className="text-xs text-gray-500">registrados</div>
        </div>
        <div className="p-4 rounded-lg border">
          <div className="text-sm font-medium mb-2">Bajo stock (≤{lowStock})</div>
          {bajoStock.length === 0 && <div className="text-sm text-gray-500">Sin alertas</div>}
          <ul className="space-y-1 text-sm">
            {bajoStock.map((p) => (
              <li key={p.id} className="flex justify-between"><span className="truncate mr-2">{p.nombre}</span><span className="font-medium">{p.stock}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ventas por día */}
      <div className="mb-6">
        <div className="text-sm font-medium mb-2">Ventas por día</div>
        <div className="border rounded-lg bg-white">
          <div className="overflow-x-auto" ref={scrollRef}>
            <div
              className="h-40 flex items-end gap-1 p-3"
              style={{ width: `${Math.max(chartWidthMobile, 320)}px` }}
            >
              {seriesDias.map((d, i) => (
                <div key={d.key} className="flex flex-col items-center" style={{ width: `${barWidth}px` }}>
                  <div
                    className="w-full sm:hidden bg-primary-500 rounded-t"
                    style={{ height: `${(d.total / maxDia) * 100 || 0}%` }}
                    title={`Bs. ${formatMoney(d.total)}`}
                  />
                  <div
                    className="hidden sm:block bg-primary-500 rounded-t"
                    style={{ width: `${barWidthSm}px`, height: `${(d.total / maxDia) * 100 || 0}%` }}
                    title={`Bs. ${formatMoney(d.total)}`}
                  />
                  <div className="text-[10px] mt-1 text-gray-500 whitespace-nowrap">
                    {i % labelStep === 0 ? d.label : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top productos */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border">
          <div className="text-sm font-medium mb-2">Top productos por cantidad</div>
          {topProductos.length === 0 && <div className="text-sm text-gray-500">Sin ventas en el período.</div>}
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left">Producto</th>
                <th className="text-right">Unidades</th>
                <th className="text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {topProductos.map((p) => (
                <tr key={p.id || p.nombre} className="border-t">
                  <td className="py-1 pr-2 truncate">{p.nombre}</td>
                  <td className="py-1 text-right">{p.qty}</td>
                  <td className="py-1 text-right">Bs. {formatMoney(p.ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 rounded-lg border">
          <div className="text-sm text-gray-600">
            Este reporte es ligero: no usa librerías de gráficos externas y se basa en los datos locales (inventario, clientes y tickets). Ajusta el período para ver tendencias recientes o históricas.
          </div>
        </div>
      </div>
    </section>
  )
}
