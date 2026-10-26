import { useState } from 'react'
import Icono from './Iconos.jsx'
import Periodo from './Periodo.jsx'
import Grafica from './Grafica.jsx'
import {
  bloquesVentas,
  deudaCliente,
  dinero,
  enPeriodo,
  esVenta,
  estadoVenta,
  etiquetaVenta,
  fechaHora,
  gananciaVenta,
  prendasVenta,
  saldoCompra,
  saldosFiado,
  STOCK_BAJO,
} from '../utils.js'

export default function Resumen({
  productos,
  compras,
  ventas,
  clientes,
  gastos,
  periodo,
  onPeriodo,
  irA,
  onNuevaVenta,
  meta,
  onMeta,
}) {
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [valorMeta, setValorMeta] = useState('')

  // Meta del mes: siempre del mes actual, sin importar el período elegido arriba
  const hoy = new Date()
  const vendidoMes = ventas.filter((v) => enPeriodo(v.fecha, 'mes')).reduce((s, v) => s + v.total, 0)
  const diasQuedan = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate() + 1
  const faltaMeta = Math.max(0, meta - vendidoMes)
  const avanceMeta = meta > 0 ? Math.min(100, (vendidoMes / meta) * 100) : 0

  const ventasP = ventas.filter((v) => enPeriodo(v.fecha, periodo))

  // Prendas que más se venden y mejores clientes del período
  const porProducto = {}
  ventasP.forEach((v) =>
    v.items.forEach((i) => {
      const p = (porProducto[i.nombre] ||= { nombre: i.nombre, unidades: 0, ingresos: 0 })
      p.unidades += i.cantidad
      p.ingresos += i.precio * i.cantidad
    }),
  )
  const masVendidos = Object.values(porProducto)
    .filter((p) => p.unidades > 0)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5)
  const maxUnidades = Math.max(1, ...masVendidos.map((p) => p.unidades))

  const porCliente = {}
  ventasP.filter((v) => v.clienteId).forEach((v) => (porCliente[v.clienteId] = (porCliente[v.clienteId] || 0) + v.total))
  const mejoresClientes = Object.entries(porCliente)
    .map(([id, total]) => ({ cliente: clientes.find((c) => c.id === id), total }))
    .filter((x) => x.cliente && x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
  const ingresos = ventasP.reduce((s, v) => s + v.total, 0)
  const prendas = ventasP.reduce((s, v) => s + prendasVenta(v), 0)
  const bruta = ventasP.reduce((s, v) => s + gananciaVenta(v), 0)
  const totalGastos = gastos.filter((g) => enPeriodo(g.fecha, periodo)).reduce((s, g) => s + g.monto, 0)
  const neta = bruta - totalGastos
  const margen = ingresos > 0 ? (neta / ingresos) * 100 : 0

  const variantes = productos.flatMap((p) => p.variantes)
  const unidades = variantes.reduce((s, v) => s + v.stock, 0)

  const saldos = saldosFiado(clientes, ventas)
  const deudores = clientes.filter((c) => deudaCliente(c, ventas) > 0)
  const porCobrar = deudores.reduce((s, c) => s + deudaCliente(c, ventas), 0)

  const porPagar = compras.reduce((s, c) => s + saldoCompra(c), 0)
  const proveedores = new Set(compras.filter((c) => saldoCompra(c) > 0).map((c) => c.proveedor || 'Sin proveedor'))

  const ultimas = ventas.slice(0, 3)
  const bajas = productos
    .flatMap((p) => p.variantes.filter((v) => v.stock <= STOCK_BAJO).map((v) => ({ p, v })))
    .sort((a, b) => a.v.stock - b.v.stock)
  const nombreCliente = (v) => clientes.find((c) => c.id === v.clienteId)?.nombre || 'Mostrador'

  return (
    <>
      <div>
        <p className="k">Resumen del negocio</p>
        <h1 className="titulo">Tu negocio, al día.</h1>
        <p className="subtitulo">Así viene Quality Shop.</p>
      </div>

      <Periodo periodo={periodo} onCambiar={onPeriodo} />

      <div className="hero">
        <span className="k">Ingresos por ventas</span>
        <span className="grande">{dinero(ingresos)}</span>
        <small>
          {ventasP.filter(esVenta).length} ventas · {prendas} prendas vendidas
        </small>
      </div>

      <div className="duo">
        <div className="card">
          <span className="k">Ganancia neta</span>
          <span className={'valor' + (neta < 0 ? ' alerta' : '')}>{dinero(neta)}</span>
          <small>Margen neto de {margen.toFixed(1).replace('.', ',')}%</small>
        </div>
        <div className="card">
          <span className="k">Stock disponible</span>
          <span className="valor">{unidades}</span>
          <small>
            {productos.length} modelos · {variantes.length} variantes
          </small>
        </div>
      </div>

      <button className="btn-negro" onClick={onNuevaVenta}>
        <Icono nombre="mas" tam={20} /> Nueva venta
      </button>

      {porCobrar > 0 && (
        <button className="card item-fila" style={{ background: 'var(--suave)', border: 0 }} onClick={() => irA('deudas')}>
          <Icono nombre="reloj" tam={26} />
          <span className="izq" style={{ flex: 1 }}>
            <strong>{dinero(porCobrar)} por cobrar</strong>
            <small>
              {deudores.length} {deudores.length === 1 ? 'cliente' : 'clientes'}
            </small>
          </span>
          <Icono nombre="flecha" tam={18} />
        </button>
      )}

      <div className="card" style={{ gap: 12 }}>
        <div className="fila-b">
          <div>
            <h2 className="valor" style={{ fontSize: 20 }}>Meta del mes</h2>
            <small>{meta > 0 ? `${dinero(vendidoMes)} de ${dinero(meta)}` : 'Ponte una meta de ventas y sigue tu avance'}</small>
          </div>
          <button
            className="insignia"
            style={{ border: 0, cursor: 'pointer' }}
            onClick={() => {
              setValorMeta(meta || '')
              setEditandoMeta(!editandoMeta)
            }}
          >
            {meta > 0 ? 'Cambiar' : 'Definir'}
          </button>
        </div>
        {editandoMeta && (
          <div className="ajuste">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Ej: 5000000"
              value={valorMeta}
              onChange={(e) => setValorMeta(e.target.value)}
            />
            <button
              className="btn-negro"
              style={{ width: 'auto', padding: '14px 18px' }}
              onClick={() => {
                onMeta(Math.max(0, Math.round(Number(valorMeta) || 0)))
                setEditandoMeta(false)
              }}
            >
              Guardar
            </button>
          </div>
        )}
        {meta > 0 && (
          <>
            <div className="pista" style={{ height: 12 }}>
              <div className="relleno" style={{ width: `${avanceMeta}%` }} />
            </div>
            <div className="fila-b">
              <strong>{avanceMeta.toFixed(0)}% de la meta</strong>
              <small>
                {faltaMeta > 0
                  ? `Faltan ${dinero(faltaMeta)} · ${dinero(faltaMeta / Math.max(1, diasQuedan))} por día`
                  : '¡Meta cumplida! 🎉'}
              </small>
            </div>
          </>
        )}
      </div>

      <div className="card" style={{ gap: 14 }}>
        <div>
          <h2 className="valor" style={{ fontSize: 20 }}>Ingresos y costos</h2>
          <small>{periodo === 'hoy' ? 'Hoy, por franjas de 4 horas' : periodo === 'todo' ? 'Últimos 6 meses' : 'Por períodos de 5 días'}</small>
        </div>
        <Grafica bloques={bloquesVentas(ventas, periodo)} />
        <div className="fila-b" style={{ borderTop: '1px solid var(--borde)', paddingTop: 12 }}>
          <strong>Ganancia bruta</strong>
          <strong>{dinero(bruta)}</strong>
        </div>
        <button className="btn-claro" onClick={() => irA('ganancias')}>
          <Icono nombre="ganancias" tam={18} /> Ver ganancias
        </button>
      </div>

      <div className="card" style={{ gap: 14 }}>
        <div>
          <h2 className="valor" style={{ fontSize: 20 }}>Últimas ventas</h2>
          <small>Movimientos más recientes</small>
        </div>
        {ultimas.length === 0 && <p className="vacio">Todavía no hay ventas.</p>}
        {ultimas.map((v) => (
          <div key={v.id} className="fila-b">
            <div style={{ display: 'grid' }}>
              <strong>{nombreCliente(v)}</strong>
              <small>
                {etiquetaVenta(v)} {etiquetaVenta(v) && '· '}
                {fechaHora(v.fecha)}
              </small>
            </div>
            <div style={{ display: 'grid', justifyItems: 'end', gap: 4 }}>
              <strong>{dinero(v.total)}</strong>
              <span className={'insignia' + (estadoVenta(v, saldos) === 'Cobrado' ? ' negra' : '')}>
                {estadoVenta(v, saldos)}
              </span>
            </div>
          </div>
        ))}
        <button className="btn-claro" onClick={() => irA('ventas')}>
          Ver todas las ventas
        </button>
      </div>

      {masVendidos.length > 0 && (
        <div className="card" style={{ gap: 14 }}>
          <div>
            <h2 className="valor" style={{ fontSize: 20 }}>Lo que más se vende</h2>
            <small>Prendas más vendidas del período</small>
          </div>
          {masVendidos.map((p) => (
            <div key={p.nombre} style={{ display: 'grid', gap: 6 }}>
              <div className="fila-b">
                <strong>{p.nombre}</strong>
                <small>
                  {p.unidades} {p.unidades === 1 ? 'prenda' : 'prendas'} · {dinero(p.ingresos)}
                </small>
              </div>
              <div className="pista">
                <div className="relleno" style={{ width: `${(p.unidades / maxUnidades) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {mejoresClientes.length > 0 && (
        <div className="card" style={{ gap: 12 }}>
          <div>
            <h2 className="valor" style={{ fontSize: 20 }}>Mejores clientes</h2>
            <small>Los que más compraron en el período</small>
          </div>
          {mejoresClientes.map((m, i) => (
            <div key={m.cliente.id} className="fila-b">
              <span>
                <strong>
                  {i + 1}. {m.cliente.nombre}
                </strong>
              </span>
              <strong>{dinero(m.total)}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ gap: 14 }}>
        <div>
          <h2 className="valor" style={{ fontSize: 20 }}>Atención al stock</h2>
          <small>
            {bajas.length === 0
              ? 'Todo en orden, nada por reponer.'
              : `${bajas.length} ${bajas.length === 1 ? 'variante' : 'variantes'} por debajo del mínimo`}
          </small>
        </div>
        {bajas.slice(0, 3).map(({ p, v }) => (
          <button key={p.id + v.id} className="item-fila" onClick={() => irA('inventario')}>
            <Icono nombre="alerta" tam={22} />
            <span className="izq" style={{ flex: 1 }}>
              <strong>{p.nombre}</strong>
              <small>
                {[v.color, v.talla].filter(Boolean).join(' · ')} · {v.stock <= 0 ? 'Sin stock' : `${v.stock} disponibles`}
              </small>
            </span>
            <Icono nombre="flecha" tam={18} />
          </button>
        ))}
        <button className="btn-claro" onClick={() => irA('inventario')}>
          <Icono nombre="inventario" tam={18} /> Revisar inventario
        </button>
      </div>

      {porPagar > 0 && (
        <div className="nota">
          <Icono nombre="info" tam={18} />
          <span>
            Tienes {dinero(porPagar)} por pagar a {proveedores.size} {proveedores.size === 1 ? 'proveedor' : 'proveedores'}.
          </span>
        </div>
      )}
    </>
  )
}
