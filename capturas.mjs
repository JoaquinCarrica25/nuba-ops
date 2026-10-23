// ============================================================
// Capturas de pantalla automáticas para revisar el diseño
// uso: node scripts/capturas.mjs
// ============================================================
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE || "http://127.0.0.1:4173";
const OUT = "capturas";

const MOVIL = { width: 390, height: 844 };
const ESCRITORIO = { width: 1440, height: 950 };

const PANTALLAS = [
  { nombre: "01-acceso", ruta: "/", vp: ESCRITORIO, perfil: null, full: false },
  { nombre: "02-inicio", ruta: "/", vp: ESCRITORIO, perfil: "Joaquín" },
  { nombre: "03-inicio-movil", ruta: "/", vp: MOVIL, perfil: "Joaquín", full: false },
  { nombre: "04-prevencion", ruta: "/prevencion?apto=almaden", vp: ESCRITORIO, perfil: "Joaquín" },
  { nombre: "05-prevencion-movil", ruta: "/prevencion?apto=imperial", vp: MOVIL, perfil: "Joaquín", full: false },
  { nombre: "06-incidencias", ruta: "/incidencias", vp: ESCRITORIO, perfil: "Joaquín" },
  { nombre: "07-calendario", ruta: "/calendario", vp: ESCRITORIO, perfil: "Joaquín" },
  { nombre: "08-historial", ruta: "/historial", vp: ESCRITORIO, perfil: "Joaquín" },
  { nombre: "09-ajustes", ruta: "/ajustes", vp: ESCRITORIO, perfil: "Joaquín" },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
let fallos = 0;

for (const p of PANTALLAS) {
  const ctx = await browser.newContext({
    viewport: p.vp,
    deviceScaleFactor: 1.6,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    reducedMotion: "reduce",
  });

  await ctx.addInitScript((perfil) => {
    try {
      if (perfil) localStorage.setItem("nuba-ops:perfil", perfil);
      else localStorage.removeItem("nuba-ops:perfil");
    } catch {}
  }, p.perfil);

  const page = await ctx.newPage();
  const errores = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(String(e)));

  await page.goto(BASE + p.ruta, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${p.nombre}.png`, fullPage: Boolean(p.full) });

  if (errores.length) {
    fallos++;
    console.log(`✗ ${p.nombre} — ${errores.slice(0, 3).join(" | ")}`);
  } else {
    console.log(`✓ ${p.nombre}`);
  }
  await ctx.close();
}

await browser.close();
console.log(fallos ? `\n${fallos} pantalla(s) con errores` : "\nTodas las pantallas sin errores de consola");
process.exit(fallos ? 1 : 0);
