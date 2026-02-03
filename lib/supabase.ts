import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Durante build, retornar un cliente mock
      return {
        from: () => ({
          select: () => ({ order: () => ({ data: null, error: null }) }),
          insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
          update: () => ({ eq: () => ({ data: null, error: null }) }),
          delete: () => ({ eq: () => ({ data: null, error: null }) }),
        }),
      } as unknown as SupabaseClient;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
})();

// Tipos
export interface Jugador {
  id: string;
  nombre: string;
  apodo?: string;
  created_at: string;
}

export interface Partido {
  id: string;
  fecha: string;
  superficie: "caucho" | "cemento" | "sintetico";
  goles_equipo_a: number;
  goles_equipo_b: number;
  estado: "programado" | "finalizado";
  created_at: string;
}

export interface Participacion {
  id: string;
  partido_id: string;
  jugador_id: string;
  equipo: "A" | "B";
  jugador?: Jugador;
}

export interface PartidoConJugadores extends Partido {
  participaciones: Participacion[];
}

export interface EstadisticasJugador {
  jugador: Jugador;
  partidos_jugados: number;
  victorias: number;
  derrotas: number;
  empates: number;
  porcentaje_victorias: number;
}

export type FaseMundial = "grupos" | "octavos" | "cuartos" | "semifinal" | "final" | "campeon";

export interface MundialEstado {
  id: string;
  jugador_id: string;
  fase: FaseMundial;
  partidos_fase: number;
  victorias_grupos: number;
  empates_grupos: number;
  derrotas_grupos: number;
  mundiales_ganados: number;
  created_at: string;
  updated_at: string;
  jugador?: Jugador;
}

export interface MundialHistorial {
  id: string;
  jugador_id: string;
  resultado: string;
  fecha_fin: string;
}

export interface Prediccion {
  id: string;
  partido_id: string;
  session_id: string;
  prediccion: "A" | "B";
  created_at: string;
}

export interface HabilidadesJugador {
  id: string;
  jugador_id: string;
  fuerza: number;
  arquero: number;
  tiro: number;
  regate: number;
  pase: number;
  defensa: number;
  estado_fisico: number;
  reaccion: number;
  overall: number;
  created_at: string;
  updated_at: string;
}

export interface H2HRecord {
  oponente: Jugador;
  victorias: number;
  empates: number;
  derrotas: number;
  partidos: number;
}

export interface Dupla {
  jugador1: Jugador;
  jugador2: Jugador;
  partidos_juntos: number;
  victorias_juntos: number;
  winrate: number;
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  desbloqueado: boolean;
}

export interface VotoMVP {
  id: string;
  partido_id: string;
  session_id: string;
  jugador_id: string;
  created_at: string;
}

export const HABILIDADES_KEYS = [
  "fuerza",
  "arquero",
  "tiro",
  "regate",
  "pase",
  "defensa",
  "estado_fisico",
  "reaccion",
] as const;

export const HABILIDADES_LABELS: Record<string, string> = {
  fuerza: "FUE",
  arquero: "ARQ",
  tiro: "TIR",
  regate: "REG",
  pase: "PAS",
  defensa: "DEF",
  estado_fisico: "FIS",
  reaccion: "REA",
};
