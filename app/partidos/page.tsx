"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import ErrorMessage from "@/components/ErrorMessage";
import { supabase, PartidoConJugadores } from "@/lib/supabase";
import { usePartidos } from "@/hooks/usePartidos";
import AdminGuard from "@/components/AdminGuard";
import VotarMVP from "@/components/VotarMVP";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";
import { formatMVPInvite } from "@/lib/share-utils";

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

  const superficieClasses: Record<string, string> = {
    sintetico: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400",
    caucho: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400",
    cemento: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400",
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const getResultado = (partido: PartidoConJugadores) => {
    if (partido.goles_equipo_a > partido.goles_equipo_b) return "A";
    if (partido.goles_equipo_b > partido.goles_equipo_a) return "B";
    return "empate";
  };

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white animate-spin mx-auto" />
          <p className="text-white text-lg mt-4">Cargando partidos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Historial de Partidos
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
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
                <div key={partido.id} className="card overflow-hidden stagger-item" style={{ "--i": index } as React.CSSProperties}>
                  {/* Header */}
                  <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200/60 dark:border-gray-700/40">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {formatearFecha(partido.fecha)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${superficieClasses[partido.superficie]}`}>
                        {partido.superficie}
                      </span>
                      <AdminGuard>
                        <button
                          onClick={() => eliminarPartido(partido.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Eliminar partido"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </AdminGuard>
                    </div>
                  </div>

                  {/* Scoreboard */}
                  <div className="px-4 py-4">
                    <div className="flex items-center">
                      {/* Equipo A */}
                      <div className={`flex-1 ${resultado === "B" ? "opacity-50" : ""}`}>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Equipo A</p>
                        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {jugadoresA?.join(", ") || "-"}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="px-4 text-center flex-shrink-0">
                        <div className="flex items-baseline">
                          <span className={`text-2xl font-bold font-heading ${resultado === "A" ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                            {partido.goles_equipo_a}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600 mx-2">-</span>
                          <span className={`text-2xl font-bold font-heading ${resultado === "B" ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                            {partido.goles_equipo_b}
                          </span>
                        </div>
                        {resultado === "empate" && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Empate</p>
                        )}
                      </div>

                      {/* Equipo B */}
                      <div className={`flex-1 text-right ${resultado === "A" ? "opacity-50" : ""}`}>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Equipo B</p>
                        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {jugadoresB?.join(", ") || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer: MVP + Share */}
                  {partido.estado === "finalizado" && (
                    <div className="px-4 py-3 border-t border-gray-200/60 dark:border-gray-700/40 flex items-center justify-between">
                      <VotarMVP partido={partido} />
                      <WhatsAppShareButton
                        text={formatMVPInvite(partido, baseUrl)}
                        label="Invitar a votar"
                      />
                    </div>
                  )}
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
