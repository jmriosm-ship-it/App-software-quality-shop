import { useRef, useState } from 'react'
import Icono from './Iconos.jsx'
import Escaner from './Escaner.jsx'
import { borrarFoto, comprimirImagen, guardarFoto, useFoto } from '../fotos.js'
import { fotoCambiada } from '../fotosNube.js'
import { uid } from '../utils.js'

const CATEGORIAS = ['Camisetas', 'Pantalones', 'Chaquetas', 'Zapatos', 'Gorras', 'Accesorios']

const varianteVacia = () => ({ id: uid(), talla: '', color: '', stock: 1, codigo: '' })

export default function FormProducto({ inicial, onGuardar, onBorrar, onCancelar }) {
  const esNuevo = !inicial.id
  const id = useRef(inicial.id || uid()).current
  const fotoGuardada = useFoto(id)
  const [fotoNueva, setFotoNueva] = useState(undefined) // undefined = sin cambios, texto = foto nueva, null = quitar
  const [nombre, setNombre] = useState(inicial.nombre || '')
  const [codigo, setCodigo] = useState(inicial.codigo || '')
  const [categoria, setCategoria] = useState(inicial.categoria || '')
  const [precio, setPrecio] = useState(inicial.precio ?? '')
  const [costo, setCosto] = useState(inicial.costo ?? '')
  const [variantes, setVariantes] = useState(inicial.variantes || [varianteVacia()])
  const [escaneando, setEscaneando] = useState(null) // id de la talla cuyo código se está escaneando
  const [error, setError] = useState('')

  const foto = fotoNueva === undefined ? fotoGuardada : fotoNueva

  async function elegirFoto(e) {
    const archivo = e.target.files[0]
    e.target.value = ''
    if (!archivo) return
    try {
      setFotoNueva(await comprimirImagen(archivo))
    } catch {
      setError('No se pudo leer esa foto. Prueba con otra.')
    }
  }

  function cambiarVariante(vid, campo, valor) {
    setVariantes((lista) => lista.map((v) => (v.id === vid ? { ...v, [campo]: valor } : v)))
  }

  async function guardar(e) {
    e.preventDefault()
    if (!nombre.trim()) return setError('Escribe el nombre del producto.')
    if (!(Number(precio) > 0)) return setError('Escribe el precio de venta.')
    const validas = variantes.filter((v) => v.talla.trim() || v.color.trim())
    if (validas.length === 0) return setError('Agrega al menos una talla o color.')

    const codigos = validas.map((v) => (v.codigo || '').trim()).filter(Boolean)
    if (new Set(codigos).size !== codigos.length) return setError('Hay dos tallas con el mismo código de barras.')

    // la foto se guarda aparte (no cabe en la memoria normal del celular) y se anota en el producto
    // cuándo cambió, para que la nube y los demás celulares se enteren
    let tieneFoto = Boolean(inicial.foto)
    let fotoT = inicial.fotoT || 0
    if (fotoNueva !== undefined) {
      try {
        if (fotoNueva) await guardarFoto(id, fotoNueva)
        else await borrarFoto(id)
      } catch {
        return setError('No se pudo guardar la foto. Intenta de nuevo.')
      }
      tieneFoto = Boolean(fotoNueva)
      fotoT = Date.now()
      fotoCambiada(id, fotoT)
    }

    onGuardar({
      id,
      foto: tieneFoto,
      fotoT,
      nombre: nombre.trim(),
      codigo: codigo.trim(),
      categoria,
      precio: Number(precio),
      costo: Number(costo) || 0,
      variantes: validas.map((v) => ({
        ...v,
        talla: v.talla.trim(),
        color: v.color.trim(),
        codigo: (v.codigo || '').trim(),
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      })),
    })
  }

  return (
    <form onSubmit={guardar} className="form">
      {escaneando && (
        <Escaner
          titulo="Escanea el código de esta talla"
          onLeer={(c) => {
            cambiarVariante(escaneando, 'codigo', c)
            setEscaneando(null)
          }}
          onCerrar={() => setEscaneando(null)}
        />
      )}

      <button type="button" className="volver" onClick={onCancelar}>
        <Icono nombre="atras" tam={20} /> Volver
      </button>
      <h1 className="titulo">{esNuevo ? 'Nuevo producto' : 'Editar producto'}</h1>

      <div className="foto-editar">
        {foto ? <img className="foto" src={foto} alt="Foto del producto" style={{ width: 96, height: 96, objectFit: 'cover' }} /> : <span className="foto" style={{ width: 96, height: 96 }}><Icono nombre="camara" tam={32} /></span>}
        <div style={{ display: 'grid', gap: 8, flex: 1 }}>
          <label className="btn-claro" style={{ cursor: 'pointer' }}>
            <Icono nombre="camara" tam={18} /> {foto ? 'Cambiar foto' : 'Tomar o elegir foto'}
            <input type="file" accept="image/*" onChange={elegirFoto} hidden />
          </label>
          {foto && (
            <button type="button" className="btn-claro" onClick={() => setFotoNueva(null)}>
              Quitar foto
            </button>
          )}
        </div>
      </div>

      <label className="campo-g">
        <span className="k">Nombre</span>
        <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Camiseta oversize" />
      </label>

      <div className="dos-campos">
        <label className="campo-g">
          <span className="k">Código (opcional)</span>
          <input className="campo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: RB-NEG" />
        </label>
        <label className="campo-g">
          <span className="k">Categoría</span>
          <input
            className="campo"
            list="categorias"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Elige o escribe"
          />
          <datalist id="categorias">
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="dos-campos">
        <label className="campo-g">
          <span className="k">Precio de venta</span>
          <input className="campo" type="number" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
        <label className="campo-g">
          <span className="k">Costo (lo que pagas)</span>
          <input className="campo" type="number" inputMode="numeric" value={costo} onChange={(e) => setCosto(e.target.value)} />
        </label>
      </div>

      <span className="k">Talla · color · cantidad</span>
      {variantes.map((v) => (
        <div key={v.id} className="variante-bloque">
          <div className="variante">
            <input className="campo" placeholder="Talla" value={v.talla} onChange={(e) => cambiarVariante(v.id, 'talla', e.target.value)} />
            <input className="campo" placeholder="Color" value={v.color} onChange={(e) => cambiarVariante(v.id, 'color', e.target.value)} />
            <input
              className="campo corto"
              type="number"
              inputMode="numeric"
              min="0"
              value={v.stock}
              onChange={(e) => cambiarVariante(v.id, 'stock', e.target.value)}
            />
            <button type="button" className="btn-x" onClick={() => setVariantes((l) => l.filter((x) => x.id !== v.id))} aria-label="Quitar">
              ×
            </button>
          </div>
          <div className="variante">
            <input
              className="campo"
              placeholder="Código de barras o QR (opcional)"
              value={v.codigo || ''}
              onChange={(e) => cambiarVariante(v.id, 'codigo', e.target.value)}
            />
            <button type="button" className="btn-x" onClick={() => setEscaneando(v.id)} aria-label="Escanear código">
              <Icono nombre="escanear" tam={20} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-claro" onClick={() => setVariantes((l) => [...l, varianteVacia()])}>
        <Icono nombre="mas" tam={18} /> Agregar talla / color
      </button>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn-negro">
        Guardar producto
      </button>

      {!esNuevo && (
        <button
          type="button"
          className="btn-peligro"
          onClick={() => confirm('¿Borrar este producto? No se puede deshacer.') && onBorrar(inicial.id)}
        >
          Borrar producto
        </button>
      )}
    </form>
  )
}
