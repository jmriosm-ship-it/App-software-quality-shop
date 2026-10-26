// Pantalla de bienvenida: logo y nombre del local, con el botón para entrar abajo
export default function Inicio({ onEntrar, onLegal }) {
  return (
    <div className="inicio">
      <div className="inicio-centro">
        <img src="./logo.png" alt="Quality Shop" width="220" height="220" />
        <h1>Quality Shop</h1>
        <span className="label">Inventario y ventas</span>
      </div>

      <button className="inicio-boton" onClick={onEntrar}>
        Entrar
      </button>
      <p className="inicio-legal">
        <button onClick={() => onLegal('privacidad')}>Privacidad</button>
        <span>·</span>
        <button onClick={() => onLegal('terminos')}>Términos</button>
      </p>
    </div>
  )
}
