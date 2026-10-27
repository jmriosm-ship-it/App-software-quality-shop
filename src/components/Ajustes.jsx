import { useState } from 'react'
import Icono from './Iconos.jsx'
import { todasLasFotos } from '../fotos.js'

// Copia de seguridad y PIN (al final del Resumen)
const ESTADOS = {
  inactivo: 'Sin sincronizar',
  sincronizando: 'Sincronizando…',
  ok: 'Al día ✓',
  sinconexion: 'Sin conexión (se sube al volver)',
  error: 'Hubo un error',
}

export default function Ajustes({ datos, pin, onPin, onRestaurar, nube, onLegal, onAyuda }) {
  const [nuevoPin, setNuevoPin] = useState('')
  const [errorPin, setErrorPin] = useState('')

  function guardarPin(e) {
    e.preventDefault()
    if (!/^\d{4}$/.test(nuevoPin)) return setErrorPin('El PIN debe ser de 4 números.')
    onPin(nuevoPin)
    setNuevoPin('')
    setErrorPin('')
  }

  // La copia incluye también las fotos de los productos
  async function exportar() {
    const fotos = await todasLasFotos().catch(() => ({}))
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob([JSON.stringify({ ...datos, fotos })], { type: 'application/json' }))
    enlace.download = `quality-shop-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    enlace.click()
  }

  function importar(e) {
    const archivo = e.target.files[0]
    if (!archivo) return
    const lector = new FileReader()
    lector.onload = () => {
      try {
        const leidos = JSON.parse(lector.result)
        if (!Array.isArray(leidos.productos)) throw new Error()
        if (confirm('Esto reemplaza todo lo que hay ahora. ¿Continuar?')) onRestaurar(leidos)
      } catch {
        alert('El archivo no es un respaldo válido.')
      }
    }
    lector.readAsText(archivo)
    e.target.value = ''
  }

  return (
    <>
      {nube?.configurada && (
        <>
          <div className="seccion-titulo">
            <h2>Cuenta en la nube</h2>
          </div>
          <div className="card">
            {nube.correo ? (
              <>
                <div className="fila-b">
                  <span className="muted">Sesión</span>
                  <strong style={{ wordBreak: 'break-all', textAlign: 'right' }}>{nube.correo}</strong>
                </div>
                <div className="fila-b">
                  <span className="muted">Estado</span>
                  <strong>{ESTADOS[nube.estado]}</strong>
                </div>
                {nube.ultima && (
                  <div className="fila-b">
                    <span className="muted">Última sincronización</span>
                    <strong>{new Date(nube.ultima).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</strong>
                  </div>
                )}
                {nube.estado === 'error' && nube.mensaje && <p className="error">{nube.mensaje}</p>}
                <p className="muted">
                  Tus datos se guardan solos en internet. Si cambias de celular, inicia sesión y todo vuelve.
                </p>
                <button className="btn-negro" onClick={nube.onSincronizar}>
                  Sincronizar ahora
                </button>
                <button
                  className="btn-claro"
                  onClick={() =>
                    confirm('¿Cerrar sesión? Los datos de este celular se quedan; solo se deja de sincronizar.') && nube.onSalir()
                  }
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <p className="muted">Estás usando la app sin nube: los datos viven solo en este celular.</p>
                <button className="btn-negro" onClick={nube.onIniciar}>
                  Iniciar sesión
                </button>
              </>
            )}
          </div>
        </>
      )}

      <div className="seccion-titulo">
        <h2>Copia de seguridad</h2>
      </div>
      <div className="card">
        <p className="muted">
          Tus datos viven en este celular. Descarga una copia cada semana y guárdala en un lugar seguro, por ejemplo
          enviándotela por WhatsApp.
        </p>
        <div className="fila-botones">
          <button className="btn-negro" onClick={exportar}>
            <Icono nombre="descargar" tam={18} /> Exportar
          </button>
          <label className="btn-claro" style={{ cursor: 'pointer' }}>
            <Icono nombre="subir" tam={18} /> Importar
            <input type="file" accept="application/json" onChange={importar} hidden />
          </label>
        </div>
      </div>

      <div className="seccion-titulo">
        <h2>Seguridad</h2>
      </div>
      <form className="card" onSubmit={guardarPin}>
        <p className="muted">
          {pin
            ? 'El PIN está activado: la app lo pide al abrirla y después de un rato en segundo plano.'
            : 'Activa un PIN de 4 números para que nadie más vea tus ventas y deudas.'}
        </p>
        <input
          className="campo"
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder={pin ? 'Nuevo PIN (4 números)' : 'PIN (4 números)'}
          value={nuevoPin}
          onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
        />
        {errorPin && <p className="error">{errorPin}</p>}
        <button type="submit" className="btn-negro">
          {pin ? 'Cambiar PIN' : 'Activar PIN'}
        </button>
        {pin && (
          <button
            type="button"
            className="btn-peligro"
            onClick={() => confirm('¿Quitar el PIN?') && onPin('')}
          >
            Quitar PIN
          </button>
        )}
      </form>

      <div className="seccion-titulo">
        <h2>Ayuda</h2>
      </div>
      <div className="card">
        <p className="muted">
          Qué hace cada apartado de la app, cómo empezar y las reglas importantes para llevar bien tus cuentas.
        </p>
        <button className="btn-negro" onClick={onAyuda}>
          Guía de uso
        </button>
      </div>

      <div className="seccion-titulo">
        <h2>Legal</h2>
      </div>
      <div className="card">
        <p className="muted">
          Cómo se cuidan los datos, las reglas de uso y un modelo de autorización para que tus clientes te dejen guardar su
          nombre y teléfono.
        </p>
        <button className="btn-claro" onClick={() => onLegal('privacidad')}>
          Política de privacidad
        </button>
        <button className="btn-claro" onClick={() => onLegal('terminos')}>
          Términos de uso
        </button>
        <button className="btn-claro" onClick={() => onLegal('clientes')}>
          Autorización para clientes
        </button>
      </div>
    </>
  )
}
