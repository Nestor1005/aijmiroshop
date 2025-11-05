import { useMemo, useRef, useState } from 'react'
import { loadData, saveData } from '../../utils/dataManager'
import { formatMoney } from '../../utils/formatNumbers'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const STORAGE_CLIENTS = 'aij-clients'
const STORAGE_PRODUCTS = 'aij-inventory'
const STORAGE_HISTORY = 'aij-history'

export default function Ticket() {
  const [clients, setClients] = useState(() => loadData(STORAGE_CLIENTS, []))
  const [products] = useState(() => loadData(STORAGE_PRODUCTS, []))
  const [history, setHistory] = useState(() => loadData(STORAGE_HISTORY, []))

  const [clientId, setClientId] = useState('')
  const [quickClient, setQuickClient] = useState('')
  const [items, setItems] = useState([])
  const [payment, setPayment] = useState('Efectivo')
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState('')

  const ticketRef = useRef(null)

  const client = useMemo(() => clients.find((c) => c.id === clientId) || null, [clients, clientId])

  // Subtotal y total
  const subtotal = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  const total = Math.max(0, subtotal - Number(discount || 0))

  const addItem = (productId) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    setItems((prev) => [{ id: p.id, name: p.nombre, price: p.precio, qty: 1 }, ...prev])
  }

  const registerQuickClient = () => {
    if (!quickClient) return
    const newClient = { id: crypto.randomUUID(), nombre: quickClient, cedula: '', telefono: '', direccion: '' }
    const next = [newClient, ...clients]
    setClients(next)
    saveData(STORAGE_CLIENTS, next)
    setClientId(newClient.id)
    setQuickClient('')
  }

  const captureAndRegister = async () => {
    // Capturar ticket a PDF
    const el = ticketRef.current
    if (!el) return
    const canvas = await html2canvas(el)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const ratio = pageWidth / canvas.width
    pdf.addImage(imgData, 'PNG', 20, 20, canvas.width * ratio - 40, canvas.height * ratio - 40)
    pdf.save('ticket.pdf')

    // Registrar en historial con estado Pendiente
    const ticket = {
      id: crypto.randomUUID(),
      cliente: client?.nombre || 'Cliente',
      fecha: new Date().toISOString(),
      total,
      estado: 'Pendiente',
    }
    const next = [ticket, ...history]
    setHistory(next)
    saveData(STORAGE_HISTORY, next)
  }

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

        {/* Productos */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Productos</label>
          <div className="grid grid-cols-2 gap-2">
            {products.slice(0, 10).map((p) => (
              <button key={p.id} className="rounded-lg border bg-gray-50 text-left px-2 py-1 text-sm hover:bg-gray-100" onClick={() => addItem(p.id)}>
                {p.nombre} — {formatMoney(p.precio)}
              </button>
            ))}
            {products.length === 0 && <div className="text-xs text-gray-500">No hay productos. Agrega en Inventario.</div>}
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

      {/* Vista del Ticket para captura */}
      <div ref={ticketRef} className="mt-6 border rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">AIJMIROSHOP — Ticket</h4>
          <span>{new Date().toLocaleString()}</span>
        </div>
        <div className="mt-2 text-gray-600">Cliente: {client?.nombre || quickClient || '—'}</div>
        <div className="mt-1 text-gray-600">Envío: {shipping || client?.direccion || '—'}</div>
        <table className="mt-3 w-full">
          <thead className="text-left text-gray-600">
            <tr><th>Producto</th><th>Cant.</th><th className="text-right">Precio</th><th className="text-right">Subt.</th></tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-1">{it.name}</td>
                <td className="py-1">
                  <input className="w-16 rounded border-gray-300" type="number" min="1" value={it.qty} onChange={(e) => setItems(prev => prev.map((p, i) => i === idx ? { ...p, qty: Number(e.target.value) } : p))} />
                </td>
                <td className="py-1 text-right">{formatMoney(it.price)}</td>
                <td className="py-1 text-right">{formatMoney((Number(it.qty) || 0) * (Number(it.price) || 0))}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="py-2 text-gray-500" colSpan="4">Sin productos</td></tr>}
          </tbody>
        </table>
        <div className="flex justify-end mt-2 font-semibold">Total: {formatMoney(total)}</div>
      </div>
    </section>
  )
}
