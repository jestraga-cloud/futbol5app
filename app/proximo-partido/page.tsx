"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import { supabase, Jugador, PartidoConJugadores, Prediccion } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";
import { procesarPartidoMundial } from "@/lib/mundial";
import AdminGuard from "@/components/AdminGuard";

export default function ProximoPartido() {
  const router = useRouter();
  const [partido, setPartido] = useState<PartidoConJugadores | null>(null);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [miPrediccion, setMiPrediccion] = useState<"A" | "B" | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardandoPrediccion, setGuardandoPrediccion] = useState(false);
  const [golesA, setGolesA] = useState(0);
  const [golesB, setGolesB] = useState(0);
  const [finalizando, setFinalizando] = useState(false);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar partido programado
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

        // Cargar predicciones
        const { data: prediccionesData } = await supabase
          .from("predicciones")
          .select("*")
          .eq("partido_id", partidoData.id);

        if (prediccionesData) {
          setPredicciones(prediccionesData);

          // Buscar mi predicción
          const sessionId = getSessionId();
          const miPred = prediccionesData.find((p) => p.session_id === sessionId);
          if (miPred) {
            setMiPrediccion(miPred.prediccion);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const hacerPrediccion = async (prediccion: "A" | "B") => {
    if (!partido) return;

    setGuardandoPrediccion(true);
    setError(null);

    try {
      const sessionId = getSessionId();

      // Upsert: insertar o actualizar si ya existe
      const { error: errorPred } = await supabase
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

      if (errorPred) throw errorPred;

      setMiPrediccion(prediccion);
      toast.success(`Prediccion: Equipo ${prediccion}`);

      // Recargar predicciones
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

  const finalizarPartido = async () => {
    if (!partido) return;

    // Validar que no sea empate
    if (golesA === golesB) {
      setError("El partido no puede terminar en empate. Alguien tiene que ganar.");
      return;
    }

    setFinalizando(true);
    setError(null);

    try {
      // Actualizar partido
      const { error: errorUpdate } = await supabase
        .from("partidos")
        .update({
          goles_equipo_a: golesA,
          goles_equipo_b: golesB,
          estado: "finalizado",
        })
        .eq("id", partido.id);

      if (errorUpdate) throw errorUpdate;

      // Obtener IDs de jugadores por equipo
      const equipoAIds = partido.participaciones
        .filter((p) => p.equipo === "A")
        .map((p) => p.jugador_id);
      const equipoBIds = partido.participaciones
        .filter((p) => p.equipo === "B")
        .map((p) => p.jugador_id);

      // Procesar mundial
      await procesarPartidoMundial(equipoAIds, equipoBIds, golesA, golesB);

      toast.success("Partido finalizado");
      router.push("/partidos");
    } catch (err) {
      console.error("Error finalizando partido:", err);
      toast.error("Error al finalizar partido");
    } finally {
      setFinalizando(false);
    }
  };

  const cancelarPartido = async () => {
    if (!partido) return;
    if (!confirm("¿Seguro que querés cancelar este partido? Se eliminarán todas las predicciones.")) return;

    try {
      await supabase.from("partidos").delete().eq("id", partido.id);
      toast.success("Partido cancelado");
      router.push("/nuevo-partido");
    } catch (err) {
      console.error("Error cancelando partido:", err);
      toast.error("Error al cancelar partido");
    }
  };

  // Calcular estadísticas de predicciones
  const totalPredicciones = predicciones.length;
  const prediccionesA = predicciones.filter((p) => p.prediccion === "A").length;
  const prediccionesB = predicciones.filter((p) => p.prediccion === "B").length;
  const porcentajeA = totalPredicciones > 0 ? Math.round((prediccionesA / totalPredicciones) * 100) : 0;
  const porcentajeB = totalPredicciones > 0 ? Math.round((prediccionesB / totalPredicciones) * 100) : 0;

  // Agrupar jugadores por equipo
  const jugadoresA = partido?.participaciones
    .filter((p) => p.equipo === "A")
    .map((p) => p.jugador)
    .filter((j): j is Jugador => j !== undefined) || [];
  const jugadoresB = partido?.participaciones
    .filter((p) => p.equipo === "B")
    .map((p) => p.jugador)
    .filter((j): j is Jugador => j !== undefined) || [];

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </main>
    );
  }

  if (!partido) {
    return (
      <main className="min-h-screen pb-24">
        <div className="max-w-lg mx-auto p-4">
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              No hay partido programado
            </h1>
            <p className="text-gray-500 mb-6">
              Programá un partido para que todos puedan hacer sus predicciones.
            </p>
            <a href="/nuevo-partido" className="btn-primary inline-block">
              ⚽ Programar Partido
            </a>
          </div>
        </div>
        <Navigation />
      </main>
    );
  }

  const fechaFormateada = new Date(partido.fecha + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Próximo Partido
        </h1>
        <p className="text-white/80 text-center mb-6 capitalize">{fechaFormateada}</p>

        {/* Equipos */}
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Equipo A */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                  A
                </span>
                Equipo A
              </h3>
              <ul className="space-y-1">
                {jugadoresA.map((j) => (
                  <li key={j.id} className="text-sm text-blue-800">
                    {j.apodo || j.nombre}
                  </li>
                ))}
              </ul>
            </div>

            {/* Equipo B */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  B
                </span>
                Equipo B
              </h3>
              <ul className="space-y-1">
                {jugadoresB.map((j) => (
                  <li key={j.id} className="text-sm text-red-800">
                    {j.apodo || j.nombre}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Predicción */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ¿Quién crees que gana?
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => hacerPrediccion("A")}
              disabled={guardandoPrediccion}
              className={`p-4 rounded-lg font-semibold transition-all ${
                miPrediccion === "A"
                  ? "bg-blue-500 text-white ring-2 ring-blue-300"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Equipo A
              {miPrediccion === "A" && " ✓"}
            </button>
            <button
              onClick={() => hacerPrediccion("B")}
              disabled={guardandoPrediccion}
              className={`p-4 rounded-lg font-semibold transition-all ${
                miPrediccion === "B"
                  ? "bg-red-500 text-white ring-2 ring-red-300"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              Equipo B
              {miPrediccion === "B" && " ✓"}
            </button>
          </div>

          {miPrediccion && (
            <p className="text-sm text-gray-500 text-center">
              Tu predicción: <span className="font-semibold">Equipo {miPrediccion}</span>
            </p>
          )}
        </div>

        {/* Estadísticas de predicciones */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Predicciones ({totalPredicciones})
          </h2>

          {totalPredicciones === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Sé el primero en predecir
            </p>
          ) : (
            <div className="space-y-3">
              {/* Barra Equipo A */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600 font-medium">Equipo A</span>
                  <span className="text-gray-600">{porcentajeA}% ({prediccionesA})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeA}%` }}
                  />
                </div>
              </div>

              {/* Barra Equipo B */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600 font-medium">Equipo B</span>
                  <span className="text-gray-600">{porcentajeB}% ({prediccionesB})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeB}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección Finalizar (solo admin) */}
        <AdminGuard fallback={
          <div className="card p-4 mb-4 text-center text-gray-400 text-sm">
            🔒 Solo admin puede registrar resultados. Toca para ingresar PIN.
          </div>
        }>
        <div className="card p-4 mb-4">
          {!mostrarFinalizar ? (
            <button
              onClick={() => setMostrarFinalizar(true)}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              📝 Registrar Resultado
            </button>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📝 Registrar Resultado
              </h2>

              <div className="flex items-center justify-around mb-4">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-semibold mb-2">Equipo A</p>
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
                  <p className="text-sm text-red-600 font-semibold mb-2">Equipo B</p>
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

              {golesA === golesB && golesA > 0 && (
                <p className="text-amber-600 text-sm text-center mb-3">
                  ⚠️ No puede haber empate
                </p>
              )}

              <button
                onClick={finalizarPartido}
                disabled={finalizando || golesA === golesB}
                className="btn-primary w-full disabled:opacity-50"
              >
                {finalizando ? "Finalizando..." : "✓ Finalizar Partido"}
              </button>

              <button
                onClick={() => setMostrarFinalizar(false)}
                className="w-full mt-2 py-2 text-gray-500 text-sm"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
        </AdminGuard>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}

        {/* Cancelar partido (solo admin) */}
        <AdminGuard>
          <button
            onClick={cancelarPartido}
            className="w-full py-3 text-red-400 hover:text-red-600 text-sm"
          >
            🗑️ Cancelar partido programado
          </button>
        </AdminGuard>
      </div>

      <Navigation />
    </main>
  );
}
