"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase, PartidoConJugadores, Jugador } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";

interface Props {
  partido: PartidoConJugadores;
}

interface VotoConteo {
  jugador: Jugador;
  votos: number;
}

export default function VotarMVP({ partido }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [votos, setVotos] = useState<VotoConteo[]>([]);
  const [miVoto, setMiVoto] = useState<string | null>(null);
  const [votando, setVotando] = useState(false);
  const [cargado, setCargado] = useState(false);

  const participantes = partido.participaciones
    .map((p) => p.jugador)
    .filter((j): j is Jugador => j !== undefined);

  useEffect(() => {
    if (abierto && !cargado) {
      cargarVotos();
    }
  }, [abierto]);

  const cargarVotos = async () => {
    try {
      const { data } = await supabase
        .from("votos_mvp")
        .select("*")
        .eq("partido_id", partido.id);

      if (data) {
        // Buscar mi voto
        const sessionId = getSessionId();
        const miVotoData = data.find((v) => v.session_id === sessionId);
        if (miVotoData) setMiVoto(miVotoData.jugador_id);

        // Contar votos por jugador
        const conteo: Record<string, number> = {};
        data.forEach((v) => {
          conteo[v.jugador_id] = (conteo[v.jugador_id] || 0) + 1;
        });

        const votosConteo = participantes
          .map((j) => ({ jugador: j, votos: conteo[j.id] || 0 }))
          .sort((a, b) => b.votos - a.votos);

        setVotos(votosConteo);
      }
      setCargado(true);
    } catch (err) {
      console.error("Error cargando votos MVP:", err);
    }
  };

  const votar = async (jugadorId: string) => {
    setVotando(true);
    try {
      const sessionId = getSessionId();
      const { error } = await supabase.from("votos_mvp").upsert(
        {
          partido_id: partido.id,
          session_id: sessionId,
          jugador_id: jugadorId,
        },
        { onConflict: "partido_id,session_id" }
      );

      if (error) throw error;

      setMiVoto(jugadorId);
      toast.success("Voto registrado");
      await cargarVotos();
    } catch (err) {
      console.error("Error votando MVP:", err);
      toast.error("Error al votar");
    } finally {
      setVotando(false);
    }
  };

  const totalVotos = votos.reduce((sum, v) => sum + v.votos, 0);
  const mvp = votos.length > 0 && votos[0].votos > 0 ? votos[0] : null;

  return (
    <div>
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="text-sm text-gray-500 hover:text-green-600 font-medium flex items-center gap-1.5"
        >
          <span className="text-xs font-bold text-amber-500">MVP</span>
          {mvp
            ? `${mvp.jugador.apodo || mvp.jugador.nombre} (${mvp.votos})`
            : "Votar"}
        </button>
      ) : (
        <div className="animate-fade-in-up">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {miVoto ? "Resultado MVP" : "Elegir MVP"}
          </p>

          {miVoto ? (
            // Mostrar resultados
            <div className="space-y-1.5">
              {votos.map((v) => {
                const porcentaje = totalVotos > 0 ? Math.round((v.votos / totalVotos) * 100) : 0;
                return (
                  <div key={v.jugador.id} className="flex items-center gap-2">
                    <p className={`text-sm flex-1 ${v.jugador.id === miVoto ? "font-semibold text-green-600" : "text-gray-600"}`}>
                      {v.jugador.apodo || v.jugador.nombre}
                      {v.jugador.id === miVoto && " (tu voto)"}
                    </p>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{v.votos}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            // Mostrar opciones para votar
            <div className="grid grid-cols-2 gap-1.5">
              {participantes.map((j) => (
                <button
                  key={j.id}
                  onClick={() => votar(j.id)}
                  disabled={votando}
                  className="text-sm p-2 bg-gray-50 rounded-lg hover:bg-green-50 hover:text-green-700 transition-colors text-gray-700 disabled:opacity-50"
                >
                  {j.apodo || j.nombre}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setAbierto(false)}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
