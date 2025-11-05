import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cloudEnabled } from '../services/cloudData'

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

  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await Promise.resolve(onValidate({ role, username, password }))
      const ok = typeof res === 'boolean' ? res : !!res?.ok
      if (!ok) {
        const reason = res?.reason
        let msg = 'Credenciales inválidas.'
        if (reason === 'cloud-disabled') msg = 'Modo local: este usuario no existe en este dispositivo (habilita Supabase o crea el usuario aquí).'
        else if (reason === 'cloud-error') msg = 'Error conectando a la nube. Verifica URL/Key de Supabase.'
        else if (reason === 'not-found') msg = 'El usuario no existe.'
        else if (reason === 'disabled') msg = 'Usuario deshabilitado.'
        else if (reason === 'role-mismatch') msg = 'El rol seleccionado no coincide con la cuenta.'
        else if (reason === 'password') msg = 'Contraseña incorrecta.'
        setError(msg)
        return
      }
      // Persistir sesión (simple: localStorage)
      onLogin({ role, username, remember, ts: Date.now() })
      navigate('/', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1 text-center">AIJMIROSHOP</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Acceso al sistema</p>
        <div className="flex justify-center mb-4">
          <span className={`text-xs px-2 py-1 rounded ${cloudEnabled() ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {cloudEnabled() ? 'Nube (Supabase) activa' : 'Modo local (sin Supabase)'}
          </span>
        </div>

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
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium transition"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
