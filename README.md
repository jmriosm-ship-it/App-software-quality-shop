# Quality Shop · Inventario

App de inventario y ventas para **Quality Shop Col** (Ocaña). Funciona en el celular como app instalable (PWA), guarda los datos
en el teléfono y los sincroniza con la nube (Supabase). También se puede empaquetar para Android con Capacitor.

## Para trabajar en el proyecto

```bash
npm install        # una sola vez, baja las dependencias
npm run dev        # abre la app para programar (se actualiza sola al guardar)
npm run build      # genera la versión final en la carpeta dist
```

Para que la nube funcione mientras programas, crea un archivo `.env` (mira `.env.example`) con la URL y la llave publishable de Supabase.

## Publicar

Cada vez que se sube un cambio a la rama `main` de GitHub, Netlify construye y publica la app solo (ver `netlify.toml`).
Los celulares que ya la tienen instalada se actualizan solos al abrirla con internet.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Pantallas | `src/components/` |
| Lógica de datos y sincronización | `src/coleccion.js`, `src/sync.js`, `src/useNube.js` |
| Textos legales (privacidad, términos) | `src/legal.js` |
| Base de datos de Supabase (SQL) | `supabase/esquema.sql` |
| Android (APK) | `android/` (se compila con `gradlew assembleDebug`) |

## Cuidado con las llaves

En este repositorio solo debe haber la **URL** y la llave **publishable** de Supabase (`.env.production`). Nunca subas la llave
`secret` ni `service_role` ni la contraseña de la base de datos.
