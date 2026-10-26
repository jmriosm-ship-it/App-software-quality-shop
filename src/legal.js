// Textos legales de la app: política de privacidad, términos de uso y modelo de autorización para clientes.
// Pensados para Colombia (Ley 1581 de 2012, Decreto 1377 de 2013 y normas que los complementan).
// Los datos del negocio son los mismos que ya usa la página web de la tienda (quality-shop/src/data.js).
// Conviene que un abogado revise estos textos antes de ampliar el uso de la app.

// Si cambias el contenido de los textos de forma importante, sube esta fecha: la app volverá a pedir la aceptación.
export const VERSION_LEGAL = '2026-10-25'

export const DATOS = {
  negocio: 'Quality Shop Col',
  responsable: 'Juan José Sanguino Lobo',
  identificacion: 'C.C. 1004819124',
  correo: 'Sanguinolobojuanjo@gmail.com',
  whatsapp: '+57 324 862 7580',
  direccion: 'Centro Comercial City Gold, local 107 — Calle 11, Ocaña, Norte de Santander',
  ciudad: 'Ocaña, Norte de Santander, Colombia',
  vigencia: '25 de octubre de 2026',
}

// true si quedara algún dato sin completar (así no se publica por descuido)
export const hayPendientes = Object.values(DATOS).some((v) => v.includes('['))

const d = DATOS

export const DOCUMENTOS = {
  privacidad: {
    titulo: 'Política de privacidad',
    resumen: 'Cómo se cuidan y se usan los datos que se guardan en la app.',
    secciones: [
      {
        titulo: '1. Responsable del tratamiento',
        parrafos: [
          `Esta política explica cómo la aplicación "Quality Shop Inventario" (la "App") trata la información, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (protección de datos personales en Colombia).`,
        ],
        lista: [
          `Responsable: ${d.responsable}, ${d.identificacion}, titular del establecimiento ${d.negocio} (el "Negocio").`,
          `Dirección: ${d.direccion}.`,
          `Correo: ${d.correo}`,
          `WhatsApp: ${d.whatsapp}`,
        ],
        despues: [
          'La App fue desarrollada por un proveedor tecnológico que actúa como encargado del tratamiento: guarda y procesa los datos por cuenta del Negocio y solo para prestar el servicio.',
        ],
      },
      {
        titulo: '2. Qué información se guarda',
        lista: [
          'De la cuenta: el correo electrónico con el que se inicia sesión. La contraseña la protege el servicio de autenticación y no puede verse en texto.',
          'Del Negocio: productos, tallas, colores, precios, costos, inventario, ventas, compras, gastos, cierres de caja y metas.',
          'De clientes y proveedores que el Negocio decida anotar: nombre, teléfono, ventas a crédito (fiado), abonos y pagos.',
          'Fotos de los productos que se tomen o elijan.',
          'Códigos de barras o QR que se escaneen, solo para buscar o agregar prendas.',
          'El PIN de bloqueo, que se guarda únicamente en el dispositivo.',
        ],
      },
      {
        titulo: '3. Para qué se usa',
        parrafos: [
          'Solo para que la App funcione: llevar el inventario, las ventas, las compras, las deudas y las ganancias del Negocio; sincronizar los datos entre sus dispositivos; ofrecer copias de seguridad; recordar pagos pendientes a los clientes; y mantener segura la cuenta.',
          'No vendemos los datos, no hacemos publicidad con ellos ni creamos perfiles para terceros.',
        ],
      },
      {
        titulo: '4. Dónde se guardan',
        parrafos: [
          'Los datos se guardan en el dispositivo. Si se inicia sesión, también se copian en los servidores de Supabase, un proveedor de infraestructura que puede tener sus servidores fuera de Colombia. Las fotos se guardan en un espacio privado al que solo accede la cuenta del Negocio.',
          'Al aceptar esta política se autoriza de forma expresa la transmisión y transferencia de los datos a esos servidores, que pueden estar en otros países, únicamente para prestar el servicio.',
        ],
      },
      {
        titulo: '5. Permisos del dispositivo',
        lista: [
          'Cámara: solo cuando se escanea un código o se toma la foto de un producto. No se graba ni se sube nada más.',
          'Internet: para sincronizar con la nube. Sin internet la App sigue funcionando y sincroniza cuando vuelve la conexión.',
        ],
      },
      {
        titulo: '6. Con quién se comparte',
        parrafos: [
          'No compartimos los datos con otras personas ni empresas, salvo con los proveedores tecnológicos necesarios para operar la App (por ejemplo, Supabase para guardar los datos y el servicio que aloja la página de la App) o cuando una autoridad competente lo exija conforme a la ley.',
          'Cuando se usa "Enviar por WhatsApp" o "Recordatorio", la App abre WhatsApp con un mensaje ya escrito. El mensaje solo se envía si la persona lo envía.',
        ],
      },
      {
        titulo: '7. Seguridad',
        parrafos: [
          'Las conexiones con la nube van cifradas (HTTPS) y cada cuenta solo puede ver sus propios datos. El PIN es un candado para evitar miradas curiosas en el celular; no es un cifrado de los datos.',
          'Ningún sistema es 100% seguro. Hay que cuidar la contraseña y el dispositivo, y descargar copias de seguridad con frecuencia.',
        ],
      },
      {
        titulo: '8. Cuánto tiempo se guardan',
        parrafos: [
          'Mientras el Negocio use la App o hasta que pida su eliminación. Si se desinstala la App, los datos guardados solo en el dispositivo se pierden; los de la nube permanecen mientras la cuenta exista.',
        ],
      },
      {
        titulo: '9. Derechos de los titulares',
        parrafos: [
          'Como titular de datos personales (el dueño del Negocio, sus clientes o sus proveedores) tienes derecho a: conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización; ser informado del uso que se les ha dado; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y pedir la supresión de tus datos; y acceder a ellos de forma gratuita.',
          `Para ejercerlos escribe a ${d.correo} o por WhatsApp al ${d.whatsapp}. Las consultas se responden en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles, prorrogables según lo permite la ley. El área responsable de atenderlos es el titular del Negocio.`,
        ],
      },
      {
        titulo: '10. Datos de los clientes',
        parrafos: [
          `Al anotar el nombre o el teléfono de un cliente (por ejemplo, para fiarle), ${d.negocio} debe informarle para qué los usa y contar con su autorización antes de guardarlos. En la App hay un modelo de autorización que se puede mostrar al cliente.`,
        ],
      },
      {
        titulo: '11. Menores de edad',
        parrafos: [
          'La App está dirigida a comerciantes mayores de edad. No recopilamos de forma intencional datos de menores de edad.',
        ],
      },
      {
        titulo: '12. Cambios en esta política',
        parrafos: [
          'Si esta política cambia de forma importante, la App mostrará la nueva versión y pedirá aceptarla otra vez.',
        ],
      },
      {
        titulo: '13. Vigencia',
        parrafos: [`Esta política rige desde el ${d.vigencia}.`],
      },
    ],
  },

  terminos: {
    titulo: 'Términos de uso',
    resumen: 'Las reglas para usar la app y lo que se puede esperar de ella.',
    secciones: [
      {
        titulo: '1. Aceptación',
        parrafos: [
          `Al usar la App "Quality Shop Inventario" se aceptan estos términos y la política de privacidad. Quien no esté de acuerdo, no debe usarla. La App está pensada para ${d.negocio}, a cargo de ${d.responsable}, y debe usarla una persona mayor de edad para administrar el negocio.`,
        ],
      },
      {
        titulo: '2. Qué es la App y qué no es',
        parrafos: [
          'La App es una herramienta de apoyo para llevar el inventario, las ventas, las compras, las deudas y los gastos de un negocio.',
          'Los cálculos que muestra (ganancias, costos, márgenes, metas, cierres de caja y estadísticas) son informativos y dependen de los datos que se registren. No constituyen contabilidad oficial ni asesoría contable, tributaria o legal.',
          'La App no emite facturas electrónicas ni cumple por el Negocio sus obligaciones ante la DIAN u otras autoridades. El Negocio debe llevar su contabilidad y cumplir sus obligaciones conforme a la ley.',
        ],
      },
      {
        titulo: '3. Responsabilidades de quien la usa',
        lista: [
          'Registrar información veraz y completa. Si no se anota una venta, una compra o un gasto, los resultados no serán correctos.',
          'Cuidar la contraseña, el PIN y el dispositivo.',
          'Descargar copias de seguridad con frecuencia y guardarlas en un lugar seguro.',
          'Contar con la autorización de los clientes antes de guardar sus datos personales.',
          'Usar WhatsApp y los demás medios de contacto respetando la ley y la voluntad de las personas (sin enviar mensajes no deseados).',
          'No usar la App para actividades ilegales.',
        ],
      },
      {
        titulo: '4. Disponibilidad y respaldo',
        parrafos: [
          'La App se ofrece "tal como está". Puede tener errores o interrupciones, y depende de servicios de terceros (como Supabase y el servicio de alojamiento) que pueden fallar.',
          'Los datos pueden perderse si se borra la App, si se daña o se pierde el dispositivo, o por fallas de terceros. Por eso es responsabilidad del Negocio mantener copias de seguridad.',
        ],
      },
      {
        titulo: '5. Límite de responsabilidad',
        parrafos: [
          'En la máxima medida permitida por la ley, el proveedor de la App no responde por pérdidas indirectas, lucro cesante, decisiones de negocio tomadas con base en la información de la App, ni por pérdidas de datos causadas por el usuario, su dispositivo o terceros.',
          'Nada en estos términos limita los derechos que la ley reconoce y que no se pueden renunciar.',
        ],
      },
      {
        titulo: '6. Propiedad intelectual',
        parrafos: [
          `El código y el diseño de la App pertenecen a su desarrollador. La marca y el logo "${d.negocio}" pertenecen al Negocio. Los datos que se guardan en la App son del Negocio: nadie más reclama derechos sobre ellos.`,
        ],
      },
      {
        titulo: '7. Terminación',
        parrafos: [
          'Se puede dejar de usar la App cuando se quiera y pedir la eliminación de los datos escribiendo a los contactos de abajo. Se puede suspender una cuenta que se use de forma indebida.',
        ],
      },
      {
        titulo: '8. Cambios',
        parrafos: [
          'Estos términos pueden actualizarse. Si el cambio es importante, la App pedirá aceptarlos de nuevo.',
        ],
      },
      {
        titulo: '9. Ley aplicable',
        parrafos: [
          `Estos términos se rigen por las leyes de la República de Colombia. Ante cualquier desacuerdo, primero se buscará una solución amistosa; si no es posible, serán competentes los jueces de ${d.ciudad}.`,
        ],
      },
      {
        titulo: '10. Contacto',
        parrafos: [`${d.negocio} · ${d.responsable} · ${d.correo} · WhatsApp ${d.whatsapp}`],
      },
    ],
  },
}

// Modelo de autorización que el negocio puede darle a sus clientes (impreso, en un cartel o por WhatsApp)
export const AUTORIZACION = {
  titulo: 'Autorización para clientes',
  resumen: 'Texto modelo para que los clientes autoricen guardar su nombre y teléfono.',
  intro:
    'Si anotas el nombre o el teléfono de un cliente (por ejemplo, para fiarle), la ley colombiana te pide avisarle para qué lo usarás y tener su autorización. Puedes mostrarle este texto, mandárselo por WhatsApp o ponerlo en un cartel. Guarda una prueba: su firma, su "acepto" por WhatsApp o un registro de que se le informó.',
  texto: () =>
    `Autorizo a ${d.negocio} (${d.responsable}, ${d.identificacion}) para recolectar, almacenar y usar mi nombre y mi número de teléfono con estas finalidades: registrar mis compras, llevar el control de mis pagos y saldos pendientes, y contactarme por WhatsApp o llamada para recordatorios de pago y novedades de mi compra.\n\nSé que no es obligatorio dar estos datos, que no serán vendidos a terceros y que puedo conocerlos, actualizarlos, corregirlos, pedir que se eliminen o revocar esta autorización en cualquier momento escribiendo a ${d.correo} o al WhatsApp ${d.whatsapp}. Esta autorización se rige por la Ley 1581 de 2012.`,
}
