// ============================================================
// Prueba funcional: crear una reserva desde el calendario
// uso: node scripts/probar-reserva.mjs
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

await ctx.addInitScript(() => localStorage.setItem("nuba-ops:perfil", "Joaquín"));
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(String(e)));

await page.goto(`${BASE}/calendario`, { waitUntil: "load" });
await page.waitForTimeout(500);

await page.getByRole("button", { name: /Reserva/i }).first().click();
await page.waitForTimeout(350);
await page.locator("#root ~ * input").first().waitFor({ state: "detached" }).catch(() => {});

await page.getByRole("button", { name: "Guardar reserva" }).click();
await page.waitForTimeout(700);

const toast = await page.getByText("Reserva añadida").count();
await page.screenshot({ path: "capturas/10-calendario-nueva-reserva.png" });

console.log(toast > 0 ? "✓ Reserva creada desde el calendario" : "✗ No se creó la reserva");
if (errores.length) console.log("Errores:", errores.join(" | "));

await browser.close();
process.exit(toast > 0 ? 0 : 1);
