// ============================================================
// Copia de seguridad de los dos proyectos antiguos
// uso: node scripts/exportar.mjs
// ============================================================
import { mkdir, writeFile } from "node:fs/promises";

const PROYECTOS = {
  incidencias: {
    url: "https://emhlqlwdiwckvufovyhi.supabase.co",
    key: "sb_publishable_4ukFFAdDqpTYhUPBBeSJZQ_SDJRNxOV",
    tablas: ["apartamentos", "reservas", "tareas_preventivas", "averias"],
  },
  mantenimiento: {
    url: "https://igcepqnkylriaxsajivz.supabase.co",
    key: "sb_publishable_ICununXRyvBWWMWQyelHVw_3ObX1t84",
    tablas: ["verificaciones", "historial"],
  },
};

const sello = new Date().toISOString().slice(0, 10);
const destino = `datos/backup-${sello}`;
await mkdir(destino, { recursive: true });

const resumen = [];

for (const [nombre, proy] of Object.entries(PROYECTOS)) {
  for (const tabla of proy.tablas) {
    const r = await fetch(`${proy.url}/rest/v1/${tabla}?select=*`, {
      headers: { apikey: proy.key, Authorization: `Bearer ${proy.key}` },
    });
    if (!r.ok) {
      console.log(`✗ ${nombre}.${tabla}: HTTP ${r.status}`);
      continue;
    }
    const filas = await r.json();
    await writeFile(`${destino}/${nombre}__${tabla}.json`, JSON.stringify(filas, null, 1), "utf8");
    resumen.push({ proyecto: nombre, tabla, filas: filas.length });
    console.log(`✓ ${nombre}.${tabla} → ${filas.length} filas`);
  }
}

await writeFile(`${destino}/_resumen.json`, JSON.stringify(resumen, null, 2), "utf8");
console.log(`\nCopia guardada en ${destino}`);
