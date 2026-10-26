// Fotos de productos en la nube (Supabase Storage). Cada producto guarda en su registro "foto" (si tiene)
// y "fotoT" (cuándo cambió la foto); con eso cada celular sabe si le falta bajar una foto o subirla.
import { borrarFoto, guardarFoto, leerFoto } from './fotos.js'

const PENDIENTES = 'qs_fotos_pend' // ids cuya foto cambió aquí y falta subir
const TIEMPOS = 'qs_fotos_t' // id -> fotoT de la foto que tiene este celular

function leer(clave, porDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? porDefecto
  } catch {
    return porDefecto
  }
}
const guardar = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // sin espacio: se reintenta en la próxima sincronización
  }
}

// Se llama cuando la persona cambia o quita la foto de un producto
export function fotoCambiada(id, fotoT) {
  const pendientes = leer(PENDIENTES, [])
  if (!pendientes.includes(id)) guardar(PENDIENTES, [...pendientes, id])
  guardar(TIEMPOS, { ...leer(TIEMPOS, {}), [id]: fotoT })
}

const ruta = (usuario, id) => `${usuario}/${id}.jpg`

function blobADataUrl(blob) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(lector.result)
    lector.onerror = () => rechazar(lector.error)
    lector.readAsDataURL(blob)
  })
}

export async function sincronizarFotos(cliente, usuario, productos) {
  const bucket = cliente.storage.from('fotos')

  // 1) Subir (o borrar de la nube) las fotos que cambiaron aquí
  let pendientes = leer(PENDIENTES, [])
  for (const id of [...pendientes]) {
    try {
      const foto = await leerFoto(id)
      if (foto) {
        const blob = await (await fetch(foto)).blob()
        const { error } = await bucket.upload(ruta(usuario, id), blob, { upsert: true, contentType: 'image/jpeg' })
        if (error) throw error
      } else {
        await bucket.remove([ruta(usuario, id)])
      }
      pendientes = pendientes.filter((x) => x !== id)
      guardar(PENDIENTES, pendientes)
    } catch {
      // sin conexión o error momentáneo: queda pendiente para la próxima vez
    }
  }

  // 2) Bajar las fotos que otro celular cambió
  const tiempos = leer(TIEMPOS, {})
  for (const producto of productos) {
    const remoto = producto.fotoT || 0
    if (remoto <= (tiempos[producto.id] || 0) || pendientes.includes(producto.id)) continue
    try {
      if (producto.foto) {
        const { data, error } = await bucket.download(ruta(usuario, producto.id))
        if (error || !data) continue // todavía no está subida; se reintenta después
        await guardarFoto(producto.id, await blobADataUrl(data))
      } else {
        await borrarFoto(producto.id)
      }
      tiempos[producto.id] = remoto
      guardar(TIEMPOS, tiempos)
    } catch {
      // se reintenta en la próxima sincronización
    }
  }
}
