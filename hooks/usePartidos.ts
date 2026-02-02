import useSWR from "swr";
import { fetchTodosPartidos, fetchPartidosFinalizados } from "@/lib/fetchers";

export function usePartidos() {
  const { data, error, isLoading, mutate } = useSWR("partidos", fetchTodosPartidos);
  return {
    partidos: data ?? [],
    error,
    cargando: isLoading,
    mutate,
  };
}

export function usePartidosFinalizados() {
  const { data, error, isLoading, mutate } = useSWR(
    "partidos-finalizados",
    fetchPartidosFinalizados
  );
  return {
    partidos: data ?? [],
    error,
    cargando: isLoading,
    mutate,
  };
}
