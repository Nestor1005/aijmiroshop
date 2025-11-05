import { useEffect, useState } from 'react'
import { loadData, saveData, uid } from '../../utils/dataManager'
import { useUI } from '../ui/UIProvider'
import { cloudEnabled, cloudList, cloudUpsert, cloudDelete, cloudReplaceAll, cloudSubscribe } from '../../services/cloudData'

const STORAGE_USERS = 'aij-users'

// Estructura simple: { id, username, role, modules: { inventario:true,... }, password }
export default function Usuarios({ session }) {
  const { notify, confirm } = useUI()
  const [users, setUsers] = useState(() => loadData(STORAGE_USERS, [
    { id: 'admin', username: 'Anahi', role: 'Administrador', password: '2025', enabled: true, modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: true, estadisticas: true, configuracion: true } },
    { id: 'user', username: 'Usuario', role: 'Usuario', password: '2025', enabled: true, modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: false, estadisticas: true, configuracion: true } },
  ]))

  const [form, setForm] = useState({ username: '', role: 'Usuario', password: '', enabled: true, modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: false, estadisticas: true, configuracion: true } })
  const [editingId, setEditingId] = useState(null)

  const canManage = session?.role === 'Administrador'

  const update = (next) => {
    setUsers(next)
    saveData(STORAGE_USERS, next)
  }

  const addUser = async () => {
    if (!canManage) return
    const username = String(form.username || '').trim()
    const password = String(form.password || '').trim()
    const role = String(form.role || 'Usuario').trim()
    if (!username || !password) return
    // Evitar duplicados por nombre de usuario (case-insensitive)
    const exists = users.some((u) => String(u.username || '').trim().toLowerCase() === username.toLowerCase() && (!editingId || u.id !== editingId))
    if (exists) { notify({ type: 'warning', message: 'Ese nombre de usuario ya existe.' }); return }
    if (editingId) {
      const idx = users.findIndex((u) => u.id === editingId)
      if (idx !== -1) {
        const next = [...users]
        next[idx] = { ...next[idx], username, role, password, enabled: !!form.enabled, modules: { ...form.modules } }
        update(next)
        if (cloudEnabled()) {
          try { await cloudUpsert(STORAGE_USERS, next[idx]) } catch (e) { console.error('Cloud upsert (usuario edit):', e) }
        }
        notify({ type: 'success', message: 'Usuario actualizado.' })
      }
      setEditingId(null)
    } else {
      const nuevo = { id: uid('usr'), username, role, password, enabled: !!form.enabled, modules: { ...form.modules } }
      const next = [nuevo, ...users]
      update(next)
      if (cloudEnabled()) {
        try { await cloudUpsert(STORAGE_USERS, nuevo) } catch (e) { console.error('Cloud upsert (usuario nuevo):', e) }
      }
      notify({ type: 'success', message: 'Usuario creado.' })
    }
    setForm({ username: '', role: 'Usuario', password: '', enabled: true, modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: false, estadisticas: true, configuracion: true } })
  }

  const onEdit = (u) => {
    setEditingId(u.id)
    setForm({ username: u.username || '', role: u.role || 'Usuario', password: u.password || '', enabled: u.enabled !== false, modules: { ...u.modules } })
  }

  const onCancel = () => {
    setEditingId(null)
    setForm({ username: '', role: 'Usuario', password: '', enabled: true, modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: false, estadisticas: true, configuracion: true } })
  }

  const onDelete = async (id) => {
    const ok = await confirm({ title: 'Eliminar usuario', message: 'Esta acción no se puede deshacer.', confirmText: 'Eliminar' })
    if (!ok) return
    const next = users.filter((u) => u.id !== id)
    update(next)
    if (cloudEnabled()) {
      try { await cloudDelete(STORAGE_USERS, id) } catch (e) { console.error('Cloud delete (usuario):', e) }
    }
    notify({ type: 'warning', message: 'Usuario eliminado.' })
  }

  const toggleEnabled = async (id) => {
    const next = users.map((u) => (u.id === id ? { ...u, enabled: u.enabled === false ? true : false } : u))
    update(next)
    const u = next.find((x) => x.id === id)
    if (cloudEnabled() && u) {
      try { await cloudUpsert(STORAGE_USERS, u) } catch (e) { console.error('Cloud upsert (toggle usuario):', e) }
    }
    notify({ type: 'info', message: `Usuario ${u?.enabled ? 'habilitado' : 'deshabilitado'}.` })
  }

  // Carga desde la nube y suscripción realtime
  useEffect(() => {
    let cancelled = false
    async function loadCloud() {
      if (!cloudEnabled()) return
      try {
        const remote = await cloudList(STORAGE_USERS)
        const local = loadData(STORAGE_USERS, [])
        if (!cancelled && Array.isArray(remote)) {
          if ((remote?.length || 0) === 0 && (local?.length || 0) > 0) {
            try { await cloudReplaceAll(STORAGE_USERS, local) } catch {}
          } else {
            setUsers(remote)
            saveData(STORAGE_USERS, remote)
          }
        }
      } catch (e) {
        console.error('Cloud load error (usuarios):', e)
      }
    }
    loadCloud()
    let unsub = () => {}
    if (cloudEnabled()) {
      unsub = cloudSubscribe(STORAGE_USERS, ({ event, new: n, old }) => {
        setUsers((prev) => {
          let next = prev
          if (event === 'INSERT' || event === 'UPDATE') {
            const idx = next.findIndex((x) => x.id === n.id)
            if (idx !== -1) { next = [...next]; next[idx] = { ...next[idx], ...n } }
            else { next = [n, ...next] }
          } else if (event === 'DELETE') {
            next = next.filter((x) => x.id !== (old?.id))
          }
          saveData(STORAGE_USERS, next)
          return next
        })
      })
    }
    return () => { cancelled = true; try { unsub() } catch {} }
  }, [])

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Usuarios</h3>
        {!canManage && <div className="text-sm text-gray-500">Solo lectura (rol Usuario)</div>}
      </header>

      {canManage && (
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <input className="rounded-lg border-gray-300" placeholder="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <select className="rounded-lg border-gray-300" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>Administrador</option>
            <option>Usuario</option>
          </select>
          <input className="rounded-lg border-gray-300" type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
              Habilitado
            </label>
          </div>
          <div className="md:col-span-4 flex items-center gap-2">
            <button onClick={addUser} className="rounded-lg bg-primary-600 text-white px-3 py-2">{editingId ? '💾 Guardar cambios' : 'Crear usuario'}</button>
            {editingId && <button onClick={onCancel} className="rounded-lg px-3 py-2 border">Cancelar</button>}
          </div>
          <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-7 gap-2 text-sm">
            {Object.keys(form.modules).map((m) => (
              <label key={m} className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!form.modules[m]} onChange={(e) => setForm({ ...form, modules: { ...form.modules, [m]: e.target.checked } })} />
                {m}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Usuario</th>
              <th className="text-left p-2">Rol</th>
              <th className="text-left p-2">Módulos</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(u.modules).filter(([, v]) => v).map(([k]) => (
                      <span key={k} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{k}</span>
                    ))}
                  </div>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.enabled === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {u.enabled === false ? 'Deshabilitado' : 'Habilitado'}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-yellow-50 border-yellow-300 text-yellow-700" onClick={() => toggleEnabled(u.id)}>
                      {u.enabled === false ? 'Habilitar' : 'Deshabilitar'}
                    </button>
                    <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-blue-50 border-blue-300 text-blue-700" onClick={() => onEdit(u)}>Editar</button>
                    <button type="button" className="px-2 py-1 rounded border text-xs hover:bg-red-50 border-red-300 text-red-700" onClick={() => onDelete(u.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
