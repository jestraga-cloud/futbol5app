import { useMemo } from "react";
import { useJugadores } from "./useJugadores";
import { usePartidosFinalizados } from "./usePartidos";
import { calcularEstadisticas } from "@/lib/fetchers";

export function useEstadisticas() {
  const { jugadores, cargando: cargandoJ, error: errorJ } = useJugadores();
  const { partidos, cargando: cargandoP, error: errorP } = usePartidosFinalizados();

  const estadisticas = useMemo(
    () => (jugadores.length > 0 ? calcularEstadisticas(jugadores, partidos) : []),
    [jugadores, partidos]
  );

  return {
    estadisticas,
    jugadores,
    partidos,
    cargando: cargandoJ || cargandoP,
    error: errorJ || errorP,
  };
}
