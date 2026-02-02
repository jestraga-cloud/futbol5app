import { useMemo } from "react";
import { useEstadisticas } from "./useEstadisticas";
import { usePartidosFinalizados } from "./usePartidos";
import { calcularDashboardData, DashboardData } from "@/lib/dashboard-stats";

export function useDashboardStats() {
  const { estadisticas, cargando: cargandoE } = useEstadisticas();
  const { partidos, cargando: cargandoP } = usePartidosFinalizados();

  const stats = useMemo<DashboardData | null>(
    () =>
      partidos.length > 0
        ? calcularDashboardData(estadisticas, partidos)
        : null,
    [estadisticas, partidos]
  );

  return {
    stats,
    cargando: cargandoE || cargandoP,
  };
}
