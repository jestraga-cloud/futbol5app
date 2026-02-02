"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import ErrorMessage from "@/components/ErrorMessage";
import { supabase, Jugador, MundialEstado, FaseMundial } from "@/lib/supabase";
import { recalcularMundialesDesdeHistorial } from "@/lib/mundial";
import AdminGuard from "@/components/AdminGuard";

interface MundialConJugador extends MundialEstado {
  jugador: Jugador;
}

const FASES_ORDEN: FaseMundial[] = ["grupos", "octavos", "cuartos", "semifinal", "final", "campeon"];

const FASE_INFO: Record<FaseMundial, { nombre: string; emoji: string; color: string }> = {
  grupos: { nombre: "Fase de Grupos", emoji: "🏟️", color: "bg-blue-100 text-blue-800" },
  octavos: { nombre: "Octavos de Final", emoji: "⚔️", color: "bg-purple-100 text-purple-800" },
  cuartos: { nombre: "Cuartos de Final", emoji: "🔥", color: "bg-orange-100 text-orange-800" },
  semifinal: { nombre: "Semifinal", emoji: "⭐", color: "bg-yellow-100 text-yellow-800" },
  final: { nombre: "Final", emoji: "👑", color: "bg-red-100 text-red-800" },
  campeon: { nombre: "¡Campeón!", emoji: "🏆", color: "bg-green-100 text-green-800" },
};

export default function Pachanga() {
  const [mundiales, setMundiales] = useState<MundialConJugador[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iniciandoMundial, setIniciandoMundial] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setError(null);
    try {
      // Cargar jugadores
      const { data: jugadoresData } = await supabase
        .from("jugadores")
        .select("*")
        .order("nombre");

      if (jugadoresData) {
        setJugadores(jugadoresData);
      }

      // Cargar estados de mundiales
      const { data: mundialesData } = await supabase
        .from("mundial_estado")
        .select(`
          *,
          jugador:jugadores (*)
        `);

      if (mundialesData) {
        setMundiales(mundialesData as MundialConJugador[]);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("No se pudieron cargar los mundiales.");
    } finally {
      setCargando(false);
    }
  };

  const iniciarMundialParaTodos = async () => {
    setIniciandoMundial(true);
    try {
      // Obtener jugadores que no tienen mundial activo
      const jugadoresSinMundial = jugadores.filter(
        (j) => !mundiales.find((m) => m.jugador_id === j.id)
      );

      if (jugadoresSinMundial.length > 0) {
        const nuevosEstados = jugadoresSinMundial.map((j) => ({
          jugador_id: j.id,
          fase: "grupos" as FaseMundial,
          partidos_fase: 0,
          victorias_grupos: 0,
          empates_grupos: 0,
          derrotas_grupos: 0,
          mundiales_ganados: 0,
        }));

        await supabase.from("mundial_estado").insert(nuevosEstados);
        await cargarDatos();
      }
    } catch (error) {
      console.error("Error iniciando mundiales:", error);
    } finally {
      setIniciandoMundial(false);
    }
  };

  const recalcularDesdeHistorial = async () => {
    if (!confirm("Esto va a recalcular todos los mundiales desde el historial de partidos. ¿Continuar?")) {
      return;
    }

    setRecalculando(true);
    try {
      const resultado = await recalcularMundialesDesdeHistorial();
      toast.success(resultado.mensaje);
      await cargarDatos();
    } catch (error) {
      console.error("Error recalculando:", error);
      toast.error("Error al recalcular mundiales");
    } finally {
      setRecalculando(false);
    }
  };

  const reiniciarMundial = async (jugadorId: string) => {
    try {
      await supabase
        .from("mundial_estado")
        .update({
          fase: "grupos",
          partidos_fase: 0,
          victorias_grupos: 0,
          empates_grupos: 0,
          derrotas_grupos: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("jugador_id", jugadorId);

      await cargarDatos();
      toast.success("Nuevo mundial iniciado");
    } catch (error) {
      console.error("Error reiniciando mundial:", error);
      toast.error("Error al reiniciar mundial");
    }
  };

  const getProgresoGrupos = (mundial: MundialEstado) => {
    const total = mundial.victorias_grupos + mundial.empates_grupos + mundial.derrotas_grupos;
    const puntos = mundial.victorias_grupos * 3 + mundial.empates_grupos;
    return { total, puntos };
  };

  const puedeClasificar = (mundial: MundialEstado) => {
    const { total, puntos } = getProgresoGrupos(mundial);
    // Necesita 4 puntos para clasificar (2V o 1V+1E+cualquier cosa)
    // Con 3 partidos jugados, si tiene menos de 4 puntos, está eliminado
    if (total >= 3) {
      return puntos >= 4;
    }
    // Aún puede clasificar si no ha jugado 3 partidos
    const partidosRestantes = 3 - total;
    const puntosMaximos = puntos + partidosRestantes * 3;
    return puntosMaximos >= 4;
  };

  // Agrupar mundiales por fase
  const mundialesPorFase = FASES_ORDEN.reduce((acc, fase) => {
    acc[fase] = mundiales.filter((m) => m.fase === fase);
    return acc;
  }, {} as Record<FaseMundial, MundialConJugador[]>);

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-white text-lg">Cargando mundiales...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-1">🏆</div>
          <h1 className="text-2xl font-bold text-white">Pachanga</h1>
          <p className="text-sm text-white/80">Mundial personal de cada jugador</p>
        </div>

        {/* Error */}
        {error && <div className="mb-4"><ErrorMessage mensaje={error} onReintentar={cargarDatos} /></div>}

        {/* Info */}
        <div className="card p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">📋 Reglas del Mundial</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Grupos:</strong> 3 partidos. Clasifica con 2V o 1V+1E</li>
            <li>• <strong>Eliminatorias:</strong> Ganar para avanzar</li>
            <li>• <strong>Empate eliminatoria:</strong> Repetir la fase</li>
          </ul>
        </div>

        {/* Botón recalcular desde historial (solo admin) */}
        <AdminGuard>
          <button
            onClick={recalcularDesdeHistorial}
            disabled={recalculando}
            className="btn-primary w-full mb-4"
          >
            {recalculando ? "Recalculando..." : "🔄 Calcular desde Historial"}
          </button>
        </AdminGuard>

        {/* Lista de mundiales por fase */}
        {mundiales.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-6xl mb-4">🌍</p>
            <p className="text-gray-500">No hay mundiales activos</p>
            <p className="text-sm text-gray-400 mt-2">
              Iniciá el mundial para que cada jugador comience su camino
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {FASES_ORDEN.map((fase) => {
              const jugadoresEnFase = mundialesPorFase[fase];
              if (jugadoresEnFase.length === 0) return null;

              const info = FASE_INFO[fase];

              return (
                <div key={fase} className="card p-4">
                  <h3 className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-3 ${info.color}`}>
                    <span>{info.emoji}</span>
                    {info.nombre}
                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                      {jugadoresEnFase.length}
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {jugadoresEnFase.map((mundial) => {
                      const { total, puntos } = getProgresoGrupos(mundial);
                      const puedeAvanzar = puedeClasificar(mundial);

                      return (
                        <div
                          key={mundial.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">
                              {mundial.jugador?.apodo || mundial.jugador?.nombre}
                            </p>
                            {fase === "grupos" ? (
                              <p className="text-xs text-gray-500">
                                {mundial.victorias_grupos}V - {mundial.empates_grupos}E - {mundial.derrotas_grupos}D
                                <span className="ml-2 font-medium">
                                  ({puntos} pts, {total}/3 partidos)
                                </span>
                              </p>
                            ) : fase === "campeon" ? (
                              <p className="text-xs text-green-600 font-medium">
                                🏆 x{mundial.mundiales_ganados} mundiales ganados
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">
                                Partidos en fase: {mundial.partidos_fase}
                              </p>
                            )}
                          </div>

                          {fase === "grupos" && (
                            <div className={`text-xs px-2 py-1 rounded ${
                              puedeAvanzar ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {puedeAvanzar ? "En carrera" : "Eliminado"}
                            </div>
                          )}

                          {fase === "campeon" && (
                            <AdminGuard>
                              <button
                                onClick={() => reiniciarMundial(mundial.jugador_id)}
                                className="text-xs px-3 py-1 bg-green-500 text-white rounded-lg"
                              >
                                Nuevo Mundial
                              </button>
                            </AdminGuard>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabla de campeones */}
        {mundiales.some((m) => m.mundiales_ganados > 0) && (
          <div className="card p-4 mt-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>👑</span> Salón de Campeones
            </h3>
            <div className="space-y-2">
              {mundiales
                .filter((m) => m.mundiales_ganados > 0)
                .sort((a, b) => b.mundiales_ganados - a.mundiales_ganados)
                .map((mundial) => (
                  <div
                    key={mundial.id}
                    className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-800">
                      {mundial.jugador?.apodo || mundial.jugador?.nombre}
                    </span>
                    <span className="text-yellow-600 font-bold">
                      🏆 x{mundial.mundiales_ganados}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </main>
  );
}
