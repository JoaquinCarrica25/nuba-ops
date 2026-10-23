// ============================================================
// Nuba Ops — formateo de fechas y números (todo en es-ES)
// ============================================================

export const HOY = () => new Date();

export function fechaCorta(iso) {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function fechaLarga(iso) {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function fechaHora(iso) {
  if (!iso) return "—";
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const s = String(value).trim();
  // "2026-10-22 14:00" no es estándar en Safari
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function diasDesde(iso) {
  const d = toDate(iso);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function horasHasta(iso) {
  const d = toDate(iso);
  if (!d) return null;
  return (d.getTime() - Date.now()) / 3600000;
}

export function hace(iso) {
  const min = Math.round((Date.now() - (toDate(iso)?.getTime() || 0)) / 60000);
  if (!iso) return "—";
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  return fechaCorta(iso);
}

export function euros(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  });
}

export function plural(n, singular, plural_) {
  return `${n} ${n === 1 ? singular : plural_ || singular + "s"}`;
}

export function iniciales(nombre = "") {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function slug(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
