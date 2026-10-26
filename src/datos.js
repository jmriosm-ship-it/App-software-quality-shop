// Las colecciones de datos de la app (productos, ventas, compras, clientes, gastos, cierres y ajustes).
// Viven aquí, fuera de los componentes, para que la sincronización con la nube pueda leerlas y escribirlas en cualquier momento.
import { crearAlmacenes } from './coleccion.js'

export const almacenes = crearAlmacenes()
