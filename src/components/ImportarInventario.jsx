import { useState } from 'react'
import Icono from './Iconos.jsx'
import { dinero } from '../utils.js'
import { descargarTexto, inventarioACsv, leerInventario, plantillaCsv, resumenImportacion } from '../importar.js'

// Pantalla para cargar el inventario desde un archivo de Excel o CSV
export default function ImportarInventario({ productos, onImportar, onVolver }) {
  const [leido, setLeido] = useState(null) // { productos, avisos }
  const [archivo, setArchivo] = useState('')
  const [error, setError] = useState('')
  const [leyendo, setLeyendo] = useState(false)
  const [listo, setListo] = useState('')

  async function elegir(e) {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    setError('')
    setListo('')
    setLeido(null)
    setLeyendo(true)
    try {
      setLeido(await leerInventario(f))
      setArchivo(f.name)
    } catch (err) {
      setError(err.message || 'No se pudo leer el archivo.')
    }
    setLeyendo(false)
  }

  const resumen = leido ? resumenImportacion(leido.productos, productos) : null

  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver al inventario
      </button>
      <div>
        <h1 className="titulo">Importar inventario</h1>
        <p className="subtitulo">Carga muchas prendas de una vez desde Excel.</p>
      </div>

      <div className="card">
        <h2 className="valor" style={{ fontSize: 18 }}>Cómo hacerlo</h2>
        <ol className="pasos">
          <li>Descarga la plantilla y ábrela en Excel o Google Sheets.</li>
          <li>Una fila por cada talla y color. Llena Producto, Talla, Color, Cantidad, Costo y Precio.</li>
          <li>Guárdala como Excel (.xlsx) o CSV y súbela aquí.</li>
        </ol>
        <button className="btn-claro" onClick={() => descargarTexto('plantilla-inventario.csv', plantillaCsv())}>
          <Icono nombre="descargar" tam={18} /> Descargar plantilla
        </button>
        <label className="btn-negro" style={{ cursor: 'pointer' }}>
          <Icono nombre="subir" tam={18} /> {leyendo ? 'Leyendo…' : 'Elegir archivo'}
          <input type="file" accept=".xlsx,.csv,.txt,text/csv" onChange={elegir} hidden />
        </label>
      </div>

      {error && <div className="nota" style={{ background: '#f9d6d3', color: 'var(--rojo)' }}><Icono nombre="alerta" tam={18} /> <span>{error}</span></div>}

      {leido && (
        <>
          <div className="card">
            <h2 className="valor" style={{ fontSize: 18 }}>Revisa antes de importar</h2>
            <small>{archivo}</small>
            <div className="lineas">
              <div><span className="muted">Productos nuevos</span><strong>{resumen.nuevos}</strong></div>
              <div><span className="muted">Productos que se actualizan</span><strong>{resumen.actualizados}</strong></div>
              <div><span className="muted">Tallas y colores</span><strong>{resumen.variantes}</strong></div>
              <div className="total"><span>Prendas en total</span><span>{resumen.unidades}</span></div>
            </div>
            {resumen.actualizados > 0 && (
              <div className="nota">
                <Icono nombre="info" tam={18} />
                <span>
                  Los productos que ya existen se actualizan: el stock, el precio y el costo quedan como dice el archivo.
                </span>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="valor" style={{ fontSize: 18 }}>Vista previa</h2>
            {leido.productos.slice(0, 6).map((p) => (
              <div key={p.nombre} className="fila-b">
                <div style={{ display: 'grid' }}>
                  <strong>{p.nombre}</strong>
                  <small>
                    {p.variantes.length} {p.variantes.length === 1 ? 'variante' : 'variantes'} ·{' '}
                    {p.variantes.reduce((s, v) => s + v.stock, 0)} uds
                  </small>
                </div>
                <strong>{dinero(p.precio)}</strong>
              </div>
            ))}
            {leido.productos.length > 6 && <small>y {leido.productos.length - 6} productos más…</small>}
          </div>

          {leido.avisos.length > 0 && (
            <div className="nota">
              <Icono nombre="info" tam={18} />
              <span>{leido.avisos.slice(0, 6).join(' ')} {leido.avisos.length > 6 ? `(y ${leido.avisos.length - 6} avisos más)` : ''}</span>
            </div>
          )}

          <button
            className="btn-negro"
            onClick={() => {
              onImportar(leido.productos)
              setListo(`Listo: ${resumen.nuevos} productos nuevos y ${resumen.actualizados} actualizados.`)
              setLeido(null)
            }}
          >
            Importar {leido.productos.length} productos
          </button>
        </>
      )}

      {listo && <div className="aviso-ok">{listo}</div>}

      <div className="seccion-titulo"><h2>Exportar</h2></div>
      <div className="card">
        <p className="muted">Descarga todo tu inventario en un archivo para abrirlo en Excel. Sirve de respaldo y para llevar cuentas.</p>
        <button
          className="btn-claro"
          disabled={productos.length === 0}
          onClick={() => descargarTexto(`inventario-${new Date().toISOString().slice(0, 10)}.csv`, inventarioACsv(productos))}
        >
          <Icono nombre="descargar" tam={18} /> Exportar inventario a Excel
        </button>
      </div>
    </>
  )
}
