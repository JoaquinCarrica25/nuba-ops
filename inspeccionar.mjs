// ============================================================
// Comprueba qué tablas responden con la clave pública
// uso: node scripts/inspeccionar.mjs
// ============================================================

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

for (const [nombre, proy] of Object.entries(PROYECTOS)) {
  console.log(`\n================ ${nombre.toUpperCase()} ================`);
  for (const t of proy.tablas) {
    const r = await fetch(`${proy.url}/rest/v1/${t}?select=*&limit=3`, {
      headers: {
        apikey: proy.key,
        Authorization: `Bearer ${proy.key}`,
        Prefer: "count=exact",
        Range: "0-2",
      },
    });
    const total = r.headers.get("content-range")?.split("/")?.[1] ?? "?";
    const cuerpo = await r.text();
    console.log(`${t}: HTTP ${r.status} · filas=${total}`);
    if (r.ok && cuerpo.trim() !== "[]") {
      console.log("  " + cuerpo.slice(0, 400).replace(/\s+/g, " "));
    } else if (!r.ok) {
      console.log("  " + cuerpo.slice(0, 200));
    }
  }
}
