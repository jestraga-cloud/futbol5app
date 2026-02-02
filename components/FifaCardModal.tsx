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
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!jugador || !isOpen) return;

    const fetchHabilidades = async () => {
      setCargando(true);
      try {
        const { data } = await supabase
          .from("habilidades_jugador")
          .select("*")
          .eq("jugador_id", jugador.id)
          .single();
        setHabilidades(data);
      } catch {
        setHabilidades(null);
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
            <div className="text-4xl soccer-ball mb-3">⚽</div>
            <p className="text-white text-sm opacity-70">Cargando...</p>
          </div>
        ) : (
          <FifaCard jugador={jugador} habilidades={habilidades} />
        )}
      </div>
    </div>
  );
}
