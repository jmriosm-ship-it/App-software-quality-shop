import { useFoto } from '../fotos.js'

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// Miniatura del producto: su foto si tiene, o sus iniciales
export default function Foto({ id, nombre, tam = 62 }) {
  const foto = useFoto(id)
  const estilo = { width: tam, height: tam, fontSize: tam * 0.3 }

  return foto ? (
    <img className="foto" src={foto} alt={nombre} style={{ ...estilo, objectFit: 'cover' }} />
  ) : (
    <span className="foto" style={estilo}>
      {iniciales(nombre)}
    </span>
  )
}
