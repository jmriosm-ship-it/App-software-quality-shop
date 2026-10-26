import { useState } from 'react'
import Icono from './Iconos.jsx'
import Escaner from './Escaner.jsx'
import { dinero, linkWhatsapp, textoRecibo, uid } from '../utils.js'

const PAGOS = ['Efectivo', 'Transferencia', 'Fiado']

// Pantalla "Nueva venta": se eligen las prendas, el medio de pago y se registra
export default function Vender({ productos, clientes, onVenta, onVolver }) {
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [pago, setPago] = useState('Efectivo')
  const [clienteId, setClienteId] = useState('')
  const [descuento, setDescuento] = useState('')
  const [aviso, setAviso] = useState('')
  const [recibo, setRecibo] = useState(null) // última venta, para mandar el recibo por WhatsApp
  const [escaneando, setEscaneando] = useState(false)

  // Una fila por cada talla/color que tenga stock
  const todas = productos.flatMap((p) =>
    p.variantes.map((v) => ({
      productoId: p.id,
      varianteId: v.id,
      nombre: p.nombre,
      talla: v.talla,
      color: v.color,
      stock: v.stock,
      precio: p.precio,
      costo: p.costo,
      codigoTalla: (v.codigo || '').toLowerCase(),
      codigoProducto: (p.codigo || '').toLowerCase(),
    })),
  )
  const opciones = todas
    .filter((o) => o.stock > 0)
    .filter((o) => `${o.nombre} ${o.talla} ${o.color}`.toLowerCase().includes(busqueda.toLowerCase()))

  // Al escanear: si el código es de una talla, la agrega al carrito; si es del producto, deja filtrado para elegir
  function alEscanear(codigo) {
    const c = codigo.trim().toLowerCase()
    const talla = todas.find((o) => o.codigoTalla && o.codigoTalla === c)
    if (talla) {
      const en = carrito.find((i) => i.productoId === talla.productoId && i.varianteId === talla.varianteId)
      if (talla.stock <= 0 || (en && en.cantidad >= talla.stock)) return `Sin más stock: ${talla.nombre} ${talla.talla}`
      agregar(talla)
      return `Agregada: ${talla.nombre} · ${[talla.color, talla.talla].filter(Boolean).join(' ')}`
    }
    const producto = todas.find((o) => o.codigoProducto && o.codigoProducto === c)
    if (producto) {
      setBusqueda(producto.nombre)
      return `${producto.nombre}: elige la talla`
    }
    return 'No encontré ese código en tu inventario'
  }

  const enCarrito = (o) => carrito.find((i) => i.productoId === o.productoId && i.varianteId === o.varianteId)

  function agregar(o) {
    setAviso('')
    setRecibo(null)
    setCarrito((lista) => {
      const existe = lista.find((i) => i.productoId === o.productoId && i.varianteId === o.varianteId)
      if (!existe) return [...lista, { ...o, cantidad: 1 }]
      if (existe.cantidad >= o.stock) return lista
      return lista.map((i) => (i === existe ? { ...i, cantidad: i.cantidad + 1 } : i))
    })
  }

  function cambiarCantidad(item, delta) {
    setCarrito((lista) =>
      lista
        .map((i) => (i === item ? { ...i, cantidad: Math.min(i.stock, i.cantidad + delta) } : i))
        .filter((i) => i.cantidad > 0),
    )
  }

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
  // el descuento no puede ser negativo ni mayor que la compra
  const desc = Math.min(Math.max(0, Math.round(Number(descuento) || 0)), subtotal)
  const total = subtotal - desc
  const faltaCliente = pago === 'Fiado' && !clienteId

  function cobrar() {
    const cliente = clientes.find((c) => c.id === clienteId)
    const venta = {
      id: uid(),
      fecha: new Date().toISOString(),
      pago,
      clienteId: clienteId || null, // el cliente es opcional, salvo en fiado
      descuento: desc,
      total,
      items: carrito.map(({ productoId, varianteId, nombre, talla, color, cantidad, precio, costo }) => ({
        productoId,
        varianteId,
        nombre,
        talla,
        color,
        cantidad,
        precio,
        costo,
      })),
    }
    onVenta(venta)
    setRecibo({ venta, telefono: cliente ? cliente.telefono : '' })
    setCarrito([])
    setPago('Efectivo')
    setClienteId('')
    setDescuento('')
    setAviso(
      pago === 'Fiado' ? `Fiado a ${cliente.nombre}: ${dinero(total)}` : `Venta registrada: ${dinero(total)}`,
    )
  }

  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver a ventas
      </button>
      <h1 className="titulo">Nueva venta</h1>

      {aviso && (
        <div className="aviso-ok">
          <span>{aviso}</span>
          {recibo && (
            <a
              className="btn-claro"
              href={linkWhatsapp(recibo.telefono, textoRecibo(recibo.venta))}
              target="_blank"
              rel="noreferrer"
            >
              <Icono nombre="enviar" tam={18} /> Enviar recibo por WhatsApp
            </a>
          )}
        </div>
      )}

      {carrito.length > 0 && (
        <div className="carrito">
          <span className="k">Carrito</span>
          {carrito.map((i) => (
            <div key={i.productoId + i.varianteId} className="linea">
              <div>
                <strong>{i.nombre}</strong>
                <small className="muted">
                  {[i.color, i.talla].filter(Boolean).join(' / ')} · {dinero(i.precio)}
                </small>
              </div>
              <div className="cantidad">
                <button onClick={() => cambiarCantidad(i, -1)}>−</button>
                <strong>{i.cantidad}</strong>
                <button onClick={() => cambiarCantidad(i, 1)} disabled={i.cantidad >= i.stock}>
                  +
                </button>
              </div>
            </div>
          ))}

          <label className="campo-g">
            <span className="k">Descuento (opcional)</span>
            <input
              className="campo"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Ej: 20000"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
            />
          </label>
          {desc > 0 && (
            <small className="muted">
              Subtotal {dinero(subtotal)} · descuento −{dinero(desc)}
            </small>
          )}

          <div className="chips-pago">
            {PAGOS.map((m) => (
              <button key={m} className={pago === m ? 'activo' : ''} onClick={() => setPago(m)}>
                {m}
              </button>
            ))}
          </div>

          {clientes.length === 0 ? (
            pago === 'Fiado' && <p className="error">Primero crea al cliente en la pestaña Deudas.</p>
          ) : (
            <select className="campo" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">{pago === 'Fiado' ? '¿A quién se le fía?' : 'Cliente (opcional)'}</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}

          <button className="btn-negro" onClick={cobrar} disabled={faltaCliente}>
            {pago === 'Fiado' ? 'Fiar' : 'Cobrar'} {dinero(total)}
          </button>
        </div>
      )}

      {escaneando && <Escaner titulo="Escanear prendas" onLeer={alEscanear} onCerrar={() => setEscaneando(false)} />}

      <div className="fila-buscar">
        <label className="buscador">
          <Icono nombre="buscar" tam={20} />
          <input placeholder="Buscar producto, talla o color…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <button className="icono-boton claro" onClick={() => setEscaneando(true)} aria-label="Escanear código">
          <Icono nombre="escanear" tam={22} />
        </button>
      </div>

      {opciones.length === 0 && <p className="vacio">No hay productos con stock para vender.</p>}

      <ul className="lista">
        {opciones.map((o) => {
          const en = enCarrito(o)
          return (
            <li key={o.productoId + o.varianteId} className="item" onClick={() => agregar(o)} style={{ cursor: 'pointer' }}>
              <div className="item-fila">
                <span className="izq">
                  <strong className="item-nombre">{o.nombre}</strong>
                  <small className="muted">
                    {[o.color, o.talla].filter(Boolean).join(' / ')} · quedan {o.stock - (en ? en.cantidad : 0)}
                  </small>
                </span>
                <span className="der">
                  <strong className="item-precio">{dinero(o.precio)}</strong>
                  {en && <small className="bueno">en carrito: {en.cantidad}</small>}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
