// Fotos de productos. Se guardan en IndexedDB (la base de datos del navegador), que aguanta mucho más
// espacio que localStorage. Cada foto se reduce antes de guardarla para que pese poco.
import { useEffect, useState } from 'react'

const BD = 'qs_fotos'
const TABLA = 'fotos'

function abrir() {
  return new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(BD, 1)
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(TABLA)
    pedido.onsuccess = () => resolver(pedido.result)
    pedido.onerror = () => rechazar(pedido.error)
  })
}

async function operar(modo, accion) {
  const bd = await abrir()
  return new Promise((resolver, rechazar) => {
    const transaccion = bd.transaction(TABLA, modo)
    const pedido = accion(transaccion.objectStore(TABLA))
    transaccion.oncomplete = () => resolver(pedido && pedido.result)
    transaccion.onerror = () => rechazar(transaccion.error)
  })
}

const memoria = new Map() // id -> foto, para no leer de la base de datos cada vez
const EVENTO = 'qs-foto'

export async function guardarFoto(id, dataUrl) {
  await operar('readwrite', (t) => t.put(dataUrl, id))
  memoria.set(id, dataUrl)
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: id }))
}

export async function borrarFoto(id) {
  await operar('readwrite', (t) => t.delete(id))
  memoria.set(id, null)
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: id }))
}

export async function leerFoto(id) {
  if (memoria.has(id)) return memoria.get(id)
  try {
    const foto = (await operar('readonly', (t) => t.get(id))) || null
    memoria.set(id, foto)
    return foto
  } catch {
    return null
  }
}

// Todas las fotos, para la copia de seguridad: { id: dataUrl }
export async function todasLasFotos() {
  const bd = await abrir()
  return new Promise((resolver) => {
    const salida = {}
    const cursor = bd.transaction(TABLA).objectStore(TABLA).openCursor()
    cursor.onsuccess = () => {
      const actual = cursor.result
      if (actual) {
        salida[actual.key] = actual.value
        actual.continue()
      } else resolver(salida)
    }
    cursor.onerror = () => resolver(salida)
  })
}

export async function restaurarFotos(fotos) {
  await operar('readwrite', (t) => t.clear())
  memoria.clear()
  for (const [id, dataUrl] of Object.entries(fotos || {})) await guardarFoto(id, dataUrl)
}

// Reduce la foto a 520 px de lado mayor y la pasa a JPEG liviano (unos 30-60 KB)
export function comprimirImagen(archivo, maximo = 520) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image()
    const url = URL.createObjectURL(archivo)
    imagen.onload = () => {
      const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height))
      const lienzo = document.createElement('canvas')
      lienzo.width = Math.round(imagen.width * escala)
      lienzo.height = Math.round(imagen.height * escala)
      lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
      URL.revokeObjectURL(url)
      resolver(lienzo.toDataURL('image/jpeg', 0.72))
    }
    imagen.onerror = () => {
      URL.revokeObjectURL(url)
      rechazar(new Error('No se pudo leer la imagen'))
    }
    imagen.src = url
  })
}

// Hook: devuelve la foto de un producto (o null) y se actualiza si cambia
export function useFoto(id) {
  const [foto, setFoto] = useState(memoria.get(id) ?? null)

  useEffect(() => {
    let vivo = true
    leerFoto(id).then((f) => vivo && setFoto(f))
    const alCambiar = (e) => e.detail === id && leerFoto(id).then((f) => vivo && setFoto(f))
    window.addEventListener(EVENTO, alCambiar)
    return () => {
      vivo = false
      window.removeEventListener(EVENTO, alCambiar)
    }
  }, [id])

  return foto
}
