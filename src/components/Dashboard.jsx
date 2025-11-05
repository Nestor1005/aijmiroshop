import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { loadData } from '../utils/dataManager'
import Inventario from './cards/Inventario'
import Clientes from './cards/Clientes'
import Ticket from './cards/Ticket'
import Historial from './cards/Historial'
import Usuarios from './cards/Usuarios'
import Estadisticas from './cards/Estadisticas'
import Configuracion from './cards/Configuracion'

export default function Dashboard({ onLogout, getSession }) {
  const navigate = useNavigate()
  const session = getSession()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const logout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  const links = [
    { to: '', label: 'Inventario', key: 'inventario' },
    { to: 'clientes', label: 'Clientes', key: 'clientes' },
    { to: 'ticket', label: 'Ticket', key: 'ticket' },
    { to: 'historial', label: 'Historial', key: 'historial' },
    { to: 'usuarios', label: 'Usuarios', key: 'usuarios', role: 'Administrador' },
    { to: 'estadisticas', label: 'Estadísticas', key: 'estadisticas' },
    { to: 'configuracion', label: 'Configuración', key: 'configuracion' },
  ]

  // Permisos por usuario (configurable en la card Usuarios)
  const users = loadData('aij-users', [])
  const current = users.find((u) => u.username === session?.username)
  const modules = current?.modules || {}

  const canSee = (link) => {
    const roleOk = !link.role || link.role === session?.role
    const moduleOk = modules[link.key] !== false // por defecto true
    return roleOk && moduleOk
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[var(--sidebar-width)] bg-white border-r border-gray-200 p-4 gap-2">
        <div className="pb-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">AIJMIROSHOP</h2>
          <p className="text-xs text-gray-500">{session?.role} — {session?.username}</p>
        </div>
        <nav className="flex-1 pt-3 space-y-1">
          {links.filter(canSee).map((l) => (
            <NavLink
              key={l.to}
              to={`/${l.to}`}
              end={l.to === ''}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="mt-auto text-sm text-red-600 hover:text-red-700">
          Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8">
        {/* Mobile header with menu toggle */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <button
            type="button"
            aria-label="Abrir menú"
            className="px-3 py-2 rounded-lg border bg-white"
            onClick={() => setMobileNavOpen(true)}
          >
            ☰ Menú
          </button>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-800">AIJMIROSHOP</h2>
            <p className="text-xs text-gray-500">{session?.role} — {session?.username}</p>
          </div>
          <button onClick={logout} className="text-sm text-red-600">Salir</button>
        </div>

        {/* Mobile drawer sidebar */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)}></div>
            {/* Panel */}
            <div className="absolute inset-y-0 left-0 w-4/5 max-w-xs bg-white border-r border-gray-200 p-4 flex flex-col gap-2">
              <div className="pb-3 border-b">
                <h2 className="text-lg font-semibold text-gray-800">AIJMIROSHOP</h2>
                <p className="text-xs text-gray-500">{session?.role} — {session?.username}</p>
              </div>
              <nav className="flex-1 pt-3 space-y-1">
                {links.filter(canSee).map((l) => (
                  <NavLink
                    key={l.to}
                    to={`/${l.to}`}
                    end={l.to === ''}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              <button onClick={() => { setMobileNavOpen(false); logout() }} className="mt-auto text-sm text-red-600 hover:text-red-700">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Routes>
            <Route index element={<Inventario />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="ticket" element={<Ticket session={session} />} />
            <Route path="historial" element={<Historial />} />
            <Route path="usuarios" element={<Usuarios session={session} />} />
            <Route path="estadisticas" element={<Estadisticas />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
