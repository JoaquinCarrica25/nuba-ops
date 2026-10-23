// ============================================================
// Prueba funcional: subida de foto en Prevención
// uso: node scripts/probar-foto.mjs
// ============================================================
import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE = process.env.BASE || "http://127.0.0.1:4173";
const FOTO = resolve(process.cwd(), "capturas/_prueba.png");

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 1.6,
  locale: "es-ES",
  timezoneId: "Europe/Madrid",
  reducedMotion: "reduce",
});

await ctx.addInitScript(() => localStorage.setItem("nuba-ops:perfil", "Joaquín"));
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(String(e)));

await page.goto(`${BASE}/prevencion?apto=almaden`, { waitUntil: "load" });
await page.waitForTimeout(500);

// Abrir la primera fila plegada
await page.locator('button[aria-expanded="false"]').first().click();
await page.waitForTimeout(250);

const input = page.locator('input[type="file"]').first();
await input.setInputFiles(FOTO);
await page.waitForTimeout(1800);

const miniaturas = await page.locator('img[src^="data:image"]').count();
await page.screenshot({ path: "capturas/09-foto-prevencion.png" });

console.log(miniaturas > 0 ? `✓ Foto subida y visible (${miniaturas} miniatura/s)` : "✗ La foto no aparece");
if (errores.length) console.log("Errores:", errores.join(" | "));

await browser.close();
process.exit(miniaturas > 0 ? 0 : 1);
