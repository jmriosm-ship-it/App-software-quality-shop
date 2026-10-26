// Barras de ingresos (negro) contra costo de mercadería (gris)
export default function Grafica({ bloques }) {
  const max = Math.max(1, ...bloques.map((b) => Math.max(b.ingresos, b.costo)))
  const marcas = [1, 0.5, 0].map((f) => Math.round((max * f) / 1000).toLocaleString('es-CO'))

  return (
    <>
      <p className="k" style={{ margin: '0 0 8px' }}>En miles de pesos</p>
      <div className="grafica">
        <div className="grafica-ejes">
          {marcas.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        <div className="grafica-barras">
          {bloques.map((b) => (
            <div className="grupo" key={b.etiqueta}>
              <div className="par">
                <i className="ing" style={{ height: `${(b.ingresos / max) * 100}%` }} />
                <i className="cos" style={{ height: `${(b.costo / max) * 100}%` }} />
              </div>
              <span>{b.etiqueta}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="leyenda">
        <span>
          <i className="ing" /> Ingresos
        </span>
        <span>
          <i className="cos" /> Costo de mercadería
        </span>
      </div>
    </>
  )
}
