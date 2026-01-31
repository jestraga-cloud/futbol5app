import { Jugador, EstadisticasJugador, HabilidadesJugador } from "./supabase";

interface JugadorConStats {
  jugador: Jugador;
  porcentajeReal: number;
  porcentajeAjustado: number;
  partidos: number;
  overall: number | null;
  puntajeFinal: number;
}

interface ResultadoEquipos {
  equipoA: Jugador[];
  equipoB: Jugador[];
  explicacion: string;
}

// Partidos mínimos para confiar 100% en el winrate
const PARTIDOS_CONFIANZA_TOTAL = 10;

/**
 * Ajusta el porcentaje de victorias según la cantidad de partidos jugados.
 * Con pocos partidos, el winrate se acerca al 50% (menos confiable).
 * Con muchos partidos, el winrate se usa tal cual (más confiable).
 */
export function calcularPorcentajeAjustado(porcentajeReal: number, partidos: number): number {
  if (partidos === 0) return 50;

  // Factor de confianza: 0 a 1 según cantidad de partidos
  const confianza = Math.min(partidos / PARTIDOS_CONFIANZA_TOTAL, 1);

  // Interpolar entre 50% (sin datos) y el porcentaje real
  return 50 + (porcentajeReal - 50) * confianza;
}

/**
 * Calcula el puntaje final combinando winrate ajustado y overall de habilidades.
 * Si tiene habilidades: 50% winrate + 50% overall (overall escalado a rango 0-100).
 * Si no tiene habilidades: 100% winrate ajustado.
 */
function calcularPuntajeFinal(porcentajeAjustado: number, overall: number | null): number {
  if (overall === null) return porcentajeAjustado;
  // overall viene en escala 1-99, lo mapeamos a ~0-100 para comparar con winrate
  const overallNormalizado = (overall / 99) * 100;
  return porcentajeAjustado * 0.5 + overallNormalizado * 0.5;
}

export function balancearEquipos(
  jugadores: Jugador[],
  estadisticas: EstadisticasJugador[],
  habilidades?: HabilidadesJugador[]
): ResultadoEquipos {
  // Combinar jugadores con sus estadísticas y habilidades
  const jugadoresConStats: JugadorConStats[] = jugadores.map((j) => {
    const stats = estadisticas.find((e) => e.jugador.id === j.id);
    const porcentajeReal = stats?.porcentaje_victorias ?? 50;
    const partidos = stats?.partidos_jugados ?? 0;
    const hab = habilidades?.find((h) => h.jugador_id === j.id);
    const overall = hab?.overall ?? null;
    const porcentajeAjustado = calcularPorcentajeAjustado(porcentajeReal, partidos);

    return {
      jugador: j,
      porcentajeReal,
      porcentajeAjustado,
      partidos,
      overall,
      puntajeFinal: calcularPuntajeFinal(porcentajeAjustado, overall),
    };
  });

  // Ordenar por puntaje final (mejor a peor)
  jugadoresConStats.sort((a, b) => b.puntajeFinal - a.puntajeFinal);

  // Calcular tamaño de equipos (lo más parejo posible)
  const total = jugadoresConStats.length;
  const tamanoA = Math.ceil(total / 2);
  const tamanoB = Math.floor(total / 2);

  // Algoritmo de balanceo: asignar al equipo con menor suma, respetando tamaños
  const equipoA: JugadorConStats[] = [];
  const equipoB: JugadorConStats[] = [];
  let sumaA = 0;
  let sumaB = 0;

  for (const jugador of jugadoresConStats) {
    const equipoALleno = equipoA.length >= tamanoA;
    const equipoBLleno = equipoB.length >= tamanoB;

    if (equipoALleno) {
      equipoB.push(jugador);
      sumaB += jugador.puntajeFinal;
    } else if (equipoBLleno) {
      equipoA.push(jugador);
      sumaA += jugador.puntajeFinal;
    } else if (sumaA <= sumaB) {
      equipoA.push(jugador);
      sumaA += jugador.puntajeFinal;
    } else {
      equipoB.push(jugador);
      sumaB += jugador.puntajeFinal;
    }
  }

  // Calcular promedios para la explicación
  const promedioA = equipoA.length > 0 ? sumaA / equipoA.length : 0;
  const promedioB = equipoB.length > 0 ? sumaB / equipoB.length : 0;
  const diferencia = Math.abs(promedioA - promedioB);

  // Contar jugadores por tipo de datos disponibles
  const jugadoresConHabilidades = jugadoresConStats.filter((j) => j.overall !== null);
  const jugadoresSinHabilidades = jugadoresConStats.filter((j) => j.overall === null);
  const jugadoresSinPartidos = jugadoresConStats.filter((j) => j.partidos === 0);

  // Generar explicación
  let explicacion = `Equipo A: ${promedioA.toFixed(1)} | Equipo B: ${promedioB.toFixed(1)}. `;

  if (diferencia < 3) {
    explicacion += `Muy parejos.`;
  } else if (diferencia < 7) {
    explicacion += `Bien balanceados.`;
  } else {
    explicacion += `Diferencia de ${diferencia.toFixed(1)} pts.`;
  }

  if (jugadoresConHabilidades.length > 0) {
    explicacion += ` Balanceo: 50% winrate + 50% habilidades.`;
  }

  if (jugadoresSinHabilidades.length > 0) {
    explicacion += ` ${jugadoresSinHabilidades.length} sin habilidades (solo winrate).`;
  }

  if (jugadoresSinPartidos.length > 0) {
    explicacion += ` ${jugadoresSinPartidos.length} sin historial.`;
  }

  return {
    equipoA: equipoA.map((j) => j.jugador),
    equipoB: equipoB.map((j) => j.jugador),
    explicacion,
  };
}

interface PrediccionEquipos {
  promedioA: number;
  promedioB: number;
  analisis: string;
}

/**
 * Calcula la predicción de winrate para equipos armados manualmente.
 * Retorna el porcentaje ajustado promedio de cada equipo y un análisis.
 */
export function calcularPrediccion(
  equipoAIds: string[],
  equipoBIds: string[],
  estadisticas: EstadisticasJugador[]
): PrediccionEquipos {
  const calcularPromedioEquipo = (ids: string[]): number => {
    if (ids.length === 0) return 50;

    let suma = 0;
    for (const id of ids) {
      const stats = estadisticas.find((e) => e.jugador.id === id);
      const porcentajeReal = stats?.porcentaje_victorias ?? 50;
      const partidos = stats?.partidos_jugados ?? 0;
      suma += calcularPorcentajeAjustado(porcentajeReal, partidos);
    }
    return suma / ids.length;
  };

  const promedioA = calcularPromedioEquipo(equipoAIds);
  const promedioB = calcularPromedioEquipo(equipoBIds);
  const diferencia = Math.abs(promedioA - promedioB);

  let analisis: string;
  if (diferencia < 3) {
    analisis = "Muy parejos";
  } else if (diferencia < 7) {
    analisis = "Bien balanceados";
  } else if (promedioA > promedioB) {
    analisis = "Equipo A tiene ventaja";
  } else {
    analisis = "Equipo B tiene ventaja";
  }

  return { promedioA, promedioB, analisis };
}
