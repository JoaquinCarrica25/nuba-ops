// ============================================================
// Lee la URL y la clave pública de Supabase desde el JS publicado.
// Son claves públicas: viajan en el bundle de cualquier visitante.
// uso: node scripts/sacar-claves.mjs
// ============================================================

const SITIOS = {
  incidencias: "https://nuba-incidencias-mantenimiento.vercel.app/",
  mantenimiento: "https://nuba-mantenimiento.vercel.app/",
};

const RE_URL = /https:\/\/[a-z0-9]{15,}\.supabase\.co/;
const RE_JWT = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;
const RE_PUB = /sb_publishable_[A-Za-z0-9_-]{10,}/;

for (const [nombre, base] of Object.entries(SITIOS)) {
  console.log(`\n=== ${nombre} ===`);
  try {
    const html = await (await fetch(base)).text();
    const refs = [...html.matchAll(/\/assets\/[^"']+\.js/g)].map((m) => m[0]);
    console.log(`bundles: ${refs.length}`);

    let url = null;
    let clave = null;

    for (const ref of refs.slice(0, 12)) {
      const js = await (await fetch(new URL(ref, base))).text();
      url ||= js.match(RE_URL)?.[0] || null;
      clave ||= js.match(RE_PUB)?.[0] || js.match(RE_JWT)?.[0] || null;

      // Contexto alrededor de "supabase.co" para ver cómo se guarda la clave
      if (!clave) {
        const i = js.indexOf(".supabase.co");
        if (i > -1) {
          const trozo = js.slice(Math.max(0, i - 120), i + 260);
          console.log("  contexto:", JSON.stringify(trozo));
        }
      }
    }

    console.log(`  URL : ${url || "NO"}`);
    console.log(`  CLAVE: ${clave || "NO"}`);
  } catch (e) {
    console.log("  ERROR", e.message);
  }
}
