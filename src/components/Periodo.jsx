import { useState } from 'react'
import Icono from './Iconos.jsx'
import { PERIODOS, etiquetaPeriodo } from '../utils.js'

// Selector de período: Hoy, Este mes, Mes pasado o Todo el tiempo
export default function Periodo({ periodo, onCambiar }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="periodo">
      <button className="periodo-boton" onClick={() => setAbierto(!abierto)}>
        <Icono nombre="calendario" tam={18} />
        <strong>{etiquetaPeriodo(periodo)}</strong>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} tam={18} />
      </button>
      {abierto && (
        <div className="periodo-menu">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              className={periodo === p.id ? 'activo' : ''}
              onClick={() => {
                onCambiar(p.id)
                setAbierto(false)
              }}
            >
              {p.texto}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
