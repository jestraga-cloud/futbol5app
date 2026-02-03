import { EstadisticasJugador, PartidoConJugadores, Logro } from "./supabase";

interface LogroDefinicion {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  check: (stats: EstadisticasJugador, rachaMax: number, goleadaParticipada: boolean) => boolean;
}

const LOGROS_DEFINICIONES: LogroDefinicion[] = [
  {
    id: "debutante",
    nombre: "Debutante",
    descripcion: "Jugar 1 partido",
    icono: "⚽",
    check: (s) => s.partidos_jugados >= 1,
  },
  {
    id: "primera_victoria",
    nombre: "Primera Victoria",
    descripcion: "Ganar 1 partido",
    icono: "✌️",
    check: (s) => s.victorias >= 1,
  },
  {
    id: "decena",
    nombre: "Decena",
    descripcion: "Ganar 10 partidos",
    icono: "🔟",
    check: (s) => s.victorias >= 10,
  },
  {
    id: "veterano",
    nombre: "Veterano",
    descripcion: "Jugar 20 partidos",
    icono: "🎖️",
    check: (s) => s.partidos_jugados >= 20,
  },
  {
    id: "racha3",
    nombre: "Racha de 3",
    descripcion: "3 victorias consecutivas",
    icono: "🔥",
    check: (_s, rachaMax) => rachaMax >= 3,
  },
  {
    id: "racha5",
    nombre: "Racha de 5",
    descripcion: "5 victorias consecutivas",
    icono: "💥",
    check: (_s, rachaMax) => rachaMax >= 5,
  },
  {
    id: "invicto",
    nombre: "Invicto",
    descripcion: "5+ partidos sin perder",
    icono: "🛡️",
    check: (s) => s.partidos_jugados >= 5 && s.derrotas === 0,
  },
  {
    id: "goleador",
    nombre: "Goleador",
    descripcion: "Partido con 5+ goles de diferencia",
    icono: "💣",
    check: (_s, _r, goleada) => goleada,
  },
];

function calcularRachaMaxima(
  jugadorId: string,
  partidos: PartidoConJugadores[]
): number {
  const partidosOrdenados = [...partidos]
    .filter((p) => p.estado === "finalizado")
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  let rachaMax = 0;
  let rachaActual = 0;

  for (const partido of partidosOrdenados) {
    const participacion = partido.participaciones.find(
      (p) => p.jugador_id === jugadorId
    );
    if (!participacion) {
      rachaActual = 0;
      continue;
    }

    const miEquipo = participacion.equipo;
    const golesAFavor = miEquipo === "A" ? partido.goles_equipo_a : partido.goles_equipo_b;
    const golesEnContra = miEquipo === "A" ? partido.goles_equipo_b : partido.goles_equipo_a;

    if (golesAFavor > golesEnContra) {
      rachaActual++;
      rachaMax = Math.max(rachaMax, rachaActual);
    } else {
      rachaActual = 0;
    }
  }

  return rachaMax;
}

function participoEnGoleada(
  jugadorId: string,
  partidos: PartidoConJugadores[]
): boolean {
  return partidos.some((partido) => {
    if (partido.estado !== "finalizado") return false;
    const participa = partido.participaciones.some((p) => p.jugador_id === jugadorId);
    if (!participa) return false;
    return Math.abs(partido.goles_equipo_a - partido.goles_equipo_b) >= 5;
  });
}

export function calcularLogros(
  jugadorId: string,
  estadisticas: EstadisticasJugador,
  partidos: PartidoConJugadores[]
): Logro[] {
  const rachaMax = calcularRachaMaxima(jugadorId, partidos);
  const goleada = participoEnGoleada(jugadorId, partidos);

  return LOGROS_DEFINICIONES.map((def) => ({
    id: def.id,
    nombre: def.nombre,
    descripcion: def.descripcion,
    icono: def.icono,
    desbloqueado: def.check(estadisticas, rachaMax, goleada),
  }));
}
