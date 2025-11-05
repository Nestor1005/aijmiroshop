import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Pantalla de Login con selector de rol, validación y recordatorio de sesión.
 */
export default function Login({ onValidate, onLogin }) {
  const navigate = useNavigate()
  const [role, setRole] = useState('Administrador')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  // Rellenar sugerencias según rol
  const suggested = useMemo(() => {
    if (role === 'Administrador') return { u: 'Anahi', p: '2025' }
    return { u: 'Usuario', p: '2025' }
  }, [role])

  useEffect(() => {
    setUsername(suggested.u)
    setPassword(suggested.p)
  }, [suggested])

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const ok = onValidate({ role, username, password })
    if (!ok) {
      setError('Credenciales inválidas.')
      return
    }
    // Persistir sesión (simple: localStorage)
    onLogin({ role, username, remember, ts: Date.now() })
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1 text-center">AIJMIROSHOP</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Acceso al sistema</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Administrador</option>
              <option>Usuario</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              placeholder="••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Recordar sesión
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
          >
            Ingresar
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Demo: Admin (Anahi/2025) • Usuario (Usuario/2025)
        </p>
      </div>
    </div>
  )
}
