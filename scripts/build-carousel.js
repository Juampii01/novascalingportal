#!/usr/bin/env node
// ─── NOVA Scaling — Carousel PNG Builder ──────────────────────────────────────
// Prereqs:  pnpm add puppeteer  (solo la primera vez)
// Uso:      node scripts/build-carousel.js --file=carrusel-mi-tema.json
// Output:   ~/Desktop/Instagram/[nombre-carrusel]/slide_01.png  ...

const path = require("path")
const fs   = require("fs")
const os   = require("os")

async function main() {
  const args    = process.argv.slice(2)
  const fileArg = args.find(a => a.startsWith("--file="))
  const jsonFile = fileArg?.split("=")[1]

  if (!jsonFile) {
    console.error("\n  ❌  Uso: node scripts/build-carousel.js --file=carrusel-nombre.json\n")
    process.exit(1)
  }
  if (!fs.existsSync(jsonFile)) {
    console.error(`\n  ❌  Archivo no encontrado: ${jsonFile}\n`)
    process.exit(1)
  }

  const carousel = JSON.parse(fs.readFileSync(jsonFile, "utf-8"))
  const name     = (carousel.name ?? "carrusel").toLowerCase().replace(/\s+/g, "-")

  // ─── Themes / Fonts ─────────────────────────────────────────────────────────
  const THEMES = {
    dark:  { bg: "#080808", text: "#ffffff", sub: "#a1a1aa", border: "#1a1a1a" },
    light: { bg: "#f5f5f0", text: "#111111", sub: "#6b7280", border: "#e0e0da" },
    cream: { bg: "#EAE6DD", text: "#141310", sub: "#6b7280", border: "#d4cfc5" },
  }
  const FONTS = {
    georgia:  { title: "Georgia, serif",                             body: "Georgia, serif" },
    playfair: { title: "'Playfair Display', Georgia, serif",         body: "'Lora', Georgia, serif" },
    impact:   { title: "Impact, 'Arial Black', sans-serif",          body: "Arial, sans-serif" },
  }

  const t      = THEMES[carousel.theme ?? "dark"]
  const f      = FONTS[carousel.fontPair ?? "georgia"]
  const accent = carousel.accentColor ?? "#22c55e"
  const gfImport = carousel.fontPair === "playfair"
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lora:wght@300;400&display=swap" rel="stylesheet">`
    : ""

  // ─── Output directory ────────────────────────────────────────────────────────
  const outDir = path.join(os.homedir(), "Desktop", "Instagram", name)
  fs.mkdirSync(outDir, { recursive: true })

  // ─── Puppeteer ───────────────────────────────────────────────────────────────
  let puppeteer
  try { puppeteer = require("puppeteer") }
  catch {
    console.error("\n  ❌  Puppeteer no instalado. Corré: pnpm add puppeteer\n")
    process.exit(1)
  }

  const browser = await puppeteer.launch({ headless: "new" })
  const page    = await browser.newPage()
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 })

  console.log(`\n  Building "${carousel.name}" (${carousel.slides.length} slides)...\n`)

  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i]
    const lines = (slide.title || "").split("\n")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
${gfImport}
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  html, body {
    width: 1080px; height: 1350px;
    background: ${t.bg};
    position: relative; overflow: hidden;
    font-family: ${f.body};
  }
  .label {
    position: absolute; top: 72px; left: 72px;
    font-size: 26px; font-family: monospace;
    letter-spacing: 6px; color: ${t.sub};
    text-transform: uppercase;
  }
  .logo {
    position: absolute; top: 56px; right: 72px;
    border: 1px solid ${t.border}; border-radius: 6px;
    padding: 7px 14px; font-size: 9px; color: ${t.sub};
    letter-spacing: 3px; font-family: monospace;
  }
  .center {
    position: absolute; left: 72px; right: 72px;
    top: 50%; transform: translateY(-58%);
  }
  .title {
    font-size: 104px; font-family: ${f.title}; font-weight: 700;
    line-height: 1.08; margin-bottom: 48px;
  }
  .title-default { color: ${t.text}; }
  .title-accent  { color: ${accent}; }
  .subtitle {
    font-size: 38px; font-family: ${f.body}; font-weight: 300;
    line-height: 1.65; color: ${t.sub};
  }
  .footer { position: absolute; bottom: 72px; left: 72px; right: 72px; }
  .footer-line { height: 1px; background: ${t.border}; margin-bottom: 32px; }
  .footer-cta {
    font-size: 24px; font-family: monospace;
    letter-spacing: 8px; color: ${t.sub}; text-transform: uppercase;
  }
  ${carousel.showCharacter ? `
  .character {
    position: absolute; bottom: 0; width: 380px; height: 580px;
    background: ${t.text}; opacity: 0.08;
    ${carousel.characterPosition === "bottom-right"
      ? "right:0; border-top-left-radius:999px;"
      : carousel.characterPosition === "bottom-left"
      ? "left:0; border-top-right-radius:999px;"
      : "left:50%; transform:translateX(-50%); border-radius:999px 999px 0 0;"}
  }` : ""}
</style>
</head>
<body>
  <div class="label">${slide.label || ""}</div>
  ${carousel.showLogo ? `<div class="logo">LOGO</div>` : ""}
  <div class="center">
    <div class="title">
      ${lines.map((ln, idx) => `<div class="${idx === lines.length - 1 ? "title-accent" : "title-default"}">${ln || "&nbsp;"}</div>`).join("")}
    </div>
    ${slide.subtitle ? `<div class="subtitle">${slide.subtitle}</div>` : ""}
  </div>
  ${carousel.showCharacter ? `<div class="character"></div>` : ""}
  <div class="footer">
    <div class="footer-line"></div>
    <div class="footer-cta">${slide.cta || "DESLIZÁ →"}</div>
  </div>
</body>
</html>`

    await page.setContent(html, { waitUntil: "networkidle0" })
    const filename = `slide_${String(i + 1).padStart(2, "0")}.png`
    await page.screenshot({ path: path.join(outDir, filename) })
    console.log(`  ✓ ${filename}`)
  }

  await browser.close()
  console.log(`\n  ✓ ${carousel.slides.length} slides exportados`)
  console.log(`  📁 ${outDir}\n`)
}

main().catch(e => { console.error("\n  ❌  Error:", e.message, "\n"); process.exit(1) })
