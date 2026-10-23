// ============================================================
// Nuba Ops — hooks de datos reactivos
// ============================================================
import { useSyncExternalStore } from "react";
import { subscribe } from "../lib/api.js";
import { getDb } from "../lib/store.js";

/** Devuelve la base local y re-renderiza en cada cambio. */
export function useDb() {
  return useSyncExternalStore(subscribe, getDb, getDb);
}
