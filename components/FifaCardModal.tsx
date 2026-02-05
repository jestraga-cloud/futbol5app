"use client";

import { useEffect, useState } from "react";
import { supabase, Jugador, HabilidadesJugador } from "@/lib/supabase";
import FifaCard from "./FifaCard";

interface FifaCardModalProps {
  jugador: Jugador | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FifaCardModal({ jugador, isOpen, onClose }: FifaCardModalProps) {
  const [habilidades, setHabilidades] = useState<HabilidadesJugador | null>(null);
  const [anteriores, setAnteriores] = useState<HabilidadesJugador | null>(null);
  const [promedioGrupo, setPromedioGrupo] = useState<number>(0);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!jugador || !isOpen) return;

    const fetchHabilidades = async () => {
      setCargando(true);
      try {
        const [{ data }, { data: todas }, { data: historial }] = await Promise.all([
          supabase
            .from("habilidades_jugador")
            .select("*")
            .eq("jugador_id", jugador.id)
            .single(),
          supabase
            .from("habilidades_jugador")
            .select("overall"),
          supabase
            .from("habilidades_historial")
            .select("*")
            .eq("jugador_id", jugador.id)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);
        setHabilidades(data);
        setAnteriores(historial && historial.length > 0 ? historial[0] as HabilidadesJugador : null);
        if (todas && todas.length > 0) {
          const sum = todas.reduce((acc, h) => acc + (h.overall || 0), 0);
          setPromedioGrupo(Math.round(sum / todas.length));
        }
      } catch {
        setHabilidades(null);
        setAnteriores(null);
      } finally {
        setCargando(false);
      }
    };

    fetchHabilidades();
  }, [jugador, isOpen]);

  if (!isOpen || !jugador) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-slide-up">
        {cargando ? (
          <div className="fifa-card flex flex-col items-center justify-center">
            <div className="text-4xl loading-ball mb-3">⚽</div>
            <p className="text-white text-sm opacity-70">Cargando...</p>
          </div>
        ) : (
          <FifaCard jugador={jugador} habilidades={habilidades} promedioGrupo={promedioGrupo} anteriores={anteriores} />
        )}
      </div>
    </div>
  );
}
