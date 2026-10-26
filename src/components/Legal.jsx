import { useState } from 'react'
import Icono from './Iconos.jsx'
import { AUTORIZACION, DOCUMENTOS, VERSION_LEGAL } from '../legal.js'

const PESTANAS = [
  ['privacidad', 'Privacidad'],
  ['terminos', 'Términos'],
  ['clientes', 'Clientes'],
]

// Lee la política de privacidad, los términos de uso y el modelo de autorización para clientes
export default function Legal({ inicial = 'privacidad', onVolver }) {
  const [doc, setDoc] = useState(inicial)
  const [copiado, setCopiado] = useState(false)
  const documento = DOCUMENTOS[doc]

  async function copiar() {
    try {
      await navigator.clipboard.writeText(AUTORIZACION.texto())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      alert('No se pudo copiar. Usa el botón de WhatsApp.')
    }
  }

  return (
    <>
      <button className="volver" onClick={onVolver}>
        <Icono nombre="atras" tam={20} /> Volver
      </button>

      <div className="segmentos">
        {PESTANAS.map(([id, texto]) => (
          <button key={id} className={doc === id ? 'activo' : ''} onClick={() => setDoc(id)}>
            {texto}
          </button>
        ))}
      </div>

      {doc === 'clientes' ? (
        <>
          <div>
            <h1 className="titulo" style={{ fontSize: 26 }}>{AUTORIZACION.titulo}</h1>
            <p className="subtitulo">{AUTORIZACION.resumen}</p>
          </div>
          <div className="nota">
            <Icono nombre="info" tam={18} />
            <span>{AUTORIZACION.intro}</span>
          </div>
          <div className="card">
            <span className="k">Texto para el cliente</span>
            <pre className="vista-mensaje">{AUTORIZACION.texto()}</pre>
            <button className="btn-claro" onClick={copiar}>
              {copiado ? '¡Copiado!' : 'Copiar texto'}
            </button>
            <a
              className="btn-negro"
              href={`https://wa.me/?text=${encodeURIComponent(AUTORIZACION.texto())}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icono nombre="enviar" tam={18} /> Enviar por WhatsApp
            </a>
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="titulo" style={{ fontSize: 26 }}>{documento.titulo}</h1>
            <p className="subtitulo">{documento.resumen}</p>
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Versión {VERSION_LEGAL}</p>
          </div>
          {documento.secciones.map((s) => (
            <div key={s.titulo} className="card legal-seccion">
              <h2>{s.titulo}</h2>
              {s.parrafos?.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {s.lista && (
                <ul>
                  {s.lista.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {s.despues?.map((p, i) => (
                <p key={'d' + i}>{p}</p>
              ))}
            </div>
          ))}
        </>
      )}
    </>
  )
}
