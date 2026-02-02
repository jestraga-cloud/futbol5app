import useSWR from "swr";
import { fetchJugadores } from "@/lib/fetchers";

export function useJugadores() {
  const { data, error, isLoading, mutate } = useSWR("jugadores", fetchJugadores);
  return {
    jugadores: data ?? [],
    error,
    cargando: isLoading,
    mutate,
  };
}
