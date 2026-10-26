import { useState } from 'react'

// Pantalla de PIN. Dos modos:
//  - "abrir": pide el PIN guardado para entrar
//  - "crear": la primera vez, el dueño inventa su PIN y lo repite para confirmarlo
export default function Bloqueo({ modo, pin, nube, onAbrir, onCrear, onOmitir, onOlvide }) {
  const [digitos, setDigitos] = useState('')
  const [primero, setPrimero] = useState('') // en "crear": el PIN de la primera vez
  const [error, setError] = useState('')

  function pulsar(n) {
    if (digitos.length >= 4) return
    const nuevo = digitos + n
    setError('')
    setDigitos(nuevo)
    if (nuevo.length < 4) return

    if (modo === 'abrir') {
      if (nuevo === pin) return onAbrir()
      return fallar('PIN incorrecto')
    }

    // modo crear
    if (!primero) {
      setTimeout(() => {
        setPrimero(nuevo)
        setDigitos('')
      }, 200)
    } else if (nuevo === primero) {
      onCrear(nuevo)
    } else {
      setPrimero('')
      fallar('No coinciden. Empieza de nuevo.')
    }
  }

  function fallar(mensaje) {
    setError(mensaje)
    setTimeout(() => setDigitos(''), 300)
  }

  const titulo =
    modo === 'abrir' ? 'Escribe tu PIN' : primero ? 'Repite tu PIN' : 'Crea tu PIN de 4 números'

  return (
    <div className="bloqueo">
      <img src="./logo.png" alt="Quality Shop" width="96" height="96" />
      <h1>Quality Shop</h1>
      <span className="label" style={{ color: error ? '#ff6b61' : '#9e9ea0', textAlign: 'center' }}>
        {error || titulo}
      </span>

      <div className="puntos">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < digitos.length ? 'lleno' : ''} />
        ))}
      </div>

      <div className="teclado">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button key={n} onClick={() => pulsar(n)}>
            {n}
          </button>
        ))}
        <span />
        <button onClick={() => pulsar('0')}>0</button>
        <button onClick={() => setDigitos((d) => d.slice(0, -1))} aria-label="Borrar">
          ←
        </button>
      </div>

      {modo === 'crear' ? (
        <>
          <p className="bloqueo-nota">
            Anótalo en un lugar seguro. Protege tus ventas, deudas y ganancias para que nadie más las vea.
          </p>
          <button className="bloqueo-link" onClick={onOmitir}>
            Ahora no
          </button>
        </>
      ) : (
        <button
          className="bloqueo-link"
          onClick={() => {
            const aviso1 = nube
              ? 'Si olvidaste el PIN, se borrarán los datos de ESTE celular y se cerrará tu sesión. Tus datos en la nube NO se tocan: los recuperas iniciando sesión con tu correo y contraseña. ¿Continuar?'
              : 'Si olvidaste el PIN, la única forma de entrar es BORRAR todos los datos de la app. Luego puedes recuperarlos con tu copia de seguridad. ¿Continuar?'
            const aviso2 = nube
              ? 'Última confirmación: se cerrará tu sesión y se limpiará este celular.'
              : 'Última confirmación: se borrarán productos, ventas, compras, clientes y gastos de este celular.'
            if (confirm(aviso1) && confirm(aviso2)) {
              onOlvide()
            }
          }}
        >
          Olvidé mi PIN
        </button>
      )}
    </div>
  )
}
