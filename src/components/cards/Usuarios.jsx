import { useMemo, useState } from 'react'
import { loadData, saveData, uid } from '../../utils/dataManager'
import { useUI } from '../ui/UIProvider'

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

  const addUser = () => {
    if (!canManage) return
    if (!form.username || !form.password) return
    if (editingId) {
      const idx = users.findIndex((u) => u.id === editingId)
      if (idx !== -1) {
        const next = [...users]
        next[idx] = { ...next[idx], ...form }
        update(next)
        notify({ type: 'success', message: 'Usuario actualizado.' })
      }
      setEditingId(null)
    } else {
      const nuevo = { id: uid('usr'), ...form }
      update([nuevo, ...users])
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
    update(users.filter((u) => u.id !== id))
    notify({ type: 'warning', message: 'Usuario eliminado.' })
  }

  const toggleEnabled = (id) => {
    const next = users.map((u) => (u.id === id ? { ...u, enabled: u.enabled === false ? true : false } : u))
    update(next)
    const u = next.find((x) => x.id === id)
    notify({ type: 'info', message: `Usuario ${u?.enabled ? 'habilitado' : 'deshabilitado'}.` })
  }

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
