"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase, Jugador, PartidoConJugadores, Prediccion } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";

export default function ProximoPartidoBanner() {
  const [partido, setPartido] = useState<PartidoConJugadores | null>(null);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [miPrediccion, setMiPrediccion] = useState<"A" | "B" | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardandoPrediccion, setGuardandoPrediccion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data: partidoData } = await supabase
        .from("partidos")
        .select(`
          *,
          participaciones (
            *,
            jugador:jugadores (*)
          )
        `)
        .eq("estado", "programado")
        .limit(1)
        .single();

      if (partidoData) {
        setPartido(partidoData);

        const { data: prediccionesData } = await supabase
          .from("predicciones")
          .select("*")
          .eq("partido_id", partidoData.id);

        if (prediccionesData) {
          setPredicciones(prediccionesData);
          const sessionId = getSessionId();
          const miPred = prediccionesData.find((p) => p.session_id === sessionId);
          if (miPred) {
            setMiPrediccion(miPred.prediccion);
          }
        }
      }
    } catch {
      // No hay partido programado
    } finally {
      setCargando(false);
    }
  };

  const hacerPrediccion = async (prediccion: "A" | "B") => {
    if (!partido) return;

    setGuardandoPrediccion(true);

    try {
      const sessionId = getSessionId();

      await supabase
        .from("predicciones")
        .upsert(
          {
            partido_id: partido.id,
            session_id: sessionId,
            prediccion,
          },
          {
            onConflict: "partido_id,session_id",
          }
        );

      setMiPrediccion(prediccion);
      toast.success(`Prediccion: Equipo ${prediccion}`);

      const { data: prediccionesData } = await supabase
        .from("predicciones")
        .select("*")
        .eq("partido_id", partido.id);

      if (prediccionesData) {
        setPredicciones(prediccionesData);
      }
    } catch (err) {
      console.error("Error guardando predicción:", err);
      toast.error("Error al guardar prediccion");
    } finally {
      setGuardandoPrediccion(false);
    }
  };

  if (cargando || !partido) {
    return null;
  }

  const totalPredicciones = predicciones.length;
  const prediccionesA = predicciones.filter((p) => p.prediccion === "A").length;
  const prediccionesB = predicciones.filter((p) => p.prediccion === "B").length;
  const porcentajeA = totalPredicciones > 0 ? Math.round((prediccionesA / totalPredicciones) * 100) : 0;
  const porcentajeB = totalPredicciones > 0 ? Math.round((prediccionesB / totalPredicciones) * 100) : 0;

  const jugadoresA = partido.participaciones
    .filter((p) => p.equipo === "A")
    .map((p) => p.jugador)
    .filter((j): j is Jugador => j !== undefined);
  const jugadoresB = partido.participaciones
    .filter((p) => p.equipo === "B")
    .map((p) => p.jugador)
    .filter((j): j is Jugador => j !== undefined);

  const fechaFormateada = new Date(partido.fecha + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="card p-4 mb-4 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>🎯</span> Próximo Partido
        </h2>
        <span className="text-xs text-purple-600 font-medium capitalize">{fechaFormateada}</span>
      </div>

      {/* Equipos en fila */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <p className="text-xs font-bold text-blue-700 mb-1">Equipo A</p>
          <p className="text-xs text-blue-800 truncate">
            {jugadoresA.map((j) => j.apodo || j.nombre).join(", ")}
          </p>
        </div>
        <div className="bg-red-100 p-2 rounded-lg">
          <p className="text-xs font-bold text-red-700 mb-1">Equipo B</p>
          <p className="text-xs text-red-800 truncate">
            {jugadoresB.map((j) => j.apodo || j.nombre).join(", ")}
          </p>
        </div>
      </div>

      {/* Predicción rápida */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-2">¿Quién gana?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => hacerPrediccion("A")}
            disabled={guardandoPrediccion}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              miPrediccion === "A"
                ? "bg-blue-500 text-white"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            Equipo A {miPrediccion === "A" && "✓"}
          </button>
          <button
            onClick={() => hacerPrediccion("B")}
            disabled={guardandoPrediccion}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              miPrediccion === "B"
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            Equipo B {miPrediccion === "B" && "✓"}
          </button>
        </div>
      </div>

      {/* Barra de predicciones */}
      {totalPredicciones > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>A: {porcentajeA}%</span>
            <span>{totalPredicciones} predicciones</span>
            <span>B: {porcentajeB}%</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${porcentajeA}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${porcentajeB}%` }}
            />
          </div>
        </div>
      )}

      <Link
        href="/proximo-partido"
        className="block text-center text-sm text-purple-600 hover:text-purple-800 font-medium"
      >
        Ver detalles y registrar resultado →
      </Link>
    </div>
  );
}
