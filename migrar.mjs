// ============================================================
// Migración de la app antigua de mantenimiento al proyecto actual
// ============================================================
// 1) Ejecuta antes supabase/actualizar-proyecto-incidencias.sql
// 2) Prueba en seco:   node scripts/migrar.mjs
// 3) Aplicar de verdad: node scripts/migrar.mjs --apply
// ============================================================
import { readFile } from "node:fs/promises";
import { ITEMS } from "../src/lib/seed.js";

const DESTINO = {
  url: "https://emhlqlwdiwckvufovyhi.supabase.co",
  key: "sb_publishable_4ukFFAdDqpTYhUPBBeSJZQ_SDJRNxOV",
};
const ORIGEN_MANT = "https://igcepqnkylriaxsajivz.supabase.co";
const ORIGEN_MANT_KEY = "sb_publishable_ICununXRyvBWWMWQyelHVw_3ObX1t84";
const BACKUP = "datos/backup-2026-10-22";
const APLICAR = process.argv.includes("--apply");

const leer = async (f) => JSON.parse(await readFile(`${BACKUP}/${f}.json`, "utf8"));

const cabeceras = (extra = {}) => ({
  apikey: DESTINO.key,
  Authorization: `Bearer ${DESTINO.key}`,
  "Content-Type": "application/json",
  ...extra,
});

async function getDestino(tabla, select = "*") {
  const r = await fetch(`${DESTINO.url}/rest/v1/${tabla}?select=${select}`, { headers: cabeceras() });
  if (!r.ok) throw new Error(`${tabla}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
  return r.json();
}

async function insertar(tabla, filas, base = "id") {
  if (!APLICAR) return { enviadas: filas.length, ok: true, simulacro: true };
  const url = base
    ? `${DESTINO.url}/rest/v1/${tabla}?on_conflict=${base}`
    : `${DESTINO.url}/rest/v1/${tabla}`;
  const r = await fetch(url, {
    method: "POST",
    headers: cabeceras({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(filas),
  });
  if (!r.ok) {
    return { enviadas: filas.length, ok: false, error: `${r.status} ${(await r.text()).slice(0, 300)}` };
  }
  return { enviadas: filas.length, ok: true };
}

// --- 1. Apartamentos destino ---------------------------------
let apartamentos;
try {
  apartamentos = await getDestino("apartamentos", "id,nombre,slug");
} catch {
  apartamentos = await getDestino("apartamentos", "id,nombre");
  console.log("(la columna slug todavía no existe: ejecuta el SQL antes de aplicar)");
}
console.log(`Destino: ${apartamentos.length} apartamentos`);
const sinSlug = apartamentos.filter((a) => !a.slug);
if (sinSlug.length) {
  console.log(`⚠️  ${sinSlug.length} apartamentos sin slug: ejecuta primero el SQL`);
}

const porLegacy = new Map(apartamentos.map((a) => [a.nombre.trim().toUpperCase(), a]));

// --- 2. Verificaciones → tareas ------------------------------
const verificaciones = await leer("mantenimiento__verificaciones");
const itemPorId = new Map(ITEMS.map((i) => [i.id, i]));
const tareasVerif = [];
const huerfanas = new Set();

for (const v of verificaciones) {
  const apt = porLegacy.get(String(v.apartamento).trim().toUpperCase());
  if (!apt) {
    huerfanas.add(v.apartamento);
    continue;
  }
  const item = itemPorId.get(v.item_id);
  tareasVerif.push({
    id: `v-${apt.id.slice(0, 8)}-${v.item_id}`,
    apartamento_id: apt.id,
    item_id: v.item_id,
    nombre: item?.nombre || `Punto ${v.item_id}`,
    grupo: item?.grupo || "otros",
    frecuencia: v.frecuencia || "Semanalmente",
    estado: v.estado ? "completada" : "pendiente",
    funciona: v.funciona,
    fecha: v.fecha_verificacion,
    hora: null,
    responsable: v.responsable || "",
    notas: v.notas || "",
    patron_accion: v.patron_accion || "",
    foto_url: v.foto_url,
    extra: false,
  });
}

// --- 3. Tareas preventivas → tareas (extras) -----------------
const tareasPrev = await leer("incidencias__tareas_preventivas");
const aptosInc = await leer("incidencias__apartamentos");
const idInc = new Map(aptosInc.map((a) => [a.id, a]));

const grupoPorTexto = (t = "") => {
  const s = t.toLowerCase();
  if (s.includes("filtro") || s.includes("aire acond")) return "clima";
  if (s.includes("sifón") || s.includes("sifon") || s.includes("baño")) return "bano";
  return "otros";
};

const tareasExtra = tareasPrev.map((t) => {
  const apt = idInc.get(t.apartamento_id);
  const destino = apt ? porLegacy.get(apt.nombre.trim().toUpperCase()) : null;
  return {
    id: `p-${t.id.slice(0, 8)}`,
    apartamento_id: destino?.id || null,
    item_id: null,
    nombre: t.tarea,
    grupo: grupoPorTexto(t.tarea),
    frecuencia: "Mensualmente",
    estado: t.estado === "completada" ? "completada" : "pendiente",
    funciona: null,
    fecha: t.fecha || null,
    hora: t.hora || null,
    responsable: t.realizado_por || "",
    notas: t.notas || "",
    patron_accion: "",
    foto_url: t.foto_url || null,
    extra: true,
  };
});

// --- 4. Historial → historial_nuba ---------------------------
const historial = await leer("mantenimiento__historial");
const historialNuevo = historial.map((h) => {
  const apt = porLegacy.get(String(h.apartamento).trim().toUpperCase());
  return {
    apartamento_id: apt?.id || null,
    item_id: h.item_id,
    nombre: h.nombre,
    estado: h.estado,
    funciona: h.funciona,
    responsable: h.responsable || "",
    notas: h.notas || "",
    foto_url: h.foto_url,
    fecha_verificacion: h.fecha_verificacion,
  };
});

// --- Resumen -------------------------------------------------
console.log(`\nVerificaciones → tareas: ${tareasVerif.length}`);
console.log(`  pisos: ${[...new Set(tareasVerif.map((t) => t.apartamento_id.slice(0, 8)))].length}`);
console.log(`  completadas: ${tareasVerif.filter((t) => t.estado === "completada").length}`);
if (huerfanas.size) console.log(`  ⚠️ sin apartamento destino: ${[...huerfanas].join(", ")}`);

console.log(`\nTareas preventivas → tareas (extras): ${tareasExtra.length}`);
const sinDestino = tareasExtra.filter((t) => !t.apartamento_id);
if (sinDestino.length) console.log(`  ⚠️ ${sinDestino.length} sin apartamento destino`);

console.log(`\nHistorial → historial_nuba: ${historialNuevo.length}`);
console.log(`  sin apartamento: ${historialNuevo.filter((h) => !h.apartamento_id).length}`);

console.log(`\nEjemplo de fila migrada:
${JSON.stringify(tareasVerif[0], null, 2)}`);

if (!APLICAR) {
  console.log("\n(Simulacro: no se ha escrito nada. Añade --apply para migrar de verdad)");
  process.exit(0);
}

// --- 5. Escritura --------------------------------------------
const r1 = await insertar("tareas", tareasVerif);
console.log(`\ntareas (verificaciones): ${r1.ok ? "OK" : "ERROR"} ${r1.enviadas} · ${r1.error || ""}`);

const r2 = await insertar("tareas", tareasExtra);
console.log(`tareas (extras): ${r2.ok ? "OK" : "ERROR"} ${r2.enviadas} · ${r2.error || ""}`);

const r3 = await insertar("historial_nuba", historialNuevo, null);
console.log(`historial_nuba: ${r3.ok ? "OK" : "ERROR"} ${r3.enviadas} · ${r3.error || ""}`);
