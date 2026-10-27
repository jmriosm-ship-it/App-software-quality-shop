import { useState } from 'react'
import { supabase } from '../nube.js'

// Inicio de sesión con el correo y la contraseña del dueño (la cuenta se crea en Supabase)
export default function Acceso({ onSinNube, onLegal, onAyuda }) {
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    if (!correo.trim() || !clave) return setError('Escribe tu correo y tu contraseña.')
    setEntrando(true)
    setError('')
    try {
      const { error: fallo } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave })
      if (fallo) {
        setError(
          /invalid login|credentials/i.test(fallo.message)
            ? 'Correo o contraseña incorrectos.'
            : /fetch|network/i.test(fallo.message)
              ? 'Sin conexión. La primera vez necesitas internet para iniciar sesión.'
              : fallo.message,
        )
      }
      // si todo sale bien, la app detecta la sesión sola y pasa a la pantalla principal
    } catch {
      setError('Sin conexión. La primera vez necesitas internet para iniciar sesión.')
    }
    setEntrando(false)
  }

  return (
    <div className="bloqueo">
      <img src="./logo.png" alt="Quality Shop" width="96" height="96" />
      <h1>Quality Shop</h1>
      <span className="label" style={{ color: '#9e9ea0', textAlign: 'center' }}>
        Inicia sesión para guardar tus datos en la nube
      </span>

      <form className="acceso-form" onSubmit={entrar}>
        <input
          className="campo oscuro"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <input
          className="campo oscuro"
          type="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
        {error && <p className="error" style={{ color: '#ff8a80', textAlign: 'center' }}>{error}</p>}
        <button type="submit" className="inicio-boton" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>

      <button className="bloqueo-link" onClick={onSinNube}>
        Seguir sin nube por ahora
      </button>
      <p className="bloqueo-nota">Sin nube, los datos quedan solo en este celular.</p>
      <p className="inicio-legal">
        <button onClick={() => onLegal('privacidad')}>Privacidad</button>
        <span>·</span>
        <button onClick={() => onLegal('terminos')}>Términos</button>
        <span>·</span>
        <button onClick={onAyuda}>Ayuda</button>
      </p>
    </div>
  )
}
