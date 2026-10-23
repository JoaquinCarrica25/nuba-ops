# Nuba Ops

Una sola aplicación para la prevención y las incidencias de los 25 apartamentos de Nuba.
Sustituye a `nuba-mantenimiento` y `nuba-incidencias-mantenimiento`, que se quedan en una
sola web.

React 18 + Vite 5 + Tailwind 3 + Supabase. Despliegue estático en Vercel (plan gratuito).

---

## Estado actual (v1)

Conectada al proyecto de Supabase de incidencias: 25 apartamentos, 276 reservas, 41 averías,
257 tareas (checklist migrado de la app de mantenimiento) y 137 registros de historial.

Si no hay variables de entorno, la app arranca en **modo demo** con datos de prueba locales.

| Pantalla | Qué hace |
|---|---|
| **Acceso** | ¿Quién eres? La sesión se recuerda al recargar |
| **Inicio** | Métricas del día, lo que requiere atención, check-outs y los 25 pisos con su estado |
| **Prevención** | Checklist de 31 puntos (35 en Robledo) agrupado, con frecuencia, responsable, sí/no funciona, notas y foto |
| **Incidencias** | Altas con urgencia y foto, aviso de check-out, y resolución con coste y foto de cierre |
| **Calendario** | Rejilla mensual de ocupación, con alta, edición y borrado de reservas |
| **Historial** | Reparaciones cerradas con coste y estado de revisión de cada piso |
| **Ajustes** | Estado de la conexión, equipo y capacidad de cada piso |

### Arreglos respecto a las apps antiguas

- **Ya no se pierde nada al recargar**: sesión, filtros y datos persisten.
- **Las fotos se suben siempre**: se comprimen en el móvil (máx. 1600 px, ~200 KB) antes de
  salir a la red, con mensaje de error claro si algo falla.
- **Hay URLs de verdad**: `/prevencion?apto=imperial` se puede compartir y el botón atrás
  funciona.
- Sin contraseñas escritas en el código.
- 253 kB de JS (77 kB gzip) frente a 438 kB de la app antigua.

---

## Desarrollo local

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de producción en dist/
```

Para revisar la build:

```bash
node scripts/servir.mjs 4173
```

Scripts de verificación (necesitan `npx playwright install chromium`):

```bash
node scripts/capturas.mjs      # capturas de todas las pantallas + errores de consola
node scripts/probar-foto.mjs   # prueba real de subida de foto
node scripts/probar-reserva.mjs # prueba real de alta de reserva
```

---

## Base de datos

El esquema completo está en [`supabase/schema.sql`](supabase/schema.sql): cuatro tablas
(`apartamentos`, `reservas`, `tareas`, `incidencias`), políticas RLS y el bucket de storage
`evidencias`.

Los apartamentos se identifican por un `id` estable (`almaden`, `cava-alta`…) y guardan en
`legacy` el nombre que tienen hoy en las dos apps (`ALMADEN`, `CAVA ALTA`…), lo que permite
migrar sin perder registros y resuelve el desajuste `Mayor` / `MAYOR`.

### Migración desde las dos apps antiguas

1. Crear el proyecto nuevo en Supabase.
2. Ejecutar `supabase/schema.sql` en el SQL Editor.
3. Copiar los datos:
   - `nuba-mantenimiento` → `verificaciones` y `historial`
   - `nuba-incidencias-mantenimiento` → `apartamentos`, `reservas`, `tareas_preventivas`, `averias`
4. Las fotos de los buckets `evidencias` y `evidencias-incidencias` se copian al bucket nuevo.

---

## Despliegue

1. Subir el proyecto a GitHub.
2. Vercel → New Project → importar el repo.
3. Framework: **Vite**. Build: `npm run build`. Output: `dist`.
4. Variables de entorno (cuando estén): `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. El `vercel.json` ya incluye la reescritura a `index.html` para que las rutas funcionen.
