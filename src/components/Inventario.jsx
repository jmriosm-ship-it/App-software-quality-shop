import { useState } from 'react'
import Icono from './Iconos.jsx'
import Foto from './Foto.jsx'
import Escaner from './Escaner.jsx'
import Etiquetas from './Etiquetas.jsx'
import Reponer from './Reponer.jsx'
import FormProducto from './FormProducto.jsx'
import ImportarInventario from './ImportarInventario.jsx'
import { codigoNumero, dinero, fechaCorta, stockTotal, STOCK_BAJO } from '../utils.js'

const POR_PAGINA = 20

export default function Inventario({ productos, compras, ventas, onGuardar, onBorrar, onAjustar, onImportar }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos') // todos | bajo | categorias
  const [categoria, setCategoria] = useState('')
  const [abierto, setAbierto] = useState(null) // id del producto desplegado
  const [seleccion, setSeleccion] = useState({}) // productoId -> varianteId elegida
  const [ajuste, setAjuste] = useState(null) // { varianteId, valor }
  const [editando, setEditando] = useState(null) // null = lista, {} = nuevo, producto = editar
  const [vista, setVista] = useState(null) // null | 'importar' | 'reponer' | { etiquetas: producto }
  const [escaneando, setEscaneando] = useState(false)
  const [limite, setLimite] = useState(POR_PAGINA)

  if (editando) {
    return (
      <FormProducto
        inicial={editando}
        onGuardar={(p) => {
          onGuardar(p)
          setEditando(null)
        }}
        onBorrar={(id) => {
          onBorrar(id)
          setEditando(null)
        }}
        onCancelar={() => setEditando(null)}
      />
    )
  }

  if (vista === 'importar') {
    return <ImportarInventario productos={productos} onImportar={onImportar} onVolver={() => setVista(null)} />
  }
  if (vista === 'reponer') {
    return <Reponer productos={productos} ventas={ventas} onVolver={() => setVista(null)} />
  }
  if (vista && vista.etiquetas) {
    return (
      <Etiquetas producto={vista.etiquetas} productos={productos} onGuardar={onGuardar} onVolver={() => setVista(null)} />
    )
  }

  const variantes = productos.flatMap((p) => p.variantes)
  const unidades = variantes.reduce((s, v) => s + v.stock, 0)
  const bajas = variantes.filter((v) => v.stock <= STOCK_BAJO).length
  const agotadas = variantes.filter((v) => v.stock <= 0).length
  const valorCosto = productos.reduce((s, p) => s + stockTotal(p) * p.costo, 0)
  const tieneBajo = (p) => p.variantes.some((v) => v.stock <= STOCK_BAJO)
  const nombreCategoria = (p) => p.categoria || 'Sin categoría'
  const categorias = [...new Set(productos.map(nombreCategoria))].sort()

  let lista = productos.filter((p) =>
    `${p.nombre} ${p.categoria} ${p.codigo || ''} ${p.variantes.map((v) => `${v.color} ${v.talla} ${v.codigo || ''}`).join(' ')}`
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  )
  if (filtro === 'bajo') lista = lista.filter(tieneBajo)
  if (filtro === 'categorias' && categoria) lista = lista.filter((p) => nombreCategoria(p) === categoria)

  const ultimaEntrada = (p, v) =>
    compras
      .filter((c) => c.items.some((i) => i.productoId === p.id && i.varianteId === v.id))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]

  // Al escanear un código se busca la talla o el producto y se abre su detalle
  function alEscanear(codigo) {
    const c = codigo.trim().toLowerCase()
    for (const p of productos) {
      const v = p.variantes.find((x) => (x.codigo || '').toLowerCase() === c)
      if (v) {
        setFiltro('todos')
        setBusqueda(p.nombre)
        setAbierto(p.id)
        setSeleccion((s) => ({ ...s, [p.id]: v.id }))
        setAjuste(null)
        return `${p.nombre} · ${[v.color, v.talla].filter(Boolean).join(' ')}`
      }
    }
    const p = productos.find((x) => (x.codigo || '').toLowerCase() === c)
    if (p) {
      setFiltro('todos')
      setBusqueda(p.nombre)
      setAbierto(p.id)
      return p.nombre
    }
    return 'No encontré ese código en tu inventario'
  }

  return (
    <>
      {escaneando && <Escaner titulo="Buscar por código" onLeer={alEscanear} onCerrar={() => setEscaneando(false)} />}

      <div>
        <p className="k">Productos / existencias</p>
        <h1 className="titulo">Inventario</h1>
        <p className="subtitulo">Cada prenda, color y talla bajo control.</p>
      </div>

      <div className="duo">
        <div className="card">
          <span className="k">Prendas disponibles</span>
          <span className="valor">{unidades}</span>
          <small>
            {productos.length} modelos · {variantes.length} variantes
          </small>
        </div>
        <div className="card oscura">
          <span className="k">Stock bajo</span>
          <span className="valor">
            {bajas} {bajas === 1 ? 'variante' : 'variantes'}
          </span>
          <small>
            {agotadas} {agotadas === 1 ? 'variante sin existencias' : 'variantes sin existencias'}
          </small>
        </div>
      </div>

      <div className="fila-b" style={{ padding: '0 4px' }}>
        <span className="muted">Valor a costo</span>
        <strong>{dinero(valorCosto)}</strong>
      </div>

      <button className="btn-negro" onClick={() => setEditando({})}>
        <Icono nombre="mas" tam={20} /> Nuevo producto
      </button>

      <div className="fila-botones">
        <button className="btn-claro" onClick={() => setVista('importar')}>
          <Icono nombre="subir" tam={18} /> Importar Excel
        </button>
        <button className="btn-claro" onClick={() => setVista('reponer')}>
          <Icono nombre="compras" tam={18} /> Lista para reponer
        </button>
      </div>

      <div className="fila-buscar">
        <label className="buscador">
          <Icono nombre="buscar" tam={20} />
          <input placeholder="Buscar producto, color o código…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <button className="icono-boton claro" onClick={() => setEscaneando(true)} aria-label="Escanear código">
          <Icono nombre="escanear" tam={22} />
        </button>
      </div>

      <div className="segmentos">
        <button className={filtro === 'todos' ? 'activo' : ''} onClick={() => setFiltro('todos')}>
          Todos · {productos.length}
        </button>
        <button className={filtro === 'bajo' ? 'activo' : ''} onClick={() => setFiltro('bajo')}>
          Stock bajo · {productos.filter(tieneBajo).length}
        </button>
        <button className={filtro === 'categorias' ? 'activo' : ''} onClick={() => setFiltro('categorias')}>
          Categorías
        </button>
      </div>

      {filtro === 'categorias' && (
        <div className="chips-filtro">
          <button className={categoria === '' ? 'activo' : ''} onClick={() => setCategoria('')}>
            Todas
          </button>
          {categorias.map((c) => (
            <button key={c} className={categoria === c ? 'activo' : ''} onClick={() => setCategoria(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="seccion-titulo">
        <h2>Productos</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {lista.length} {lista.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {lista.length === 0 && (
        <p className="vacio">
          {productos.length === 0
            ? 'Aún no hay productos. Crea el primero o impórtalos todos desde Excel.'
            : 'Sin resultados.'}
        </p>
      )}

      <ul className="lista">
        {lista.slice(0, limite).map((p) => {
          const desplegado = abierto === p.id
          const vSel = p.variantes.find((v) => v.id === seleccion[p.id]) || p.variantes[0]
          const entrada = desplegado && vSel ? ultimaEntrada(p, vSel) : null
          const margen = p.precio > 0 ? ((p.precio - p.costo) / p.precio) * 100 : 0
          const total = stockTotal(p)

          return (
            <li key={p.id} className={'item' + (desplegado ? ' abierto' : '')}>
              <button className="item-cabeza" onClick={() => setAbierto(desplegado ? null : p.id)}>
                <Foto id={p.id} nombre={p.nombre} />
                <span className="item-info">
                  <strong className="item-nombre">{p.nombre}</strong>
                  <span className="item-sub">{[p.codigo, nombreCategoria(p)].filter(Boolean).join(' · ')}</span>
                  <strong className="item-precio">{dinero(p.precio)}</strong>
                  <span className="item-sub">
                    Costo {dinero(p.costo)} · {total === 0 ? 'Agotado' : `${total} uds`}
                  </span>
                </span>
                <Icono nombre={desplegado ? 'arriba' : 'flecha'} tam={18} />
              </button>

              <div className="celdas">
                {p.variantes.map((v) => (
                  <button
                    key={v.id}
                    className={'celda' + (v.stock <= STOCK_BAJO ? ' bajo' : '') + (desplegado && vSel.id === v.id ? ' sel' : '')}
                    onClick={() => {
                      setAbierto(p.id)
                      setSeleccion({ ...seleccion, [p.id]: v.id })
                      setAjuste(null)
                    }}
                  >
                    <small>{[v.talla, v.color].filter(Boolean).join(' · ')}</small>
                    <b>{v.stock}</b>
                  </button>
                ))}
              </div>

              {desplegado && vSel && (
                <div className="detalle">
                  <div className="fila-b">
                    <strong>{[vSel.color, vSel.talla].filter(Boolean).join(' / ')}</strong>
                    {vSel.stock <= 0 ? (
                      <span className="insignia roja">Agotado</span>
                    ) : (
                      vSel.stock <= STOCK_BAJO && <span className="insignia">Stock bajo</span>
                    )}
                  </div>
                  <div className="fila-b">
                    <strong>Stock disponible</strong>
                    <strong>
                      {vSel.stock} {vSel.stock === 1 ? 'prenda' : 'prendas'}
                    </strong>
                  </div>
                  <div className="fila-b muted">
                    <span>Margen bruto</span>
                    <strong style={{ color: 'var(--negro)' }}>{margen.toFixed(1).replace('.', ',')}%</strong>
                  </div>
                  {vSel.codigo && (
                    <div className="fila-b muted">
                      <span>Código</span>
                      <strong style={{ color: 'var(--negro)' }}>{vSel.codigo}</strong>
                    </div>
                  )}

                  {entrada && (
                    <div className="nota">
                      <Icono nombre="info" tam={18} />
                      <span>
                        Última entrada: {fechaCorta(entrada.fecha)}
                        {entrada.numero ? ` · Compra ${codigoNumero('C', entrada.numero)}` : ''}.
                        {entrada.proveedor ? ` Proveedor: ${entrada.proveedor}.` : ''}
                      </span>
                    </div>
                  )}

                  {ajuste && ajuste.varianteId === vSel.id ? (
                    <>
                      <div className="ajuste">
                        <button
                          className="mas-menos"
                          onClick={() => setAjuste({ ...ajuste, valor: Math.max(0, Number(ajuste.valor) - 1) })}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={ajuste.valor}
                          onChange={(e) => setAjuste({ ...ajuste, valor: e.target.value })}
                        />
                        <button className="mas-menos" onClick={() => setAjuste({ ...ajuste, valor: Number(ajuste.valor) + 1 })}>
                          +
                        </button>
                      </div>
                      <div className="fila-botones">
                        <button className="btn-claro" onClick={() => setAjuste(null)}>
                          Cancelar
                        </button>
                        <button
                          className="btn-negro"
                          onClick={() => {
                            onAjustar(p.id, vSel.id, Math.floor(Number(ajuste.valor) || 0))
                            setAjuste(null)
                          }}
                        >
                          Guardar stock
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="fila-botones">
                        <button className="btn-claro" onClick={() => setAjuste({ varianteId: vSel.id, valor: vSel.stock })}>
                          <Icono nombre="ajustes" tam={18} /> Ajustar stock
                        </button>
                        <button className="btn-claro" onClick={() => setEditando(p)}>
                          <Icono nombre="editar" tam={18} /> Editar
                        </button>
                      </div>
                      <button className="btn-claro" onClick={() => setVista({ etiquetas: p })}>
                        <Icono nombre="escanear" tam={18} /> Etiquetas con código QR
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {lista.length > limite && (
        <button className="btn-claro" onClick={() => setLimite(limite + POR_PAGINA)}>
          <Icono nombre="abajo" tam={18} /> Cargar más productos
        </button>
      )}

      <div className="nota">
        <Icono nombre="info" tam={18} />
        <span>
          Stock bajo: {STOCK_BAJO} prendas o menos. Toca una talla para ver y ajustar sus existencias. Las copias de seguridad
          están al final del Resumen.
        </span>
      </div>
    </>
  )
}
