import { useEffect, useMemo, useState } from 'react'
import { loadData, saveData } from '../../utils/dataManager'
import { formatMoney } from '../../utils/formatNumbers'
import { cloudEnabled, cloudList, cloudReplaceAll, cloudSubscribe } from '../../services/cloudData'

const STORAGE_HISTORY = 'aij-history'
const STORAGE_PRODUCTS = 'aij-inventory'
const STORAGE_CLIENTS = 'aij-clients'
const STORAGE_SETTINGS = 'aij-settings'
const STORAGE_USERS = 'aij-users'

export default function Estadisticas() {
  const [range, setRange] = useState('30') // 7, 30, 90, all
  const [lowStock, setLowStock] = useState(() => {
    const s = loadData(STORAGE_SETTINGS, {})
    return Number(s.lowStockThreshold ?? 5)
  })

  const [history, setHistory] = useState(() => loadData(STORAGE_HISTORY, []))
  const [products, setProducts] = useState(() => loadData(STORAGE_PRODUCTS, []))
  const [clients, setClients] = useState(() => loadData(STORAGE_CLIENTS, []))
  const [users, setUsers] = useState(() => loadData(STORAGE_USERS, []))

  // Cargar desde la nube y suscribirse en tiempo real (history, products, clients, users)
  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      if (!cloudEnabled()) return
      try {
        const [remoteHistory, remoteProducts, remoteClients, remoteUsers] = await Promise.all([
          cloudList(STORAGE_HISTORY),
          cloudList(STORAGE_PRODUCTS),
          cloudList(STORAGE_CLIENTS),
          cloudList(STORAGE_USERS),
        ])
        if (cancelled) return
        if (Array.isArray(remoteHistory)) { setHistory(remoteHistory); saveData(STORAGE_HISTORY, remoteHistory) }
        if (Array.isArray(remoteProducts)) { setProducts(remoteProducts); saveData(STORAGE_PRODUCTS, remoteProducts) }
        if (Array.isArray(remoteClients)) { setClients(remoteClients); saveData(STORAGE_CLIENTS, remoteClients) }
        if (Array.isArray(remoteUsers)) {
          if ((remoteUsers?.length || 0) === 0) {
            // seed si no hay nada y hay local
            const local = loadData(STORAGE_USERS, [])
            if (local?.length) { try { await cloudReplaceAll(STORAGE_USERS, local) } catch {} }
            setUsers(local)
          } else { setUsers(remoteUsers); saveData(STORAGE_USERS, remoteUsers) }
        }
      } catch {}
    }
    loadAll()

    let unsubs = []
    if (cloudEnabled()) {
      const pushUnsub = (fn) => unsubs.push(fn)
      pushUnsub(cloudSubscribe(STORAGE_HISTORY, ({ event, new: n, old }) => {
        setHistory((prev) => {
          let next = prev
          if (event === 'INSERT' || event === 'UPDATE') {
            const idx = next.findIndex((x) => x.id === n.id)
            if (idx !== -1) { next = [...next]; next[idx] = { ...next[idx], ...n } } else { next = [n, ...next] }
          } else if (event === 'DELETE') {
            next = next.filter((x) => x.id !== (old?.id))
          }
          saveData(STORAGE_HISTORY, next)
          return next
        })
      }))
      pushUnsub(cloudSubscribe(STORAGE_PRODUCTS, ({ event, new: n, old }) => {
        setProducts((prev) => {
          let next = prev
          if (event === 'INSERT' || event === 'UPDATE') {
            const idx = next.findIndex((x) => x.id === n.id)
            if (idx !== -1) { next = [...next]; next[idx] = { ...next[idx], ...n } } else { next = [n, ...next] }
          } else if (event === 'DELETE') {
            next = next.filter((x) => x.id !== (old?.id))
          }
          saveData(STORAGE_PRODUCTS, next)
          return next
        })
      }))
      pushUnsub(cloudSubscribe(STORAGE_CLIENTS, ({ event, new: n, old }) => {
        setClients((prev) => {
          let next = prev
          if (event === 'INSERT' || event === 'UPDATE') {
            const idx = next.findIndex((x) => x.id === n.id)
            if (idx !== -1) { next = [...next]; next[idx] = { ...next[idx], ...n } } else { next = [n, ...next] }
          } else if (event === 'DELETE') {
            next = next.filter((x) => x.id !== (old?.id))
          }
          saveData(STORAGE_CLIENTS, next)
          return next
        })
      }))
      pushUnsub(cloudSubscribe(STORAGE_USERS, ({ event, new: n, old }) => {
        setUsers((prev) => {
          let next = prev
          if (event === 'INSERT' || event === 'UPDATE') {
            const idx = next.findIndex((x) => x.id === n.id)
            if (idx !== -1) { next = [...next]; next[idx] = { ...next[idx], ...n } } else { next = [n, ...next] }
          } else if (event === 'DELETE') {
            next = next.filter((x) => x.id !== (old?.id))
          }
          saveData(STORAGE_USERS, next)
          return next
        })
      }))
    }
    return () => { cancelled = true; unsubs.forEach((u) => { try { u() } catch {} }) }
  }, [])

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

  // Se removió el gráfico de "Ventas por día" (y su serie) a pedido.

  // Ventas del día por usuario (tickets Completados hoy)
  const ventasHoyPorUsuario = useMemo(() => {
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    const endDay = new Date()
    endDay.setHours(23, 59, 59, 999)
    const ofToday = history.filter((t) => {
      if (t.estado !== 'Completado') return false
      const dt = new Date(t.fecha)
      return dt >= startDay && dt <= endDay
    })
    const map = new Map()
    for (const t of ofToday) {
      const name = String(t.atendidoPor || '—')
      const user = users.find((u) => String(u.username || '').trim().toLowerCase() === name.trim().toLowerCase())
      const role = user?.role || 'Usuario'
      const key = name.toLowerCase()
      const prev = map.get(key) || { nombre: name, role, ventas: 0, importe: 0 }
      prev.ventas += 1
      prev.importe += Number(t.total || 0)
      // en caso de que role cambie, preferir el más reciente
      prev.role = role
      map.set(key, prev)
    }
    return Array.from(map.values()).sort((a, b) => b.importe - a.importe)
  }, [history, users])

  // Gráfico removido; sin auto-scroll ni refs.

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

      {/* Se removió la sección de "Ventas por día" */}

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
          <div className="text-sm font-medium mb-2">Ventas de hoy por usuario</div>
          {ventasHoyPorUsuario.length === 0 && <div className="text-sm text-gray-500">Sin ventas completadas hoy.</div>}
          {ventasHoyPorUsuario.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="text-left">Rol</th>
                  <th className="text-left">Usuario</th>
                  <th className="text-right">Ventas</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {ventasHoyPorUsuario.map((u) => (
                  <tr key={u.nombre} className="border-t">
                    <td className="py-1 pr-2 truncate">{u.role}</td>
                    <td className="py-1 pr-2 truncate">{u.nombre}</td>
                    <td className="py-1 text-right">{u.ventas}</td>
                    <td className="py-1 text-right">Bs. {formatMoney(u.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}
