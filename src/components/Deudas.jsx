import { useState } from 'react'
import Icono from './Iconos.jsx'
import {
  codigoNumero,
  deudaCliente,
  dinero,
  fechaCorta,
  linkWhatsapp,
  pagadoCompra,
  saldoCompra,
  saldosFiado,
  uid,
} from '../utils.js'

function FormCliente({ inicial, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(inicial.nombre || '')
  const [telefono, setTelefono] = useState(inicial.telefono || '')
  const [error, setError] = useState('')

  function guardar(e) {
    e.preventDefault()
    if (!nombre.trim()) return setError('Escribe el nombre del cliente.')
    onGuardar({ id: inicial.id || uid(), nombre: nombre.trim(), telefono: telefono.trim(), abonos: inicial.abonos || [] })
  }

  return (
    <form onSubmit={guardar} className="form">
      <button type="button" className="volver" onClick={onCancelar}>
        <Icono nombre="atras" tam={20} /> Volver
      </button>
      <h1 className="titulo">{inicial.id ? 'Editar cliente' : 'Nuevo cliente'}</h1>
      <label className="campo-g">
        <span className="k">Nombre</span>
        <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Carlos Pérez" />
      </label>
      <label className="campo-g">
        <span className="k">Teléfono (WhatsApp)</span>
        <input
          className="campo"
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Ej: 3001234567"
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn-negro">
        Guardar cliente
      </button>
    </form>
  )
}

const DIA = 86400000

export default function Deudas({ clientes, ventas, compras, onGuardarCliente, onBorrarCliente, onAbono, onPagar }) {
  const [filtro, setFiltro] = useState('todas') // todas | cobrar | pagar
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null) // 'c:<id>' o 'p:<id>'
  const [monto, setMonto] = useState('')
  const [medio, setMedio] = useState('Efectivo') // cómo pagó el abono o el pago al proveedor
  const [error, setError] = useState('')
  const [formCliente, setFormCliente] = useState(null) // null = lista, {} = nuevo, cliente = editar
  const [verAlDia, setVerAlDia] = useState(false)

  if (formCliente) {
    return (
      <FormCliente
        inicial={formCliente}
        onGuardar={(c) => {
          onGuardarCliente(c)
          setFormCliente(null)
        }}
        onCancelar={() => setFormCliente(null)}
      />
    )
  }

  const saldos = saldosFiado(clientes, ventas)
  const conDeuda = clientes.map((c) => ({ ...c, deuda: deudaCliente(c, ventas) }))
  const deudores = conDeuda.filter((c) => c.deuda > 0).sort((a, b) => b.deuda - a.deuda)
  const alDia = conDeuda.filter((c) => c.deuda <= 0)
  const porCobrar = deudores.reduce((s, c) => s + c.deuda, 0)

  const porPagarLista = compras
    .filter((c) => saldoCompra(c) > 0)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  const porPagar = porPagarLista.reduce((s, c) => s + saldoCompra(c), 0)
  const proveedores = new Set(porPagarLista.map((c) => c.proveedor || 'Sin proveedor')).size

  // Antigüedad de lo que te deben, según la fecha de cada venta fiada
  const edades = { t1: 0, t2: 0, t3: 0 }
  ventas.forEach((v) => {
    const saldo = saldos[v.id] || 0
    if (saldo <= 0) return
    const dias = (Date.now() - new Date(v.fecha)) / DIA
    edades[dias <= 7 ? 't1' : dias <= 30 ? 't2' : 't3'] += saldo
  })

  const coincide = (texto) => texto.toLowerCase().includes(busqueda.toLowerCase())
  const listaClientes = (verAlDia ? [...deudores, ...alDia] : deudores).filter((c) => coincide(`${c.nombre} ${c.telefono}`))
  const listaPagar = porPagarLista.filter((c) =>
    coincide(`${c.proveedor || ''} ${c.factura || ''} ${codigoNumero('C', c.numero)}`),
  )

  function abrir(id) {
    setAbierto(abierto === id ? null : id)
    setMonto('')
    setError('')
  }

  function cobrar(c) {
    const valor = Number(monto)
    if (!(valor > 0)) return setError('Escribe cuánto abonó.')
    if (valor > c.deuda) return setError(`No puede abonar más de lo que debe (${dinero(c.deuda)}).`)
    onAbono(c.id, valor, medio)
    setMonto('')
    setError('')
  }

  function pagar(c) {
    const valor = Number(monto)
    if (!(valor > 0)) return setError('Escribe cuánto pagaste.')
    if (valor > saldoCompra(c)) return setError(`No puedes pagar más del saldo (${dinero(saldoCompra(c))}).`)
    onPagar(c.id, valor, medio)
    setMonto('')
    setError('')
  }

  function borrar(c) {
    if (c.deuda > 0) return alert('Este cliente todavía debe plata. No se puede borrar hasta que pague.')
    if (confirm('¿Borrar este cliente?')) onBorrarCliente(c.id)
  }

  return (
    <>
      <div>
        <p className="k">Finanzas / cuentas corrientes</p>
        <h1 className="titulo">Deudas</h1>
        <p className="subtitulo">Lo que te deben y lo que tienes que pagar.</p>
      </div>

      <div className="duo">
        <div className="card oscura">
          <span className="k">Por cobrar · {deudores.length} {deudores.length === 1 ? 'cliente' : 'clientes'}</span>
          <span className="valor">{dinero(porCobrar)}</span>
          <small>De ventas a cuenta</small>
        </div>
        <div className="card">
          <span className="k">Por pagar · {proveedores} {proveedores === 1 ? 'proveedor' : 'proveedores'}</span>
          <span className="valor">{dinero(porPagar)}</span>
          <small>De compras con saldo</small>
        </div>
      </div>

      <div className="fila-b" style={{ padding: '0 4px' }}>
        <span className="muted">Balance de saldos</span>
        <strong className={porCobrar - porPagar < 0 ? 'alerta' : ''}>
          {porCobrar - porPagar < 0 ? '− ' : ''}
          {dinero(Math.abs(porCobrar - porPagar))}
        </strong>
      </div>

      <button className="btn-negro" onClick={() => setFormCliente({})}>
        <Icono nombre="mas" tam={20} /> Nuevo cliente
      </button>

      <div className="segmentos">
        <button className={filtro === 'todas' ? 'activo' : ''} onClick={() => setFiltro('todas')}>
          Todas · {deudores.length + porPagarLista.length}
        </button>
        <button className={filtro === 'cobrar' ? 'activo' : ''} onClick={() => setFiltro('cobrar')}>
          Por cobrar · {deudores.length}
        </button>
        <button className={filtro === 'pagar' ? 'activo' : ''} onClick={() => setFiltro('pagar')}>
          Por pagar · {porPagarLista.length}
        </button>
      </div>

      <label className="buscador">
        <Icono nombre="buscar" tam={20} />
        <input placeholder="Cliente o proveedor…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </label>

      {filtro !== 'pagar' && (
        <>
          <div className="seccion-titulo">
            <h2>Por cobrar</h2>
            <strong>{dinero(porCobrar)}</strong>
          </div>
          {listaClientes.length === 0 && (
            <p className="vacio">
              {clientes.length === 0 ? 'Aún no hay clientes. Toca “Nuevo cliente”.' : 'Nadie te debe plata. ¡Todo al día!'}
            </p>
          )}
          <ul className="lista">
            {listaClientes.map((c) => {
              const id = 'c:' + c.id
              const desplegado = abierto === id
              const pendientes = ventas
                .filter((v) => v.clienteId === c.id && v.pago === 'Fiado' && (saldos[v.id] || 0) > 0)
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
              const fiado = ventas.filter((v) => v.clienteId === c.id && v.pago === 'Fiado').reduce((s, v) => s + v.total, 0)
              const abonado = c.abonos.reduce((s, a) => s + a.monto, 0)

              return (
                <li key={c.id} className={'item' + (desplegado ? ' abierto' : '')}>
                  <button className="item-fila" onClick={() => abrir(id)}>
                    <span className="izq">
                      <strong className="item-nombre">{c.nombre}</strong>
                      <small className="muted">{c.telefono || 'Sin teléfono'}</small>
                    </span>
                    <span className="der">
                      <strong className="item-precio" style={{ color: c.deuda > 0 ? 'var(--rojo)' : 'var(--verde)' }}>
                        {dinero(c.deuda)}
                      </strong>
                      <span className={'insignia' + (c.deuda > 0 ? '' : ' negra')}>{c.deuda > 0 ? 'Por cobrar' : 'Al día'}</span>
                    </span>
                  </button>

                  {desplegado && (
                    <div className="detalle">
                      {pendientes.map((v) => (
                        <div key={v.id} className="fila-b">
                          <div style={{ display: 'grid' }}>
                            <strong>{codigoNumero('V', v.numero) || 'Venta'}</strong>
                            <small className="muted">
                              {fechaCorta(v.fecha)} · {v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')}
                            </small>
                          </div>
                          <strong>{dinero(saldos[v.id])}</strong>
                        </div>
                      ))}

                      <div className="lineas" style={{ borderTop: '1px solid var(--borde)' }}>
                        <div>
                          <span className="muted">Importe original</span>
                          <span>{dinero(fiado)}</span>
                        </div>
                        <div>
                          <span className="muted">Abonos recibidos</span>
                          <span>{dinero(abonado)}</span>
                        </div>
                        <div className="total">
                          <span>Saldo pendiente</span>
                          <span>{dinero(c.deuda)}</span>
                        </div>
                      </div>

                      {c.deuda > 0 && (
                        <>
                          <div className="chips-pago" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            {['Efectivo', 'Transferencia'].map((m) => (
                              <button key={m} className={medio === m ? 'activo' : ''} onClick={() => setMedio(m)}>
                                {m}
                              </button>
                            ))}
                          </div>
                          <div className="ajuste">
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              placeholder="¿Cuánto abonó?"
                              value={monto}
                              onChange={(e) => setMonto(e.target.value)}
                            />
                            <button className="btn-negro" style={{ width: 'auto', padding: '14px 18px' }} onClick={() => cobrar(c)}>
                              Registrar cobro
                            </button>
                          </div>
                          {error && <p className="error">{error}</p>}
                          {c.telefono && (
                            <a
                              className="btn-claro"
                              target="_blank"
                              rel="noreferrer"
                              href={linkWhatsapp(
                                c.telefono,
                                `Hola ${c.nombre}, te escribimos de Quality Shop. Tienes un saldo pendiente de ${dinero(c.deuda)}. ¡Gracias!`,
                              )}
                            >
                              <Icono nombre="enviar" tam={18} /> Enviar recordatorio
                            </a>
                          )}
                        </>
                      )}

                      <div className="fila-botones">
                        <button className="btn-claro" onClick={() => setFormCliente(c)}>
                          <Icono nombre="editar" tam={18} /> Editar
                        </button>
                        <button className="btn-peligro" onClick={() => borrar(c)}>
                          Borrar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {alDia.length > 0 && (
            <button className="btn-claro" onClick={() => setVerAlDia(!verAlDia)}>
              {verAlDia ? 'Ocultar clientes al día' : `Ver clientes al día (${alDia.length})`}
            </button>
          )}
        </>
      )}

      {filtro !== 'cobrar' && (
        <>
          <div className="seccion-titulo">
            <h2>Por pagar</h2>
            <strong>{dinero(porPagar)}</strong>
          </div>
          {listaPagar.length === 0 && <p className="vacio">No tienes pagos pendientes a proveedores.</p>}
          <ul className="lista">
            {listaPagar.map((c) => {
              const id = 'p:' + c.id
              const desplegado = abierto === id
              return (
                <li key={c.id} className={'item' + (desplegado ? ' abierto' : '')}>
                  <button className="item-fila" onClick={() => abrir(id)}>
                    <span className="izq">
                      <strong className="item-nombre">{c.proveedor || 'Sin proveedor'}</strong>
                      <small className="muted">
                        {codigoNumero('C', c.numero)} {c.factura ? `· Fact. ${c.factura} ` : ''}· {fechaCorta(c.fecha)}
                      </small>
                    </span>
                    <span className="der">
                      <strong className="item-precio">{dinero(saldoCompra(c))}</strong>
                      <span className="insignia">Por pagar</span>
                    </span>
                  </button>

                  {desplegado && (
                    <div className="detalle">
                      <div className="lineas">
                        <div>
                          <span className="muted">Total de la compra</span>
                          <span>{dinero(c.total)}</span>
                        </div>
                        <div>
                          <span className="muted">Pagado</span>
                          <span>{dinero(pagadoCompra(c))}</span>
                        </div>
                        <div className="total">
                          <span>Saldo pendiente</span>
                          <span>{dinero(saldoCompra(c))}</span>
                        </div>
                      </div>
                      <div className="chips-pago" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        {['Efectivo', 'Transferencia'].map((m) => (
                          <button key={m} className={medio === m ? 'activo' : ''} onClick={() => setMedio(m)}>
                            {m}
                          </button>
                        ))}
                      </div>
                      <div className="ajuste">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder="¿Cuánto pagaste?"
                          value={monto}
                          onChange={(e) => setMonto(e.target.value)}
                        />
                        <button className="btn-negro" style={{ width: 'auto', padding: '14px 18px' }} onClick={() => pagar(c)}>
                          Registrar pago
                        </button>
                      </div>
                      {error && <p className="error">{error}</p>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {porCobrar > 0 && (
        <div className="card">
          <h2 className="valor" style={{ fontSize: 20 }}>Antigüedad por cobrar</h2>
          <small>Según la fecha de cada venta a cuenta · {dinero(porCobrar)} pendientes</small>
          <div className="barra-apilada">
            {['t1', 't2', 't3'].map(
              (t) => edades[t] > 0 && <i key={t} className={t} style={{ flex: edades[t] }} />,
            )}
          </div>
          <div className="lineas">
            <div>
              <span><i className="punto t1" />De 0 a 7 días</span>
              <strong>{dinero(edades.t1)}</strong>
            </div>
            <div>
              <span><i className="punto t2" />De 8 a 30 días</span>
              <strong>{dinero(edades.t2)}</strong>
            </div>
            <div>
              <span><i className="punto t3" />Más de 30 días</span>
              <strong>{dinero(edades.t3)}</strong>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
