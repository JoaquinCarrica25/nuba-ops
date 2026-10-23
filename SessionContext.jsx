// ============================================================
// Nuba Ops — Sesión (¿quién eres?)
// ============================================================
// De momento sin contraseña, pero la sesión SÍ se recuerda al
// recargar (cosa que la app antigua no hacía). La pantalla de
// selección es la única que hay que cambiar si activamos
// Supabase Auth más adelante.
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import { RESPONSABLES } from "../lib/seed.js";

const KEY = "nuba-ops:perfil";
const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
  const [perfil, setPerfilState] = useState(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });

  const setPerfil = (nombre) => {
    setPerfilState(nombre);
    try {
      localStorage.setItem(KEY, nombre);
    } catch {
      /* modo privado */
    }
  };

  const salir = () => {
    setPerfilState(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* modo privado */
    }
  };

  return (
    <SessionCtx.Provider value={{ perfil, setPerfil, salir, perfiles: RESPONSABLES }}>
      {children}
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);
