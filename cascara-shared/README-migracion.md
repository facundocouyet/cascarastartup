# Cáscara · hoja de estilos compartida — guía de migración

Convierte el design system de Cáscara en **un solo archivo** que todas las
páginas linkean. Migrar una página = **2 cambios** (borrar tokens + linkear css).
Sin tocar el HTML del contenido.

---

## Qué hay en esta carpeta (`cascara-shared/`)

```
cascara-shared/
├── cascara.css     ← LA hoja compartida (tokens oficiales + @font-face + base + logos)
├── fonts/          ← Helvetica Neue LT Std (14 pesos) + Redaction 10 Italic (.otf)
├── logos/          ← wordmark (inline/stacked · black/white/blue) · cáscara · jinete-arquero
└── stickers/       ← star-archer (la estrella OFICIAL, con el arquero adentro)
```

Subí **toda la carpeta `cascara-shared/`** a cada repo (a la raíz, junto al `index.html`).

---

## La migración, paso a paso (por página)

### 1. Linkear la hoja en el `<head>`
```html
<link rel="stylesheet" href="cascara-shared/cascara.css">
```
> Ajustá la ruta según dónde quede la carpeta. Si `cascara-shared/` está en la
> raíz del repo y el HTML también, `cascara-shared/cascara.css` es correcto.

### 2. Borrar el bloque `:root` viejo del `<style>` embebido
Cada página tiene esto al inicio de su `<style>` — **eliminalo entero**:
```css
:root{
  --cream:#DBD8D3; --cream-soft:#E6E3DE; ...
  --blue:#1400FF; ...
  --font-sans:'Helvetica Neue',...; --font-serif:'Redaction',...;
}
```
`cascara.css` redefine **esos mismos nombres** (`--blue`, `--cream`, `--ink`,
`--font-sans`…) con los valores **oficiales**. Todo el resto del CSS de la
página (que usa `var(--blue)`, etc.) sigue funcionando sin cambios — ahora con
el azul oficial `#10069F` y las fuentes reales cargadas.

### 3. Cambiar las ESTRELLAS de 4 puntas por recursos reales de marca
> ⚠️ La estrella geométrica de 4 puntas **NO es de Cáscara** (el brand book dice
> *"never a geometric sparkle"*). Reemplazala así en cada página:
>
> - **Estrella grande de fondo (bgstar):** `logo-mark-white.png` / `-black.png` (jinete-arquero) como marca de agua.
> - **Estrella ★ dentro de recuadros (`.q::after`):** misma marca de agua del arquero, faint.
> - **Sello ★ en tarjetas (`.cn`):** el sticker `stickers/star-archer.png` (la estrella oficial con arquero).
>
> En la página molde están los tres reemplazos hechos — copiá el patrón.

### 4. (Opcional, recomendado) Reemplazar el "★ Cáscara" de texto por el logo real
- **Navbar / footer:** `<img src="cascara-shared/logos/wordmark-inline-black.png" style="height:15px">`
- **Sobre fondo azul/negro:** usá la variante `-white.png`.
- **Portada / hero:** el emblema `logo-mark-black.png` (jinete-arquero) como
  marca de agua sutil queda muy bien (ver la página molde).

**Eso es todo.** El reset (`*{margin...}`), el grano de film y `::selection` ya
están en cada página y son idénticos a los de `cascara.css` — podés dejarlos o
borrarlos, no rompen nada.

---

## Mirá el ejemplo

`estratega0a1-migrado.html` (en la raíz del proyecto) es `estratega0a1` ya
migrado: muestra los 2 cambios + los 3 usos de logo. Usalo de molde.

---

## Repos a migrar

| Repo | Archivo | Notas |
|---|---|---|
| `estratega0a1`     | `index.html` | Deck. Migración directa (= la página molde). |
| `cascarastartup`   | `index.html` | Deck 45 slides, mismo sistema. Migración directa. |
| `grecia`           | `index.html` | Landing. Mismo `:root`; las clases propias (villa, boat, itin…) quedan igual. |
| `cascaradireccion-`| `index.html` | Web app. Tiene su CSS embebido + `css/styles.css` (placeholder). Revisá que el `:root` esté en el `<style>` inline y aplicá lo mismo. |

---

## Cambios oficiales que aplica esta migración

1. **Azul → `#10069F`** (oficial). Antes las páginas usaban el eléctrico `#1400FF`.
   *(Si alguna vez querés el eléctrico puntual, está en `--cc-blue-electric`.)*
2. **Fuentes reales.** Antes `'Helvetica Neue'`/`'Redaction'` caían a fuentes del
   sistema; ahora cargan los `.otf` vía `@font-face`.
3. **Tiza/negro oficiales.** `--cream` → `#DBD7D2`, `--ink` → `#000000`.
4. **Una sola fuente de verdad.** Cambiás un color en `cascara.css` → cambia en
   todas las páginas.

---

## Fase 2 (opcional, más adelante)

Las clases de componentes compartidas (`.kicker`, `.card`, `.grid`, `.flow`,
`.ladder`, `.q`, `.chip`, `.prices`…) hoy están **duplicadas** en cada página.
Se podrían centralizar también en `cascara.css` para dejar el `<style>` de cada
página con sólo lo específico (villa, boat, itin…). No es urgente y tiene más
riesgo de conflictos, por eso se deja para una segunda pasada.

---

## Nota sobre fuentes

Helvetica Neue LT Std es una tipografía con licencia. Servirla como webfont en
repos públicos de GitHub Pages expone los `.otf`. Es la misma situación del
design system; si te preocupa, considerá repos privados o subsetting. Decisión
tuya — lo dejo señalado.
