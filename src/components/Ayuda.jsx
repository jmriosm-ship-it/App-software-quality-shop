import Icono from './Iconos.jsx'
import { PRIMEROS_PASOS, REGLAS, SECCIONES } from '../ayuda.js'

// Guía de uso: qué hace cada apartado de la app
export default function Ayuda({ onVolver }) {
  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver
      </button>

      <div>
        <h1 className="titulo" style={{ fontSize: 26 }}>Guía de uso</h1>
        <p className="subtitulo">Qué hace cada apartado de la app. Toca uno para ver los detalles.</p>
      </div>

      <div className="card ayuda-pasos">
        <h2>Primeros pasos</h2>
        <ol>
          {PRIMEROS_PASOS.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </div>

      <div className="ayuda-lista">
        {SECCIONES.map((s) => (
          <details key={s.id} className="ayuda-item">
            <summary>
              <span className="ayuda-icono">
                <Icono nombre={s.icono} tam={22} />
              </span>
              <span className="ayuda-titulo">
                <strong>{s.titulo}</strong>
                <small>{s.sirve}</small>
              </span>
              <span className="ayuda-flecha">
                <Icono nombre="abajo" tam={18} />
              </span>
            </summary>
            <ul>
              {s.puntos.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <div className="card ayuda-reglas">
        <h2>Cuatro reglas importantes</h2>
        <ol>
          {REGLAS.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      </div>
    </>
  )
}
