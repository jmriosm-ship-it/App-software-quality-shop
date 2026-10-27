import { useEffect, useState } from 'react'
import { siguienteNumero, uid, useStorage } from './utils.js'
import { mezclarProductos } from './importar.js'
import { borrarFoto, restaurarFotos } from './fotos.js'
import { useColeccion } from './coleccion.js'
import { almacenes } from './datos.js'
import { nubeConfigurada, supabase, useSesion } from './nube.js'
import { olvidarEstadoNube, useNube } from './useNube.js'
import Icono from './components/Iconos.jsx'
import { VERSION_LEGAL } from './legal.js'
import Aceptacion from './components/Aceptacion.jsx'
import Acceso from './components/Acceso.jsx'
import Legal from './components/Legal.jsx'
import Bloqueo from './components/Bloqueo.jsx'
import Inicio from './components/Inicio.jsx'
import Resumen from './components/Resumen.jsx'
import Inventario from './components/Inventario.jsx'
import Ventas from './components/Ventas.jsx'
import Compras from './components/Compras.jsx'
import Deudas from './components/Deudas.jsx'
import Ganancias from './components/Ganancias.jsx'
import Ajustes from './components/Ajustes.jsx'

const TABS = [
  { id: 'resumen', texto: 'Resumen' },
  { id: 'inventario', texto: 'Inventario' },
  { id: 'ventas', texto: 'Ventas' },
  { id: 'compras', texto: 'Compras' },
  { id: 'deudas', texto: 'Deudas' },
  { id: 'ganancias', texto: 'Ganancias' },
]

// Los textos legales también se pueden abrir con un enlace público: "…/#/privacidad" o "…/#/terminos"
function legalDelEnlace() {
  const hash = typeof location === 'undefined' ? '' : location.hash
  if (hash.includes('privacidad')) return 'privacidad'
  if (hash.includes('terminos')) return 'terminos'
  return null
}

export default function App() {
  const [tab, setTab] = useState('resumen')
  const [verLegal, setVerLegal] = useState(legalDelEnlace) // documento legal abierto: 'privacidad' | 'terminos' | 'clientes' | null
  const [legalAceptado, setLegalAceptado] = useStorage('qs_legal', '') // versión de los textos que ya se aceptó
  const [periodo, setPeriodo] = useState('mes')
  // Los datos viven en "colecciones" que se guardan en el celular y se sincronizan con la nube
  const [productos, setProductos] = useColeccion(almacenes.productos)
  const [compras, setCompras] = useColeccion(almacenes.compras)
  const [ventas, setVentas] = useColeccion(almacenes.ventas)
  const [clientes, setClientes] = useColeccion(almacenes.clientes)
  const [gastos, setGastos] = useColeccion(almacenes.gastos)
  const [cierres, setCierres] = useColeccion(almacenes.cierres) // cierres de caja guardados
  const [ajustes, setAjustes] = useColeccion(almacenes.ajustes)
  const meta = ajustes.find((a) => a.id === 'meta')?.valor || 0 // meta de ventas del mes
  const setMeta = (valor) =>
    setAjustes((lista) => {
      const resto = lista.filter((a) => a.id !== 'meta')
      return valor > 0 ? [...resto, { id: 'meta', valor }] : resto
    })

  // Cuenta en la nube (Supabase): sesión, y sincronización automática mientras haya sesión
  const sesion = useSesion()
  const [sinNube, setSinNube] = useStorage('qs_sin_nube', false) // eligió usar la app sin iniciar sesión
  const nube = useNube(sesion)
  const [pin, setPin] = useStorage('qs_pin', '')
  const [pinOmitido, setPinOmitido] = useStorage('qs_pin_omitido', false) // el dueño eligió no usar PIN
  const [abierto, setAbierto] = useState(false)
  const [enInicio, setEnInicio] = useState(true) // pantalla de bienvenida
  const [pedirVenta, setPedirVenta] = useState(false) // abrir "Nueva venta" al entrar a Ventas

  // Si la app estuvo más de 1 minuto en segundo plano, vuelve a pedir el PIN
  useEffect(() => {
    let oculta = 0
    function alCambiar() {
      if (document.hidden) oculta = Date.now()
      else if (oculta && Date.now() - oculta > 60000) setAbierto(false)
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  // ---------- Productos ----------
  // Crea el producto o lo reemplaza si ya existe
  function guardarProducto(producto) {
    setProductos((lista) =>
      lista.some((p) => p.id === producto.id)
        ? lista.map((p) => (p.id === producto.id ? producto : p))
        : [producto, ...lista],
    )
  }

  function borrarProducto(id) {
    setProductos((lista) => lista.filter((p) => p.id !== id))
    borrarFoto(id).catch(() => {})
  }

  // Carga masiva desde Excel/CSV: crea los productos nuevos y actualiza los que ya existen
  function importarProductos(leidos) {
    setProductos((lista) => mezclarProductos(lista, leidos, uid))
  }

  // Fija el stock de una talla/color (ajuste manual de inventario)
  function ajustarStock(productoId, varianteId, stock) {
    setProductos((lista) =>
      lista.map((p) =>
        p.id === productoId
          ? { ...p, variantes: p.variantes.map((v) => (v.id === varianteId ? { ...v, stock: Math.max(0, stock) } : v)) }
          : p,
      ),
    )
  }

  // Suma (signo = 1) o resta (signo = -1) stock según los items de una compra o venta
  function moverStock(items, signo) {
    setProductos((lista) =>
      lista.map((p) => ({
        ...p,
        variantes: p.variantes.map((v) => {
          const item = items.find((i) => i.productoId === p.id && i.varianteId === v.id)
          return item ? { ...v, stock: Math.max(0, v.stock + signo * item.cantidad) } : v
        }),
      })),
    )
  }

  // ---------- Compras (entra mercancía) ----------
  function registrarCompra(compra) {
    moverStock(compra.items, 1)
    // el costo del producto pasa a ser el de la última compra
    setProductos((lista) =>
      lista.map((p) => {
        const item = compra.items.find((i) => i.productoId === p.id)
        return item ? { ...p, costo: item.costo } : p
      }),
    )
    setCompras((lista) => [{ ...compra, numero: siguienteNumero(lista) }, ...lista])
  }

  function anularCompra(compra) {
    moverStock(compra.items, -1)
    setCompras((lista) => lista.filter((c) => c.id !== compra.id))
  }

  // Pago (total o parcial) a un proveedor por una compra; queda anotado con su fecha y medio de pago
  function pagarCompra(id, monto, medio = 'Efectivo') {
    setCompras((lista) =>
      lista.map((c) =>
        c.id === id
          ? {
              ...c,
              pagado: Math.min(c.total, (c.pagado ?? c.total) + monto),
              pagos: [...(c.pagos || []), { id: uid(), fecha: new Date().toISOString(), monto, medio }],
            }
          : c,
      ),
    )
  }

  // ---------- Ventas (sale mercancía) ----------
  function registrarVenta(venta) {
    moverStock(venta.items, -1)
    setVentas((lista) => [{ ...venta, numero: siguienteNumero(lista) }, ...lista])
  }

  function anularVenta(venta) {
    moverStock(venta.items, 1)
    setVentas((lista) => lista.filter((v) => v.id !== venta.id))
  }

  // ---------- Clientes ----------
  function guardarCliente(cliente) {
    setClientes((lista) =>
      lista.some((c) => c.id === cliente.id)
        ? lista.map((c) => (c.id === cliente.id ? cliente : c))
        : [cliente, ...lista],
    )
  }

  function borrarCliente(id) {
    setClientes((lista) => lista.filter((c) => c.id !== id))
  }

  function registrarAbono(clienteId, monto, medio = 'Efectivo') {
    setClientes((lista) =>
      lista.map((c) =>
        c.id === clienteId
          ? { ...c, abonos: [{ id: uid(), fecha: new Date().toISOString(), monto, medio }, ...c.abonos] }
          : c,
      ),
    )
  }

  // ---------- Cierre de caja ----------
  // Un cierre por día: si se guarda otro del mismo día, reemplaza al anterior
  function guardarCierre(cierre) {
    setCierres((lista) =>
      [cierre, ...lista.filter((c) => new Date(c.fecha).toDateString() !== new Date(cierre.fecha).toDateString())].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha),
      ),
    )
  }

  // ---------- Gastos y PIN ----------
  function registrarGasto(gasto) {
    setGastos((lista) => [gasto, ...lista])
  }

  function borrarGasto(id) {
    setGastos((lista) => lista.filter((g) => g.id !== id))
  }

  function cambiarPin(nuevo) {
    setPin(nuevo)
    setAbierto(true) // quien lo cambia ya está dentro
    setPinOmitido(!nuevo) // si lo quitó, que no vuelva a pedir crearlo
  }

  // "Olvidé mi PIN": borra los datos de ESTE celular para poder entrar de nuevo. No avisa a la nube
  // (si lo hiciera, se borrarían también los datos de internet). Cierra la sesión: para recuperar todo
  // hay que volver a entrar con el correo y la contraseña.
  async function olvidePin() {
    Object.values(almacenes).forEach((a) => {
      a.setRemoto([])
      a.guardarBorrados([])
    })
    restaurarFotos({}).catch(() => {})
    olvidarEstadoNube()
    if (supabase) await supabase.auth.signOut().catch(() => {})
    setSinNube(false)
    setPin('')
    setPinOmitido(false)
    setAbierto(true)
  }

  async function cerrarSesion() {
    if (supabase) await supabase.auth.signOut().catch(() => {})
    olvidarEstadoNube()
  }

  // ---------- Copia de seguridad ----------
  function restaurar(datos) {
    setProductos(datos.productos || [])
    setCompras(datos.compras || [])
    setVentas(datos.ventas || [])
    setClientes(datos.clientes || [])
    setGastos(datos.gastos || [])
    setCierres(datos.cierres || [])
    setMeta(datos.meta || 0)
    restaurarFotos(datos.fotos || {}).catch(() => {})
  }

  function aceptarLegal() {
    setLegalAceptado(VERSION_LEGAL)
    // queda también registrada (con fecha) en los ajustes, y por tanto en la nube, como constancia
    setAjustes((lista) => [
      ...lista.filter((a) => a.id !== 'aceptacion'),
      { id: 'aceptacion', version: VERSION_LEGAL, fecha: new Date().toISOString() },
    ])
  }

  function cerrarLegal() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search)
    setVerLegal(null)
  }

  // Un documento legal abierto se muestra sobre cualquier pantalla (sin pedir PIN ni sesión)
  if (verLegal) {
    return (
      <div className="app">
        <main className="contenido">
          <Legal key={verLegal} inicial={verLegal} onVolver={cerrarLegal} />
        </main>
      </div>
    )
  }

  if (enInicio) return <Inicio onTerminar={()=> setEnInicio(false)} />

  // La primera vez (o si cambian los textos) hay que aceptar la política y los términos
  if (legalAceptado !== VERSION_LEGAL) return <Aceptacion onLeer={setVerLegal} onAceptar={aceptarLegal} />

  // Al tocar "Entrar": si ya hay PIN lo pide; si no hay, la primera vez ofrece crearlo
  if (pin && !abierto) {
    return <Bloqueo modo="abrir" pin={pin} nube={nubeConfigurada} onAbrir={() => setAbierto(true)} onOlvide={olvidePin} />
  }
  if (!pin && !pinOmitido && !abierto) {
    return (
      <Bloqueo
        modo="crear"
        onCrear={cambiarPin}
        onOmitir={() => {
          setPinOmitido(true)
          setAbierto(true)
        }}
      />
    )
  }

  // Con la nube configurada, hay que iniciar sesión (o elegir seguir sin nube) antes de usar la app
  if (nubeConfigurada && sesion === undefined) return <p className="vacio" style={{ paddingTop: 80 }}>Cargando…</p>
  if (nubeConfigurada && !sesion && !sinNube) return <Acceso onSinNube={() => setSinNube(true)} onLegal={setVerLegal} />

  function nuevaVenta() {
    setPedirVenta(true)
    setTab('ventas')
  }

  const textoNube = {
    sincronizando: 'Sincronizando…',
    ok: 'Al día',
    sinconexion: 'Sin conexión',
    error: 'Error',
  }[nube.estado]

  return (
    <div className="app">
      <header className="topbar">
        <div className="marca">
          <img src="./logo.png" alt="Quality Shop" width="44" height="44" />
          <div className="marca-texto">
            <small>Gestión del local</small>
            <strong>Quality Shop</strong>
          </div>
        </div>
        <div className="topbar-acciones">
          {textoNube && (
            <button
              className={'nube-chip ' + nube.estado}
              onClick={nube.sincronizarAhora}
              aria-label="Sincronizar con la nube"
              title={nube.mensaje || 'Toca para sincronizar ahora'}
            >
              <Icono nombre="nube" tam={16} />
              <span>{textoNube}</span>
            </button>
          )}
          {pin && (
            <button className="icono-boton" onClick={() => setAbierto(false)} aria-label="Bloquear la app">
              <Icono nombre="candado" tam={20} />
            </button>
          )}
        </div>
      </header>

      <main className="contenido" key={tab}>
        {tab === 'resumen' && (
          <>
            <Resumen
              productos={productos}
              compras={compras}
              ventas={ventas}
              clientes={clientes}
              gastos={gastos}
              periodo={periodo}
              onPeriodo={setPeriodo}
              irA={setTab}
              onNuevaVenta={nuevaVenta}
              meta={meta}
              onMeta={setMeta}
            />
            <Ajustes
              datos={{ productos, compras, ventas, clientes, gastos, cierres, meta }}
              pin={pin}
              onPin={cambiarPin}
              onRestaurar={restaurar}
              onLegal={setVerLegal}
              nube={{
                configurada: nubeConfigurada,
                correo: sesion?.user?.email || '',
                sinNube,
                estado: nube.estado,
                ultima: nube.ultima,
                mensaje: nube.mensaje,
                onSincronizar: nube.sincronizarAhora,
                onSalir: cerrarSesion,
                onIniciar: () => setSinNube(false),
              }}
            />
          </>
        )}
        {tab === 'inventario' && (
          <Inventario
            productos={productos}
            compras={compras}
            ventas={ventas}
            onGuardar={guardarProducto}
            onBorrar={borrarProducto}
            onAjustar={ajustarStock}
            onImportar={importarProductos}
          />
        )}
        {tab === 'ventas' && (
          <Ventas
            productos={productos}
            clientes={clientes}
            ventas={ventas}
            compras={compras}
            gastos={gastos}
            cierres={cierres}
            onGuardarCierre={guardarCierre}
            periodo={periodo}
            onPeriodo={setPeriodo}
            onVenta={registrarVenta}
            onAnular={anularVenta}
            inicioNueva={pedirVenta}
            onConsumido={() => setPedirVenta(false)}
          />
        )}
        {tab === 'compras' && (
          <Compras
            productos={productos}
            compras={compras}
            periodo={periodo}
            onPeriodo={setPeriodo}
            onCompra={registrarCompra}
            onAnular={anularCompra}
            onPagar={pagarCompra}
          />
        )}
        {tab === 'deudas' && (
          <Deudas
            clientes={clientes}
            ventas={ventas}
            compras={compras}
            onGuardarCliente={guardarCliente}
            onBorrarCliente={borrarCliente}
            onAbono={registrarAbono}
            onPagar={pagarCompra}
          />
        )}
        {tab === 'ganancias' && (
          <Ganancias
            productos={productos}
            ventas={ventas}
            clientes={clientes}
            gastos={gastos}
            periodo={periodo}
            onPeriodo={setPeriodo}
            onGasto={registrarGasto}
            onBorrarGasto={borrarGasto}
          />
        )}
      </main>

      <nav className="menu">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'activo' : ''} onClick={() => setTab(t.id)}>
            <Icono nombre={t.id} tam={22} />
            {t.texto}
          </button>
        ))}
      </nav>
    </div>
  )
}
