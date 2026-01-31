import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function clamp(val: number): number {
  return Math.max(1, Math.min(99, isNaN(val) ? 50 : Math.round(val)));
}

export async function POST(request: Request) {
  try {
    const { csv } = (await request.json()) as { csv: string };

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "Se requiere el campo 'csv'" }, { status: 400 });
    }

    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ error: "El CSV debe tener al menos un encabezado y una fila" }, { status: 400 });
    }

    const results: { nombre: string; status: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const nombre = values[0];

      if (!nombre) continue;

      // Buscar jugador por nombre (case-insensitive)
      let jugadorId: string | null = null;

      const { data: porNombre } = await supabase
        .from("jugadores")
        .select("id")
        .ilike("nombre", nombre)
        .single();

      if (porNombre) {
        jugadorId = porNombre.id;
      } else {
        // Fallback: buscar por apodo
        const { data: porApodo } = await supabase
          .from("jugadores")
          .select("id")
          .ilike("apodo", nombre)
          .single();

        if (porApodo) {
          jugadorId = porApodo.id;
        }
      }

      if (!jugadorId) {
        results.push({ nombre, status: "no encontrado" });
        continue;
      }

      const skills = {
        jugador_id: jugadorId,
        fuerza: clamp(Number(values[1])),
        arquero: clamp(Number(values[2])),
        tiro: clamp(Number(values[3])),
        regate: clamp(Number(values[4])),
        pase: clamp(Number(values[5])),
        defensa: clamp(Number(values[6])),
        estado_fisico: clamp(Number(values[7])),
        reaccion: clamp(Number(values[8])),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("habilidades_jugador")
        .upsert(skills, { onConflict: "jugador_id" });

      results.push({ nombre, status: error ? `error: ${error.message}` : "ok" });
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
