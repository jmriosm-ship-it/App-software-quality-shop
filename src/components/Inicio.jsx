import { useEffect, useRef } from 'react'

// Pantalla de bienvenida: muestra el logo un momento y pasa sola a lo que sigue
export default function Inicio({ onTerminar }) {
  const alTerminar = useRef(onTerminar)
  alTerminar.current = onTerminar

  useEffect(() => {
    const temporizador = setTimeout(() => alTerminar.current(), 1800)
    return () => clearTimeout(temporizador)
  }, [])

  return (
    <div className="inicio">
      <div className="inicio-centro">
        <img src="./logo.png" alt="Quality Shop" width="220" height="220" />
        <h1>Quality Shop</h1>
        <span className="label">Inventario y ventas</span>
      </div>
    </div>
  )
}
