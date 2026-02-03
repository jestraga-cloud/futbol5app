import { Jugador, PartidoConJugadores, Dupla } from "./supabase";

export function calcularDuplas(
  jugadores: Jugador[],
  partidos: PartidoConJugadores[]
): Dupla[] {
  const pares: Record<string, { partidos: number; victorias: number; ids: [string, string] }> = {};

  for (const partido of partidos) {
    if (partido.estado !== "finalizado") continue;

    for (const equipo of ["A", "B"] as const) {
      const jugadoresEquipo = partido.participaciones
        .filter((p) => p.equipo === equipo)
        .map((p) => p.jugador_id);

      const golesAFavor = equipo === "A" ? partido.goles_equipo_a : partido.goles_equipo_b;
      const golesEnContra = equipo === "A" ? partido.goles_equipo_b : partido.goles_equipo_a;
      const gano = golesAFavor > golesEnContra;

      // Generar todos los pares del equipo
      for (let i = 0; i < jugadoresEquipo.length; i++) {
        for (let j = i + 1; j < jugadoresEquipo.length; j++) {
          const ids = [jugadoresEquipo[i], jugadoresEquipo[j]].sort() as [string, string];
          const key = ids.join("-");

          if (!pares[key]) {
            pares[key] = { partidos: 0, victorias: 0, ids };
          }
          pares[key].partidos++;
          if (gano) pares[key].victorias++;
        }
      }
    }
  }

  const jugadoresMap = new Map(jugadores.map((j) => [j.id, j]));

  return Object.values(pares)
    .filter((p) => p.partidos >= 3)
    .map((p) => ({
      jugador1: jugadoresMap.get(p.ids[0])!,
      jugador2: jugadoresMap.get(p.ids[1])!,
      partidos_juntos: p.partidos,
      victorias_juntos: p.victorias,
      winrate: Math.round((p.victorias / p.partidos) * 100),
    }))
    .filter((d) => d.jugador1 && d.jugador2)
    .sort((a, b) => {
      if (b.winrate !== a.winrate) return b.winrate - a.winrate;
      return b.partidos_juntos - a.partidos_juntos;
    });
}
