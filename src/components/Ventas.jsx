import { useEffect, useState } from 'react'
import Icono from './Iconos.jsx'
import Periodo from './Periodo.jsx'
import Vender from './Vender.jsx'
import Caja from './Caja.jsx'
import Devolucion from './Devolucion.jsx'
import {
  dinero,
  enPeriodo,
  esVenta,
  estadoVenta,
  etiquetaVenta,
  fechaHora,
  linkWhatsapp,
  prendasVenta,
  saldosFiado,
  textoRecibo,
} from '../utils.js'

const POR_PAGINA = 15

export default function Ventas({
  productos,
  clientes,
  ventas,
  compras,
  gastos,
  cierres,
  onGuardarCierre,
  periodo,
  onPeriodo,
  onVenta,
  onAnular,
  inicioNueva,
  onConsumido,
}) {
  const [nueva, setNueva] = useState(inicioNueva)
  const [caja, setCaja] = useState(false)
  const [devolviendo, setDevolviendo] = useState(null) // venta a la que se le hace la devolución o el cambio
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todas') // todas | cobradas | porcobrar
  const [abierta, setAbierta] = useState(null)
  const [limite, setLimite] = useState(POR_PAGINA)

  // si venimos del botón "Nueva venta" del Resumen, ya la abrimos; avisamos para no repetirlo
  useEffect(() => {
    if (inicioNueva) onConsumido()
  }, [inicioNueva, onConsumido])

  if (nueva) {
    return <Vender productos={productos} clientes={clientes} onVenta={onVenta} onVolver={() => setNueva(false)} />
  }

  if (caja) {
    return (
      <Caja
        ventas={ventas}
        compras={compras}
        clientes={clientes}
        gastos={gastos}
        cierres={cierres}
        onGuardar={onGuardarCierre}
        onVolver={() => setCaja(false)}
      />
    )
  }

  if (devolviendo) {
    return (
      <Devolucion
        venta={devolviendo}
        ventas={ventas}
        productos={productos}
        clientes={clientes}
        onRegistrar={(registro) => {
          onVenta(registro)
          setDevolviendo(null)
          setAbierta(null)
        }}
        onVolver={() => setDevolviendo(null)}
      />
    )
  }

  const saldos = saldosFiado(clientes, ventas)
  const delPeriodo = ventas.filter((v) => enPeriodo(v.fecha, periodo))
  const soloVentas = delPeriodo.filter(esVenta)
  // los totales descuentan las devoluciones y cambios del período
  const total = delPeriodo.reduce((s, v) => s + v.total, 0)
  const prendas = delPeriodo.reduce((s, v) => s + prendasVenta(v), 0)
  const porCobrar = delPeriodo.reduce((s, v) => s + (saldos[v.id] || 0), 0)
  const cobrado = total - porCobrar
  const ticket = soloVentas.length ? total / soloVentas.length : 0
  const cuentaCobrar = delPeriodo.filter((v) => estadoVenta(v, saldos) === 'Por cobrar').length
  const cuentaCobradas = delPeriodo.filter((v) => estadoVenta(v, saldos) === 'Cobrado').length

  const nombreCliente = (v) => clientes.find((c) => c.id === v.clienteId)?.nombre || 'Mostrador'

  let lista = delPeriodo.filter((v) => {
    const texto = `${nombreCliente(v)} ${etiquetaVenta(v)} ${v.items.map((i) => i.nombre).join(' ')}`
    return texto.toLowerCase().includes(busqueda.toLowerCase())
  })
  if (filtro === 'cobradas') lista = lista.filter((v) => estadoVenta(v, saldos) === 'Cobrado')
  if (filtro === 'porcobrar') lista = lista.filter((v) => estadoVenta(v, saldos) === 'Por cobrar')

  return (
    <>
      <div>
        <p className="k">Movimientos / ingresos</p>
        <h1 className="titulo">Ventas</h1>
        <p className="subtitulo">Registra cada venta y sigue su cobro.</p>
      </div>

      <Periodo periodo={periodo} onCambiar={onPeriodo} />

      <div className="hero">
        <span className="k">Total vendido</span>
        <span className="grande">{dinero(total)}</span>
        <small>
          {soloVentas.length} ventas · {prendas} prendas
          {delPeriodo.length > soloVentas.length ? ` · ${delPeriodo.length - soloVentas.length} devoluciones o cambios` : ''}
        </small>
      </div>

      <div className="duo">
        <div className="card">
          <span className="k">Ticket promedio</span>
          <span className="valor">{dinero(ticket)}</span>
          <small>Por venta registrada</small>
        </div>
        <div className="card">
          <span className="k">Por cobrar</span>
          <span className="valor">{dinero(porCobrar)}</span>
          <small>
            {cuentaCobrar} {cuentaCobrar === 1 ? 'venta' : 'ventas'} a cuenta
          </small>
        </div>
      </div>

      <button className="btn-negro" onClick={() => setNueva(true)}>
        <Icono nombre="mas" tam={20} /> Nueva venta
      </button>
      <button className="btn-claro" onClick={() => setCaja(true)}>
        <Icono nombre="deudas" tam={18} /> Cierre de caja
      </button>

      <div className="segmentos">
        <button className={filtro === 'todas' ? 'activo' : ''} onClick={() => setFiltro('todas')}>
          Todas · {delPeriodo.length}
        </button>
        <button className={filtro === 'cobradas' ? 'activo' : ''} onClick={() => setFiltro('cobradas')}>
          Cobradas · {cuentaCobradas}
        </button>
        <button className={filtro === 'porcobrar' ? 'activo' : ''} onClick={() => setFiltro('porcobrar')}>
          Por cobrar · {cuentaCobrar}
        </button>
      </div>

      <label className="buscador">
        <Icono nombre="buscar" tam={20} />
        <input placeholder="Buscar venta, cliente o prenda…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </label>

      <div className="seccion-titulo">
        <h2>Historial de ventas</h2>
        <span className="muted" style={{ fontSize: 12 }}>Más recientes</span>
      </div>

      {lista.length === 0 && <p className="vacio">No hay ventas en este período.</p>}

      <ul className="lista">
        {lista.slice(0, limite).map((v) => {
          const desplegada = abierta === v.id
          const estado = estadoVenta(v, saldos)
          const cliente = clientes.find((c) => c.id === v.clienteId)
          const n = prendasVenta(v)
          const subtotal = v.items.reduce((s, i) => s + i.precio * i.cantidad, 0)

          return (
            <li key={v.id} className={'item' + (desplegada ? ' abierto' : '')}>
              <button className="item-fila" onClick={() => setAbierta(desplegada ? null : v.id)}>
                <span className="izq">
                  <span className="k">{etiquetaVenta(v) || (v.tipo ? 'Devolución' : 'Venta')}</span>
                  <strong className="item-nombre">{nombreCliente(v)}</strong>
                  <small className="muted">
                    {fechaHora(v.fecha)} · {v.tipo ? (v.tipo === 'cambio' ? 'Cambio de prendas' : 'Prendas devueltas') : `${n} ${n === 1 ? 'prenda' : 'prendas'}`}
                  </small>
                </span>
                <span className="der">
                  <span className={'insignia' + (estado === 'Cobrado' ? ' negra' : '')}>{estado}</span>
                  <strong className="item-precio">{dinero(v.total)}</strong>
                </span>
              </button>

              {desplegada && (
                <div className="detalle">
                  <p className="k">
                    {v.tipo ? 'Prendas del movimiento' : `Productos · ${n} ${n === 1 ? 'prenda' : 'prendas'}`}
                  </p>
                  {v.items.map((i, idx) => (
                    <div key={idx} className="fila-b" style={{ alignItems: 'flex-start' }}>
                      <div style={{ display: 'grid' }}>
                        <strong>
                          {i.cantidad < 0 ? 'Devuelve: ' : v.tipo ? 'Se lleva: ' : ''}
                          {i.nombre}
                        </strong>
                        <small className="muted">
                          {[i.color, i.talla].filter(Boolean).join(' / ')} · {Math.abs(i.cantidad)} × {dinero(i.precio)}
                        </small>
                      </div>
                      <strong>{dinero(i.precio * i.cantidad)}</strong>
                    </div>
                  ))}

                  <div className="lineas" style={{ borderTop: '1px solid var(--borde)' }}>
                    {!v.tipo && (
                      <>
                        <div>
                          <span className="muted">Subtotal</span>
                          <span>{dinero(subtotal)}</span>
                        </div>
                        <div>
                          <span className="muted">Descuento</span>
                          <span>{dinero(v.descuento || 0)}</span>
                        </div>
                      </>
                    )}
                    <div className="total">
                      <span>{v.tipo ? (v.total < 0 ? 'Se devolvió al cliente' : v.total > 0 ? 'Diferencia que pagó' : 'Cambio parejo') : 'Total de la venta'}</span>
                      <span>{dinero(Math.abs(v.total))}</span>
                    </div>
                    <div>
                      <span className="muted">Medio de pago</span>
                      <strong>{v.pago}</strong>
                    </div>
                    {v.pago === 'Fiado' && (
                      <div>
                        <span className="muted">Saldo pendiente</span>
                        <strong className={saldos[v.id] > 0 ? 'alerta' : 'bueno'}>{dinero(saldos[v.id] || 0)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="nota">
                    <Icono nombre="info" tam={18} />
                    <span>
                      {v.tipo
                        ? 'Las prendas devueltas volvieron al inventario y la ganancia se corrigió.'
                        : `Esta venta descontó ${n} ${n === 1 ? 'prenda' : 'prendas'} del inventario.`}
                    </span>
                  </div>

                  {!v.tipo && (
                    <>
                      <a
                        className="btn-claro"
                        href={linkWhatsapp(cliente?.telefono, textoRecibo(v))}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icono nombre="compartir" tam={18} /> Compartir comprobante
                      </a>
                      <button className="btn-claro" onClick={() => setDevolviendo(v)}>
                        <Icono nombre="atras" tam={18} /> Devolver o cambiar prendas
                      </button>
                    </>
                  )}
                  {!v.tipo && ventas.some((x) => x.ventaOrigenId === v.id) ? (
                    <small className="muted" style={{ textAlign: 'center' }}>
                      Esta venta tiene devoluciones. Para anularla, anula primero sus devoluciones.
                    </small>
                  ) : (
                    <button
                      className="btn-peligro"
                      onClick={() =>
                        confirm(
                          v.tipo
                            ? '¿Anular esta devolución o cambio? Las prendas se mueven de nuevo como estaban.'
                            : '¿Anular esta venta? Las prendas vuelven al inventario.',
                        ) && onAnular(v)
                      }
                    >
                      {v.tipo ? 'Anular movimiento' : 'Anular venta'}
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {lista.length > limite && (
        <button className="btn-claro" onClick={() => setLimite(limite + POR_PAGINA)}>
          <Icono nombre="abajo" tam={18} /> Cargar más ventas
        </button>
      )}
      <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
        Mostrando {Math.min(limite, lista.length)} de {lista.length} ventas
      </p>

      <div className="card">
        <h2 className="valor" style={{ fontSize: 20 }}>Cobros del período</h2>
        <div className="lineas">
          <div>
            <span className="muted">Cobrado en ventas</span>
            <strong>{dinero(cobrado)}</strong>
          </div>
          <div className="total">
            <span>Saldo por cobrar</span>
            <span>{dinero(porCobrar)}</span>
          </div>
        </div>
      </div>
    </>
  )
}
