import { useState } from 'react'
import Icono from './Iconos.jsx'
import { STOCK_BAJO } from '../utils.js'

// Lista de reposición: lo que se está acabando, con la cantidad sugerida, lista para mandar por WhatsApp
export default function Reponer({ productos, ventas, onVolver }) {
  const [ideal, setIdeal] = useState(6) // cuántas prendas de cada talla conviene tener
  const [cantidades, setCantidades] = useState({}) // id de variante -> cantidad editada a mano
  const [proveedor, setProveedor] = useState('')
  const [copiado, setCopiado] = useState(false)

  const hace30 = Date.now() - 30 * 86400000
  const vendidas = {} // "productoId|varianteId" -> prendas vendidas en 30 días
  ventas
    .filter((v) => new Date(v.fecha).getTime() >= hace30)
    .forEach((v) =>
      v.items.forEach((i) => {
        const k = i.productoId + '|' + i.varianteId
        vendidas[k] = (vendidas[k] || 0) + i.cantidad
      }),
    )

  const filas = productos
    .flatMap((p) =>
      p.variantes
        .filter((v) => v.stock <= STOCK_BAJO)
        .map((v) => ({
          clave: v.id,
          producto: p,
          variante: v,
          vendidas: Math.max(0, vendidas[p.id + '|' + v.id] || 0),
          sugerida: Math.max(0, Number(ideal) - v.stock),
        })),
    )
    .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre))

  const cantidadDe = (f) => (cantidades[f.clave] !== undefined ? Number(cantidades[f.clave]) || 0 : f.sugerida)
  const pedido = filas.filter((f) => cantidadDe(f) > 0)
  const unidades = pedido.reduce((s, f) => s + cantidadDe(f), 0)

  const texto = [
    `*Pedido Quality Shop*${proveedor.trim() ? ' para ' + proveedor.trim() : ''}`,
    'Necesito reponer:',
    ...pedido.map(
      (f) => `• ${cantidadDe(f)}× ${f.producto.nombre} ${[f.variante.color, f.variante.talla].filter(Boolean).join(' ')}`,
    ),
    `Total: ${unidades} ${unidades === 1 ? 'prenda' : 'prendas'}`,
    'Gracias.',
  ].join('\n')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      alert('No se pudo copiar. Usa el botón de WhatsApp.')
    }
  }

  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver al inventario
      </button>
      <div>
        <h1 className="titulo">Lista para reponer</h1>
        <p className="subtitulo">Las prendas con {STOCK_BAJO} o menos, listas para pedir.</p>
      </div>

      <div className="card">
        <div className="dos-campos">
          <label className="campo-g">
            <span className="k">Tener por talla</span>
            <input
              className="campo"
              type="number"
              inputMode="numeric"
              min="1"
              value={ideal}
              onChange={(e) => {
                setIdeal(e.target.value)
                setCantidades({})
              }}
            />
          </label>
          <label className="campo-g">
            <span className="k">Proveedor</span>
            <input className="campo" placeholder="Opcional" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
          </label>
        </div>
        <small className="muted">La cantidad sugerida es lo que falta para llegar a ese número. Puedes cambiarla en cada fila.</small>
      </div>

      {filas.length === 0 && <p className="vacio">Todo en orden: no hay prendas con stock bajo.</p>}

      <ul className="lista">
        {filas.map((f) => (
          <li key={f.clave} className="item">
            <div className="item-fila">
              <span className="izq">
                <strong className="item-nombre">{f.producto.nombre}</strong>
                <small className="muted">
                  {[f.variante.color, f.variante.talla].filter(Boolean).join(' / ')} · quedan {f.variante.stock}
                  {f.vendidas > 0 ? ` · vendidas en 30 días: ${f.vendidas}` : ''}
                </small>
              </span>
              <input
                className="campo corto"
                type="number"
                inputMode="numeric"
                min="0"
                value={cantidades[f.clave] !== undefined ? cantidades[f.clave] : f.sugerida}
                onChange={(e) => setCantidades({ ...cantidades, [f.clave]: e.target.value })}
                aria-label="Cantidad a pedir"
              />
            </div>
          </li>
        ))}
      </ul>

      {pedido.length > 0 && (
        <>
          <div className="card">
            <span className="k">Así queda el mensaje</span>
            <pre className="vista-mensaje">{texto}</pre>
          </div>
          <a className="btn-negro" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer">
            <Icono nombre="enviar" tam={18} /> Enviar por WhatsApp
          </a>
          <button className="btn-claro" onClick={copiar}>
            {copiado ? '¡Copiado!' : 'Copiar lista'}
          </button>
        </>
      )}
    </>
  )
}
