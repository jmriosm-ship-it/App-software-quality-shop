import { useEffect, useRef, useState } from 'react'
import Icono from './Iconos.jsx'

// Escáner de códigos de barras y QR con la cámara. Se queda abierto para escanear varias prendas seguidas.
// onLeer(codigo) puede devolver un texto corto que se muestra como confirmación ("Agregada: Camiseta M").
export default function Escaner({ onLeer, onCerrar, titulo = 'Escanear código' }) {
  const video = useRef(null)
  const ultimo = useRef({ codigo: '', t: 0 })
  const leer = useRef(onLeer)
  leer.current = onLeer
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [manual, setManual] = useState('')

  function procesar(codigo) {
    const ahora = Date.now()
    // el mismo código seguido (cámara que lo ve muchas veces) se ignora durante 2 segundos
    if (codigo === ultimo.current.codigo && ahora - ultimo.current.t < 2000) return
    ultimo.current = { codigo, t: ahora }
    const respuesta = leer.current(codigo)
    if (navigator.vibrate) navigator.vibrate(60)
    if (respuesta) {
      setMensaje(respuesta)
      setTimeout(() => setMensaje(''), 1800)
    }
  }

  useEffect(() => {
    let controles
    let activo = true
    ;(async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const lector = new BrowserMultiFormatReader()
        controles = await lector.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          video.current,
          (resultado) => {
            if (resultado && activo) procesar(resultado.getText())
          },
        )
        if (!activo) controles.stop()
      } catch {
        if (activo) setError('No se pudo abrir la cámara. Revisa el permiso de cámara o escribe el código a mano.')
      }
    })()
    return () => {
      activo = false
      if (controles) controles.stop()
    }
  }, [])

  return (
    <div className="escaner">
      <video ref={video} playsInline muted autoPlay />
      <div className="escaner-marco" />

      <div className="escaner-top">
        <strong>{titulo}</strong>
        <button className="icono-boton" onClick={onCerrar} aria-label="Cerrar">
          <Icono nombre="cerrar" tam={20} />
        </button>
      </div>

      {error && <p className="escaner-error">{error}</p>}
      {mensaje && <p className="escaner-mensaje">{mensaje}</p>}

      <form
        className="escaner-abajo"
        onSubmit={(e) => {
          e.preventDefault()
          if (manual.trim()) {
            ultimo.current = { codigo: '', t: 0 }
            procesar(manual.trim())
            setManual('')
          }
        }}
      >
        <input className="campo" placeholder="O escribe el código a mano" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button type="submit" className="btn-negro" style={{ width: 'auto', padding: '14px 18px', background: '#fff', color: '#111' }}>
          OK
        </button>
        <button type="button" className="btn-claro" style={{ width: 'auto', padding: '14px 18px' }} onClick={onCerrar}>
          Listo
        </button>
      </form>
    </div>
  )
}
