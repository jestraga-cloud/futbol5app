import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Jugador, EstadisticasJugador } from "@/lib/supabase";

export async function POST(request: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { jugadores, estadisticas } = (await request.json()) as {
      jugadores: Jugador[];
      estadisticas: EstadisticasJugador[];
    };

    // Preparar datos para la IA
    const datosJugadores = jugadores.map((j) => {
      const stats = estadisticas.find((e) => e.jugador.id === j.id);
      return {
        id: j.id,
        nombre: j.apodo || j.nombre,
        partidos: stats?.partidos_jugados || 0,
        victorias: stats?.victorias || 0,
        derrotas: stats?.derrotas || 0,
        empates: stats?.empates || 0,
        porcentaje: stats?.porcentaje_victorias || 50,
      };
    });

    const prompt = `Sos un experto en armar equipos de fútbol 5 balanceados.

Tenés que dividir a estos ${jugadores.length} jugadores en 2 equipos lo más parejos posible.

Datos de los jugadores (nombre, partidos jugados, victorias, derrotas, empates, % victorias):
${datosJugadores.map((j) => `- ${j.nombre}: ${j.partidos} partidos, ${j.victorias}V/${j.empates}E/${j.derrotas}D, ${j.porcentaje.toFixed(0)}% victorias`).join("\n")}

Reglas:
1. Dividí los jugadores en 2 equipos del tamaño más parejo posible
2. Intentá que el promedio de porcentaje de victorias sea similar en ambos equipos
3. Si hay jugadores sin historial, distribuilos equitativamente

Respondé ÚNICAMENTE con un JSON válido en este formato exacto (sin markdown, sin explicación adicional afuera del JSON):
{
  "equipoA": ["nombre1", "nombre2", ...],
  "equipoB": ["nombre3", "nombre4", ...],
  "explicacion": "Breve explicación de por qué armaste los equipos así"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const respuesta = completion.choices[0].message.content;
    if (!respuesta) {
      throw new Error("No se recibió respuesta de OpenAI");
    }

    // Parsear la respuesta
    const resultado = JSON.parse(respuesta);

    // Mapear nombres a objetos jugador
    const equipoA = resultado.equipoA
      .map((nombre: string) =>
        jugadores.find(
          (j) =>
            j.apodo?.toLowerCase() === nombre.toLowerCase() ||
            j.nombre.toLowerCase() === nombre.toLowerCase()
        )
      )
      .filter(Boolean);

    const equipoB = resultado.equipoB
      .map((nombre: string) =>
        jugadores.find(
          (j) =>
            j.apodo?.toLowerCase() === nombre.toLowerCase() ||
            j.nombre.toLowerCase() === nombre.toLowerCase()
        )
      )
      .filter(Boolean);

    return NextResponse.json({
      equipoA,
      equipoB,
      explicacion: resultado.explicacion,
    });
  } catch (error) {
    console.error("Error generando equipos:", error);
    return NextResponse.json(
      { error: "Error al generar equipos" },
      { status: 500 }
    );
  }
}
