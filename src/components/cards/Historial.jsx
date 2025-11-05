import { useEffect, useMemo, useRef, useState } from 'react'
import { loadData, saveData } from '../../utils/dataManager'
import { formatMoney } from '../../utils/formatNumbers'
import { useUI } from '../ui/UIProvider'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { cloudEnabled, cloudList, cloudUpsert, cloudDelete, cloudReplaceAll } from '../../services/cloudData'

const STORAGE_HISTORY = 'aij-history'
const STORAGE_PRODUCTS = 'aij-inventory'

export default function Historial() {
  const { notify, confirm } = useUI()
  const [items, setItems] = useState(() => loadData(STORAGE_HISTORY, []))
  useCloudHistoryLoader(setItems)
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const ticketRef = useRef(null)

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

  const update = async (next) => {
    setItems(next)
    saveData(STORAGE_HISTORY, next)
    if (cloudEnabled()) {
      try {
        // For batch changes, replace all for simplicity
        await cloudReplaceAll(STORAGE_HISTORY, next)
      } catch (e) {
        console.error('Cloud sync error (historial):', e)
      }
    }
  }

  const completeTicket = async (id) => {
    const idx = items.findIndex((t) => t.id === id)
    if (idx === -1) return
    const t = items[idx]
    if (t.estado === 'Completado') return
    const ok = await confirm({ title: 'Completar ticket', message: 'Al completar se descontará del inventario.', confirmText: 'Completar' })
    if (!ok) return

    // Descontar stock
    const inv = loadData(STORAGE_PRODUCTS, [])
    let cambios = 0
    for (const it of t.items || []) {
      const p = inv.find((x) => x.id === it.id)
      if (p) {
        const newStock = Math.max(0, Number(p.stock || 0) - Number(it.qty || 0))
        if (newStock !== p.stock) {
          p.stock = newStock
          cambios++
        }
      }
    }
    saveData(STORAGE_PRODUCTS, inv)

    const next = [...items]
    next[idx] = { ...t, estado: 'Completado' }
    await update(next)
    notify({ type: 'success', message: `Ticket completado. ${cambios} productos actualizados.` })
  }

  const deleteTicket = async (id) => {
    const ok = await confirm({ title: 'Eliminar ticket', message: 'Esta acción no se puede deshacer.', confirmText: 'Eliminar' })
    if (!ok) return
    const next = items.filter((t) => t.id !== id)
    await update(next)
    notify({ type: 'warning', message: 'Ticket eliminado.' })
  }

  const downloadTicket = async (t) => {
    if (!t) return
    // Renderizar una plantilla similar a la del componente Ticket
    const container = ticketRef.current
    if (!container) return
    const s = loadData('aij-settings', {})
    const companyName = s.ticketCompanyName || 'AIJMIROSHOP'
    const companyEmail = s.ticketEmail || ''
    const companyAddress = s.ticketAddress || ''
    const companyRefs = Array.isArray(s.ticketRefs) ? s.ticketRefs : []
    const footer = s.ticketFooter || '¡Gracias por su compra!'
    container.innerHTML = `
      <div style="width: 360pt; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; line-height: 1.5; color:#111; padding:24px;">
        <div style="text-align:center">
          <div style="font-size:20px; font-weight:800; letter-spacing:2px;">${companyName}</div>
          ${companyEmail ? `<div style=\"font-size:12px; margin-top:4px;\">${companyEmail}</div>` : ''}
          ${companyAddress ? `<div style=\"font-size:12px;\">${companyAddress}</div>` : ''}
          ${companyRefs.length ? `<div style=\"font-size:12px;\">Cel: ${companyRefs.join(', ')}</div>` : ''}
          <div style="font-size:18px; font-weight:700; margin-top:12px;">Orden de Venta</div>
          <div style="margin-top:4px;">${new Date(t.fecha).toLocaleString('es-BO')}</div>
        </div>
        <hr style="margin:16px 0; border-style:dashed;">
        <div>
          <div><b>Cliente:</b> ${t.cliente || '—'}</div>
          ${t.ci ? `<div><b>CI:</b> ${t.ci}</div>` : ''}
          <div><b>Atendido por:</b> ${t.atendidoPor || 'Usuario'}</div>
        </div>
        <hr style="margin:16px 0; border-style:dashed;">
        <div>
          ${(t.items || []).map(it => `
            <div style=\"display:flex; justify-content:space-between;\">
              <div style=\"max-width:65%;\">${it.name}</div>
              <div style=\"font-weight:700;\">Bs. ${formatMoney((Number(it.qty)||0)*(Number(it.price)||0))}</div>
            </div>
            <div style=\"font-size:12px;\">P/U: Bs. ${formatMoney(it.price)} x ${Number(it.qty)||0}</div>
          `).join('')}
        </div>
        <hr style="margin:16px 0; border-style:dashed;">
        <div>
          <div style="display:flex; justify-content:space-between;"><b>Subtotal:</b><span>Bs. ${formatMoney(t.subtotal || 0)}</span></div>
          <div style="display:flex; justify-content:space-between;"><b>Descuento:</b><span>Bs. ${formatMoney(t.descuento || 0)}</span></div>
        </div>
        <div style="margin-top:12px; padding:12px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:8px;">
          <div style="font-weight:700;">Lugar de Envío:</div>
          <div>${t.envio || '—'}</div>
        </div>
        <div style="margin-top:16px; display:flex; justify-content:space-between; font-weight:800; font-size:18px;">
          <span>TOTAL:</span><span>Bs. ${formatMoney(t.total || 0)}</span>
        </div>
        <div style="margin-top:8px;">Método de Pago: ${t.pago || '—'}</div>
        <hr style="margin:16px 0; border-style:dashed;">
        <div style="text-align:center">${footer}</div>
      </div>
    `
    const canvas = await html2canvas(container.firstElementChild, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const targetWidthPt = 360
    const ratio = targetWidthPt / canvas.width
    const targetHeightPt = canvas.height * ratio
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [targetWidthPt, targetHeightPt] })
    pdf.addImage(imgData, 'PNG', 0, 0, targetWidthPt, targetHeightPt)
    pdf.save('ticket.pdf')
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Historial</h3>
        <div className="flex items-center gap-2">
          <input className="rounded-lg border-gray-300" placeholder="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button
            type="button"
            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            onClick={async () => {
              const ok = await confirm({ title: 'Vaciar historial', message: 'Se eliminarán todos los tickets del historial.', confirmText: 'Vaciar' })
              if (!ok) return
              await update([])
              notify({ type: 'warning', message: 'Historial vaciado.' })
            }}
          >
            Vaciar historial
          </button>
        </div>
      </header>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Nº ticket</th>
              <th className="text-left p-2">Cliente</th>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Atendido por</th>
              <th className="text-right p-2">Total</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.id.slice(0, 6)}</td>
                <td className="p-2">{it.cliente}</td>
                <td className="p-2">{new Date(it.fecha).toLocaleString()}</td>
                <td className="p-2">{it.atendidoPor || '—'}</td>
                <td className="p-2 text-right">{formatMoney(it.total)}</td>
                <td className="p-2">{it.estado}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title={it.estado === 'Completado' ? 'Ya completado' : 'Marcar como Completado'}
                      className={`px-2 py-1 rounded border text-xs ${it.estado === 'Completado' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50 border-green-300 text-green-700'}`}
                      disabled={it.estado === 'Completado'}
                      onClick={() => completeTicket(it.id)}
                    >
                      Completar
                    </button>
                    <button
                      type="button"
                      title="Descargar ticket (PDF)"
                      className="px-2 py-1 rounded border text-xs hover:bg-blue-50 border-blue-300 text-blue-700"
                      onClick={() => downloadTicket(it)}
                    >
                      Descargar
                    </button>
                    <button
                      type="button"
                      title="Eliminar ticket"
                      className="px-2 py-1 rounded border text-xs hover:bg-red-50 border-red-300 text-red-700"
                      onClick={() => deleteTicket(it.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">Sin resultados</td>
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
      {/* Contenedor oculto para renderizar ticket al descargar */}
      <div ref={ticketRef} style={{ position: 'fixed', left: -9999, top: 0, width: 0, height: 0, overflow: 'hidden' }} />
    </section>
  )
}

// Cargar desde la nube al montar
export function useCloudHistoryLoader(setItems) {
  useEffect(() => {
    let cancelled = false
    async function loadCloud() {
      if (!cloudEnabled()) return
      try {
        const remote = await cloudList(STORAGE_HISTORY)
        const local = loadData(STORAGE_HISTORY, [])
        if (!cancelled && Array.isArray(remote)) {
          if ((remote?.length || 0) === 0 && (local?.length || 0) > 0) {
            try { await cloudReplaceAll(STORAGE_HISTORY, local) } catch {}
          } else {
            setItems(remote)
            saveData(STORAGE_HISTORY, remote)
          }
        }
      } catch (e) {
        console.error('Cloud load error (historial):', e)
      }
    }
    loadCloud()
    return () => { cancelled = true }
  }, [setItems])
}
