import { FaseMundial, MundialEstado } from "./supabase";

const SIGUIENTE_FASE: Record<FaseMundial, FaseMundial | null> = {
  grupos: "octavos",
  octavos: "cuartos",
  cuartos: "semifinal",
  semifinal: "final",
  final: "campeon",
  campeon: null,
};

export type Resultado = "victoria" | "empate" | "derrota";

export interface MundialUpdate {
  fase: FaseMundial;
  partidos_fase: number;
  victorias_grupos: number;
  empates_grupos: number;
  derrotas_grupos: number;
  mundiales_ganados: number;
  eliminado: boolean;
  campeon: boolean;
}

/**
 * Calcula el nuevo estado del mundial dado el estado actual y un resultado.
 * Funcion pura sin side effects - no toca la base de datos.
 */
export function calcularNuevoEstadoMundial(
  estado: Pick<
    MundialEstado,
    | "fase"
    | "partidos_fase"
    | "victorias_grupos"
    | "empates_grupos"
    | "derrotas_grupos"
    | "mundiales_ganados"
  > | null,
  resultado: Resultado
): MundialUpdate {
  // Sin estado previo: crear nuevo mundial en grupos
  if (!estado) {
    return {
      fase: "grupos",
      partidos_fase: 1,
      victorias_grupos: resultado === "victoria" ? 1 : 0,
      empates_grupos: resultado === "empate" ? 1 : 0,
      derrotas_grupos: resultado === "derrota" ? 1 : 0,
      mundiales_ganados: 0,
      eliminado: false,
      campeon: false,
    };
  }

  // Si ya es campeon, no cambiar nada
  if (estado.fase === "campeon") {
    return {
      fase: "campeon",
      partidos_fase: estado.partidos_fase,
      victorias_grupos: estado.victorias_grupos,
      empates_grupos: estado.empates_grupos,
      derrotas_grupos: estado.derrotas_grupos,
      mundiales_ganados: estado.mundiales_ganados,
      eliminado: false,
      campeon: false,
    };
  }

  // Fase de grupos
  if (estado.fase === "grupos") {
    const nuevasVictorias =
      estado.victorias_grupos + (resultado === "victoria" ? 1 : 0);
    const nuevosEmpates =
      estado.empates_grupos + (resultado === "empate" ? 1 : 0);
    const nuevasDerrotas =
      estado.derrotas_grupos + (resultado === "derrota" ? 1 : 0);
    const totalPartidos = nuevasVictorias + nuevosEmpates + nuevasDerrotas;
    const puntos = nuevasVictorias * 3 + nuevosEmpates;

    if (totalPartidos >= 3) {
      if (puntos >= 4) {
        // Clasifica a octavos
        return {
          fase: "octavos",
          partidos_fase: 0,
          victorias_grupos: nuevasVictorias,
          empates_grupos: nuevosEmpates,
          derrotas_grupos: nuevasDerrotas,
          mundiales_ganados: estado.mundiales_ganados,
          eliminado: false,
          campeon: false,
        };
      } else {
        // Eliminado en grupos
        return {
          fase: "grupos",
          partidos_fase: 0,
          victorias_grupos: 0,
          empates_grupos: 0,
          derrotas_grupos: 0,
          mundiales_ganados: estado.mundiales_ganados,
          eliminado: true,
          campeon: false,
        };
      }
    }

    // Todavia en grupos, actualizar contadores
    return {
      fase: "grupos",
      partidos_fase: totalPartidos,
      victorias_grupos: nuevasVictorias,
      empates_grupos: nuevosEmpates,
      derrotas_grupos: nuevasDerrotas,
      mundiales_ganados: estado.mundiales_ganados,
      eliminado: false,
      campeon: false,
    };
  }

  // Fases eliminatorias
  if (resultado === "victoria") {
    const siguienteFase = SIGUIENTE_FASE[estado.fase];

    if (siguienteFase === "campeon") {
      return {
        fase: "campeon",
        partidos_fase: 0,
        victorias_grupos: estado.victorias_grupos,
        empates_grupos: estado.empates_grupos,
        derrotas_grupos: estado.derrotas_grupos,
        mundiales_ganados: estado.mundiales_ganados + 1,
        eliminado: false,
        campeon: true,
      };
    }

    return {
      fase: siguienteFase!,
      partidos_fase: 0,
      victorias_grupos: estado.victorias_grupos,
      empates_grupos: estado.empates_grupos,
      derrotas_grupos: estado.derrotas_grupos,
      mundiales_ganados: estado.mundiales_ganados,
      eliminado: false,
      campeon: false,
    };
  }

  if (resultado === "derrota") {
    return {
      fase: "grupos",
      partidos_fase: 0,
      victorias_grupos: 0,
      empates_grupos: 0,
      derrotas_grupos: 0,
      mundiales_ganados: estado.mundiales_ganados,
      eliminado: true,
      campeon: false,
    };
  }

  // Empate en eliminatoria
  return {
    fase: estado.fase,
    partidos_fase: estado.partidos_fase + 1,
    victorias_grupos: estado.victorias_grupos,
    empates_grupos: estado.empates_grupos,
    derrotas_grupos: estado.derrotas_grupos,
    mundiales_ganados: estado.mundiales_ganados,
    eliminado: false,
    campeon: false,
  };
}
