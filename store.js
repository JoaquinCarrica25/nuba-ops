// ============================================================
// Nuba Ops — Almacén local (modo demo)
// ============================================================
// Mientras no haya Supabase conectado, todo vive aquí y se
// guarda en localStorage: al recargar NO se pierde nada.
// Es sustituible por `api.js` sin tocar la interfaz.
// ============================================================

import { APARTAMENTOS, ITEMS, itemsDe, RESPONSABLES } from "./seed.js";

const KEY = "nuba-ops:db:v1";

// --- utilidades deterministas ---------------------------------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

const iso = (d) => new Date(d).toISOString();
const diasAtras = (n) => iso(Date.now() - n * 86400000);
const horasAdelante = (n) => iso(Date.now() + n * 3600000);

const NOTAS_OK = [
  "Todo correcto.",
  "Se revisó y funciona.",
  "Limpio y en buen estado.",
  "Sin incidencias.",
  "Se apagó y se dejó listo.",
];

const NOTAS_KO = [
  "No enciende, revisar.",
  "Falta una unidad.",
  "Presenta manchas, revisar.",
  "Hace ruido al funcionar.",
];

// --- semilla --------------------------------------------------
export function crearDemo() {
  const tareas = [];
  const incidencias = [];
  const reservas = [];

  APARTAMENTOS.forEach((apt, i) => {
    const r = rng(hash(apt.id) + 7);
    const nivel = [0.92, 0.45, 0.08, 0.7, 1, 0.3][i % 6];

    for (const it of itemsDe(apt.id)) {
      const hecha = r() < nivel;
      const rota = hecha && r() < 0.06;
      tareas.push({
        id: `t-${apt.id}-${it.id}`,
        apartamento_id: apt.id,
        item_id: it.id,
        nombre: it.nombre,
        grupo: it.grupo,
        frecuencia: it.id % 5 === 0 ? "Quincenalmente" : "Semanalmente",
        estado: hecha ? "completada" : "pendiente",
        funciona: hecha ? !rota : null,
        fecha: hecha ? diasAtras(Math.floor(r() * 16)).slice(0, 10) : null,
        hora: hecha ? `${String(9 + Math.floor(r() * 8)).padStart(2, "0")}:${pick(["05", "15", "30", "45"], r)}` : null,
        responsable: hecha ? pick(RESPONSABLES, r) : "",
        notas: hecha ? (rota ? pick(NOTAS_KO, r) : r() < 0.4 ? pick(NOTAS_OK, r) : "") : "",
        foto_url: null,
        extra: false,
      });
    }

    // Tareas libres heredadas de la app antigua (las 2 de base)
    if (i % 4 === 0) {
      tareas.push({
        id: `t-${apt.id}-x1`,
        apartamento_id: apt.id,
        item_id: null,
        nombre: "Limpieza de filtros de aire acondicionado",
        grupo: "clima",
        frecuencia: "Mensualmente",
        estado: i % 8 === 0 ? "completada" : "pendiente",
        funciona: null,
        fecha: i % 8 === 0 ? diasAtras(9).slice(0, 10) : null,
        hora: null,
        responsable: i % 8 === 0 ? "Oscar" : "",
        notas: "",
        foto_url: null,
        extra: true,
      });
      tareas.push({
        id: `t-${apt.id}-x2`,
        apartamento_id: apt.id,
        item_id: null,
        nombre: "Desatascar y limpiar bote sifónico",
        grupo: "bano",
        frecuencia: "Mensualmente",
        estado: "pendiente",
        funciona: null,
        fecha: null,
        hora: null,
        responsable: "",
        notas: "",
        foto_url: null,
        extra: true,
      });
    }
  });

  // --- incidencias de ejemplo ---
  const INC = [
    ["imperial", "Fuga de agua bajo el fregadero de la cocina", "alta", "pendiente", 1.5, "Joaquín", "Llamar al fontanero de guardia", null, null],
    ["moratin", "El aire acondicionado no enfría", "alta", "pendiente", 3, "Vanessa", "Revisar gas y filtros", null, null],
    ["robledo", "Barbacoa sin gas", "media", "pendiente", 2, "Oscar", "Cambiar bombona antes del viernes", null, null],
    ["montera", "Bombilla fundida en el baño", "baja", "pendiente", 12, "Nanda", "Cambiar bombilla", null, null],
    ["valencia", "Mando de TV sin pilas", "baja", "pendiente", 6, "Nanda", "Comprar pilas AAA", null, null],
    ["navas", "Cerradura de la puerta principal dura", "media", "pendiente", 9, "Joaquín", "Engrasar y revisar bombín", null, null],
    ["olivar", "Lavadora no desagua bien", "media", "resuelta", 21, "Oscar", "Limpiar filtro", { quien: "Oscar", coste: 0, obs: "Filtro lleno de pelos y una moneda." }, 4],
    ["zurbano", "Radiador del salón no calienta", "alta", "resuelta", 30, "Vanessa", "Purgar radiador", { quien: "Técnico externo", coste: 85, obs: "Se purgó y se sustituyó la válvula." }, 9],
    ["tetuan", "Grifo de la cocina gotea", "baja", "resuelta", 40, "Joaquín", "Cambiar cartucho", { quien: "Joaquín", coste: 12.4, obs: "Cartucho nuevo." }, 14],
    ["carretas", "TV de la habitación sin señal", "baja", "resuelta", 55, "Nanda", "Revisar antena", { quien: "Técnico externo", coste: 40, obs: "Cable de antena suelto." }, 20],
  ];

  INC.forEach(([apto, desc, urg, estado, dias, resp, patron, res, cierreDias], i) => {
    incidencias.push({
      id: `i-${i + 1}`,
      apartamento_id: apto,
      descripcion: desc,
      urgencia: urg,
      estado,
      responsable: resp,
      patron_accion: patron,
      fecha_apertura: diasAtras(dias),
      fecha_cierre: estado === "resuelta" ? diasAtras(cierreDias ?? dias - 1) : null,
      quien_reparo: res?.quien || "",
      coste: res?.coste ?? 0,
      observaciones: res?.obs || "",
      alerta_horas: urg === "alta" ? 24 : 48,
      foto_apertura_url: null,
      foto_cierre_url: null,
    });
  });

  // --- reservas: unas cuantas ocupadas ahora mismo ---
  const OCUPADOS = ["imperial", "moratin", "navas", "carretas", "valencia", "zurbano"];
  OCUPADOS.forEach((apto, i) => {
    reservas.push({
      id: `r-${i}-a`,
      apartamento_id: apto,
      fecha_entrada: iso(Date.now() - (i % 3 + 1) * 86400000),
      fecha_salida: horasAdelante(20 + i * 7),
      huespedes: (i % 4) + 1,
      notas: ["Familia García", "Ana Ruiz", "M. Thompson", "Luis y Marta", "Familia Okafor", "J. Pérez"][i % 6],
    });
  });
  ["montera", "tetuan", "olivar", "robledo", "mayor"].forEach((apto, i) => {
    reservas.push({
      id: `r-${i}-b`,
      apartamento_id: apto,
      fecha_entrada: horasAdelante(30 + i * 26),
      fecha_salida: horasAdelante(30 + i * 26 + 72),
      huespedes: (i % 3) + 1,
      notas: ["Pareja belga", "S. Martín", "Grupo de 4", "Familia López", "N. Rossi"][i % 5],
    });
  });

  return {
    version: 1,
    apartamentos: APARTAMENTOS.map((a) => ({ ...a })),
    tareas,
    incidencias,
    reservas,
    historial: [],
  };
}

// --- persistencia --------------------------------------------
function cargar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const db = JSON.parse(raw);
    if (!db || db.version !== 1) return null;
    return db;
  } catch {
    return null;
  }
}

let db = cargar() || crearDemo();
const listeners = new Set();

function persistir() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    // Cuota llena: se sigue funcionando en memoria
    console.warn("No se pudo guardar en localStorage", e);
  }
}

export function getDb() {
  return db;
}

/** Sustituye toda la base por la que llega de Supabase. */
export function hidratar(datos) {
  db = {
    version: 1,
    apartamentos: datos.apartamentos || [],
    tareas: datos.tareas || [],
    incidencias: datos.incidencias || [],
    reservas: datos.reservas || [],
    historial: [],
  };
  persistir();
  listeners.forEach((l) => l());
}

export function commit(fn) {
  fn(db);
  // Nueva referencia para que React detecte el cambio y repinte
  db = { ...db };
  persistir();
  listeners.forEach((l) => l());
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function resetDemo() {
  db = crearDemo();
  persistir();
  listeners.forEach((l) => l());
}

export { ITEMS };
