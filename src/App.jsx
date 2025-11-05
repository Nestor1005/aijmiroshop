import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { loadData } from './utils/dataManager'
import { cloudEnabled, cloudList } from './services/cloudData'

// Reglas de credenciales fijas (pueden migrar a backend/Supabase luego)
const CREDENTIALS = {
  admin: { user: 'Anahi', pass: '2025' },
  user: { user: 'Usuario', pass: '2025' },
}

// Helpers de autenticación en localStorage
const storageKey = 'aijmiroshop-auth'
export const getSession = () => {
  try {
    const s = localStorage.getItem(storageKey)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}
export const setSession = (session) => localStorage.setItem(storageKey, JSON.stringify(session))
export const clearSession = () => localStorage.removeItem(storageKey)

export const validateLogin = async ({ role, username, password }) => {
  const normalizeRole = (r) => {
    const x = String(r || '').trim().toLowerCase()
    if (x.startsWith('admin')) return 'administrador'
    if (x.startsWith('user') || x.startsWith('usu')) return 'usuario'
    return x
  }
  const normRole = normalizeRole(role)
  const normUser = String(username || '').trim().toLowerCase()
  const normPass = String(password || '').trim()

  // 1) Demo credenciales fijas mantienen acceso rápido
  if (normRole === 'administrador' && normUser === CREDENTIALS.admin.user.toLowerCase() && normPass === CREDENTIALS.admin.pass) return true
  if (normRole === 'usuario' && normUser === CREDENTIALS.user.user.toLowerCase() && normPass === CREDENTIALS.user.pass) return true

  // 2) Buscar usuarios guardados (nube si está habilitada; sino local)
  let users = []
  try {
    if (cloudEnabled()) {
      users = (await cloudList('aij-users')) || []
    } else {
      users = loadData('aij-users', [])
    }
  } catch {
    users = loadData('aij-users', [])
  }

  const u = users.find((x) => String(x.username || '').trim().toLowerCase() === normUser)
  if (!u) return false
  if (u.enabled === false) return false
  if (normalizeRole(u.role) !== normRole) return false
  if (String(u.password || '').trim() !== normPass) return false
  return true
}

// Rutas protegidas por rol
const Protected = ({ children, roles }) => {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  if (roles && !roles.includes(session.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login onValidate={validateLogin} onLogin={setSession} />} />
      <Route
        path="/*"
        element={
          <Protected roles={["Administrador", "Usuario"]}>
            <Dashboard onLogout={clearSession} getSession={getSession} />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
