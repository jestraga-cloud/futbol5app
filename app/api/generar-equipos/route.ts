import { NextResponse } from "next/server";
import { supabase, Jugador, EstadisticasJugador } from "@/lib/supabase";
import { balancearEquipos } from "@/lib/balancear-equipos";

export async function POST(request: Request) {
  try {
    const { jugadores, estadisticas } = (await request.json()) as {
      jugadores: Jugador[];
      estadisticas: EstadisticasJugador[];
    };

    if (!jugadores || jugadores.length < 2) {
      return NextResponse.json(
        { error: "Se necesitan al menos 2 jugadores" },
        { status: 400 }
      );
    }

    // Fetch habilidades de los jugadores seleccionados
    const ids = jugadores.map((j) => j.id);
    const { data: habilidades } = await supabase
      .from("habilidades_jugador")
      .select("*")
      .in("jugador_id", ids);

    const resultado = balancearEquipos(jugadores, estadisticas, habilidades ?? []);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error generando equipos:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar equipos: ${errorMessage}` },
      { status: 500 }
    );
  }
}
