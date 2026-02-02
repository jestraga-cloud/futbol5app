import useSWR from "swr";
import { fetchPartidoProgramado } from "@/lib/fetchers";

export function useProximoPartido() {
  const { data, error, isLoading, mutate } = useSWR(
    "proximo-partido",
    fetchPartidoProgramado
  );
  return {
    partido: data ?? null,
    error,
    cargando: isLoading,
    mutate,
  };
}
