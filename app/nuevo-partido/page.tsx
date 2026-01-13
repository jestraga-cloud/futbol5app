"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { supabase, Jugador } from "@/lib/supabase";

type Superficie = "caucho" | "cemento" | "sintetico";

export default function NuevoPartido() {
  const router = useRouter();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [equipoA, setEquipoA] = useState<string[]>([]);
  const [equipoB, setEquipoB] = useState<string[]>([]);
  const [golesA, setGolesA] = useState(0);
  const [golesB, setGolesB] = useState(0);
  const [superficie, setSuperficie] = useState<Superficie>("sintetico");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarJugadores();
  }, []);

  const cargarJugadores = async () => {
    const { data } = await supabase
      .from("jugadores")
      .select("*")
      .order("nombre");
    if (data) setJugadores(data);
  };

  const toggleJugador = (id: string, equipo: "A" | "B") => {
    if (equipo === "A") {
      if (equipoA.includes(id)) {
        setEquipoA(equipoA.filter((j) => j !== id));
      } else {
        setEquipoB(equipoB.filter((j) => j !== id));
        setEquipoA([...equipoA, id]);
      }
    } else {
      if (equipoB.includes(id)) {
        setEquipoB(equipoB.filter((j) => j !== id));
      } else {
        setEquipoA(equipoA.filter((j) => j !== id));
        setEquipoB([...equipoB, id]);
      }
    }
  };

  const guardarPartido = async () => {
    if (equipoA.length === 0 || equipoB.length === 0) {
      setError("Cada equipo debe tener al menos un jugador");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      // Crear partido
      const { data: partido, error: errorPartido } = await supabase
        .from("partidos")
        .insert({
          fecha,
          superficie,
          goles_equipo_a: golesA,
          goles_equipo_b: golesB,
        })
        .select()
        .single();

      if (errorPartido) throw errorPartido;

      // Crear participaciones
      const participaciones = [
        ...equipoA.map((jugador_id) => ({
          partido_id: partido.id,
          jugador_id,
          equipo: "A" as const,
        })),
        ...equipoB.map((jugador_id) => ({
          partido_id: partido.id,
          jugador_id,
          equipo: "B" as const,
        })),
      ];

      const { error: errorPart } = await supabase
        .from("participaciones")
        .insert(participaciones);

      if (errorPart) throw errorPart;

      router.push("/partidos");
    } catch (err) {
      console.error("Error guardando partido:", err);
      setError("Error al guardar el partido. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const superficies: { value: Superficie; label: string; emoji: string }[] = [
    { value: "sintetico", label: "Sintético", emoji: "🟢" },
    { value: "caucho", label: "Caucho", emoji: "🔴" },
    { value: "cemento", label: "Cemento", emoji: "⬜" },
  ];

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          ⚽ Nuevo Partido
        </h1>

        {/* Fecha y superficie */}
        <div className="card p-4 mb-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del partido
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie
            </label>
            <div className="grid grid-cols-3 gap-2">
              {superficies.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSuperficie(s.value)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    superficie === s.value
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <p className="text-xs mt-1">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Marcador */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Resultado
          </h2>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-semibold mb-2">
                Equipo A
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGolesA(Math.max(0, golesA - 1))}
                  className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold"
                >
                  -
                </button>
                <span className="text-4xl font-bold text-blue-600 w-12 text-center">
                  {golesA}
                </span>
                <button
                  onClick={() => setGolesA(golesA + 1)}
                  className="w-10 h-10 bg-blue-500 text-white rounded-full text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <span className="text-2xl text-gray-400">vs</span>

            <div className="text-center">
              <p className="text-sm text-red-600 font-semibold mb-2">
                Equipo B
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGolesB(Math.max(0, golesB - 1))}
                  className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold"
                >
                  -
                </button>
                <span className="text-4xl font-bold text-red-600 w-12 text-center">
                  {golesB}
                </span>
                <button
                  onClick={() => setGolesB(golesB + 1)}
                  className="w-10 h-10 bg-red-500 text-white rounded-full text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selección de jugadores */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Seleccionar jugadores
          </h2>

          {jugadores.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay jugadores registrados.{" "}
              <a href="/jugadores" className="text-green-600 underline">
                Agregar jugadores
              </a>
            </p>
          ) : (
            <div className="space-y-2">
              {jugadores.map((jugador) => {
                const enA = equipoA.includes(jugador.id);
                const enB = equipoB.includes(jugador.id);

                return (
                  <div
                    key={jugador.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-700">
                      {jugador.apodo || jugador.nombre}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleJugador(jugador.id, "A")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          enA
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => toggleJugador(jugador.id, "B")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          enB
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        B
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>Equipo A: {equipoA.length} jugadores</span>
            <span>Equipo B: {equipoB.length} jugadores</span>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}

        <button
          onClick={guardarPartido}
          disabled={guardando || equipoA.length === 0 || equipoB.length === 0}
          className="btn-primary w-full disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "✓ Guardar Partido"}
        </button>
      </div>

      <Navigation />
    </main>
  );
}
