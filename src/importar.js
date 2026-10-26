// Lectura de inventario desde Excel (.xlsx) o CSV, y exportación en el mismo formato.
// Formato: una fila por talla/color. Las filas con el mismo "Producto" se agrupan en un solo producto.
import { readSheet } from 'read-excel-file/universal'

export const ENCABEZADOS = ['Producto', 'Categoría', 'Código', 'Talla', 'Color', 'Cantidad', 'Costo', 'Precio', 'Código de barras']

const BOM = String.fromCharCode(0xfeff) // marca que le dice a Excel que el archivo está en UTF-8 (para que salgan las tildes)

const sinTildes = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

// Nombres con los que puede venir cada columna (sin tildes ni mayúsculas)
const ALIAS = {
  nombre: ['producto', 'nombre', 'articulo', 'prenda', 'descripcion', 'item'],
  categoria: ['categoria', 'tipo', 'linea'],
  codigo: ['codigo', 'sku', 'referencia', 'ref'],
  talla: ['talla', 'size', 'medida', 'tamano'],
  color: ['color'],
  cantidad: ['cantidad', 'stock', 'existencias', 'unidades', 'inventario', 'cant'],
  costo: ['costo', 'costo unitario', 'precio compra', 'precio de compra', 'compra'],
  precio: ['precio', 'precio venta', 'precio de venta', 'venta', 'pvp', 'valor'],
  barras: ['codigo de barras', 'codigo barras', 'barras', 'ean', 'qr'],
}

function numero(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  const texto = String(valor ?? '').trim()
  if (/^\d+[.,]\d{1,2}$/.test(texto)) return parseFloat(texto.replace(',', '.')) // 12,5 -> 12.5
  return Number(texto.replace(/[^\d-]/g, '')) || 0 // "$ 45.000" -> 45000
}

const texto = (v) => String(v ?? '').trim()

// ---------- CSV ----------
function leerCsv(contenido) {
  const sinBom = contenido.replace(new RegExp('^' + BOM), '')
  const primera = sinBom.split(/\r?\n/)[0] || ''
  const separador = [';', ',', '\t'].map((s) => [s, primera.split(s).length]).sort((a, b) => b[1] - a[1])[0][0]

  const filas = []
  let fila = []
  let campo = ''
  let comillas = false
  for (let i = 0; i < sinBom.length; i++) {
    const c = sinBom[i]
    if (comillas) {
      if (c === '"') {
        if (sinBom[i + 1] === '"') {
          campo += '"'
          i++
        } else comillas = false
      } else campo += c
    } else if (c === '"') comillas = true
    else if (c === separador) {
      fila.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && sinBom[i + 1] === '\n') i++
      fila.push(campo)
      campo = ''
      filas.push(fila)
      fila = []
    } else campo += c
  }
  if (campo !== '' || fila.length) {
    fila.push(campo)
    filas.push(fila)
  }
  return filas
}

// Excel guarda a veces el CSV en ANSI (Windows-1252): si salen símbolos raros, lo leemos así
function decodificar(buffer) {
  const utf8 = new TextDecoder('utf-8').decode(buffer)
  return utf8.includes(String.fromCharCode(0xfffd)) ? new TextDecoder('windows-1252').decode(buffer) : utf8
}

// ---------- Archivo -> filas ----------
async function filasDeArchivo(archivo) {
  const buffer = await archivo.arrayBuffer()
  const nombre = archivo.name.toLowerCase()
  if (nombre.endsWith('.xls')) throw new Error('Los archivos .xls viejos no se pueden leer. Guárdalo como .xlsx o como CSV.')
  if (nombre.endsWith('.xlsx')) return readSheet(buffer)
  return leerCsv(decodificar(buffer))
}

// ---------- Filas -> productos ----------
export async function leerInventario(archivo) {
  const filas = (await filasDeArchivo(archivo)).filter((f) => f.some((c) => texto(c) !== ''))
  if (filas.length === 0) throw new Error('El archivo está vacío.')

  // Busca la fila de títulos entre las primeras 5
  let cabecera = -1
  let columnas = {}
  for (let i = 0; i < Math.min(5, filas.length) && cabecera < 0; i++) {
    const encontrado = {}
    filas[i].forEach((celda, idx) => {
      const clave = sinTildes(celda)
      for (const [campo, nombres] of Object.entries(ALIAS)) {
        if (nombres.includes(clave) && encontrado[campo] === undefined) encontrado[campo] = idx
      }
    })
    if (encontrado.nombre !== undefined && encontrado.cantidad !== undefined) {
      cabecera = i
      columnas = encontrado
    }
  }
  if (cabecera < 0) {
    throw new Error('No encontré las columnas "Producto" y "Cantidad". Descarga la plantilla y usa esos títulos.')
  }

  const valor = (fila, campo) => (columnas[campo] === undefined ? '' : fila[columnas[campo]])
  const productos = new Map()
  const avisos = []

  filas.slice(cabecera + 1).forEach((fila, idx) => {
    const nombre = texto(valor(fila, 'nombre'))
    if (!nombre) return
    const clave = sinTildes(nombre)
    const producto = productos.get(clave) || {
      nombre,
      categoria: '',
      codigo: '',
      precio: 0,
      costo: 0,
      variantes: [],
    }
    productos.set(clave, producto)

    producto.categoria ||= texto(valor(fila, 'categoria'))
    producto.codigo ||= texto(valor(fila, 'codigo'))
    producto.precio ||= numero(valor(fila, 'precio'))
    producto.costo ||= numero(valor(fila, 'costo'))

    const talla = texto(valor(fila, 'talla')) || (texto(valor(fila, 'color')) ? '' : 'Única')
    const color = texto(valor(fila, 'color'))
    const stock = Math.max(0, Math.floor(numero(valor(fila, 'cantidad'))))
    const barras = texto(valor(fila, 'barras'))

    const repetida = producto.variantes.find(
      (v) => sinTildes(v.talla) === sinTildes(talla) && sinTildes(v.color) === sinTildes(color),
    )
    if (repetida) {
      repetida.stock += stock
      avisos.push(`Fila ${cabecera + idx + 2}: "${nombre}" ${talla} ${color} estaba repetida; se sumaron las cantidades.`)
    } else {
      producto.variantes.push({ talla, color, stock, codigo: barras })
    }
  })

  const lista = [...productos.values()]
  if (lista.length === 0) throw new Error('No encontré productos en el archivo.')
  lista.forEach((p) => {
    if (!(p.precio > 0)) avisos.push(`"${p.nombre}" no tiene precio de venta: quedará en $ 0 y tendrás que ponérselo.`)
  })
  return { productos: lista, avisos }
}

// Cuántos productos se crean y cuántos ya existen (se comparan por nombre)
export function resumenImportacion(leidos, actuales) {
  const existentes = new Set(actuales.map((p) => sinTildes(p.nombre)))
  const nuevos = leidos.filter((p) => !existentes.has(sinTildes(p.nombre)))
  return {
    nuevos: nuevos.length,
    actualizados: leidos.length - nuevos.length,
    variantes: leidos.reduce((s, p) => s + p.variantes.length, 0),
    unidades: leidos.reduce((s, p) => s + p.variantes.reduce((a, v) => a + v.stock, 0), 0),
  }
}

// Une lo leído con el inventario actual: crea los nuevos y actualiza los que ya existen
export function mezclarProductos(actuales, leidos, uid) {
  const copia = actuales.map((p) => ({ ...p, variantes: p.variantes.map((v) => ({ ...v })) }))
  leidos.forEach((n) => {
    const existente = copia.find((p) => sinTildes(p.nombre) === sinTildes(n.nombre))
    if (!existente) {
      copia.unshift({
        id: uid(),
        nombre: n.nombre,
        codigo: n.codigo,
        categoria: n.categoria,
        precio: n.precio,
        costo: n.costo,
        variantes: n.variantes.map((v) => ({ id: uid(), ...v })),
      })
      return
    }
    if (n.precio) existente.precio = n.precio
    if (n.costo) existente.costo = n.costo
    if (n.categoria) existente.categoria = n.categoria
    if (n.codigo) existente.codigo = n.codigo
    n.variantes.forEach((v) => {
      const igual = existente.variantes.find(
        (x) => sinTildes(x.talla) === sinTildes(v.talla) && sinTildes(x.color) === sinTildes(v.color),
      )
      if (igual) {
        igual.stock = v.stock // el archivo manda: el stock queda como dice el archivo
        if (v.codigo) igual.codigo = v.codigo
      } else existente.variantes.push({ id: uid(), ...v })
    })
  })
  return copia
}

// ---------- Exportar / plantilla ----------
const celda = (v) => {
  const t = String(v ?? '')
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

function aCsv(filas) {
  // ";" y BOM para que Excel en español lo abra con las columnas bien separadas y con tildes
  return BOM + filas.map((f) => f.map(celda).join(';')).join('\r\n')
}

export function inventarioACsv(productos) {
  const filas = [ENCABEZADOS]
  productos.forEach((p) =>
    p.variantes.forEach((v) =>
      filas.push([p.nombre, p.categoria, p.codigo || '', v.talla, v.color, v.stock, p.costo, p.precio, v.codigo || '']),
    ),
  )
  return aCsv(filas)
}

export function plantillaCsv() {
  return aCsv([
    ENCABEZADOS,
    ['Camiseta oversize', 'Camisetas', 'CO-001', 'M', 'Negro', 10, 18000, 30000, ''],
    ['Camiseta oversize', 'Camisetas', 'CO-001', 'L', 'Negro', 8, 18000, 30000, ''],
    ['Camiseta oversize', 'Camisetas', 'CO-001', 'M', 'Blanco', 6, 18000, 30000, ''],
    ['Pantalón cargo', 'Pantalones', 'PC-010', '32', 'Verde', 4, 45000, 80000, ''],
  ])
}

export function descargarTexto(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  enlace.download = nombre
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
