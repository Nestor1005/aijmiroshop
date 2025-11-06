import { useEffect, useMemo, useRef, useState } from 'react'
import { loadData, saveData } from '../../utils/dataManager'
import { formatMoney } from '../../utils/formatNumbers'
// Cargar librerías pesadas bajo demanda para mejorar rendimiento
// import jsPDF from 'jspdf'
// import html2canvas from 'html2canvas'
import { useUI } from '../ui/UIProvider'
import { cloudEnabled, cloudList, cloudUpsert, cloudSubscribe } from '../../services/cloudData'
import { SETTINGS_DEFAULTS } from '../../constants/settingsDefaults'

const STORAGE_CLIENTS = 'aij-clients'
const STORAGE_PRODUCTS = 'aij-inventory'
const STORAGE_HISTORY = 'aij-history'

const STORAGE_SETTINGS = 'aij-settings'

export default function Ticket({ session }) {
  const { notify } = useUI()
  const [clients, setClients] = useState(() => loadData(STORAGE_CLIENTS, []))
  const [products] = useState(() => loadData(STORAGE_PRODUCTS, []))
  const [history, setHistory] = useState(() => loadData(STORAGE_HISTORY, []))
  const [settings, setSettings] = useState(() => loadData(STORAGE_SETTINGS, SETTINGS_DEFAULTS))

  const [clientId, setClientId] = useState('')
  const [quickClient, setQuickClient] = useState('')
  const [items, setItems] = useState([])
  const [payment, setPayment] = useState('Efectivo')
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState('')
  const [productQuery, setProductQuery] = useState('')

  const ticketRef = useRef(null)

  const client = useMemo(() => clients.find((c) => c.id === clientId) || null, [clients, clientId])

  // Subtotal y total
  const subtotal = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  const total = Math.max(0, subtotal - Number(discount || 0))

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return products.slice(0, 20)
    return products.filter(p => [p.nombre, p.color, p.categoria].some(v => String(v || '').toLowerCase().includes(q))).slice(0, 20)
  }, [products, productQuery])

  const addItem = (productId) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    const stock = Number(p.stock || 0)
    if (stock <= 0) {
      notify({ type: 'warning', message: 'Sin stock disponible para este producto.' })
      return
    }
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === p.id)
      if (idx !== -1) {
        const current = prev[idx]
        const newQty = Math.min(stock, Number(current.qty || 0) + 1)
        if (newQty === current.qty) {
          notify({ type: 'info', message: 'Alcanzaste el stock disponible.' })
          return prev
        }
        const next = [...prev]
        next[idx] = { ...current, qty: newQty }
        return next
      }
      return [{ id: p.id, name: p.nombre, price: p.precio, qty: 1 }, ...prev]
    })
  }

  const registerQuickClient = () => {
    if (!quickClient) return
    const newClient = { id: crypto.randomUUID(), nombre: quickClient, cedula: '', telefono: '', direccion: '' }
    const next = [newClient, ...clients]
    setClients(next)
    saveData(STORAGE_CLIENTS, next)
    if (cloudEnabled()) {
      cloudUpsert(STORAGE_CLIENTS, newClient).catch((e) => console.error('Cloud upsert client error:', e))
    }
    setClientId(newClient.id)
    setQuickClient('')
  }

  const captureAndRegister = async () => {
    // Capturar ticket a PDF con tamaño ajustado al contenido (sin espacio en blanco)
    const el = ticketRef.current
    if (!el) return
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const canvas = await html2canvas(el, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')

    // Definir un ancho objetivo más angosto (recibo) en puntos.
    // 1pt ≈ 1/72 in; 360pt ≈ 5 pulgadas (~127mm)
    const targetWidthPt = 360
    const ratio = targetWidthPt / canvas.width
    const targetHeightPt = canvas.height * ratio

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [targetWidthPt, targetHeightPt] })
    pdf.addImage(imgData, 'PNG', 0, 0, targetWidthPt, targetHeightPt)
    pdf.save('ticket.pdf')

    // Registrar en historial con estado Pendiente
    const ticket = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      cliente: client?.nombre || quickClient || 'Cliente',
      clienteId: client?.id || null,
      fecha: new Date().toISOString(),
      items: items.map(it => ({ id: it.id, name: it.name, price: it.price, qty: it.qty })),
      subtotal,
      descuento: Number(discount || 0),
      total,
      envio: shipping || client?.direccion || '',
      pago: payment,
      atendidoPor: session?.username || 'Usuario',
      estado: 'Pendiente',
    }
    const next = [ticket, ...history]
    setHistory(next)
    saveData(STORAGE_HISTORY, next)
    if (cloudEnabled()) {
      cloudUpsert(STORAGE_HISTORY, ticket).catch((e) => console.error('Cloud upsert history error:', e))
    }
    notify({ type: 'success', message: 'Ticket capturado y registrado como Pendiente.' })
  }

  useEffect(() => {
    let cancelled = false
    async function loadCloud() {
      if (!cloudEnabled()) return
      try {
        const [remoteClients] = await Promise.all([
          cloudList(STORAGE_CLIENTS)
        ])
        if (!cancelled) {
          if (Array.isArray(remoteClients)) {
            setClients(remoteClients)
            saveData(STORAGE_CLIENTS, remoteClients)
          }
        }
      } catch (e) {
        console.error('Cloud load error (ticket):', e)
      }
    }
    loadCloud()
    // Suscripción a settings para tener encabezado/pie en tiempo real
    let unsubSettings = () => {}
    if (cloudEnabled()) {
      unsubSettings = cloudSubscribe(STORAGE_SETTINGS, ({ event, new: n }) => {
        if (!n) return
        const s = {
          ticketCompanyName: n.ticketCompanyName ?? n.ticket_company_name,
          ticketEmail: n.ticketEmail ?? n.ticket_email,
          ticketAddress: n.ticketAddress ?? n.ticket_address,
          ticketRefs: Array.isArray(n.ticketRefs) ? n.ticketRefs : (Array.isArray(n.ticket_refs) ? n.ticket_refs : []),
          ticketFooter: n.ticketFooter ?? n.ticket_footer,
        }
        saveData(STORAGE_SETTINGS, s)
        setSettings(s)
      })
    }
    // Realtime for clients in ticket selector
    let unsub = () => {}
    if (cloudEnabled()) {
      unsub = cloudSubscribe(STORAGE_CLIENTS, ({ event, new: n, old }) => {
        setClients((prev) => {
          let next = prev
          if (event === 'INSERT' || event === 'UPDATE') {
            const idx = next.findIndex((x) => x.id === n.id)
            if (idx !== -1) { next = [...next]; next[idx] = { ...next[idx], ...n } }
            else { next = [n, ...next] }
          } else if (event === 'DELETE') {
            next = next.filter((x) => x.id !== (old?.id))
          }
          saveData(STORAGE_CLIENTS, next)
          return next
        })
      })
    }
    return () => { cancelled = true; try { unsub() } catch {}; try { unsubSettings() } catch {} }
  }, [])

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Ticket</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button className="px-3 py-2 bg-primary-600 text-white rounded-lg" onClick={captureAndRegister}>Capturar y Registrar</button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Selección de cliente */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Cliente</label>
          <select className="w-full rounded-lg border-gray-300" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <input className="col-span-2 rounded-lg border-gray-300" placeholder="Agregar rápido" value={quickClient} onChange={(e) => setQuickClient(e.target.value)} />
            <button className="rounded-lg border bg-gray-50" onClick={registerQuickClient}>Agregar</button>
          </div>

          <label className="block text-sm text-gray-700">Lugar de envío</label>
          <input className="w-full rounded-lg border-gray-300" placeholder="Dirección" value={shipping} onChange={(e) => setShipping(e.target.value)} />
        </div>

        {/* Productos con búsqueda */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Productos</label>
          <input
            className="w-full rounded-lg border-gray-300"
            placeholder="Buscar por nombre, color o categoría"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
          />
          <div className="max-h-64 overflow-auto border rounded-lg divide-y">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                className="w-full text-left px-2 py-2 hover:bg-gray-50"
                onClick={() => addItem(p.id)}
                title={`Stock: ${p.stock || 0}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate pr-2">{p.nombre}</div>
                  <div className="text-sm text-gray-600">{formatMoney(p.precio)}</div>
                </div>
                <div className="text-xs text-gray-500 truncate">Color: {p.color || '—'} • Cat: {p.categoria || '—'} • Stock: {p.stock || 0}</div>
              </button>
            ))}
            {products.length === 0 && <div className="text-xs text-gray-500 p-2">No hay productos. Agrega en Inventario.</div>}
          </div>
        </div>

        {/* Resumen */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Método de pago</label>
          <select className="w-full rounded-lg border-gray-300" value={payment} onChange={(e) => setPayment(e.target.value)}>
            {['Efectivo', 'QR', 'Transferencia', 'Otro'].map((m) => <option key={m}>{m}</option>)}
          </select>

          <label className="block text-sm text-gray-700">Descuento (Bs.)</label>
          <input className="w-full rounded-lg border-gray-300" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />

          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between"><span>Descuento</span><span>- {formatMoney(Number(discount || 0))}</span></div>
            <div className="flex justify-between font-semibold mt-1"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
        </div>
      </div>

      {/* Vista del Ticket tipo recibo para captura */}
      <div className="mt-6 flex justify-center">
        <div ref={ticketRef} className="w-full max-w-[480px] bg-white text-gray-900 font-mono text-[14px] leading-6 p-6 border rounded-lg shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-widest">{settings.ticketCompanyName || SETTINGS_DEFAULTS.ticketCompanyName}</h1>
            {settings.ticketEmail && <div className="text-sm mt-1">{settings.ticketEmail}</div>}
            {settings.ticketAddress && <div className="text-sm">{settings.ticketAddress}</div>}
            {Array.isArray(settings.ticketRefs) && settings.ticketRefs.length > 0 && (
              <div className="text-sm">Cel: {settings.ticketRefs.join(', ')}</div>
            )}
            <h2 className="mt-4 text-xl font-bold">Orden de Venta</h2>
            <div className="mt-1">{new Date().toLocaleString('es-BO')}</div>
          </div>

          <div className="my-4 border-t border-dashed"></div>

          <div className="space-y-1">
            <div><span className="font-bold">Cliente:</span> {client?.nombre || quickClient || '—'}</div>
            {client?.cedula && <div><span className="font-bold">CI:</span> {client.cedula}</div>}
            <div><span className="font-bold">Atendido por:</span> {session?.username || 'Usuario'}</div>
          </div>

          <div className="my-4 border-t border-dashed"></div>

          <div className="space-y-4">
            {items.map((it) => {
              const lineTotal = (Number(it.qty) || 0) * (Number(it.price) || 0)
              return (
                <div key={it.id}>
                  <div className="flex justify-between">
                    <div className="whitespace-pre-wrap break-words max-w-[65%]">{it.name}</div>
                    <div className="font-bold">Bs. {formatMoney(lineTotal)}</div>
                  </div>
                  <div className="text-sm">P/U: Bs. {formatMoney(Number(it.price) || 0)} x {Number(it.qty) || 0}</div>
                </div>
              )
            })}
            {items.length === 0 && (
              <div className="text-sm text-gray-500">Sin productos</div>
            )}
          </div>

          <div className="my-4 border-t border-dashed"></div>

          <div className="space-y-1">
            <div className="flex justify-between"><span className="font-bold">Subtotal:</span><span>Bs. {formatMoney(subtotal)}</span></div>
            <div className="flex justify-between"><span className="font-bold">Descuento:</span><span>Bs. {formatMoney(Number(discount || 0))}</span></div>
          </div>

          <div className="mt-3 p-3 rounded border bg-gray-100">
            <div className="font-bold">Lugar de Envío:</div>
            <div>{shipping || client?.direccion || '—'}</div>
          </div>

          <div className="mt-4 flex justify-between text-xl font-extrabold">
            <span>TOTAL:</span>
            <span>Bs. {formatMoney(total)}</span>
          </div>

          <div className="mt-2">Método de Pago: {payment}</div>

          <div className="my-4 border-t border-dashed"></div>
          <div className="text-center">{settings.ticketFooter || SETTINGS_DEFAULTS.ticketFooter}</div>
        </div>
      </div>
    </section>
  )
}
