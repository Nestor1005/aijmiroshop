import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

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

export const validateLogin = ({ role, username, password }) => {
  if (role === 'Administrador') {
    return username === CREDENTIALS.admin.user && password === CREDENTIALS.admin.pass
  }
  if (role === 'Usuario') {
    return username === CREDENTIALS.user.user && password === CREDENTIALS.user.pass
  }
  return false
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
