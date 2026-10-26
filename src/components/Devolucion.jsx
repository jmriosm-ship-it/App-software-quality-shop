import { useState } from 'react'
import Icono from './Iconos.jsx'
import { dinero, devueltoDe, etiquetaVenta, uid } from '../utils.js'

// Devolver prendas de una venta o cambiarlas por otras. Se registra como un movimiento nuevo (no se borra la venta):
// las prendas devueltas entran con cantidad negativa, así el stock, las ganancias y las deudas se ajustan solos.
export default function Devolucion({ venta, ventas, productos, clientes, onRegistrar, onVolver }) {
  const [devolver, setDevolver] = useState({}) // "productoId|varianteId" -> cantidad
  const [nuevos, setNuevos] = useState([]) // prendas que se lleva a cambio
  const [busqueda, setBusqueda] = useState('')
  const [pago, setPago] = useState(null)
  const [error, setError] = useState('')

  const yaDevuelto = devueltoDe(venta.id, ventas)
  const clave = (i) => i.productoId + '|' + i.varianteId
  const disponibles = venta.items.map((i) => ({ ...i, max: i.cantidad - (yaDevuelto[clave(i)] || 0) })).filter((i) => i.max > 0)

  // Lo que se devuelve es lo que el cliente realmente pagó por la prenda (con el descuento proporcional)
  const subtotal = venta.items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const proporcion = subtotal > 0 ? venta.total / subtotal : 1
  const valorUnidad = (i) => Math.round(i.precio * proporcion)

  const cliente = clientes.find((c) => c.id === venta.clienteId)
  const aCuenta = venta.pago === 'Fiado' && cliente
  const medios = aCuenta ? ['Fiado', 'Efectivo', 'Transferencia'] : ['Efectivo', 'Transferencia']
  // por defecto, la plata vuelve por el mismo medio con el que se pagó la venta
  const medio = pago && medios.includes(pago) ? pago : medios.includes(venta.pago) ? venta.pago : medios[0]

  const devueltos = disponibles.filter((i) => (devolver[clave(i)] || 0) > 0)
  const valorDevuelto = devueltos.reduce((s, i) => s + valorUnidad(i) * devolver[clave(i)], 0)
  const valorNuevo = nuevos.reduce((s, n) => s + n.precio * n.cantidad, 0)
  const diferencia = valorNuevo - valorDevuelto

  const opciones = productos
    .flatMap((p) =>
      p.variantes.map((v) => ({
        productoId: p.id,
        varianteId: v.id,
        nombre: p.nombre,
        talla: v.talla,
        color: v.color,
        stock: v.stock,
        precio: p.precio,
        costo: p.costo,
      })),
    )
    .filter((o) => o.stock > 0)
    .filter((o) => `${o.nombre} ${o.talla} ${o.color}`.toLowerCase().includes(busqueda.toLowerCase()))
    .slice(0, 12)

  function agregarNuevo(o) {
    setNuevos((lista) => {
      const existe = lista.find((n) => clave(n) === clave(o))
      if (!existe) return [...lista, { ...o, cantidad: 1 }]
      return lista.map((n) => (n === existe ? { ...n, cantidad: Math.min(n.stock, n.cantidad + 1) } : n))
    })
  }

  function cambiarNuevo(n, delta) {
    setNuevos((lista) =>
      lista.map((x) => (x === n ? { ...x, cantidad: Math.min(x.stock, x.cantidad + delta) } : x)).filter((x) => x.cantidad > 0),
    )
  }

  function registrar() {
    if (devueltos.length === 0) return setError('Elige al menos una prenda para devolver.')
    const items = [
      ...devueltos.map((i) => ({
        productoId: i.productoId,
        varianteId: i.varianteId,
        nombre: i.nombre,
        talla: i.talla,
        color: i.color,
        cantidad: -devolver[clave(i)],
        precio: valorUnidad(i),
        costo: i.costo,
      })),
      ...nuevos.map(({ productoId, varianteId, nombre, talla, color, cantidad, precio, costo }) => ({
        productoId,
        varianteId,
        nombre,
        talla,
        color,
        cantidad,
        precio,
        costo,
      })),
    ]
    onRegistrar({
      id: uid(),
      fecha: new Date().toISOString(),
      tipo: nuevos.length > 0 ? 'cambio' : 'devolucion',
      ventaOrigenId: venta.id,
      pago: diferencia === 0 ? 'Efectivo' : medio,
      clienteId: diferencia !== 0 && medio === 'Fiado' ? venta.clienteId : null,
      descuento: 0,
      total: diferencia,
      items,
    })
  }

  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver
      </button>
      <div>
        <h1 className="titulo">Devolver o cambiar</h1>
        <p className="subtitulo">Venta {etiquetaVenta(venta)}</p>
      </div>

      <div className="card">
        <span className="k">1. ¿Qué prendas devuelve?</span>
        {disponibles.length === 0 && <p className="vacio">Ya se devolvieron todas las prendas de esta venta.</p>}
        {disponibles.map((i) => (
          <div key={clave(i)} className="linea">
            <div>
              <strong>{i.nombre}</strong>
              <small className="muted">
                {[i.color, i.talla].filter(Boolean).join(' / ')} · se le devuelven {dinero(valorUnidad(i))} c/u · puede devolver hasta {i.max}
              </small>
            </div>
            <div className="cantidad">
              <button onClick={() => setDevolver({ ...devolver, [clave(i)]: Math.max(0, (devolver[clave(i)] || 0) - 1) })}>−</button>
              <strong>{devolver[clave(i)] || 0}</strong>
              <button
                onClick={() => setDevolver({ ...devolver, [clave(i)]: Math.min(i.max, (devolver[clave(i)] || 0) + 1) })}
                disabled={(devolver[clave(i)] || 0) >= i.max}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <span className="k">2. ¿Se lleva otra prenda a cambio? (opcional)</span>
        {nuevos.map((n) => (
          <div key={clave(n)} className="linea">
            <div>
              <strong>{n.nombre}</strong>
              <small className="muted">
                {[n.color, n.talla].filter(Boolean).join(' / ')} · {dinero(n.precio)}
              </small>
            </div>
            <div className="cantidad">
              <button onClick={() => cambiarNuevo(n, -1)}>−</button>
              <strong>{n.cantidad}</strong>
              <button onClick={() => cambiarNuevo(n, 1)} disabled={n.cantidad >= n.stock}>
                +
              </button>
            </div>
          </div>
        ))}
        <input className="campo" placeholder="Buscar la prenda nueva…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {busqueda.trim() &&
          opciones.map((o) => (
            <button key={clave(o)} className="item-fila" style={{ padding: '6px 0' }} onClick={() => agregarNuevo(o)}>
              <span className="izq">
                <strong>{o.nombre}</strong>
                <small className="muted">
                  {[o.color, o.talla].filter(Boolean).join(' / ')} · quedan {o.stock}
                </small>
              </span>
              <strong>{dinero(o.precio)}</strong>
            </button>
          ))}
      </div>

      <div className="card">
        <span className="k">3. Resumen</span>
        <div className="lineas">
          <div>
            <span className="muted">Valor de lo que devuelve</span>
            <strong>{dinero(valorDevuelto)}</strong>
          </div>
          {nuevos.length > 0 && (
            <div>
              <span className="muted">Valor de lo que se lleva</span>
              <strong>{dinero(valorNuevo)}</strong>
            </div>
          )}
          <div className="total">
            <span>{diferencia < 0 ? 'Se le devuelve al cliente' : diferencia > 0 ? 'El cliente paga la diferencia' : 'Cambio parejo'}</span>
            <span>{dinero(Math.abs(diferencia))}</span>
          </div>
        </div>

        {diferencia !== 0 && (
          <>
            <span className="k">{diferencia < 0 ? 'La plata se devuelve por' : 'La diferencia se paga por'}</span>
            <div className="chips-pago" style={{ gridTemplateColumns: `repeat(${medios.length}, 1fr)` }}>
              {medios.map((m) => (
                <button key={m} className={medio === m ? 'activo' : ''} onClick={() => setPago(m)}>
                  {m === 'Fiado' ? (diferencia < 0 ? 'Bajar su deuda' : 'A su cuenta') : m}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="nota">
          <Icono nombre="info" tam={18} />
          <span>
            Las prendas devueltas vuelven al inventario y la ganancia de la venta se corrige. La venta original no se borra.
          </span>
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn-negro" onClick={registrar} disabled={devueltos.length === 0}>
          {nuevos.length > 0 ? 'Registrar cambio' : 'Registrar devolución'}
        </button>
      </div>
    </>
  )
}
