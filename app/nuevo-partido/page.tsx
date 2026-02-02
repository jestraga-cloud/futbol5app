"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import { supabase, Jugador } from "@/lib/supabase";
import { procesarPartidoMundial } from "@/lib/mundial";
import { calcularPrediccion } from "@/lib/balancear-equipos";
import { useEstadisticas } from "@/hooks/useEstadisticas";
import { useProximoPartido } from "@/hooks/useProximoPartido";
import WizardProgress from "@/components/WizardProgress";

type Superficie = "caucho" | "cemento" | "sintetico";
type PasoPartidoFuturo = 1 | 2 | 3;
type ModoAsignacion = "manual" | "automatico";

interface EquiposGenerados {
  equipoA: Jugador[];
  equipoB: Jugador[];
  explicacion: string;
}

export default function NuevoPartido() {
  const router = useRouter();
  const { jugadores, estadisticas } = useEstadisticas();
  const { partido: partidoProgramado } = useProximoPartido();
  const [equipoA, setEquipoA] = useState<string[]>([]);
  const [equipoB, setEquipoB] = useState<string[]>([]);
  const [golesA, setGolesA] = useState(0);
  const [golesB, setGolesB] = useState(0);
  const [superficie, setSuperficie] = useState<Superficie>("caucho");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [esPartidoFuturo, setEsPartidoFuturo] = useState(false);

  // Estados para el nuevo flujo de partido futuro
  const [pasoFuturo, setPasoFuturo] = useState<PasoPartidoFuturo>(1);
  const [asistentes, setAsistentes] = useState<string[]>([]);
  const [modoAsignacion, setModoAsignacion] = useState<ModoAsignacion | null>(null);
  const [equiposGenerados, setEquiposGenerados] = useState<EquiposGenerados | null>(null);
  const [generandoEquipos, setGenerandoEquipos] = useState(false);

  const hayPartidoProgramado = partidoProgramado !== null;

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

  const toggleAsistente = (id: string) => {
    setAsistentes((prev) =>
      prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
    );
  };

  const generarEquiposAutomatico = async () => {
    setGenerandoEquipos(true);
    setError(null);

    try {
      const jugadoresAsistentes = jugadores.filter((j) =>
        asistentes.includes(j.id)
      );
      const statsAsistentes = estadisticas.filter((e) =>
        asistentes.includes(e.jugador.id)
      );

      const response = await fetch("/api/generar-equipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jugadores: jugadoresAsistentes,
          estadisticas: statsAsistentes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar equipos");
      }

      setEquiposGenerados(data);
      // Asignar a los estados de equipo
      setEquipoA(data.equipoA.map((j: Jugador) => j.id));
      setEquipoB(data.equipoB.map((j: Jugador) => j.id));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
    } finally {
      setGenerandoEquipos(false);
    }
  };

  const iniciarModoManual = () => {
    setModoAsignacion("manual");
    // Limpiar equipos para empezar de cero
    setEquipoA([]);
    setEquipoB([]);
    setPasoFuturo(3);
  };

  const iniciarModoAutomatico = async () => {
    setModoAsignacion("automatico");
    setPasoFuturo(3);
    await generarEquiposAutomatico();
  };

  const volverPaso = () => {
    if (pasoFuturo === 2) {
      setPasoFuturo(1);
    } else if (pasoFuturo === 3) {
      setPasoFuturo(2);
      setModoAsignacion(null);
      setEquiposGenerados(null);
      setEquipoA([]);
      setEquipoB([]);
    }
  };

  const guardarPartido = async () => {
    if (equipoA.length === 0 || equipoB.length === 0) {
      setError("Cada equipo debe tener al menos un jugador");
      return;
    }

    if (esPartidoFuturo && hayPartidoProgramado) {
      setError("Ya hay un partido programado. Finalizalo antes de crear otro.");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const { data: partido, error: errorPartido } = await supabase
        .from("partidos")
        .insert({
          fecha,
          superficie,
          goles_equipo_a: esPartidoFuturo ? 0 : golesA,
          goles_equipo_b: esPartidoFuturo ? 0 : golesB,
          estado: esPartidoFuturo ? "programado" : "finalizado",
        })
        .select()
        .single();

      if (errorPartido) throw errorPartido;

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

      if (!esPartidoFuturo) {
        await procesarPartidoMundial(equipoA, equipoB, golesA, golesB);
        toast.success("Partido guardado");
        router.push("/partidos");
      } else {
        toast.success("Partido programado");
        router.push("/proximo-partido");
      }
    } catch (err) {
      console.error("Error guardando partido:", err);
      toast.error("Error al guardar el partido");
    } finally {
      setGuardando(false);
    }
  };

  const superficies: { value: Superficie; label: string; emoji: string }[] = [
    { value: "sintetico", label: "Sintético", emoji: "🟢" },
    { value: "caucho", label: "Caucho", emoji: "🔴" },
    { value: "cemento", label: "Cemento", emoji: "⬜" },
  ];

  // Calcular predicción para modo manual
  const prediccion = modoAsignacion === "manual" && equipoA.length > 0 && equipoB.length > 0
    ? calcularPrediccion(equipoA, equipoB, estadisticas)
    : null;

  // Filtrar jugadores asistentes para mostrar en paso 3 manual
  const jugadoresAsistentes = jugadores.filter((j) => asistentes.includes(j.id));

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Nuevo Partido
        </h1>

        {/* Tipo de partido */}
        <div className="card p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de partido
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setEsPartidoFuturo(false);
                setPasoFuturo(1);
                setAsistentes([]);
                setModoAsignacion(null);
              }}
              className={`p-3 rounded-lg text-center transition-all ${
                !esPartidoFuturo
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <span className="text-xl">📋</span>
              <p className="text-xs mt-1">Ya jugado</p>
            </button>
            <button
              onClick={() => {
                setEsPartidoFuturo(true);
                setPasoFuturo(1);
                setEquipoA([]);
                setEquipoB([]);
              }}
              disabled={hayPartidoProgramado}
              className={`p-3 rounded-lg text-center transition-all ${
                esPartidoFuturo
                  ? "bg-purple-500 text-white"
                  : hayPartidoProgramado
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <span className="text-xl">🎯</span>
              <p className="text-xs mt-1">Por jugar</p>
            </button>
          </div>
          {hayPartidoProgramado && (
            <p className="text-xs text-amber-600 mt-2">
              Ya hay un partido programado. <a href="/proximo-partido" className="underline">Ver partido</a>
            </p>
          )}
        </div>

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

        {/* ========== FLUJO PARTIDO YA JUGADO ========== */}
        {!esPartidoFuturo && (
          <>
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

            {/* Selección de jugadores (flujo original) */}
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
                  {[...jugadores].sort((a, b) => (a.apodo || a.nombre).localeCompare(b.apodo || b.nombre)).map((jugador) => {
                    const enA = equipoA.includes(jugador.id);
                    const enB = equipoB.includes(jugador.id);

                    return (
                      <div
                        key={jugador.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium text-gray-700">
                          {jugador.nombre}
                          {jugador.apodo && jugador.apodo !== jugador.nombre && (
                            <span className="text-gray-400 text-sm ml-1">({jugador.apodo})</span>
                          )}
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
              className="w-full btn-primary disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "✓ Guardar Partido"}
            </button>
          </>
        )}

        {/* ========== FLUJO PARTIDO POR JUGAR ========== */}
        {esPartidoFuturo && (
          <>
            <WizardProgress pasoActual={pasoFuturo} />

            {/* PASO 1: Seleccionar asistentes */}
            {pasoFuturo === 1 && (
              <div className="card p-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Paso 1: ¿Quiénes juegan?
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Seleccioná los jugadores que van a participar
                </p>

                {jugadores.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay jugadores registrados.{" "}
                    <a href="/jugadores" className="text-green-600 underline">
                      Agregar jugadores
                    </a>
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[...jugadores].sort((a, b) => (a.apodo || a.nombre).localeCompare(b.apodo || b.nombre)).map((jugador) => (
                      <button
                        key={jugador.id}
                        onClick={() => toggleAsistente(jugador.id)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          asistentes.includes(jugador.id)
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <p className="font-medium truncate">
                          {jugador.apodo || jugador.nombre}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-500 mb-4">
                  Seleccionados: {asistentes.length} jugadores
                </p>

                <button
                  onClick={() => setPasoFuturo(2)}
                  disabled={asistentes.length < 2}
                  className="w-full btn-primary disabled:opacity-50 bg-purple-500 hover:bg-purple-600"
                >
                  Continuar →
                </button>
              </div>
            )}

            {/* PASO 2: Elegir modo de asignación */}
            {pasoFuturo === 2 && (
              <div className="card p-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Paso 2: ¿Cómo armamos los equipos?
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {asistentes.length} jugadores seleccionados
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={iniciarModoManual}
                    className="p-6 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all text-center"
                  >
                    <span className="text-4xl mb-2 block">✋</span>
                    <p className="font-semibold text-gray-800">Manual</p>
                    <p className="text-xs text-gray-500 mt-1">Yo elijo los equipos</p>
                  </button>

                  <button
                    onClick={iniciarModoAutomatico}
                    className="p-6 rounded-xl bg-purple-100 hover:bg-purple-200 transition-all text-center"
                  >
                    <span className="text-4xl mb-2 block">⚡</span>
                    <p className="font-semibold text-purple-800">Automático</p>
                    <p className="text-xs text-purple-600 mt-1">Equipos balanceados</p>
                  </button>
                </div>

                <button
                  onClick={volverPaso}
                  className="w-full py-2 text-gray-500 hover:text-gray-700"
                >
                  ← Volver
                </button>
              </div>
            )}

            {/* PASO 3: Asignar equipos */}
            {pasoFuturo === 3 && modoAsignacion === "manual" && (
              <div className="card p-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Paso 3: Armar equipos
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Asigná cada jugador a un equipo
                </p>

                <div className="space-y-2 mb-4">
                  {[...jugadoresAsistentes].sort((a, b) => (a.apodo || a.nombre).localeCompare(b.apodo || b.nombre)).map((jugador) => {
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

                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span className="text-blue-600">Equipo A: {equipoA.length}</span>
                  <span className="text-red-600">Equipo B: {equipoB.length}</span>
                </div>

                {/* Predicción en tiempo real */}
                {prediccion && (
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <span>🔮</span> Predicción de la app
                    </h4>
                    <p className="text-sm text-purple-700">
                      <span className="text-blue-600 font-semibold">Equipo A: {prediccion.promedioA.toFixed(0)}%</span>
                      {" | "}
                      <span className="text-red-600 font-semibold">Equipo B: {prediccion.promedioB.toFixed(0)}%</span>
                    </p>
                    <p className="text-xs text-purple-600 mt-1">{prediccion.analisis}</p>
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={volverPaso}
                    className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    ← Volver
                  </button>
                  <button
                    onClick={guardarPartido}
                    disabled={guardando || equipoA.length === 0 || equipoB.length === 0}
                    className="flex-1 btn-primary disabled:opacity-50 bg-purple-500 hover:bg-purple-600"
                  >
                    {guardando ? "Guardando..." : "🎯 Programar"}
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Equipos automáticos */}
            {pasoFuturo === 3 && modoAsignacion === "automatico" && (
              <div className="card p-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Paso 3: Equipos sugeridos
                </h2>

                {generandoEquipos ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">⚡</div>
                    <p className="text-gray-500">Generando equipos balanceados...</p>
                  </div>
                ) : equiposGenerados ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            A
                          </span>
                          Equipo A
                        </h3>
                        <ul className="space-y-1">
                          {equiposGenerados.equipoA.map((j) => (
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
                          {equiposGenerados.equipoB.map((j) => (
                            <li key={j.id} className="text-sm text-red-800">
                              {j.apodo || j.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">
                        💡 Análisis:
                      </h4>
                      <p className="text-sm text-gray-600">{equiposGenerados.explicacion}</p>
                    </div>
                  </>
                ) : null}

                {error && (
                  <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={volverPaso}
                    className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    ← Volver
                  </button>
                  <button
                    onClick={guardarPartido}
                    disabled={guardando || !equiposGenerados}
                    className="flex-1 btn-primary disabled:opacity-50 bg-purple-500 hover:bg-purple-600"
                  >
                    {guardando ? "Guardando..." : "🎯 Aceptar y Programar"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Navigation />
    </main>
  );
}
