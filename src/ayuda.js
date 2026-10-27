// Contenido de la guía de uso ("Ayuda") de la app. Si cambia algo en la app, se actualiza aquí.

export const PRIMEROS_PASOS = [
  'Entra con tu correo y contraseña. La primera vez acepta los términos y crea tu PIN de 4 números.',
  'Carga tu inventario: en Inventario toca "Importar Excel" (muchas prendas de una vez) o "Nuevo producto" (una por una).',
  'Revisa que cada producto tenga su costo y su precio de venta. De ahí salen las ganancias.',
  'Registra cada venta en Ventas → "Nueva venta" y cada compra de mercancía en Compras.',
  'Anota tus gastos (arriendo, servicios, bolsas) en Ganancias.',
  'Al cerrar el local, haz el "Cierre de caja" en Ventas.',
  'Cada semana descarga la copia de seguridad (Resumen, al final). La nube ya guarda todo, pero una copia extra nunca sobra.',
]

export const SECCIONES = [
  {
    id: 'resumen',
    icono: 'resumen',
    titulo: 'Resumen',
    sirve: 'Cómo va el negocio de un vistazo.',
    puntos: [
      'Arriba eliges el período: hoy, este mes, mes pasado o todo el tiempo.',
      'Muestra lo vendido, la ganancia neta, las prendas disponibles y cuánto te deben.',
      'Meta del mes: defines una meta de ventas y una barra te dice cuánto llevas y cuánto falta por día.',
      'Tiene la gráfica de ingresos contra costos, lo que más se vende, tus mejores clientes, las últimas ventas y las prendas que se están acabando.',
      'El botón "Nueva venta" te lleva directo a registrar una venta.',
      'Al final están la copia de seguridad, el PIN, la cuenta en la nube y la parte legal.',
    ],
  },
  {
    id: 'inventario',
    icono: 'inventario',
    titulo: 'Inventario',
    sirve: 'Todo lo que hay en la tienda, por talla y color.',
    puntos: [
      'Cada producto muestra su foto, precio, costo y las tallas con su cantidad. Las tallas que se están acabando salen en negro.',
      'Al tocar una talla ves el margen de ganancia, su código y la última vez que entró mercancía.',
      'Nuevo producto: nombre, foto, categoría, precio, costo, y cada talla y color con su cantidad y su código de barras.',
      'Ajustar stock: úsalo cuando contaste a mano y el número no coincide, o se perdió una prenda.',
      'Importar Excel: carga muchas prendas de una vez desde una plantilla. Antes de confirmar te muestra qué va a crear y qué va a actualizar. También puedes exportar tu inventario a Excel.',
      'Lista para reponer: arma el pedido de lo que se acaba, con la cantidad sugerida, y lo manda por WhatsApp.',
      'Escáner (el botón junto a la búsqueda): lee códigos de barras o QR con la cámara.',
      'Etiquetas con código QR: crea etiquetas para pegar en cada prenda y escanearlas al vender.',
    ],
  },
  {
    id: 'ventas',
    icono: 'ventas',
    titulo: 'Ventas',
    sirve: 'Lo que sale de la tienda.',
    puntos: [
      'Nueva venta: toca las prendas (o escanéalas), pon el descuento si hubo, elige cómo paga (efectivo, transferencia o fiado) y registra. El inventario baja solo.',
      'Si es fiado, eliges el cliente y la deuda queda anotada. Si el cliente es de confianza, también puedes asociarlo en las ventas normales.',
      'Después de vender puedes mandar el recibo por WhatsApp.',
      'El historial muestra cada venta con su número, si está cobrada o por cobrar, y el detalle.',
      'Devolver o cambiar prendas: la prenda vuelve al inventario, se corrige la ganancia y se devuelve la plata (o se cobra la diferencia). La venta original no se borra.',
      'Anular venta: úsalo si te equivocaste al registrarla; las prendas vuelven al inventario.',
      'Cierre de caja: al final del día te dice cuánto efectivo debería haber. Cuentas la caja y te dice si cuadra, si sobra o si falta.',
    ],
  },
  {
    id: 'compras',
    icono: 'compras',
    titulo: 'Compras',
    sirve: 'Lo que entra a la tienda.',
    puntos: [
      'Registrar compra: cuando llega mercancía. Anotas qué llegó, cuántas prendas, a qué costo, el proveedor y cuánto pagaste.',
      'El inventario sube solo y el costo del producto se actualiza.',
      'Lo que quedó sin pagar aparece como saldo por pagar, y puedes registrar los pagos (en efectivo o transferencia) hasta saldarlo.',
    ],
  },
  {
    id: 'deudas',
    icono: 'deudas',
    titulo: 'Deudas',
    sirve: 'Quién te debe y a quién le debes.',
    puntos: [
      'Por cobrar: los clientes con ventas fiadas. Ves cuánto debe cada uno, registras sus abonos y le mandas un recordatorio por WhatsApp.',
      'Por pagar: lo que le debes a tus proveedores.',
      'Antigüedad: cuánto lleva de atraso lo que te deben, para saber a quién cobrarle primero.',
      'Aquí también creas y editas a tus clientes.',
    ],
  },
  {
    id: 'ganancias',
    icono: 'ganancias',
    titulo: 'Ganancias',
    sirve: 'La plata de verdad.',
    puntos: [
      'La cuenta paso a paso: ventas menos el costo de las prendas es la ganancia bruta; menos los gastos, la ganancia neta.',
      'Gráfica de ingresos contra costos y ganancia por categoría (por ejemplo, qué deja más: camisetas o pantalones).',
      'Gastos del local: arriendo, servicios, bolsas. Si no los anotas, la ganancia sale más alta de lo real.',
    ],
  },
  {
    id: 'ajustes',
    icono: 'ajustes',
    titulo: 'Ajustes (al final del Resumen)',
    sirve: 'Tu cuenta, tus copias y tu seguridad.',
    puntos: [
      'Cuenta en la nube: tu correo, el estado, "Sincronizar ahora" y "Cerrar sesión".',
      'Copia de seguridad: "Exportar" descarga todo (con las fotos) e "Importar" lo recupera.',
      'Seguridad: cambiar o quitar el PIN.',
      'Legal: la política de privacidad, los términos y el modelo de autorización para que tus clientes te dejen guardar su nombre y teléfono.',
    ],
  },
  {
    id: 'nube',
    icono: 'nube',
    titulo: 'La nube y lo que hace sola',
    sirve: 'Tus datos protegidos, sin que hagas nada.',
    puntos: [
      'Arriba, junto al candado, hay un botón de nube: "Al día" (todo guardado), "Sincronizando…" o "Sin conexión" (se sube cuando vuelva el internet).',
      'La app funciona sin internet y sincroniza apenas vuelve la conexión.',
      'Si cambias de celular, inicia sesión con tu correo y contraseña y todo vuelve.',
      'La app se actualiza sola: cuando haya mejoras, cierra la app del todo y ábrela con internet.',
    ],
  },
]

export const REGLAS = [
  'La ganancia es tan buena como lo que anotes. Si no registras una venta, una compra o un gasto, las cuentas no cuadran.',
  'Antes de guardar el nombre o el teléfono de un cliente, pídele su autorización. En Ajustes → Legal hay un texto modelo.',
  'Si olvidas el PIN, el botón "Olvidé mi PIN" limpia ese celular y cierra la sesión. Tus datos de la nube no se tocan: los recuperas iniciando sesión.',
  'Esta app es para administrar tu negocio. No emite facturas electrónicas ni reemplaza la contabilidad oficial.',
]
