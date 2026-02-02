import { PartidoConJugadores, EstadisticasJugador } from "./supabase";

export interface RachaInfo {
  jugador: string;
  cantidad: number;
}

export interface RecordPartido {
  golesA: number;
  golesB: number;
  fecha: string;
}

export interface DashboardData {
  rachaActual: RachaInfo | null;
  rachaHistorica: RachaInfo | null;
  goleada: RecordPartido | null;
  partidoParejo: RecordPartido | null;
  totalPartidos: number;
  superficieFavorita: string | null;
}

/**
 * Calcula la racha de victorias actual y la más larga de la historia
 * para cada jugador, y devuelve la mejor de cada tipo.
 */
export function calcularRachas(
  estadisticas: EstadisticasJugador[],
  partidos: PartidoConJugadores[]
): { rachaActual: RachaInfo | null; rachaHistorica: RachaInfo | null } {
  if (partidos.length === 0 || estadisticas.length === 0) {
    return { rachaActual: null, rachaHistorica: null };
  }

  // Ordenar partidos por fecha ascendente para calcular rachas
  const partidosOrdenados = [...partidos].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  // Para cada jugador, calcular racha actual y mejor racha
  const rachas: Map<string, { nombre: string; actual: number; mejor: number }> = new Map();

  for (const est of estadisticas) {
    if (est.partidos_jugados === 0) continue;

    const nombre = est.jugador.apodo || est.jugador.nombre;
    let rachaActual = 0;
    let mejorRacha = 0;
    let rachaTemp = 0;

    for (const partido of partidosOrdenados) {
      const participacion = partido.participaciones?.find(
        (p) => p.jugador_id === est.jugador.id
      );
      if (!participacion) continue;

      const ganoA = partido.goles_equipo_a > partido.goles_equipo_b;
      const ganoB = partido.goles_equipo_b > partido.goles_equipo_a;
      const gano =
        (participacion.equipo === "A" && ganoA) ||
        (participacion.equipo === "B" && ganoB);

      if (gano) {
        rachaTemp++;
        mejorRacha = Math.max(mejorRacha, rachaTemp);
      } else {
        rachaTemp = 0;
      }
    }

    rachaActual = rachaTemp; // La racha al final de todos los partidos es la actual
    rachas.set(est.jugador.id, { nombre, actual: rachaActual, mejor: mejorRacha });
  }

  // Encontrar la mejor racha actual y la mejor histórica
  let mejorActual: RachaInfo | null = null;
  let mejorHistorica: RachaInfo | null = null;

  for (const [, data] of rachas) {
    if (data.actual > 0 && (!mejorActual || data.actual > mejorActual.cantidad)) {
      mejorActual = { jugador: data.nombre, cantidad: data.actual };
    }
    if (data.mejor > 0 && (!mejorHistorica || data.mejor > mejorHistorica.cantidad)) {
      mejorHistorica = { jugador: data.nombre, cantidad: data.mejor };
    }
  }

  return { rachaActual: mejorActual, rachaHistorica: mejorHistorica };
}

/**
 * Encuentra la goleada más grande y el partido más parejo.
 */
export function calcularRecords(partidos: PartidoConJugadores[]): {
  goleada: RecordPartido | null;
  partidoParejo: RecordPartido | null;
} {
  if (partidos.length === 0) {
    return { goleada: null, partidoParejo: null };
  }

  let goleada: RecordPartido | null = null;
  let maxDiferencia = 0;
  let partidoParejo: RecordPartido | null = null;
  let minDiferencia = Infinity;
  let maxGoles = 0; // Para desempate del más parejo: el que tuvo más goles total

  for (const p of partidos) {
    const diff = Math.abs(p.goles_equipo_a - p.goles_equipo_b);
    const totalGoles = p.goles_equipo_a + p.goles_equipo_b;

    // Goleada: mayor diferencia
    if (diff > maxDiferencia) {
      maxDiferencia = diff;
      goleada = { golesA: p.goles_equipo_a, golesB: p.goles_equipo_b, fecha: p.fecha };
    }

    // Partido más parejo: menor diferencia, desempate por más goles
    if (diff < minDiferencia || (diff === minDiferencia && totalGoles > maxGoles)) {
      minDiferencia = diff;
      maxGoles = totalGoles;
      partidoParejo = { golesA: p.goles_equipo_a, golesB: p.goles_equipo_b, fecha: p.fecha };
    }
  }

  return { goleada, partidoParejo };
}

/**
 * Obtiene estadísticas generales: total partidos, superficie más jugada.
 */
export function getResumenGeneral(partidos: PartidoConJugadores[]): {
  totalPartidos: number;
  superficieFavorita: string | null;
} {
  if (partidos.length === 0) {
    return { totalPartidos: 0, superficieFavorita: null };
  }

  const conteo: Record<string, number> = {};
  for (const p of partidos) {
    conteo[p.superficie] = (conteo[p.superficie] || 0) + 1;
  }

  let superficieFavorita: string | null = null;
  let maxCount = 0;
  for (const [superficie, count] of Object.entries(conteo)) {
    if (count > maxCount) {
      maxCount = count;
      superficieFavorita = superficie;
    }
  }

  return { totalPartidos: partidos.length, superficieFavorita };
}

/**
 * Calcula todos los datos del dashboard.
 */
export function calcularDashboardData(
  estadisticas: EstadisticasJugador[],
  partidos: PartidoConJugadores[]
): DashboardData {
  const { rachaActual, rachaHistorica } = calcularRachas(estadisticas, partidos);
  const { goleada, partidoParejo } = calcularRecords(partidos);
  const { totalPartidos, superficieFavorita } = getResumenGeneral(partidos);

  return {
    rachaActual,
    rachaHistorica,
    goleada,
    partidoParejo,
    totalPartidos,
    superficieFavorita,
  };
}
