// ============================================================
//  Cáscara · Generador de documentos respaldatorios (PDF)
//  Convierte los .md de docs/source/ en PDFs con la estética
//  del deck (crema / tinta / azul serif, grano, portada).
//
//  Uso:  npm run docs      (desde la carpeta build/)
// ============================================================
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'docs', 'source');
const OUT = join(ROOT, 'docs');

// Estrella de marca (data URI extraída del deck) — opcional
const STAR_PATH = join(ROOT, 'assets', 'star-data-uri.txt');
const STAR = existsSync(STAR_PATH) ? readFileSync(STAR_PATH, 'utf8').trim() : '';

// Grano: mismo filtro de turbulencia que usa el deck
const GRAIN =
  "data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

// Documentos a generar
const DOCS = [
  {
    src: 'cascara_founders_v3.md',
    out: 'cascara-founders.pdf',
    eyebrow: 'Cáscara · Startup',
  },
  {
    src: 'cascara_estructura_economica_respaldo.md',
    out: 'cascara-estructura-economica.pdf',
    eyebrow: 'Cáscara · Estructura Económica',
  },
];

// --- Plantilla branded -----------------------------------------------------
function buildHtml({ title, accent, subtitle, eyebrow, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<style>
:root{
  --cream:#DBD8D3; --cream-soft:#E6E3DE; --cream-softer:#EEEBE6;
  --ink:#0A0A0C; --ink-soft:#1C1C1F; --ink-muted:#52525A; --ink-faint:#A8A8AC;
  --blue:#1400FF; --blue-soft:#6B7AFF;
  --line:rgba(0,0,0,0.08); --line-strong:rgba(0,0,0,0.14);
  --sans:'Helvetica Neue',Helvetica,Arial,system-ui,sans-serif;
  --serif:'Redaction','Times New Roman',Georgia,serif;
}
@page{ size:A4; margin:18mm 17mm 20mm; }
*{ box-sizing:border-box; margin:0; padding:0; }
html,body{ background:var(--cream); color:var(--ink); font-family:var(--sans);
  -webkit-font-smoothing:antialiased; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* Fondo crema a sangre completa, repetido en cada página.
   (El grano del deck se omite a propósito: en PDF multi-página
   Chromium lo rasteriza por página y dispara el peso del archivo.) */
.bg{ position:fixed; inset:0; background:var(--cream); z-index:-2; }

/* ---------- PORTADA ---------- */
.cover{ position:relative; height:calc(100vh - 38mm); display:flex; flex-direction:column;
  justify-content:center; page-break-after:always; }
.cover .star{ position:absolute; top:-6%; right:-8%; width:46vh; height:46vh; opacity:0.10; }
.cover .eyebrow{ font-size:11px; font-weight:800; letter-spacing:0.28em; text-transform:uppercase;
  color:var(--ink-muted); display:flex; align-items:center; gap:14px; margin-bottom:26px; }
.cover .eyebrow::before{ content:''; width:30px; height:1px; background:var(--blue); }
.cover h1.cover-title{ font-size:52px; font-weight:800; line-height:1.0; letter-spacing:-0.025em;
  max-width:14ch; }
.cover h1.cover-title .ac{ font-family:var(--serif); font-style:italic; font-weight:400;
  color:var(--blue); display:block; line-height:1.04; margin-top:6px; }
.cover .rule{ width:64px; height:2px; background:var(--blue); margin:34px 0 26px; }
.cover .subtitle{ font-family:var(--serif); font-style:italic; font-size:19px; color:var(--ink-muted);
  max-width:46ch; line-height:1.45; }
.cover .foot{ position:absolute; bottom:0; left:0; right:0; display:flex; justify-content:space-between;
  align-items:flex-end; font-size:11px; letter-spacing:0.16em; text-transform:uppercase;
  color:var(--ink-muted); font-weight:700; }
.cover .foot .star-mark{ color:var(--blue); }

/* ---------- CUERPO ---------- */
.body{ position:relative; max-width:none; }
.body h2{ font-size:27px; font-weight:800; letter-spacing:-0.02em; line-height:1.12;
  margin:34px 0 16px; padding-top:6px; page-break-after:avoid; }
.body h2 em{ font-family:var(--serif); font-style:italic; color:var(--blue); font-weight:400; }
.body h3{ font-size:18px; font-weight:800; margin:24px 0 10px; page-break-after:avoid; }
.body h3 em{ font-family:var(--serif); font-style:italic; color:var(--blue); font-weight:400; }
.body h4{ font-size:15px; font-weight:800; margin:18px 0 8px; page-break-after:avoid; }
.body p{ font-size:14.5px; line-height:1.7; color:var(--ink-soft); margin:0 0 13px; }
.body strong{ color:var(--ink); font-weight:700; }
.body em{ font-family:var(--serif); font-style:italic; color:var(--blue); font-style:italic; }
.body a{ color:var(--blue); text-decoration:none; }
.body ul,.body ol{ margin:0 0 15px 22px; }
.body li{ font-size:14.5px; line-height:1.65; color:var(--ink-soft); margin-bottom:7px; }
.body li::marker{ color:var(--blue); }
.body hr{ border:none; border-top:1px solid var(--line-strong); margin:26px 0; }
.body blockquote{ background:var(--cream-soft); border:1px solid var(--line);
  border-left:3px solid var(--blue); border-radius:10px; padding:16px 22px; margin:0 0 16px;
  font-size:14.5px; line-height:1.6; color:var(--ink-soft); }

/* Bloques de código / fórmulas */
.body pre{ background:var(--cream-softer); border:1px solid var(--line); border-radius:12px;
  padding:18px 22px; font-size:13.5px; line-height:1.7; margin:0 0 16px; white-space:pre-wrap;
  font-family:'SF Mono',ui-monospace,Menlo,Consolas,monospace; color:var(--ink-soft);
  page-break-inside:avoid; }
.body code{ font-family:'SF Mono',ui-monospace,Menlo,Consolas,monospace; font-size:0.9em;
  background:var(--cream-softer); border:1px solid var(--line); border-radius:5px; padding:1px 6px; }
.body pre code{ background:none; border:none; padding:0; }

/* Tablas — estilo big-table / modal del deck */
.body table{ width:100%; border-collapse:collapse; margin:6px 0 20px; font-size:13.5px;
  page-break-inside:auto; }
.body thead{ display:table-header-group; }
.body tr{ page-break-inside:avoid; }
.body th{ text-align:left; padding:11px 14px; font-size:10px; letter-spacing:0.12em;
  text-transform:uppercase; color:var(--ink-muted); font-weight:800;
  border-bottom:1.5px solid var(--line-strong); background:var(--cream-soft); }
.body td{ padding:11px 14px; border-bottom:1px solid var(--line); color:var(--ink-soft);
  vertical-align:top; }
.body td strong{ color:var(--blue); font-family:var(--serif); font-style:italic; font-weight:400;
  font-size:1.08em; }
.body tbody tr:nth-child(even) td{ background:rgba(0,0,0,0.018); }
/* columnas numéricas a la derecha (heurística: contienen dígitos y separadores) */
.body td.num, .body th.num{ text-align:right; font-variant-numeric:tabular-nums; }
</style></head>
<body>
<div class="bg"></div>

<section class="cover">
  ${STAR ? `<img class="star" src="${STAR}" alt="">` : ''}
  <div class="eyebrow">${eyebrow}</div>
  <h1 class="cover-title">${accent ? `${escapeHtml(title)}<span class="ac">${escapeHtml(accent)}</span>` : escapeHtml(title)}</h1>
  <div class="rule"></div>
  <div class="subtitle">${escapeHtml(subtitle || '')}</div>
  <div class="foot"><span class="star-mark">★ CÁSCARA · STARTUP</span><span>Documento respaldatorio</span></div>
</section>

<main class="body">
${bodyHtml}
</main>
</body></html>`;
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Marca como numérica las celdas de tabla que son montos/porcentajes/números
function markNumericCells(html){
  return html.replace(/<(td|th)>([^<]*?)<\/\1>/g, (m, tag, inner) => {
    const t = inner.trim();
    const isNum = /^[-–]?[\d.,]+%?$/.test(t) || /^USD/.test(t) || /^[+\-]?[\d.,]+\b/.test(t.replace(/\s/g,''));
    const looksNumeric = /^[-+–]?[\dUSD$.,%×\s]+$/.test(t) && /\d/.test(t);
    return looksNumeric ? `<${tag} class="num">${inner}</${tag}>` : m;
  });
}

async function main(){
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const doc of DOCS){
    const raw = readFileSync(join(SRC, doc.src), 'utf8');
    const lines = raw.split('\n');

    // Título: primera línea "# ..."
    const titleLine = lines.find(l => /^#\s+/.test(l)) || '';
    let fullTitle = titleLine.replace(/^#\s+/, '').trim();
    // Subtítulo: primera línea en negrita "**...**"
    const subLine = lines.find(l => /^\*\*.+\*\*\s*$/.test(l.trim())) || '';
    const subtitle = subLine.replace(/\*\*/g, '').trim();

    // Acento: parte después del "—" va en serif azul
    let title = fullTitle, accent = '';
    const dash = fullTitle.indexOf('—');
    if (dash !== -1){ title = fullTitle.slice(0, dash).trim(); accent = fullTitle.slice(dash + 1).trim(); }

    // Cuerpo: quitar título + subtítulo + primer separador, convertir el resto
    let bodyMd = raw
      .replace(titleLine, '')
      .replace(subLine, '');
    bodyMd = bodyMd.replace(/^\s*---\s*$/m, ''); // primer hr tras el header
    let bodyHtml = marked.parse(bodyMd, { mangle:false, headerIds:false });
    bodyHtml = markNumericCells(bodyHtml);

    const html = buildHtml({ title, accent, subtitle, eyebrow: doc.eyebrow, bodyHtml });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: join(OUT, doc.out),
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
    if (process.env.PREVIEW){
      writeFileSync(join('/tmp', doc.out.replace('.pdf','.html')), html);
      await page.setViewport({ width: 794, height: 1123 });
      await page.screenshot({ path: join('/tmp', doc.out.replace('.pdf','-cover.png')) }); // viewport = portada
    }
    await page.close();
    console.log(`✓ ${doc.out}  ←  ${doc.src}`);
  }
  await browser.close();
  console.log('\nListo. PDFs en docs/');
}

main().catch(e => { console.error(e); process.exit(1); });
