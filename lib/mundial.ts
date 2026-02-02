import { supabase, FaseMundial, MundialEstado } from "./supabase";

const SIGUIENTE_FASE: Record<FaseMundial, FaseMundial | null> = {
  grupos: "octavos",
  octavos: "cuartos",
  cuartos: "semifinal",
  semifinal: "final",
  final: "campeon",
  campeon: null,
};

export async function actualizarMundialJugador(
  jugadorId: string,
  resultado: "victoria" | "empate" | "derrota"
) {
  // Obtener estado actual del mundial del jugador
  const { data: estado } = await supabase
    .from("mundial_estado")
    .select("*")
    .eq("jugador_id", jugadorId)
    .single();

  if (!estado) {
    // Si no tiene mundial, crear uno nuevo
    await supabase.from("mundial_estado").insert({
      jugador_id: jugadorId,
      fase: "grupos",
      partidos_fase: 1,
      victorias_grupos: resultado === "victoria" ? 1 : 0,
      empates_grupos: resultado === "empate" ? 1 : 0,
      derrotas_grupos: resultado === "derrota" ? 1 : 0,
      mundiales_ganados: 0,
    });
    return;
  }

  const mundial = estado as MundialEstado;

  // Si ya es campeón, no hacer nada (debe reiniciar manualmente)
  if (mundial.fase === "campeon") {
    return;
  }

  if (mundial.fase === "grupos") {
    // Fase de grupos: actualizar contadores
    const nuevasVictorias = mundial.victorias_grupos + (resultado === "victoria" ? 1 : 0);
    const nuevosEmpates = mundial.empates_grupos + (resultado === "empate" ? 1 : 0);
    const nuevasDerrotas = mundial.derrotas_grupos + (resultado === "derrota" ? 1 : 0);
    const totalPartidos = nuevasVictorias + nuevosEmpates + nuevasDerrotas;
    const puntos = nuevasVictorias * 3 + nuevosEmpates;

    // Verificar si completó la fase de grupos
    if (totalPartidos >= 3) {
      if (puntos >= 4) {
        // Clasifica a octavos
        await supabase
          .from("mundial_estado")
          .update({
            fase: "octavos",
            partidos_fase: 0,
            victorias_grupos: nuevasVictorias,
            empates_grupos: nuevosEmpates,
            derrotas_grupos: nuevasDerrotas,
            updated_at: new Date().toISOString(),
          })
          .eq("jugador_id", jugadorId);
      } else {
        // Eliminado en grupos - reiniciar mundial
        await guardarHistorial(jugadorId, "grupos");
        await reiniciarMundial(jugadorId, mundial.mundiales_ganados);
      }
    } else {
      // Actualizar contadores sin cambiar de fase
      await supabase
        .from("mundial_estado")
        .update({
          victorias_grupos: nuevasVictorias,
          empates_grupos: nuevosEmpates,
          derrotas_grupos: nuevasDerrotas,
          updated_at: new Date().toISOString(),
        })
        .eq("jugador_id", jugadorId);
    }
  } else {
    // Fase eliminatoria (octavos, cuartos, semifinal, final)
    if (resultado === "victoria") {
      const siguienteFase = SIGUIENTE_FASE[mundial.fase];

      if (siguienteFase === "campeon") {
        // ¡Ganó la final!
        await supabase
          .from("mundial_estado")
          .update({
            fase: "campeon",
            partidos_fase: 0,
            mundiales_ganados: mundial.mundiales_ganados + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("jugador_id", jugadorId);

        await guardarHistorial(jugadorId, "campeon");
      } else if (siguienteFase) {
        // Avanza a la siguiente fase
        await supabase
          .from("mundial_estado")
          .update({
            fase: siguienteFase,
            partidos_fase: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("jugador_id", jugadorId);
      }
    } else if (resultado === "derrota") {
      // Eliminado - guardar en qué fase quedó y reiniciar
      await guardarHistorial(jugadorId, mundial.fase);
      await reiniciarMundial(jugadorId, mundial.mundiales_ganados);
    } else {
      // Empate en eliminatoria - incrementar partidos en fase, sigue intentando
      await supabase
        .from("mundial_estado")
        .update({
          partidos_fase: mundial.partidos_fase + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("jugador_id", jugadorId);
    }
  }
}

async function guardarHistorial(jugadorId: string, resultado: string) {
  await supabase.from("mundial_historial").insert({
    jugador_id: jugadorId,
    resultado,
  });
}

async function reiniciarMundial(jugadorId: string, mundialesGanados: number) {
  await supabase
    .from("mundial_estado")
    .update({
      fase: "grupos",
      partidos_fase: 0,
      victorias_grupos: 0,
      empates_grupos: 0,
      derrotas_grupos: 0,
      mundiales_ganados: mundialesGanados,
      updated_at: new Date().toISOString(),
    })
    .eq("jugador_id", jugadorId);
}

export async function procesarPartidoMundial(
  equipoA: string[],
  equipoB: string[],
  golesA: number,
  golesB: number
) {
  const esEmpate = golesA === golesB;
  const ganaA = golesA > golesB;

  // Procesar cada jugador del equipo A
  for (const jugadorId of equipoA) {
    const resultado = esEmpate ? "empate" : ganaA ? "victoria" : "derrota";
    await actualizarMundialJugador(jugadorId, resultado);
  }

  // Procesar cada jugador del equipo B
  for (const jugadorId of equipoB) {
    const resultado = esEmpate ? "empate" : !ganaA ? "victoria" : "derrota";
    await actualizarMundialJugador(jugadorId, resultado);
  }
}

// Recalcular mundiales desde el historial de partidos
export async function recalcularMundialesDesdeHistorial() {
  // 1. Limpiar tablas de mundial
  await supabase.from("mundial_historial").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("mundial_estado").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 2. Obtener todos los partidos ordenados por fecha (más antiguo primero)
  const { data: partidos } = await supabase
    .from("partidos")
    .select(`
      *,
      participaciones (
        jugador_id,
        equipo
      )
    `)
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true });

  if (!partidos || partidos.length === 0) {
    return { procesados: 0, mensaje: "No hay partidos para procesar" };
  }

  // 3. Procesar cada partido en orden cronológico
  let procesados = 0;
  for (const partido of partidos) {
    const equipoA = partido.participaciones
      ?.filter((p: { equipo: string }) => p.equipo === "A")
      .map((p: { jugador_id: string }) => p.jugador_id) || [];

    const equipoB = partido.participaciones
      ?.filter((p: { equipo: string }) => p.equipo === "B")
      .map((p: { jugador_id: string }) => p.jugador_id) || [];

    if (equipoA.length > 0 && equipoB.length > 0) {
      await procesarPartidoMundial(
        equipoA,
        equipoB,
        partido.goles_equipo_a,
        partido.goles_equipo_b
      );
      procesados++;
    }
  }

  return { procesados, mensaje: `Se procesaron ${procesados} partidos` };
}
