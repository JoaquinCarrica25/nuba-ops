// ============================================================
// Analiza la copia de seguridad y resume el uso real
// uso: node scripts/analizar.mjs
// ============================================================
import { readFile } from "node:fs/promises";

const dir = "datos/backup-2026-10-22";
const leer = async (f) => JSON.parse(await readFile(`${dir}/${f}.json`, "utf8"));

const [
  apartamentos,
  reservas,
  tareasPrev,
  averias,
  verificaciones,
  historial,
] = await Promise.all([
  leer("incidencias__apartamentos"),
  leer("incidencias__reservas"),
  leer("incidencias__tareas_preventivas"),
  leer("incidencias__averias"),
  leer("mantenimiento__verificaciones"),
  leer("mantenimiento__historial"),
]);

const nombrePorId = Object.fromEntries(apartamentos.map((a) => [a.id, a.nombre]));
const contar = (arr, fn) =>
  arr.reduce((m, x) => {
    const k = fn(x);
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});

console.log("========== RESERVAS ==========");
const fechas = reservas.map((r) => r.fecha_entrada).sort();
console.log(`total: ${reservas.length}`);
console.log(`desde ${fechas[0]?.slice(0, 10)} hasta ${fechas[fechas.length - 1]?.slice(0, 10)}`);
const ahora = new Date().toISOString().slice(0, 19);
console.log(`activas ahora: ${reservas.filter((r) => r.fecha_entrada <= ahora && r.fecha_salida >= ahora).length}`);
console.log(`futuras: ${reservas.filter((r) => r.fecha_entrada > ahora).length}`);
const porApto = contar(reservas, (r) => nombrePorId[r.apartamento_id] || "?");
console.log("reparto:", Object.entries(porApto).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" · "));

console.log("\n========== AVERÍAS / INCIDENCIAS ==========");
console.log(`total: ${averias.length}`, contar(averias, (a) => a.estado));
console.log("urgencia:", contar(averias, (a) => a.urgencia));
console.log(`coste total: ${averias.reduce((s, a) => s + Number(a.coste || 0), 0)} €`);
console.log(`con foto apertura: ${averias.filter((a) => a.foto_apertura_url).length} · con foto cierre: ${averias.filter((a) => a.foto_cierre_url).length}`);
console.log("abiertas:", averias.filter((a) => a.estado === "pendiente").map((a) => `${nombrePorId[a.apartamento_id]}: ${a.descripcion.slice(0, 40)}`));

console.log("\n========== TAREAS PREVENTIVAS (app A) ==========");
console.log(`total: ${tareasPrev.length}`, contar(tareasPrev, (t) => t.estado));
console.log("por piso:", contar(tareasPrev, (t) => nombrePorId[t.apartamento_id] || "?"));

console.log("\n========== VERIFICACIONES (app B) ==========");
console.log(`total: ${verificaciones.length}`);
const porPiso = contar(verificaciones, (v) => v.apartamento);
console.log("por piso:", Object.entries(porPiso).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" · "));
console.log(`comprobadas: ${verificaciones.filter((v) => v.estado).length}`);
console.log(`con foto: ${verificaciones.filter((v) => v.foto_url).length}`);

console.log("\n========== HISTORIAL (app B) ==========");
console.log(`total: ${historial.length}`);
const fechasH = historial.map((h) => h.fecha_verificacion).filter(Boolean).sort();
console.log(`desde ${fechasH[0]} hasta ${fechasH[fechasH.length - 1]}`);
console.log(`con foto: ${historial.filter((h) => h.foto_url).length}`);

console.log("\n========== CALIDAD DE DATOS ==========");
const conEspacios = apartamentos.filter((a) => a.nombre !== a.nombre.trim());
console.log("nombres con espacios sobrantes:", conEspacios.map((a) => JSON.stringify(a.nombre)));
const idsReserva = new Set(reservas.map((r) => r.apartamento_id));
console.log(`apartamentos con reservas: ${idsReserva.size} de ${apartamentos.length}`);
const legacyVistos = new Set([...verificaciones.map((v) => v.apartamento), ...historial.map((h) => h.apartamento)]);
console.log("nombres usados en app B:", [...legacyVistos].join(" · "));
