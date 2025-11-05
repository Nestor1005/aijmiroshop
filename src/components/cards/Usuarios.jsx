import { useMemo, useState } from 'react'
import { loadData, saveData } from '../../utils/dataManager'
import { useUI } from '../ui/UIProvider'

const STORAGE_USERS = 'aij-users'

// Estructura simple: { id, username, role, modules: { inventario:true,... }, password }
export default function Usuarios({ session }) {
  const { notify } = useUI()
  const [users, setUsers] = useState(() => loadData(STORAGE_USERS, [
    { id: 'admin', username: 'Anahi', role: 'Administrador', password: '2025', modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: true, estadisticas: true, configuracion: true } },
    { id: 'user', username: 'Usuario', role: 'Usuario', password: '2025', modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: false, estadisticas: true, configuracion: true } },
  ]))

  const [form, setForm] = useState({ username: '', role: 'Usuario', password: '', modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: false, estadisticas: true, configuracion: true } })

  const canManage = session?.role === 'Administrador'

  const update = (next) => {
    setUsers(next)
    saveData(STORAGE_USERS, next)
  }

  const addUser = () => {
    if (!canManage) return
    if (!form.username || !form.password) return
    const nuevo = { id: crypto.randomUUID(), ...form }
    update([nuevo, ...users])
    setForm({ username: '', role: 'Usuario', password: '', modules: { inventario: true, clientes: true, ticket: true, historial: true, usuarios: false, estadisticas: true, configuracion: true } })
    notify({ type: 'success', message: 'Usuario creado.' })
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
          <button onClick={addUser} className="rounded-lg bg-primary-600 text-white">Crear usuario</button>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
