"use client";

import { useMemo } from "react";
import Navigation from "@/components/Navigation";
import RankingTable from "@/components/RankingTable";
import ProximoPartidoBanner from "@/components/ProximoPartidoBanner";
import DashboardStats from "@/components/DashboardStats";
import ErrorMessage from "@/components/ErrorMessage";
import { useEstadisticas } from "@/hooks/useEstadisticas";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function Home() {
  const { estadisticas, cargando, error } = useEstadisticas();
  const { stats } = useDashboardStats();

  // Filtrar jugadores sin partidos y ordenar para el ranking
  const ranking = useMemo(
    () =>
      estadisticas
        .filter((s) => s.partidos_jugados > 0)
        .sort((a, b) => {
          if (b.porcentaje_victorias !== a.porcentaje_victorias) {
            return b.porcentaje_victorias - a.porcentaje_victorias;
          }
          return b.partidos_jugados - a.partidos_jugados;
        }),
    [estadisticas]
  );

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl soccer-ball mb-4">⚽</div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-4xl soccer-ball">⚽</div>
          <h1 className="text-2xl font-bold text-white">Futbol 5</h1>
          <p className="text-sm text-white/80">Registro de partidos entre amigos</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4">
            <ErrorMessage
              mensaje="No se pudieron cargar las estadisticas. Intenta de nuevo."
            />
          </div>
        )}

        {/* Próximo partido (solo se muestra si hay uno programado) */}
        <ProximoPartidoBanner />

        {/* Dashboard Stats */}
        {stats && <DashboardStats stats={stats} />}

        {/* Ranking */}
        <div className="mb-4">
          <RankingTable estadisticas={ranking} />
        </div>

      </div>

      <Navigation />
    </main>
  );
}
