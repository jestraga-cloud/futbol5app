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
