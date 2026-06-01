# Cáscara · Startup

Presentación web de la **estructura societaria y económica de Cáscara** — un deck
de slides autónomo (HTML/CSS/JS, sin build ni frameworks) pensado para mostrarse a
pantalla completa y publicarse en GitHub Pages.

La última slide ofrece la descarga de los **dos documentos respaldatorios** en PDF.

## Estructura

```
index.html                          → el deck (34 slides, navegación con ← →)
docs/
  cascara-founders.pdf              → Documento 01 · Founders, Equity y Revenue
  cascara-estructura-economica.pdf  → Documento 02 · Estructura Económica B2C + B2B
  source/
    cascara_founders_v3.md          → fuente del Documento 01
    cascara_estructura_economica_respaldo.md → fuente del Documento 02
assets/
  star-data-uri.txt                 → ícono de marca (usado por el generador de PDFs)
build/
  build-docs.mjs                    → genera los PDFs a partir de los .md
  package.json
```

## Regenerar los PDFs

Los PDFs se generan desde los `.md` de `docs/source/` con la estética de Cáscara
(crema / tinta / azul serif, portada con el ícono de marca).

```bash
cd build
npm install        # marked + puppeteer (descarga Chromium la primera vez)
npm run docs       # escribe los PDFs en docs/
```

Para previsualizar con screenshots: `PREVIEW=1 npm run docs` (deja PNGs en /tmp).

## Publicar (GitHub Pages)

El sitio es estático: alcanza con servir la raíz del repo.

1. Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
2. La URL queda como `https://facundocouyet.github.io/cascarastartup/`.
3. Para un subdominio propio: agregar un archivo `CNAME` en la raíz + registro
   CNAME en Hostinger apuntando a `facundocouyet.github.io`.

## Editar el contenido

- **Slides:** editar `index.html` directamente (cada slide es un `<section class="s-slide">`).
- **Documentos:** editar los `.md` de `docs/source/` y volver a correr `npm run docs`.
