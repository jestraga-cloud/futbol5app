"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import RankingTable from "@/components/RankingTable";
import GenerarEquipos from "@/components/GenerarEquipos";
import { supabase, Jugador, EstadisticasJugador, PartidoConJugadores } from "@/lib/supabase";

export default function Home() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasJugador[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [ultimoPartido, setUltimoPartido] = useState<PartidoConJugadores | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar jugadores
      const { data: jugadoresData } = await supabase
        .from("jugadores")
        .select("*")
        .order("nombre");

      if (jugadoresData) {
        setJugadores(jugadoresData);
      }

      // Cargar partidos con participaciones
      const { data: partidosData } = await supabase
        .from("partidos")
        .select(`
          *,
          participaciones (
            *,
            jugador:jugadores (*)
          )
        `)
        .order("fecha", { ascending: false });

      if (partidosData && partidosData.length > 0) {
        setUltimoPartido(partidosData[0] as PartidoConJugadores);

        // Calcular estadísticas
        const stats = calcularEstadisticas(jugadoresData || [], partidosData);
        setEstadisticas(stats);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticas = (
    jugadores: Jugador[],
    partidos: PartidoConJugadores[]
  ): EstadisticasJugador[] => {
    const stats: Map<string, EstadisticasJugador> = new Map();

    jugadores.forEach((jugador) => {
      stats.set(jugador.id, {
        jugador,
        partidos_jugados: 0,
        victorias: 0,
        derrotas: 0,
        empates: 0,
        porcentaje_victorias: 0,
      });
    });

    partidos.forEach((partido) => {
      const esEmpate = partido.goles_equipo_a === partido.goles_equipo_b;
      const ganaA = partido.goles_equipo_a > partido.goles_equipo_b;

      partido.participaciones?.forEach((p) => {
        const stat = stats.get(p.jugador_id);
        if (stat) {
          stat.partidos_jugados++;
          if (esEmpate) {
            stat.empates++;
          } else if ((p.equipo === "A" && ganaA) || (p.equipo === "B" && !ganaA)) {
            stat.victorias++;
          } else {
            stat.derrotas++;
          }
        }
      });
    });

    // Calcular porcentaje y filtrar jugadores sin partidos
    const resultado = Array.from(stats.values())
      .filter((s) => s.partidos_jugados > 0)
      .map((s) => ({
        ...s,
        porcentaje_victorias:
          s.partidos_jugados > 0
            ? (s.victorias / s.partidos_jugados) * 100
            : 0,
      }))
      .sort((a, b) => {
        // Ordenar por porcentaje, luego por cantidad de partidos
        if (b.porcentaje_victorias !== a.porcentaje_victorias) {
          return b.porcentaje_victorias - a.porcentaje_victorias;
        }
        return b.partidos_jugados - a.partidos_jugados;
      });

    return resultado;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const superficieEmoji: Record<string, string> = {
    caucho: "🔴",
    cemento: "⬜",
    sintetico: "🟢",
  };

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
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <span className="soccer-ball">⚽</span>
            Futbol 5
          </h1>
          <p className="text-green-100">Registro de partidos entre amigos</p>
        </div>

        {/* Último partido */}
        {ultimoPartido && (
          <div className="card p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              Último partido
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Equipo A</p>
                <p className="text-3xl font-bold text-blue-600">
                  {ultimoPartido.goles_equipo_a}
                </p>
              </div>
              <div className="text-center px-4">
                <p className="text-gray-400">vs</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Equipo B</p>
                <p className="text-3xl font-bold text-red-600">
                  {ultimoPartido.goles_equipo_b}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>{formatearFecha(ultimoPartido.fecha)}</span>
              <span>
                {superficieEmoji[ultimoPartido.superficie]}{" "}
                {ultimoPartido.superficie}
              </span>
            </div>
          </div>
        )}

        {/* Ranking */}
        <div className="mb-4">
          <RankingTable estadisticas={estadisticas} />
        </div>

        {/* Generar equipos */}
        {jugadores.length >= 2 && (
          <GenerarEquipos jugadores={jugadores} estadisticas={estadisticas} />
        )}
      </div>

      <Navigation />
    </main>
  );
}
