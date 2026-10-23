// ============================================================
// Prueba con datos REALES de Supabase
// uso: node scripts/probar-real.mjs
// ============================================================
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4173";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 1.6,
  locale: "es-ES",
  timezoneId: "Europe/Madrid",
  reducedMotion: "reduce",
});
await ctx.addInitScript(() => {
  localStorage.setItem("nuba-ops:perfil", "Joaquín");
  localStorage.removeItem("nuba-ops:db:v1");
});

const page = await ctx.newPage();
const errores = [];
page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
page.on("pageerror", (e) => errores.push(String(e)));

await page.goto(`${BASE}/`, { waitUntil: "load" });
// espera a que desaparezca el splash y aparezcan las métricas
await page.getByText("Requiere atención").waitFor({ timeout: 20000 });
await page.waitForTimeout(800);

const abiertas = await page.locator("text=ABIERTAS").locator("..").innerText().catch(() => "?");
await page.screenshot({ path: "capturas/11-inicio-real.png", fullPage: false });

const cuerpo = await page.locator("body").innerText();
console.log("Métricas:", abiertas.replace(/\n/g, " "));
console.log("Contiene 'incidencias abiertas':", /incidencias abiertas/i.test(cuerpo));
console.log("Pisos en pantalla:", (cuerpo.match(/Almadén|Carretas|Robledo/g) || []).length);

await page.goto(`${BASE}/prevencion?apto=almaden`, { waitUntil: "load" });
await page.waitForTimeout(2000);
const puntos = await page.locator("text=/de \\d+ puntos/").first().innerText().catch(() => "?");
console.log("Prevención:", puntos);
await page.screenshot({ path: "capturas/12-prevencion-real.png" });

console.log("Errores consola:", errores.length ? errores.slice(0, 3).join(" | ") : "ninguno");

await browser.close();
