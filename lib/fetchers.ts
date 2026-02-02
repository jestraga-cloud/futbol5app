import { supabase, Jugador, EstadisticasJugador, PartidoConJugadores } from "./supabase";

export async function fetchJugadores(): Promise<Jugador[]> {
  const { data, error } = await supabase
    .from("jugadores")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPartidosFinalizados(): Promise<PartidoConJugadores[]> {
  const { data, error } = await supabase
    .from("partidos")
    .select(`
      *,
      participaciones (
        *,
        jugador:jugadores (*)
      )
    `)
    .eq("estado", "finalizado")
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data as PartidoConJugadores[]) ?? [];
}

export async function fetchTodosPartidos(): Promise<PartidoConJugadores[]> {
  const { data, error } = await supabase
    .from("partidos")
    .select(`
      *,
      participaciones (
        *,
        jugador:jugadores (*)
      )
    `)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data as PartidoConJugadores[]) ?? [];
}

export async function fetchPartidoProgramado(): Promise<PartidoConJugadores | null> {
  const { data, error } = await supabase
    .from("partidos")
    .select(`
      *,
      participaciones (
        *,
        jugador:jugadores (*)
      )
    `)
    .eq("estado", "programado")
    .limit(1)
    .single();
  // PGRST116 = no rows found, that's not an error for us
  if (error && error.code !== "PGRST116") throw error;
  return (data as PartidoConJugadores) ?? null;
}

/**
 * Calcula estadísticas de jugadores a partir de partidos finalizados.
 * Lógica centralizada - antes estaba duplicada en page.tsx y nuevo-partido/page.tsx.
 */
export function calcularEstadisticas(
  jugadores: Jugador[],
  partidos: PartidoConJugadores[]
): EstadisticasJugador[] {
  const stats: Map<string, EstadisticasJugador> = new Map();

  jugadores.forEach((jugador) => {
    stats.set(jugador.id, {
      jugador,
      partidos_jugados: 0,
      victorias: 0,
      derrotas: 0,
      empates: 0,
      porcentaje_victorias: 0,
    });
  });

  partidos.forEach((partido) => {
    const esEmpate = partido.goles_equipo_a === partido.goles_equipo_b;
    const ganaA = partido.goles_equipo_a > partido.goles_equipo_b;

    partido.participaciones?.forEach((p) => {
      const stat = stats.get(p.jugador_id);
      if (stat) {
        stat.partidos_jugados++;
        if (esEmpate) {
          stat.empates++;
        } else if ((p.equipo === "A" && ganaA) || (p.equipo === "B" && !ganaA)) {
          stat.victorias++;
        } else {
          stat.derrotas++;
        }
      }
    });
  });

  return Array.from(stats.values())
    .map((s) => ({
      ...s,
      porcentaje_victorias:
        s.partidos_jugados > 0
          ? (s.victorias / s.partidos_jugados) * 100
          : 0,
    }));
}
