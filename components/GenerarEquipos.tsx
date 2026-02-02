"use client";

import { useState } from "react";
import { Jugador, EstadisticasJugador } from "@/lib/supabase";

interface Props {
  jugadores: Jugador[];
  estadisticas: EstadisticasJugador[];
}

interface EquiposGenerados {
  equipoA: Jugador[];
  equipoB: Jugador[];
  explicacion: string;
}

export default function GenerarEquipos({ jugadores, estadisticas }: Props) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [equipos, setEquipos] = useState<EquiposGenerados | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleJugador = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
    );
    setEquipos(null);
  };

  const generarEquipos = async () => {
    if (seleccionados.length < 2) {
      setError("Selecciona al menos 2 jugadores");
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const jugadoresSeleccionados = jugadores.filter((j) =>
        seleccionados.includes(j.id)
      );
      const statsSeleccionados = estadisticas.filter((e) =>
        seleccionados.includes(e.jugador.id)
      );

      const response = await fetch("/api/generar-equipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jugadores: jugadoresSeleccionados,
          estadisticas: statsSeleccionados,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar equipos");
      }

      setEquipos(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>⚖️</span> Generar Equipos
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Seleccioná los jugadores que van a jugar y el sistema armará los equipos
        más parejos posibles basándose en el historial.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[...jugadores].sort((a, b) => (a.apodo || a.nombre).localeCompare(b.apodo || b.nombre)).map((jugador) => (
          <button
            key={jugador.id}
            onClick={() => toggleJugador(jugador.id)}
            className={`p-3 rounded-lg text-left transition-all ${
              seleccionados.includes(jugador.id)
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <p className="font-medium truncate">
              {jugador.apodo || jugador.nombre}
            </p>
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Seleccionados: {seleccionados.length} jugadores
      </p>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">
          {error}
        </p>
      )}

      <button
        onClick={generarEquipos}
        disabled={cargando || seleccionados.length < 2}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cargando ? "Generando..." : "⚡ Generar Equipos"}
      </button>

      {equipos && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                  A
                </span>
                Equipo A
              </h3>
              <ul className="space-y-1">
                {equipos.equipoA.map((j) => (
                  <li key={j.id} className="text-sm text-blue-800">
                    {j.apodo || j.nombre}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  B
                </span>
                Equipo B
              </h3>
              <ul className="space-y-1">
                {equipos.equipoB.map((j) => (
                  <li key={j.id} className="text-sm text-red-800">
                    {j.apodo || j.nombre}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">
              💡 Análisis:
            </h4>
            <p className="text-sm text-gray-600">{equipos.explicacion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
