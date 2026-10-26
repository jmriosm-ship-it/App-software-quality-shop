import { useState } from 'react'
import Icono from './Iconos.jsx'
import Periodo from './Periodo.jsx'
import Grafica from './Grafica.jsx'
import {
  bloquesVentas,
  costoVenta,
  dinero,
  enPeriodo,
  esVenta,
  fechaCorta,
  gananciaVenta,
  prendasVenta,
  saldosFiado,
  uid,
} from '../utils.js'

export default function Ganancias({ productos, ventas, clientes, gastos, periodo, onPeriodo, onGasto, onBorrarGasto }) {
  const [anadiendo, setAnadiendo] = useState(false)
  const [concepto, setConcepto] = useState('')
  const [montoGasto, setMontoGasto] = useState('')

  const ventasP = ventas.filter((v) => enPeriodo(v.fecha, periodo))
  const gastosP = gastos.filter((g) => enPeriodo(g.fecha, periodo))

  const ingresos = ventasP.reduce((s, v) => s + v.total, 0)
  const costo = ventasP.reduce((s, v) => s + costoVenta(v), 0)
  const bruta = ingresos - costo
  const totalGastos = gastosP.reduce((s, g) => s + g.monto, 0)
  const neta = bruta - totalGastos
  const margen = ingresos > 0 ? (neta / ingresos) * 100 : 0
  const prendas = ventasP.reduce((s, v) => s + prendasVenta(v), 0)
  const descuentos = ventasP.reduce((s, v) => s + (v.descuento || 0), 0)

  const saldos = saldosFiado(clientes, ventas)
  const porCobrarP = ventasP.reduce((s, v) => s + (saldos[v.id] || 0), 0)

  // Ganancia bruta por categoría (la categoría se toma del producto vendido)
  const categorias = {}
  ventasP.forEach((v) =>
    v.items.forEach((i) => {
      const nombre = productos.find((p) => p.id === i.productoId)?.categoria || 'Sin categoría'
      const c = (categorias[nombre] ||= { nombre, prendas: 0, ingresos: 0, costo: 0 })
      c.prendas += i.cantidad
      c.ingresos += i.precio * i.cantidad
      c.costo += i.costo * i.cantidad
    }),
  )
  const filas = Object.values(categorias).sort((a, b) => b.ingresos - b.costo - (a.ingresos - a.costo))
  const maxGanancia = Math.max(1, ...filas.map((f) => f.ingresos - f.costo))
  const totalCategorias = filas.reduce((s, f) => s + f.ingresos - f.costo, 0)

  function agregarGasto(e) {
    e.preventDefault()
    const monto = Number(montoGasto)
    if (!concepto.trim() || !(monto > 0)) return
    onGasto({ id: uid(), fecha: new Date().toISOString(), concepto: concepto.trim(), monto })
    setConcepto('')
    setMontoGasto('')
    setAnadiendo(false)
  }

  return (
    <>
      <div>
        <p className="k">Finanzas / rentabilidad</p>
        <h1 className="titulo">Ganancias</h1>
        <p className="subtitulo">Ingresos, costos y el resultado real.</p>
      </div>

      <Periodo periodo={periodo} onCambiar={onPeriodo} />

      <div className="hero">
        <span className="k">Ganancia neta</span>
        <span className="grande" style={neta < 0 ? { color: '#ff8a80' } : undefined}>{dinero(neta)}</span>
        <small>
          Margen neto: {margen.toFixed(1).replace('.', ',')}% · De cada $100, te quedan ${margen.toFixed(2).replace('.', ',')}
        </small>
      </div>

      <div className="card">
        <div>
          <h2 className="valor" style={{ fontSize: 20 }}>Cómo se calcula tu ganancia</h2>
          <small>Del ingreso al resultado neto</small>
        </div>
        <div className="lineas">
          <div>
            <span className="muted">Ingresos por ventas</span>
            <strong>{dinero(ingresos)}</strong>
          </div>
          <div>
            <small>
              {ventasP.filter(esVenta).length} ventas · {prendas} prendas
            </small>
          </div>
          <div>
            <span className="muted">− Costo de prendas vendidas</span>
            <strong>{dinero(costo)}</strong>
          </div>
          <div className="total">
            <span>= Ganancia bruta</span>
            <span>{dinero(bruta)}</span>
          </div>
          <div>
            <span className="muted">− Gastos operativos</span>
            <strong>{dinero(totalGastos)}</strong>
          </div>
        </div>
        <div className="resultado">
          <span>= Ganancia neta</span>
          <b className={neta < 0 ? 'alerta' : ''}>{dinero(neta)}</b>
        </div>
      </div>

      <div className="card" style={{ gap: 14 }}>
        <div>
          <h2 className="valor" style={{ fontSize: 20 }}>Ingresos vs. costos</h2>
          <small>{periodo === 'hoy' ? 'Hoy, por franjas de 4 horas' : periodo === 'todo' ? 'Últimos 6 meses' : 'Por períodos de 5 días'}</small>
        </div>
        <Grafica bloques={bloquesVentas(ventas, periodo)} />
        <div className="fila-b" style={{ borderTop: '1px solid var(--borde)', paddingTop: 12 }}>
          <small>La diferencia es la ganancia bruta: {dinero(bruta)}.</small>
        </div>
      </div>

      <div className="card" style={{ gap: 14 }}>
        <div>
          <h2 className="valor" style={{ fontSize: 20 }}>Ganancia bruta por categoría</h2>
          <small>Costo histórico · Sin gastos operativos</small>
        </div>
        {filas.length === 0 && <p className="vacio">No hay ventas en este período.</p>}
        {filas.map((f) => (
          <div key={f.nombre} style={{ display: 'grid', gap: 6, paddingBottom: 12, borderBottom: '1px solid var(--borde)' }}>
            <div className="fila-b">
              <div style={{ display: 'grid' }}>
                <strong>{f.nombre}</strong>
                <small>
                  {f.prendas} {f.prendas === 1 ? 'prenda vendida' : 'prendas vendidas'}
                </small>
              </div>
              <strong className="valor" style={{ fontSize: 20 }}>{dinero(f.ingresos - f.costo)}</strong>
            </div>
            <div className="pista">
              <div className="relleno" style={{ width: `${((f.ingresos - f.costo) / maxGanancia) * 100}%` }} />
            </div>
            <div className="fila-b">
              <small>Ingresos {dinero(f.ingresos)}</small>
              <small>Costo {dinero(f.costo)}</small>
            </div>
          </div>
        ))}
        {descuentos > 0 && (
          <div className="fila-b">
            <span className="muted">Descuentos dados</span>
            <strong>−{dinero(descuentos)}</strong>
          </div>
        )}
        {filas.length > 0 && (
          <div className="fila-b">
            <strong>
              Total · {prendas} {prendas === 1 ? 'prenda' : 'prendas'}
            </strong>
            <strong>{dinero(totalCategorias - descuentos)}</strong>
          </div>
        )}
      </div>

      <div className="card" style={{ gap: 14 }}>
        <div>
          <h2 className="valor" style={{ fontSize: 20 }}>Gastos operativos</h2>
          <small>
            {ingresos > 0 ? ((totalGastos / ingresos) * 100).toFixed(1).replace('.', ',') : '0'}% de los ingresos del período
          </small>
        </div>

        {gastosP.length === 0 && <p className="vacio">No hay gastos en este período.</p>}
        <div className="lineas">
          {gastosP.map((g) => (
            <div key={g.id}>
              <span style={{ display: 'grid' }}>
                <strong style={{ fontWeight: 500 }}>{g.concepto}</strong>
                <small>{fechaCorta(g.fecha)}</small>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong>{dinero(g.monto)}</strong>
                <button
                  className="btn-x"
                  style={{ width: 32, height: 32, fontSize: 16 }}
                  onClick={() => confirm('¿Borrar este gasto?') && onBorrarGasto(g.id)}
                  aria-label="Borrar gasto"
                >
                  ×
                </button>
              </span>
            </div>
          ))}
          <div className="total">
            <span>Total de gastos</span>
            <span>{dinero(totalGastos)}</span>
          </div>
        </div>

        {anadiendo ? (
          <form onSubmit={agregarGasto} className="form">
            <input
              className="campo"
              placeholder="Ej: Arriendo, servicios, bolsas…"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
            <input
              className="campo"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Valor"
              value={montoGasto}
              onChange={(e) => setMontoGasto(e.target.value)}
            />
            <div className="fila-botones">
              <button type="button" className="btn-claro" onClick={() => setAnadiendo(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-negro">
                Guardar gasto
              </button>
            </div>
          </form>
        ) : (
          <button className="btn-claro" onClick={() => setAnadiendo(true)}>
            <Icono nombre="mas" tam={18} /> Añadir gasto
          </button>
        )}
      </div>

      {porCobrarP > 0 && (
        <div className="nota">
          <Icono nombre="info" tam={18} />
          <span>
            La ganancia incluye {dinero(porCobrarP)} en ventas a cuenta que todavía no cobras. Las compras de stock no se
            restan completas: solo se reconoce el costo de las prendas vendidas.
          </span>
        </div>
      )}
    </>
  )
}
