# Makers — Fotografía y Video

Sitio web estático de estudio fotográfico y de video ubicado en Felipe Carrillo Puerto, Quintana Roo.
Construido con **Astro 7**, **Tailwind CSS 4** y desplegado en **Vercel**.

## 🚀 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando                   | Acción                                                       |
| :------------------------ | :----------------------------------------------------------- |
| `npm install`             | Instala dependencias                                         |
| `npm run dev`             | Servidor de desarrollo en `localhost:4321`                   |
| `npm run build`           | Genera el sitio de producción en `./dist/`                   |
| `npm run preview`         | Previsualiza el build de producción localmente               |
| `npm run astro ...`       | Ejecuta comandos de la CLI de Astro (`astro add`, `astro check`, …) |

> **Videos del canal:** el listado se mantiene en `src/components/home/Video.astro` (constante `VIDEOS`).
> YouTube deprecó el feed RSS (`feeds/videos.xml` → 404), por eso la lista es manual.
> Añade una entrada `{ id, title }` por video; el primero es el que se muestra en grande.

> **Nota:** `astro check` requiere `@astrojs/check` y `typescript` (no instalados actualmente).
> Puedes añadirlos con `npm i -D @astrojs/check typescript`.

## 🗂 Estructura

```
├── public/                  # estáticos (favicon.svg, og-image.jpg)
└── src/
    ├── assets/              # imágenes, logos, global.css
    │   └── pictures/        # Casual, Bodas-fotos, Posters
    ├── layouts/Layout.astro
    ├── lib/main.js          # lógica JS centralizada y comentada
    ├── components/home/     # secciones de la página de inicio
    │   ├── Navbar, Welcome, Valores, Video, Planes,
    │   ├── Calculadora, FAQ, Footer
    │   └── galleries/       # Galeria, Boda, Posters
    └── pages/index.astro
```

## 🧩 Funcionalidades

- Galería de fotos (Casual / Boda) con tabs y efectos de tarjeta 3D.
- Carrusel de posters con autoplay, swipe táctil y teclado.
- Reproductor de video de YouTube (RSS del canal) con carrusel de miniaturas.
- Calculadora de cotización con envío por correo (`mailto:`).
- Sección de preguntas frecuentes (acordeón).
- Favicon, Open Graph y Twitter Card para compartir en redes.

## 🧠 JavaScript

Toda la lógica cliente vive en **un solo archivo**: `src/lib/main.js`, auto-inicializado al cargar el DOM,
agrupado por sección y comentado (índice en la cabecera del archivo): navbar, parallax, typewriter,
tarjetas 3D, modal, tabs, gallery reveal, carrusel de posters, video y calculadora + FAQ.
Se importa una sola vez desde `src/layouts/Layout.astro`.

---

# ✅ Registro de mejoras aplicadas

Revisión de compatibilidad entre navegadores, errores y rendimiento, aplicados sobre el proyecto.

## Alta prioridad (errores / compatibilidad)

1. ✅ **Favicon roto (404).** Se apuntaba a `/favicon.ico` inexistente. Ahora usa `/favicon.svg`, que sí existe en `public/`.
2. ✅ **Doble manejador `mousemove` en tarjetas.** El tilt 3D se registrarba dos veces (Welcome + Boda). Ahora se registra una sola vez en `initCardTilt()` (y se omite en pantallas táctiles / `prefers-reduced-motion`).
3. ✅ **`h-screen` (100vh) desbordaba en móvil.** El hero usa ahora `min-h-screen min-h-dvh` con fallback.
4. ✅ **`viewport` sin `initial-scale`.** Añadido `initial-scale=1`.
5. ✅ **Modal sin accesibilidad.** Ahora `role="dialog"`, `aria-modal`, `alt`, cierre con `Esc`, y captura/restauración de foco.
6. ✅ **Reacomodo de carpetas.** Componentes bajo `src/components/home/` (secciones + `galleries/`) y JS centralizado en `src/lib/main.js`.

## Media prioridad (rendimiento / robustez)

7. ✅ **`@latest` en CDN de iconos.** `tabler-icons-webfont` fijado a `3.46.0`.
8. ✅ **Teclado del carrusel de Posters.** Las flechas `←`/`→` solo responden cuando el foco está dentro del carrusel (no al escribir en la calculadora).
9. ✅ **Miniaturas de video `maxresdefault`.** Degradación elegante a `hqdefault` → `mqdefault` si la imagen no existe.
10. ✅ **`IntersectionObserver`.** Tiene fallback: si no existe, los elementos se muestran de inmediato.
11. ✅ **Rendimiento del video en el audit (Lighthouse/Astro).**
    - **iframe:** se eliminó el `src=""` vacío (evita una petición extra y CLS al cargar el reproductor), se agregó `loading="lazy"` y `allow` ampliado.
    - **imagen del video principal:** `width`/`height` explícitos (previene CLS) + `fetchpriority="high"`.
    - **miniaturas del carrusel:** `width`/`height` y `loading="lazy"`.

## Baja prioridad / pulido

12. ✅ **Componente sin uso.** Eliminado `src/components/Imagen.astro`.
13. ✅ **© dinámico.** El año del Footer se calcula con `new Date().getFullYear()` (ya no está fijo a 2025).
14. ✅ **`aria-label` en botones de icono.** Añadido a las flechas del carrusel de posters (prev/next) y `type="button"`.

## No aplicables / correcto ya

- **`w-4.25` y fracciones de opacidad** (`border-white/12`, `bg-white/2`, etc.): se verificó que **Tailwind v4 sí los genera** (`width: calc(var(--spacing)*4.25)`, etc.). No era un problema real.

## Pendiente (opcional)

- **Contraste de textos muy tenues** (`#cacaca/18`, `/25`, `/35`): no superan WCAG AA en algunas combinaciones. Revisar para mejorar legibilidad.
