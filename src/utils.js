import { useEffect, useState } from 'react'

export const STOCK_BAJO = 2

// Genera un id único
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 45000 -> "$ 45.000"
export function dinero(n) {
  return '$ ' + Math.round(Number(n) || 0).toLocaleString('es-CO')
}

export function stockTotal(producto) {
  return producto.variantes.reduce((suma, v) => suma + v.stock, 0)
}

// "24 oct"
export function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
}

// "24 oct, 17:50"
export function fechaHora(iso) {
  return new Date(iso)
    .toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .replace('.', '')
}

// Número consecutivo para ventas y compras: siguiente número de una lista
export function siguienteNumero(lista) {
  const mayor = lista.reduce((m, x) => Math.max(m, x.numero || 0), 0)
  return Math.max(mayor, lista.length) + 1
}

// (V, 108) -> "#V-0108"
export function codigoNumero(prefijo, n) {
  return n ? `#${prefijo}-${String(n).padStart(4, '0')}` : ''
}

// ---------- Ventas ----------
export function costoVenta(venta) {
  return venta.items.reduce((s, i) => s + i.costo * i.cantidad, 0)
}

// Ganancia de una venta = lo que se cobró menos lo que costaron las prendas
export function gananciaVenta(venta) {
  return venta.total - costoVenta(venta)
}

export function prendasVenta(venta) {
  return venta.items.reduce((s, i) => s + i.cantidad, 0)
}

// Lo que un cliente debe: ventas fiadas menos abonos
export function deudaCliente(cliente, ventas) {
  const fiado = ventas.filter((v) => v.clienteId === cliente.id && v.pago === 'Fiado').reduce((s, v) => s + v.total, 0)
  const abonado = cliente.abonos.reduce((s, a) => s + a.monto, 0)
  return fiado - abonado
}

// Una "venta" normal no tiene tipo; las devoluciones y cambios sí (tipo: 'devolucion' | 'cambio')
export function esVenta(venta) {
  return !venta.tipo
}

// "#V-0008" para una venta, "#D-0009" para una devolución o cambio
export function etiquetaVenta(venta) {
  return codigoNumero(venta.tipo ? 'D' : 'V', venta.numero)
}

// Cuánto falta por cobrar de cada venta fiada. Los abonos y las devoluciones a cuenta se aplican
// primero a las ventas más viejas.
export function saldosFiado(clientes, ventas) {
  const saldos = {}
  clientes.forEach((c) => {
    const fiadas = ventas.filter((v) => v.clienteId === c.id && v.pago === 'Fiado')
    let restante =
      c.abonos.reduce((s, a) => s + a.monto, 0) + fiadas.filter((v) => v.total < 0).reduce((s, v) => s - v.total, 0)
    fiadas
      .filter((v) => v.total > 0)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .forEach((v) => {
        const aplicado = Math.min(restante, v.total)
        saldos[v.id] = v.total - aplicado
        restante -= aplicado
      })
  })
  return saldos
}

export function estadoVenta(venta, saldos) {
  if (venta.tipo) return venta.tipo === 'cambio' ? 'Cambio' : 'Devolución'
  return venta.pago === 'Fiado' && (saldos[venta.id] || 0) > 0 ? 'Por cobrar' : 'Cobrado'
}

// Cuánto de cada prenda de una venta ya se devolvió o cambió: { "productoId|varianteId": cantidad }
export function devueltoDe(ventaId, ventas) {
  const devuelto = {}
  ventas
    .filter((v) => v.ventaOrigenId === ventaId)
    .forEach((v) =>
      v.items
        .filter((i) => i.cantidad < 0)
        .forEach((i) => {
          const clave = i.productoId + '|' + i.varianteId
          devuelto[clave] = (devuelto[clave] || 0) - i.cantidad
        }),
    )
  return devuelto
}

export function mismoDia(fechaISO, dia) {
  return new Date(fechaISO).toDateString() === dia.toDateString()
}

// ---------- Compras ----------
// Las compras viejas no tienen "pagado": se toman como pagadas completas
export function pagadoCompra(compra) {
  return compra.pagado ?? compra.total
}

export function saldoCompra(compra) {
  return Math.max(0, compra.total - pagadoCompra(compra))
}

// Pagos posteriores a un proveedor: [{ id, fecha, monto, medio }]
export function pagosCompra(compra) {
  return compra.pagos || []
}

// Lo que se pagó en el momento de registrar la compra
export function pagoInicialCompra(compra) {
  return pagadoCompra(compra) - pagosCompra(compra).reduce((s, p) => s + p.monto, 0)
}

export function prendasCompra(compra) {
  return compra.items.reduce((s, i) => s + i.cantidad, 0)
}

// ---------- Períodos (Hoy, Este mes, Mes pasado, Todo) ----------
export const PERIODOS = [
  { id: 'hoy', texto: 'Hoy' },
  { id: 'mes', texto: 'Este mes' },
  { id: 'mespasado', texto: 'Mes pasado' },
  { id: 'todo', texto: 'Todo el tiempo' },
]

export function enPeriodo(fechaISO, periodo) {
  if (periodo === 'todo') return true
  const f = new Date(fechaISO)
  const ahora = new Date()
  if (periodo === 'hoy') return f.toDateString() === ahora.toDateString()
  const ref = periodo === 'mes' ? ahora : new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  return f.getFullYear() === ref.getFullYear() && f.getMonth() === ref.getMonth()
}

function nombreMesLargo(d) {
  const s = d.toLocaleString('es-CO', { month: 'long' })
  return `${s.charAt(0).toUpperCase() + s.slice(1)} ${d.getFullYear()}`
}

export function etiquetaPeriodo(periodo) {
  const ahora = new Date()
  if (periodo === 'hoy') return `Hoy · ${fechaCorta(ahora.toISOString())}`
  if (periodo === 'mes') return nombreMesLargo(ahora)
  if (periodo === 'mespasado') return nombreMesLargo(new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1))
  return 'Todo el tiempo'
}

// Ingresos y costo de las ventas repartidos en bloques, para las gráficas
export function bloquesVentas(ventas, periodo) {
  const ahora = new Date()
  let etiquetas
  let indice

  if (periodo === 'hoy') {
    etiquetas = ['0–4h', '4–8h', '8–12h', '12–16h', '16–20h', '20–24h']
    indice = (f) => Math.floor(f.getHours() / 4)
  } else if (periodo === 'todo') {
    const meses = []
    for (let i = 5; i >= 0; i--) meses.push(new Date(ahora.getFullYear(), ahora.getMonth() - i, 1))
    etiquetas = meses.map((d) => d.toLocaleString('es-CO', { month: 'short' }).replace('.', ''))
    indice = (f) => meses.findIndex((d) => d.getFullYear() === f.getFullYear() && d.getMonth() === f.getMonth())
  } else {
    const ref = periodo === 'mes' ? ahora : new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
    const dias = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
    etiquetas = Array.from({ length: Math.ceil(dias / 5) }, (_, i) => `${i * 5 + 1}–${Math.min(dias, i * 5 + 5)}`)
    indice = (f) => Math.floor((f.getDate() - 1) / 5)
  }

  const bloques = etiquetas.map((etiqueta) => ({ etiqueta, ingresos: 0, costo: 0 }))
  ventas
    .filter((v) => enPeriodo(v.fecha, periodo))
    .forEach((v) => {
      const b = bloques[indice(new Date(v.fecha))]
      if (b) {
        b.ingresos += v.total
        b.costo += costoVenta(v)
      }
    })
  return bloques
}

// ---------- WhatsApp ----------
export function linkWhatsapp(telefono, texto) {
  let numero = (telefono || '').replace(/\D/g, '')
  if (numero.length === 10) numero = '57' + numero // Colombia
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export function textoRecibo(venta) {
  const lineas = [
    '*Quality Shop*',
    ...venta.items.map((i) => `${i.cantidad}× ${i.nombre} ${i.talla} ${i.color} — ${dinero(i.precio * i.cantidad)}`),
  ]
  if (venta.descuento > 0) lineas.push(`Descuento: -${dinero(venta.descuento)}`)
  lineas.push(`*Total: ${dinero(venta.total)}*`, `Pago: ${venta.pago}`, '¡Gracias por tu compra!')
  return lineas.join('\n')
}

// Como useState, pero guarda el valor en el celular (localStorage)
export function useStorage(clave, inicial) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = localStorage.getItem(clave)
      return guardado ? JSON.parse(guardado) : inicial
    } catch {
      return inicial
    }
  })

  useEffect(() => {
    localStorage.setItem(clave, JSON.stringify(valor))
  }, [clave, valor])

  return [valor, setValor]
}
