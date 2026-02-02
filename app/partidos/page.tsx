"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import ErrorMessage from "@/components/ErrorMessage";
import { supabase, PartidoConJugadores } from "@/lib/supabase";
import { usePartidos } from "@/hooks/usePartidos";
import AdminGuard from "@/components/AdminGuard";

export default function Partidos() {
  const { partidos, cargando, error: fetchError, mutate } = usePartidos();
  const [error, setError] = useState<string | null>(null);

  const eliminarPartido = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este partido?")) return;

    setError(null);
    try {
      const { error: dbError } = await supabase.from("partidos").delete().eq("id", id);
      if (dbError) throw dbError;
      mutate();
      toast.success("Partido eliminado");
    } catch (err) {
      console.error("Error eliminando partido:", err);
      toast.error("No se pudo eliminar el partido");
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const superficieEmoji: Record<string, string> = {
    caucho: "🔴",
    cemento: "⬜",
    sintetico: "🟢",
  };

  const getResultado = (partido: PartidoConJugadores) => {
    if (partido.goles_equipo_a > partido.goles_equipo_b) return "A";
    if (partido.goles_equipo_b > partido.goles_equipo_a) return "B";
    return "empate";
  };

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl soccer-ball mb-4">⚽</div>
          <p className="text-white text-lg">Cargando partidos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          📋 Historial de Partidos
        </h1>

        {/* Error */}
        {(error || fetchError) && (
          <div className="mb-4">
            <ErrorMessage
              mensaje={error || "No se pudieron cargar los partidos."}
              onReintentar={() => { setError(null); mutate(); }}
            />
          </div>
        )}

        {partidos.length === 0 && !fetchError ? (
          <div className="card p-8 text-center">
            <p className="text-6xl mb-4">📋</p>
            <p className="text-gray-500 mb-4">No hay partidos registrados</p>
            <a href="/nuevo-partido" className="btn-primary inline-block">
              Registrar primer partido
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {partidos.map((partido, index) => {
              const resultado = getResultado(partido);
              const jugadoresA = partido.participaciones
                ?.filter((p) => p.equipo === "A")
                .map((p) => p.jugador?.apodo || p.jugador?.nombre);
              const jugadoresB = partido.participaciones
                ?.filter((p) => p.equipo === "B")
                .map((p) => p.jugador?.apodo || p.jugador?.nombre);

              return (
                <div key={partido.id} className="card p-4 stagger-item" style={{ "--i": index } as React.CSSProperties}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-gray-500">
                      {formatearFecha(partido.fecha)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {superficieEmoji[partido.superficie]}{" "}
                        {partido.superficie}
                      </span>
                      <AdminGuard>
                        <button
                          onClick={() => eliminarPartido(partido.id)}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          🗑️
                        </button>
                      </AdminGuard>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`text-center flex-1 p-3 rounded-lg ${
                        resultado === "A" ? "bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      <p className="text-3xl font-bold text-blue-600">
                        {partido.goles_equipo_a}
                      </p>
                      {resultado === "A" && (
                        <span className="text-xs text-blue-500">🏆 Ganador</span>
                      )}
                    </div>
                    <div className="px-4 text-gray-400">vs</div>
                    <div
                      className={`text-center flex-1 p-3 rounded-lg ${
                        resultado === "B" ? "bg-red-50" : "bg-gray-50"
                      }`}
                    >
                      <p className="text-3xl font-bold text-red-600">
                        {partido.goles_equipo_b}
                      </p>
                      {resultado === "B" && (
                        <span className="text-xs text-red-500">🏆 Ganador</span>
                      )}
                    </div>
                  </div>

                  {resultado === "empate" && (
                    <p className="text-center text-sm text-gray-500 mb-3">
                      ⚖️ Empate
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-blue-600 mb-1">
                        Equipo A
                      </p>
                      <p className="text-gray-600">
                        {jugadoresA?.join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-red-600 mb-1">
                        Equipo B
                      </p>
                      <p className="text-gray-600">
                        {jugadoresB?.join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-green-100 text-sm">
            Total: {partidos.length} partidos jugados
          </p>
        </div>
      </div>

      <Navigation />
    </main>
  );
}
