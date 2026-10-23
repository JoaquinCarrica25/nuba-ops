// ============================================================
// Servidor estático para revisar la build en local
// uso: node scripts/servir.mjs [puerto]
// ============================================================
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const raiz = resolve(process.cwd(), "dist");
const puerto = Number(process.argv[2] || 4173);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

async function existe(p) {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let fichero = join(raiz, url);

  if (!(await existe(fichero))) fichero = join(raiz, "index.html"); // SPA

  try {
    const datos = await readFile(fichero);
    res.writeHead(200, {
      "Content-Type": TIPOS[extname(fichero)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(datos);
  } catch {
    res.writeHead(404);
    res.end("no encontrado");
  }
}).listen(puerto, "127.0.0.1", () => {
  console.log(`Nuba Ops en http://127.0.0.1:${puerto}`);
});
