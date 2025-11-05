import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/**
 * UIProvider: provee notificaciones (toast) y confirmaciones (modal) sin usar alert/confirm nativos.
 */
const UIContext = createContext(null)

export function UIProvider({ children }) {
  // Estado de toasts: { id, type, message, timeout }
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  // Estado de confirmación
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', confirmText: 'Confirmar', cancelText: 'Cancelar' })
  const confirmResolveRef = useRef(null)

  const notify = useCallback(({ type = 'info', message = '', timeout = 3000 } = {}) => {
    const id = ++idRef.current
    const toast = { id, type, message }
    setToasts((prev) => [...prev, toast])
    if (timeout > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, timeout)
    }
  }, [])

  const confirm = useCallback(({ title = '¿Confirmar?', message = '', confirmText = 'Sí', cancelText = 'Cancelar' } = {}) => {
    setConfirmState({ open: true, title, message, confirmText, cancelText })
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
    })
  }, [])

  const closeConfirm = useCallback((result) => {
    setConfirmState((s) => ({ ...s, open: false }))
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result)
      confirmResolveRef.current = null
    }
  }, [])

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm])

  return (
    <UIContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <ConfirmModal state={confirmState} onClose={closeConfirm} />
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>')
  return ctx
}

function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

function Toaster({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[1000] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames(
            'min-w-[260px] max-w-[360px] rounded-lg shadow-lg px-4 py-3 text-sm text-white',
            t.type === 'success' && 'bg-emerald-600',
            t.type === 'info' && 'bg-blue-600',
            t.type === 'warning' && 'bg-amber-600',
            t.type === 'error' && 'bg-red-600'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">{t.message}</div>
            <button className="opacity-80 hover:opacity-100" onClick={() => onClose(t.id)}>×</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ConfirmModal({ state, onClose }) {
  if (!state.open) return null
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose(false)} />
      <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-md p-5">
        <h4 className="text-lg font-semibold text-gray-800">{state.title}</h4>
        {state.message && <p className="text-sm text-gray-600 mt-2">{state.message}</p>}
        <div className="mt-6 flex justify-end gap-3 text-sm">
          <button className="px-3 py-2 rounded-lg border" onClick={() => onClose(false)}>{state.cancelText || 'Cancelar'}</button>
          <button className="px-3 py-2 rounded-lg bg-primary-600 text-white" onClick={() => onClose(true)}>{state.confirmText || 'Confirmar'}</button>
        </div>
      </div>
    </div>
  )
}
