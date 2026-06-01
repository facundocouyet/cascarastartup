// ============================================================
//  Cáscara · Generador de documentos respaldatorios (PDF)
//  Convierte los .md de docs/source/ en PDFs limpios estilo
//  documento Word: fondo blanco, texto negro, simple y legible.
//
//  Uso:  npm run docs      (desde la carpeta build/)
// ============================================================
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'docs', 'source');
const OUT = join(ROOT, 'docs');

// Documentos a generar
const DOCS = [
  { src: 'cascara_founders_v3.md', out: 'cascara-founders.pdf' },
  { src: 'cascara_estructura_economica_respaldo.md', out: 'cascara-estructura-economica.pdf' },
];

// --- Plantilla: documento blanco simple (estilo Word) ----------------------
function buildHtml({ title, subtitle, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<style>
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; background:#fff; color:#1a1a1a;
  font-family:'Calibri','Segoe UI','Helvetica Neue',Arial,sans-serif;
  font-size:11pt; line-height:1.5; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* Título del documento */
.doc-title{ font-size:21pt; font-weight:700; line-height:1.2; margin:0 0 4px; }
.doc-sub{ font-size:11.5pt; color:#666; font-style:italic; margin:0 0 14px; }
.doc-rule{ border:none; border-top:1px solid #d0d0d0; margin:0 0 22px; }

/* Encabezados */
h2{ font-size:15pt; font-weight:700; margin:22px 0 8px; line-height:1.25; }
h3{ font-size:12.5pt; font-weight:700; margin:16px 0 6px; }
h4{ font-size:11pt; font-weight:700; margin:13px 0 5px; }
h2,h3,h4{ page-break-after:avoid; }

/* Texto */
p{ margin:0 0 10px; }
strong{ font-weight:700; }
em{ font-style:italic; }
a{ color:#1a1a1a; text-decoration:underline; }
ul,ol{ margin:0 0 12px 24px; padding:0; }
li{ margin-bottom:5px; line-height:1.45; }
hr{ border:none; border-top:1px solid #e0e0e0; margin:20px 0; }
blockquote{ margin:0 0 12px; padding:8px 16px; border-left:3px solid #cfcfcf;
  background:#fafafa; color:#333; }

/* Bloques de código / fórmulas */
pre{ background:#f6f6f6; border:1px solid #e2e2e2; border-radius:4px; padding:12px 16px;
  font-family:'Consolas','SF Mono',Menlo,monospace; font-size:10pt; line-height:1.55;
  white-space:pre-wrap; margin:0 0 14px; page-break-inside:avoid; }
code{ font-family:'Consolas','SF Mono',Menlo,monospace; font-size:0.92em;
  background:#f2f2f2; border-radius:3px; padding:1px 5px; }
pre code{ background:none; padding:0; }

/* Tablas estilo documento */
table{ width:100%; border-collapse:collapse; margin:6px 0 16px; font-size:10.5pt;
  page-break-inside:auto; }
thead{ display:table-header-group; }
tr{ page-break-inside:avoid; }
th,td{ border:1px solid #cfcfcf; padding:6px 10px; text-align:left; vertical-align:top; }
th{ background:#f0f0f0; font-weight:700; }
tbody tr:nth-child(even) td{ background:#fafafa; }
td.num,th.num{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
</style></head>
<body>
<h1 class="doc-title">${escapeHtml(title)}</h1>
${subtitle ? `<p class="doc-sub">${escapeHtml(subtitle)}</p>` : ''}
<hr class="doc-rule">
${bodyHtml}
</body></html>`;
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Marca como numéricas las celdas que son montos/porcentajes/números
function markNumericCells(html){
  return html.replace(/<(td|th)>([^<]*?)<\/\1>/g, (m, tag, inner) => {
    const t = inner.trim();
    const looksNumeric = /^[-+–]?[\dUSD$.,%×\s]+$/.test(t) && /\d/.test(t);
    return looksNumeric ? `<${tag} class="num">${inner}</${tag}>` : m;
  });
}

async function main(){
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const doc of DOCS){
    const raw = readFileSync(join(SRC, doc.src), 'utf8');
    const lines = raw.split('\n');

    const titleLine = lines.find(l => /^#\s+/.test(l)) || '';
    const title = titleLine.replace(/^#\s+/, '').trim();
    const subLine = lines.find(l => /^\*\*.+\*\*\s*$/.test(l.trim())) || '';
    const subtitle = subLine.replace(/\*\*/g, '').trim();

    let bodyMd = raw.replace(titleLine, '').replace(subLine, '');
    bodyMd = bodyMd.replace(/^\s*---\s*$/m, ''); // primer hr tras el header
    let bodyHtml = marked.parse(bodyMd, { mangle:false, headerIds:false });
    bodyHtml = markNumericCells(bodyHtml);

    const html = buildHtml({ title, subtitle, bodyHtml });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: join(OUT, doc.out),
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '18mm', left: '20mm', right: '20mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="width:100%; font-size:9px; color:#999; text-align:center; font-family:Arial,sans-serif;"><span class="pageNumber"></span></div>',
    });
    if (process.env.PREVIEW){
      writeFileSync(join('/tmp', doc.out.replace('.pdf','.html')), html);
      await page.setViewport({ width: 794, height: 1123 });
      await page.screenshot({ path: join('/tmp', doc.out.replace('.pdf','-preview.png')) });
    }
    await page.close();
    console.log(`✓ ${doc.out}  ←  ${doc.src}`);
  }
  await browser.close();
  console.log('\nListo. PDFs en docs/');
}

main().catch(e => { console.error(e); process.exit(1); });
