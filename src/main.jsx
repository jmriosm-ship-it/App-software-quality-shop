import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // En la app publicada: registra el service worker para que funcione sin internet
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {})
    })
  } else {
    // Mientras programas: borra service workers y cachés viejos para ver siempre lo último
    navigator.serviceWorker.getRegistrations().then(async (registros) => {
      if (registros.length === 0) return
      await Promise.all(registros.map((r) => r.unregister()))
      const claves = await caches.keys()
      await Promise.all(claves.map((k) => caches.delete(k)))
      location.reload()
    })
  }
}