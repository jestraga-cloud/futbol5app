import { Jugador, PartidoConJugadores, H2HRecord } from "./supabase";

export function calcularH2H(
  jugadorId: string,
  jugadores: Jugador[],
  partidos: PartidoConJugadores[]
): H2HRecord[] {
  const registros: Record<string, { victorias: number; empates: number; derrotas: number; partidos: number }> = {};

  for (const partido of partidos) {
    if (partido.estado !== "finalizado") continue;

    const participacion = partido.participaciones.find(
      (p) => p.jugador_id === jugadorId
    );
    if (!participacion) continue;

    const miEquipo = participacion.equipo;
    const golesAFavor = miEquipo === "A" ? partido.goles_equipo_a : partido.goles_equipo_b;
    const golesEnContra = miEquipo === "A" ? partido.goles_equipo_b : partido.goles_equipo_a;

    let resultado: "victoria" | "empate" | "derrota";
    if (golesAFavor > golesEnContra) resultado = "victoria";
    else if (golesAFavor < golesEnContra) resultado = "derrota";
    else resultado = "empate";

    // Incrementar para cada oponente
    const oponentes = partido.participaciones.filter(
      (p) => p.equipo !== miEquipo
    );

    for (const oponente of oponentes) {
      if (!registros[oponente.jugador_id]) {
        registros[oponente.jugador_id] = { victorias: 0, empates: 0, derrotas: 0, partidos: 0 };
      }
      registros[oponente.jugador_id].partidos++;
      if (resultado === "victoria") registros[oponente.jugador_id].victorias++;
      else if (resultado === "empate") registros[oponente.jugador_id].empates++;
      else registros[oponente.jugador_id].derrotas++;
    }
  }

  const jugadoresMap = new Map(jugadores.map((j) => [j.id, j]));

  return Object.entries(registros)
    .map(([oponenteId, stats]) => ({
      oponente: jugadoresMap.get(oponenteId)!,
      ...stats,
    }))
    .filter((r) => r.oponente)
    .sort((a, b) => b.partidos - a.partidos);
}
