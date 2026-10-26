import { useState } from 'react'
import Icono from './Iconos.jsx'
import Periodo from './Periodo.jsx'
import {
  codigoNumero,
  dinero,
  enPeriodo,
  fechaCorta,
  pagadoCompra,
  prendasCompra,
  saldoCompra,
  uid,
} from '../utils.js'

const POR_PAGINA = 15

// Formulario "Registrar compra": llega mercancía y sube el stock
function FormCompra({ productos, onGuardar, onVolver }) {
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [proveedor, setProveedor] = useState('')
  const [factura, setFactura] = useState('')
  const [pagado, setPagado] = useState('') // vacío = se pagó todo
  const [medio, setMedio] = useState('Efectivo')

  // Una fila por cada talla/color, tenga o no stock
  const opciones = productos
    .flatMap((p) =>
      p.variantes.map((v) => ({
        productoId: p.id,
        varianteId: v.id,
        nombre: p.nombre,
        talla: v.talla,
        color: v.color,
        stock: v.stock,
        costo: p.costo,
      })),
    )
    .filter((o) => `${o.nombre} ${o.talla} ${o.color}`.toLowerCase().includes(busqueda.toLowerCase()))

  const enCarrito = (o) => carrito.find((i) => i.productoId === o.productoId && i.varianteId === o.varianteId)

  function agregar(o) {
    if (enCarrito(o)) return
    setCarrito((lista) => [...lista, { ...o, cantidad: 1 }])
  }

  function cambiar(item, campo, valor) {
    setCarrito((lista) => lista.map((i) => (i === item ? { ...i, [campo]: valor } : i)))
  }

  const total = carrito.reduce((s, i) => s + (Number(i.costo) || 0) * (Number(i.cantidad) || 0), 0)
  const valido = carrito.length > 0 && carrito.every((i) => Number(i.cantidad) > 0 && Number(i.costo) >= 0)
  const abono = pagado === '' ? total : Math.min(total, Math.max(0, Number(pagado) || 0))

  function registrar() {
    onGuardar({
      id: uid(),
      fecha: new Date().toISOString(),
      proveedor: proveedor.trim(),
      factura: factura.trim(),
      total,
      pagado: abono,
      medioPago: medio,
      items: carrito.map(({ productoId, varianteId, nombre, talla, color, cantidad, costo }) => ({
        productoId,
        varianteId,
        nombre,
        talla,
        color,
        cantidad: Math.floor(Number(cantidad)),
        costo: Number(costo),
      })),
    })
  }

  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver a compras
      </button>
      <h1 className="titulo">Registrar compra</h1>
      <p className="subtitulo" style={{ marginTop: -6 }}>Toca las prendas que llegaron.</p>

      {productos.length === 0 && (
        <p className="vacio">Primero crea los productos en Inventario. Aquí solo se les suma mercancía.</p>
      )}

      {carrito.length > 0 && (
        <div className="carrito">
          <span className="k">Mercancía que llegó · cantidad y costo por unidad</span>
          {carrito.map((i) => (
            <div key={i.productoId + i.varianteId} className="linea">
              <div>
                <strong>{i.nombre}</strong>
                <small className="muted">{[i.color, i.talla].filter(Boolean).join(' / ')}</small>
              </div>
              <div className="cantidad">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={i.cantidad}
                  onChange={(e) => cambiar(i, 'cantidad', e.target.value)}
                  aria-label="Cantidad"
                />
                <input
                  style={{ width: 92 }}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={i.costo}
                  onChange={(e) => cambiar(i, 'costo', e.target.value)}
                  aria-label="Costo por unidad"
                />
                <button onClick={() => setCarrito((l) => l.filter((x) => x !== i))} aria-label="Quitar">
                  ×
                </button>
              </div>
            </div>
          ))}

          <div className="dos-campos">
            <label className="campo-g">
              <span className="k">Proveedor</span>
              <input className="campo" placeholder="Opcional" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
            </label>
            <label className="campo-g">
              <span className="k">Factura</span>
              <input className="campo" placeholder="Opcional" value={factura} onChange={(e) => setFactura(e.target.value)} />
            </label>
          </div>

          <label className="campo-g">
            <span className="k">¿Cuánto pagaste ahora?</span>
            <input
              className="campo"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder={`Todo: ${dinero(total)}`}
              value={pagado}
              onChange={(e) => setPagado(e.target.value)}
            />
          </label>
          <div className="chips-pago" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {['Efectivo', 'Transferencia'].map((m) => (
              <button key={m} type="button" className={medio === m ? 'activo' : ''} onClick={() => setMedio(m)}>
                Pagado en {m.toLowerCase()}
              </button>
            ))}
          </div>
          {abono < total && (
            <small className="muted">Quedarías debiendo {dinero(total - abono)} al proveedor.</small>
          )}

          <button className="btn-negro" onClick={registrar} disabled={!valido}>
            Registrar compra {dinero(total)}
          </button>
        </div>
      )}

      <label className="buscador">
        <Icono nombre="buscar" tam={20} />
        <input placeholder="Buscar qué prenda llegó…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </label>

      <ul className="lista">
        {opciones.map((o) => (
          <li key={o.productoId + o.varianteId} className="item" onClick={() => agregar(o)} style={{ cursor: 'pointer' }}>
            <div className="item-fila">
              <span className="izq">
                <strong className="item-nombre">{o.nombre}</strong>
                <small className="muted">
                  {[o.color, o.talla].filter(Boolean).join(' / ')} · hay {o.stock}
                </small>
              </span>
              <span className="der">
                <small className="muted">costo {dinero(o.costo)}</small>
                {enCarrito(o) && <small className="bueno">agregado</small>}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export default function Compras({ productos, compras, periodo, onPeriodo, onCompra, onAnular, onPagar }) {
  const [nueva, setNueva] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todas') // todas | saldo
  const [abierta, setAbierta] = useState(null)
  const [pago, setPago] = useState('')
  const [medioPago, setMedioPago] = useState('Efectivo')
  const [limite, setLimite] = useState(POR_PAGINA)

  if (nueva) {
    return (
      <FormCompra
        productos={productos}
        onGuardar={(c) => {
          onCompra(c)
          setNueva(false)
        }}
        onVolver={() => setNueva(false)}
      />
    )
  }

  const delPeriodo = compras.filter((c) => enPeriodo(c.fecha, periodo))
  const total = delPeriodo.reduce((s, c) => s + c.total, 0)
  const prendas = delPeriodo.reduce((s, c) => s + prendasCompra(c), 0)
  const pagado = delPeriodo.reduce((s, c) => s + pagadoCompra(c), 0)
  const saldo = total - pagado
  const conSaldo = delPeriodo.filter((c) => saldoCompra(c) > 0)
  const proveedores = new Set(conSaldo.map((c) => c.proveedor || 'Sin proveedor')).size

  let lista = delPeriodo.filter((c) =>
    `${c.proveedor || ''} ${c.factura || ''} ${codigoNumero('C', c.numero)} ${c.items.map((i) => i.nombre).join(' ')}`
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  )
  if (filtro === 'saldo') lista = lista.filter((c) => saldoCompra(c) > 0)

  function registrarPago(c) {
    const monto = Math.min(saldoCompra(c), Math.max(0, Number(pago) || 0))
    if (monto <= 0) return
    onPagar(c.id, monto, medioPago)
    setPago('')
  }

  return (
    <>
      <div>
        <p className="k">Movimientos / abastecimiento</p>
        <h1 className="titulo">Compras</h1>
        <p className="subtitulo">Mercadería y proveedores, bajo control.</p>
      </div>

      <Periodo periodo={periodo} onCambiar={onPeriodo} />

      <div className="hero">
        <span className="k">Compras del período</span>
        <span className="grande">{dinero(total)}</span>
        <small>
          {delPeriodo.length} compras · {prendas} prendas recibidas
        </small>
      </div>

      <div className="duo">
        <div className="card">
          <span className="k">Pagado a proveedores</span>
          <span className="valor">{dinero(pagado)}</span>
          <small>{total > 0 ? ((pagado / total) * 100).toFixed(1).replace('.', ',') : 0}% de las compras</small>
        </div>
        <div className="card">
          <span className="k">Saldo por pagar</span>
          <span className={'valor' + (saldo > 0 ? ' alerta' : '')}>{dinero(saldo)}</span>
          <small>
            {proveedores} {proveedores === 1 ? 'proveedor' : 'proveedores'}
          </small>
        </div>
      </div>

      <button className="btn-negro" onClick={() => setNueva(true)}>
        <Icono nombre="mas" tam={20} /> Registrar compra
      </button>

      <div className="segmentos">
        <button className={filtro === 'todas' ? 'activo' : ''} onClick={() => setFiltro('todas')}>
          Todas · {delPeriodo.length}
        </button>
        <button className={filtro === 'saldo' ? 'activo' : ''} onClick={() => setFiltro('saldo')}>
          Con saldo · {conSaldo.length}
        </button>
      </div>

      <label className="buscador">
        <Icono nombre="buscar" tam={20} />
        <input placeholder="Compra, factura o proveedor…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </label>

      <div className="seccion-titulo">
        <h2>Historial de compras</h2>
      </div>

      {lista.length === 0 && <p className="vacio">No hay compras en este período.</p>}

      <ul className="lista">
        {lista.slice(0, limite).map((c) => {
          const desplegada = abierta === c.id
          const saldoC = saldoCompra(c)
          const pagadoC = pagadoCompra(c)
          const estado = saldoC <= 0 ? 'Pagado' : pagadoC > 0 ? 'Parcial' : 'Debe'
          const n = prendasCompra(c)

          return (
            <li key={c.id} className={'item' + (desplegada ? ' abierto' : '')}>
              <button
                className="item-fila"
                onClick={() => {
                  setAbierta(desplegada ? null : c.id)
                  setPago('')
                }}
              >
                <span className="izq">
                  <span className="k">
                    {codigoNumero('C', c.numero) || 'Compra'} · {fechaCorta(c.fecha)}
                  </span>
                  <strong className="item-nombre">{c.proveedor || 'Sin proveedor'}</strong>
                  <small className="muted">
                    {n} {n === 1 ? 'prenda' : 'prendas'} · Recibida
                  </small>
                </span>
                <span className="der">
                  <span className={'insignia' + (estado === 'Pagado' ? ' negra' : '')}>{estado}</span>
                  <strong className="item-precio">{dinero(c.total)}</strong>
                </span>
              </button>

              {desplegada && (
                <div className="detalle">
                  {c.factura && (
                    <div className="fila-b">
                      <span className="muted">Factura</span>
                      <strong>{c.factura}</strong>
                    </div>
                  )}
                  <p className="k">Entrada al inventario · {n} uds.</p>
                  {c.items.map((i, idx) => (
                    <div key={idx} className="fila-b" style={{ alignItems: 'flex-start' }}>
                      <div style={{ display: 'grid' }}>
                        <strong>{i.nombre}</strong>
                        <small className="muted">
                          {[i.color, i.talla].filter(Boolean).join(' / ')} · Costo {dinero(i.costo)}
                        </small>
                      </div>
                      <strong>+{i.cantidad} uds.</strong>
                    </div>
                  ))}

                  <div className="lineas" style={{ borderTop: '1px solid var(--borde)' }}>
                    <div className="total">
                      <span>Total de compra</span>
                      <span>{dinero(c.total)}</span>
                    </div>
                    <div>
                      <span className="muted">Pagado</span>
                      <strong>{dinero(pagadoC)}</strong>
                    </div>
                  </div>

                  {saldoC > 0 && (
                    <>
                      <div className="resultado">
                        <span>Saldo pendiente</span>
                        <b>{dinero(saldoC)}</b>
                      </div>
                      <div className="chips-pago" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        {['Efectivo', 'Transferencia'].map((m) => (
                          <button key={m} className={medioPago === m ? 'activo' : ''} onClick={() => setMedioPago(m)}>
                            {m}
                          </button>
                        ))}
                      </div>
                      <div className="ajuste">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder={`Hasta ${dinero(saldoC)}`}
                          value={pago}
                          onChange={(e) => setPago(e.target.value)}
                        />
                        <button className="btn-negro" style={{ width: 'auto', padding: '14px 18px' }} onClick={() => registrarPago(c)}>
                          Registrar pago
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    className="btn-peligro"
                    onClick={() => confirm('¿Anular esta compra? Se resta esa mercancía del inventario.') && onAnular(c)}
                  >
                    Anular compra
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {lista.length > limite && (
        <button className="btn-claro" onClick={() => setLimite(limite + POR_PAGINA)}>
          <Icono nombre="abajo" tam={18} /> Cargar más compras
        </button>
      )}

      <div className="nota">
        <Icono nombre="info" tam={18} />
        <span>
          Comprar mercadería aumenta el inventario. Para calcular la ganancia, solo se descuenta el costo de las prendas
          vendidas, no el total de las compras.
        </span>
      </div>
    </>
  )
}
