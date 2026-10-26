import { useState } from 'react'

// Pantalla que sale la primera vez (y cuando cambian los textos legales): hay que aceptarlos para usar la app
export default function Aceptacion({ onAceptar, onLeer }) {
  const [acepto, setAcepto] = useState(false)

  return (
    <div className="bloqueo aceptacion">
      <img src="./logo.png" alt="Quality Shop" width="80" height="80" />
      <h1>Antes de empezar</h1>
      <p className="bloqueo-nota" style={{ maxWidth: 320 }}>
        Para usar la app hay que aceptar cómo se cuidan los datos y las reglas de uso.
      </p>

      <ul className="aceptacion-lista">
        <li>Tus datos son del negocio: no se venden ni se usan para publicidad.</li>
        <li>Se guardan en este celular y, si inicias sesión, en la nube (Supabase).</li>
        <li>Las cuentas de la app son informativas: no reemplazan la contabilidad oficial.</li>
      </ul>

      <button className="bloqueo-link" onClick={() => onLeer('privacidad')}>
        Leer la política de privacidad
      </button>
      <button className="bloqueo-link" style={{ marginTop: 0 }} onClick={() => onLeer('terminos')}>
        Leer los términos de uso
      </button>

      <label className="aceptacion-check">
        <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
        <span>
          He leído y acepto la política de privacidad y los términos de uso, y autorizo el tratamiento de los datos como allí se
          explica, incluida su transferencia a servidores en la nube.
        </span>
      </label>

      <button className="inicio-boton" disabled={!acepto} onClick={onAceptar}>
        Aceptar y continuar
      </button>
    </div>
  )
}
