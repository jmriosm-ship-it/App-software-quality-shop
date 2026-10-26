// Colecciones de datos (productos, ventas, compras…) guardadas en el celular.
// Cada registro lleva una marca "_t" con la hora de su último cambio; con eso la nube sabe qué es nuevo
// y qué versión gana si dos celulares cambian lo mismo. Los registros borrados se anotan aparte
// para poder avisarle a la nube que ya no existen.
import { useSyncExternalStore } from 'react'

const BORRADOS = 'qs_borrados_'

function leerJson(clave, porDefecto, almacenamiento) {
  try {
    const texto = almacenamiento.getItem(clave)
    return texto ? JSON.parse(texto) : porDefecto
  } catch {
    return porDefecto
  }
}

function guardarJson(clave, valor, almacenamiento) {
  try {
    almacenamiento.setItem(clave, JSON.stringify(valor))
  } catch {
    // sin espacio o navegación privada: la app sigue funcionando en memoria
  }
}

const sinMarca = (registro) => {
  const { _t, ...resto } = registro
  return JSON.stringify(resto)
}

// Compara la lista anterior con la nueva: sella con la hora los registros nuevos o cambiados
// y anota los que se borraron.
export function marcarCambios(antes, despues, borrados, ahora = Date.now()) {
  if (antes === despues) return { lista: despues, borrados }

  const previos = new Map(antes.map((r) => [r.id, r]))
  const presentes = new Set()

  const lista = despues.map((registro) => {
    presentes.add(registro.id)
    const previo = previos.get(registro.id)
    if (previo === registro) return registro
    // mismo contenido, solo cambió el objeto: se conserva la marca de antes
    if (previo && sinMarca(previo) === sinMarca(registro)) return { ...registro, _t: previo._t }
    return { ...registro, _t: ahora }
  })

  // lo que reapareció ya no está borrado; lo que desapareció queda anotado
  let nuevosBorrados = borrados.filter((b) => !presentes.has(b.id))
  for (const previo of antes) {
    if (!presentes.has(previo.id)) {
      nuevosBorrados = [...nuevosBorrados.filter((b) => b.id !== previo.id), { id: previo.id, _t: ahora }]
    }
  }
  return { lista, borrados: nuevosBorrados }
}

// Una colección: guarda en el celular cada cambio y avisa a la pantalla. Se lee y se escribe en el acto.
export function crearAlmacen(clave, inicial = () => [], almacenamiento = globalThis.localStorage) {
  let valor = leerJson(clave, null, almacenamiento)
  if (valor === null) valor = inicial()
  const oyentes = new Set()
  const avisar = () => oyentes.forEach((f) => f())

  return {
    clave,
    get: () => valor,
    // cambio hecho por la persona: se sella con la hora y se anotan los borrados
    set(cambio) {
      const siguiente = typeof cambio === 'function' ? cambio(valor) : cambio
      const resultado = marcarCambios(valor, siguiente, leerJson(BORRADOS + clave, [], almacenamiento))
      valor = resultado.lista
      guardarJson(clave, valor, almacenamiento)
      guardarJson(BORRADOS + clave, resultado.borrados, almacenamiento)
      avisar()
    },
    // cambio que viene de la nube: se guarda tal cual, sin sellarlo como cambio local
    setRemoto(lista) {
      valor = lista
      guardarJson(clave, valor, almacenamiento)
      avisar()
    },
    borrados: () => leerJson(BORRADOS + clave, [], almacenamiento),
    guardarBorrados: (lista) => guardarJson(BORRADOS + clave, lista, almacenamiento),
    subscribe(oyente) {
      oyentes.add(oyente)
      return () => oyentes.delete(oyente)
    },
  }
}

// Las colecciones que se guardan en la nube
export const NOMBRES = ['productos', 'compras', 'ventas', 'clientes', 'gastos', 'cierres', 'ajustes']

export function crearAlmacenes(almacenamiento = globalThis.localStorage) {
  const almacenes = {}
  for (const nombre of NOMBRES) {
    // la meta del mes antes se guardaba suelta; ahora vive en "ajustes" y se migra sola
    const inicial =
      nombre === 'ajustes'
        ? () => {
            const meta = Number(leerJson('qs_meta', 0, almacenamiento)) || 0
            return meta > 0 ? [{ id: 'meta', valor: meta, _t: 1 }] : []
          }
        : () => []
    almacenes[nombre] = crearAlmacen('qs_' + nombre, inicial, almacenamiento)
  }
  return almacenes
}

// Para usar una colección dentro de un componente: [lista, cambiarLista]
export function useColeccion(almacen) {
  const valor = useSyncExternalStore(almacen.subscribe, almacen.get)
  return [valor, almacen.set]
}
