// ============================================================
// Comprueba el estado final del proyecto de destino
// uso: node scripts/verificar.mjs
// ============================================================
const DESTINO = {
  url: "https://emhlqlwdiwckvufovyhi.supabase.co",
  key: "sb_publishable_4ukFFAdDqpTYhUPBBeSJZQ_SDJRNxOV",
};

async function contar(tabla, filtro = "") {
  const r = await fetch(`${DESTINO.url}/rest/v1/${tabla}?select=id&limit=1${filtro}`, {
    headers: { apikey: DESTINO.key, Authorization: `Bearer ${DESTINO.key}`, Prefer: "count=exact" },
  });
  const total = r.headers.get("content-range")?.split("/")?.[1] ?? "?";
  return `${tabla}${filtro ? filtro : ""} = ${total} (HTTP ${r.status})`;
}

console.log(await contar("apartamentos"));
console.log(await contar("apartamentos", "&slug=not.is.null"));
console.log(await contar("reservas"));
console.log(await contar("averias"));
console.log(await contar("averias", "&estado=eq.pendiente"));
console.log(await contar("tareas"));
console.log(await contar("tareas", "&estado=eq.completada"));
console.log(await contar("tareas", "&extra=is.true"));
console.log(await contar("historial_nuba"));
