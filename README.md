# Makers — Fotografía y Video

Sitio web estático de estudio fotográfico y de video en Felipe Carrillo Puerto, Quintana Roo.
**Astro 7** · **Tailwind CSS 4** · **Vercel** · Producción: https://makersfotoyvideo.vercel.app/

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # localhost:4321
npm run build      # generar ./dist/
npm run preview    # previsualizar build
```

## Estructura

```
├── public/                     # favicon.svg, robots.txt
└── src/
    ├── assets/
    │   ├── global.css          # sistema de temas (dark/light) con CSS variables
    │   └── pictures/           # subcarpetas: Casual/, Bodas-fotos/, Posters/, XV/
    ├── layouts/Layout.astro    # <html>, meta, JSON-LD, init script de tema
    ├── lib/main.js             # toda la lógica cliente (1 solo archivo, comentado)
    ├── components/home/
    │   ├── Navbar.astro        # nav + ThemeToggle + link contacto
    │   ├── Welcome.astro       # hero, about, galería tabs, modal, planes, calculadora, FAQ
    │   ├── ThemeToggle.astro   # botón sol/luna con SVG inline
    │   ├── Video.astro         # reproductor YouTube + carrusel miniaturas
    │   ├── Planes.astro        # tarjetas de paquetes (orange container)
    │   ├── Calculadora.astro   # cotizador con validación y envío por correo
    │   ├── FAQ.astro           # acordeón con ARIA
    │   ├── Valores.astro       # marquee de valores
    │   ├── Footer.astro        # contacto, equipo, copyright
    │   └── galleries/
    │       ├── Gallery.astro   # componente genérico reutilizable
    │       └── Posters.astro   # carrusel de posters
    └── pages/index.astro       # punto de entrada (SPA de 1 página)
```

## Arquitectura del tema (dark/light)

- CSS variables definidas en `:root` (dark, default) y `html.light` en `global.css`
- Init script inline en `<head>` de Layout.astro lee `localStorage` y aplica clase `light` antes del render (anti-FOUC)
- Toggle guarda preferencia en `localStorage` y detecta `prefers-color-scheme`
- Colores principales: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--accent`

## Galerías

- **Gallery.astro** es el componente unificado. Se usa con props:
  ```astro
  <Gallery folder="Casual" label="Casual" exclude="Posters" />
  <Gallery folder="Bodas-fotos" label="Boda" />
  ```
- Para agregar una categoría: crear carpeta en `pictures/`, agregar `<Gallery>` en las tabs de Welcome.astro
- Posters.astro es un carrusel separado (diseño diferente)

## JavaScript (`src/lib/main.js`)

Un solo archivo con todas las funciones, auto-inicializadas en `DOMContentLoaded`:
- `initNavbar` — nav sticky + theme
- `initHeroParallax` — parallax en hero
- `initTypewriter` — efecto máquina de escribir
- `initCardTilt` — tarjetas 3D con mouse
- `initModal` — modal de imagen con zoom y pan
- `initTabs` — tabs de galería con ARIA
- `initScrollReveal` — animaciones bidireccionales (entrada/salida) con blur
- `initPosterCarousel` — carrusel con autoplay y swipe
- `initVideoPlayer` — YouTube embed + miniaturas
- `initCalculator` — lógica de cotización
- `initFaq` — acordeón con ARIA
- `initPlanSpotlight` — efecto spotlight en tarjetas de planes

## Mejoras futuras pendientes

### Rendimiento
- [ ] Lazy loading nativo `loading="lazy"` en imágenes de galería (actualmente usa Astro Image optimizado pero sin lazy explícito)
- [ ] Prefetch de páginas internas si se agregan (actualmente es SPA de 1 página)
- [ ] Evaluar `astro:check` e instalar `typescript` para tipado estático

### Funcionalidad
- [ ] Formulario de contacto real (actualmente envía por `mailto:`)
- [ ] Página de XV Años (tab deshabilitada con "Próximamente")
- [ ] Página de Infantiles (tab deshabilitada con "Próximamente")
- [ ] Galería con filtrado por tipo de sesión dentro de cada categoría

### SEO / Accesibilidad
- [ ] `@astrojs/check` para validar build con tipos
- [ ] Meta description dinámica por página (actualmente solo en Layout)
- [ ] Imágenes de Open Graph por sección

### Diseño
- [ ] Animación de entrada más suave en el hero (actualmente usa blur + translateY)
- [ ] Evaluar si la sección de Planes necesita más contraste en modo claro
- [ ] Testear en navegadores más antiguos (safari 15, edge legacy)
