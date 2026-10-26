import { useEffect, useRef, useState } from 'react'
import Icono from './Iconos.jsx'
import { dinero, uid } from '../utils.js'

function codigoNuevo(usados) {
  let codigo
  do {
    codigo = 'QS' + uid().slice(-6).toUpperCase()
  } while (usados.has(codigo))
  usados.add(codigo)
  return codigo
}

// Etiquetas con código QR para pegar en cada prenda. Si una talla no tiene código, se le crea uno.
export default function Etiquetas({ producto, productos, onGuardar, onVolver }) {
  const iniciado = useRef(false)
  const [prod, setProd] = useState(null)
  const [qr, setQr] = useState({}) // código -> imagen del QR
  const [copias, setCopias] = useState({}) // id de variante -> cuántas etiquetas

  useEffect(() => {
    if (iniciado.current) return
    iniciado.current = true

    let p = producto
    if (p.variantes.some((v) => !v.codigo)) {
      const usados = new Set(productos.flatMap((x) => x.variantes.map((v) => v.codigo)).filter(Boolean))
      p = { ...p, variantes: p.variantes.map((v) => (v.codigo ? v : { ...v, codigo: codigoNuevo(usados) })) }
      onGuardar(p) // los códigos nuevos quedan guardados para poder escanearlos después
    }
    setProd(p)
    setCopias(Object.fromEntries(p.variantes.map((v) => [v.id, Math.max(1, v.stock)])))
    ;(async () => {
      const QR = (await import('qrcode')).default
      const mapa = {}
      for (const v of p.variantes) mapa[v.codigo] = await QR.toDataURL(v.codigo, { margin: 1, width: 240 })
      setQr(mapa)
    })()
  }, [producto, productos, onGuardar])

  if (!prod) return <p className="vacio">Preparando etiquetas…</p>

  const total = prod.variantes.reduce((s, v) => s + (Number(copias[v.id]) || 0), 0)

  return (
    <>
      <div className="no-imprimir" style={{ display: 'grid', gap: 14 }}>
        <button className="volver" onClick={onVolver}>
          <Icono nombre="atras" tam={20} /> Volver
        </button>
        <div>
          <h1 className="titulo">Etiquetas QR</h1>
          <p className="subtitulo">{prod.nombre}</p>
        </div>
        <div className="nota">
          <Icono nombre="info" tam={18} />
          <span>
            Pega una etiqueta en cada prenda. Al escanearla en Ventas, la app agrega esa talla y color al carrito. Elige
            cuántas etiquetas imprimir de cada una.
          </span>
        </div>
        {prod.variantes.map((v) => (
          <div key={v.id} className="fila-b card" style={{ gridTemplateColumns: 'none' }}>
            <div style={{ display: 'grid' }}>
              <strong>{[v.talla, v.color].filter(Boolean).join(' · ')}</strong>
              <small>{v.codigo} · stock {v.stock}</small>
            </div>
            <input
              className="campo corto"
              type="number"
              inputMode="numeric"
              min="0"
              value={copias[v.id] ?? ''}
              onChange={(e) => setCopias({ ...copias, [v.id]: e.target.value })}
              aria-label="Cantidad de etiquetas"
            />
          </div>
        ))}
        <button className="btn-negro" onClick={() => window.print()} disabled={total === 0}>
          <Icono nombre="descargar" tam={18} /> Imprimir {total} {total === 1 ? 'etiqueta' : 'etiquetas'}
        </button>
      </div>

      <div className="hoja-etiquetas">
        {prod.variantes.flatMap((v) =>
          Array.from({ length: Math.max(0, Math.floor(Number(copias[v.id]) || 0)) }, (_, i) => (
            <div key={v.id + i} className="etiqueta">
              {qr[v.codigo] && <img src={qr[v.codigo]} alt={v.codigo} />}
              <strong>{prod.nombre}</strong>
              <span>{[v.talla, v.color].filter(Boolean).join(' · ')}</span>
              <b>{dinero(prod.precio)}</b>
              <small>{v.codigo}</small>
            </div>
          )),
        )}
      </div>
    </>
  )
}
