import { useState } from 'react'
import Icono from './Iconos.jsx'
import { dinero, mismoDia, pagoInicialCompra, pagosCompra, uid } from '../utils.js'

const hoyTexto = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Cierre de caja: cuánto efectivo debería haber al final del día y cuánto hay de verdad
export default function Caja({ ventas, compras, clientes, gastos, cierres, onGuardar, onVolver }) {
  const [fecha, setFecha] = useState(hoyTexto())
  const [base, setBase] = useState('')
  const [contado, setContado] = useState('')
  const [guardado, setGuardado] = useState(false)

  const [anio, mes, dia] = fecha.split('-').map(Number)
  const dia0 = new Date(anio, mes - 1, dia)

  const ventasDia = ventas.filter((v) => mismoDia(v.fecha, dia0))
  const suma = (lista, medio) => lista.filter((v) => v.pago === medio).reduce((s, v) => s + v.total, 0)
  const efectivoVentas = suma(ventasDia, 'Efectivo')
  const transferVentas = suma(ventasDia, 'Transferencia')
  const fiadoVentas = suma(ventasDia, 'Fiado')

  // Abonos de clientes recibidos ese día (los viejos sin "medio" se toman como efectivo)
  const abonos = clientes.flatMap((c) => c.abonos.filter((a) => mismoDia(a.fecha, dia0)).map((a) => ({ ...a, cliente: c.nombre })))
  const abonosEfectivo = abonos.filter((a) => (a.medio || 'Efectivo') === 'Efectivo').reduce((s, a) => s + a.monto, 0)
  const abonosTransfer = abonos.filter((a) => a.medio === 'Transferencia').reduce((s, a) => s + a.monto, 0)

  // Pagos a proveedores ese día
  const pagosProv = compras.flatMap((c) => {
    const lista = []
    const inicial = pagoInicialCompra(c)
    if (inicial > 0 && mismoDia(c.fecha, dia0)) lista.push({ monto: inicial, medio: c.medioPago || 'Efectivo', proveedor: c.proveedor })
    pagosCompra(c)
      .filter((p) => mismoDia(p.fecha, dia0))
      .forEach((p) => lista.push({ monto: p.monto, medio: p.medio || 'Efectivo', proveedor: c.proveedor }))
    return lista
  })
  const provEfectivo = pagosProv.filter((p) => p.medio === 'Efectivo').reduce((s, p) => s + p.monto, 0)
  const provTransfer = pagosProv.filter((p) => p.medio === 'Transferencia').reduce((s, p) => s + p.monto, 0)

  const gastosEfectivo = gastos.filter((g) => mismoDia(g.fecha, dia0)).reduce((s, g) => s + g.monto, 0)

  const baseNum = Number(base) || 0
  const esperado = baseNum + efectivoVentas + abonosEfectivo - gastosEfectivo - provEfectivo
  const hayContado = contado !== ''
  const diferencia = (Number(contado) || 0) - esperado
  const enBanco = transferVentas + abonosTransfer - provTransfer

  const cierreDelDia = cierres.find((c) => mismoDia(c.fecha, dia0))

  function guardar() {
    onGuardar({ id: uid(), fecha: dia0.toISOString(), base: baseNum, esperado, contado: Number(contado) || 0, diferencia })
    setGuardado(true)
  }

  const Fila = ({ texto, valor, signo }) => (
    <div>
      <span className="muted">{texto}</span>
      <strong>
        {signo}
        {dinero(valor)}
      </strong>
    </div>
  )

  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver a ventas
      </button>
      <div>
        <h1 className="titulo">Cierre de caja</h1>
        <p className="subtitulo">Cuenta el efectivo y mira si cuadra.</p>
      </div>

      <label className="campo-g">
        <span className="k">Día</span>
        <input
          className="campo"
          type="date"
          value={fecha}
          max={hoyTexto()}
          onChange={(e) => {
            setFecha(e.target.value || hoyTexto())
            setGuardado(false)
          }}
        />
      </label>

      <div className="card">
        <h2 className="valor" style={{ fontSize: 18 }}>Efectivo que debería haber</h2>
        <label className="campo-g">
          <span className="k">Base con la que abrió la caja (opcional)</span>
          <input className="campo" type="number" inputMode="numeric" min="0" placeholder="Ej: 50000" value={base} onChange={(e) => setBase(e.target.value)} />
        </label>
        <div className="lineas">
          <Fila texto="Base de la caja" valor={baseNum} signo="" />
          <Fila texto="Ventas en efectivo" valor={efectivoVentas} signo="+ " />
          <Fila texto="Abonos de clientes en efectivo" valor={abonosEfectivo} signo="+ " />
          <Fila texto="Gastos pagados" valor={gastosEfectivo} signo="− " />
          <Fila texto="Pagos a proveedores en efectivo" valor={provEfectivo} signo="− " />
        </div>
        <div className="resultado">
          <span>Debería haber</span>
          <b>{dinero(esperado)}</b>
        </div>
      </div>

      <div className="card">
        <h2 className="valor" style={{ fontSize: 18 }}>¿Cuánto efectivo hay?</h2>
        <input
          className="campo"
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Cuenta los billetes y monedas"
          value={contado}
          onChange={(e) => {
            setContado(e.target.value)
            setGuardado(false)
          }}
        />
        {hayContado && (
          <div
            className="resultado"
            style={{
              background: diferencia === 0 ? '#e6f4ea' : diferencia > 0 ? '#fdecc8' : '#f9d6d3',
              color: diferencia === 0 ? 'var(--verde)' : diferencia > 0 ? '#7a5400' : 'var(--rojo)',
            }}
          >
            <span>{diferencia === 0 ? 'La caja cuadra' : diferencia > 0 ? 'Sobra plata' : 'Falta plata'}</span>
            <b>{diferencia === 0 ? '✓' : dinero(Math.abs(diferencia))}</b>
          </div>
        )}
        <button className="btn-negro" onClick={guardar} disabled={!hayContado || guardado}>
          {guardado ? 'Cierre guardado' : cierreDelDia ? 'Guardar de nuevo este cierre' : 'Guardar cierre'}
        </button>
      </div>

      <div className="card">
        <h2 className="valor" style={{ fontSize: 18 }}>Otros movimientos del día</h2>
        <div className="lineas">
          <Fila texto="Transferencias recibidas (ventas)" valor={transferVentas} signo="" />
          <Fila texto="Abonos por transferencia" valor={abonosTransfer} signo="" />
          <Fila texto="Pagos a proveedores por transferencia" valor={provTransfer} signo="− " />
          <div className="total">
            <span>Movimiento en el banco</span>
            <span>{dinero(enBanco)}</span>
          </div>
          <Fila texto="Vendido a cuenta (fiado)" valor={fiadoVentas} signo="" />
        </div>
        <small>{ventasDia.length} movimientos de venta ese día.</small>
      </div>

      {cierres.length > 0 && (
        <>
          <div className="seccion-titulo">
            <h2>Cierres anteriores</h2>
          </div>
          <ul className="lista">
            {cierres.slice(0, 7).map((c) => (
              <li key={c.id} className="item">
                <div className="item-fila">
                  <span className="izq">
                    <strong>{new Date(c.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}</strong>
                    <small className="muted">
                      Debía haber {dinero(c.esperado)} · hubo {dinero(c.contado)}
                    </small>
                  </span>
                  <span className={'insignia' + (c.diferencia === 0 ? ' negra' : c.diferencia < 0 ? ' roja' : '')}>
                    {c.diferencia === 0 ? 'Cuadró' : c.diferencia < 0 ? `Faltó ${dinero(-c.diferencia)}` : `Sobró ${dinero(c.diferencia)}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
