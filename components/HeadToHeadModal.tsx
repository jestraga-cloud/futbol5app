"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { Jugador, PartidoConJugadores, EstadisticasJugador } from "@/lib/supabase";
import { calcularH2H } from "@/lib/head-to-head";
import { calcularLogros } from "@/lib/logros";
import LogrosJugador from "./LogrosJugador";

interface Props {
  jugador: Jugador;
  jugadores: Jugador[];
  partidos: PartidoConJugadores[];
  estadisticas: EstadisticasJugador;
  isOpen: boolean;
  onClose: () => void;
}

export default function HeadToHeadModal({
  jugador,
  jugadores,
  partidos,
  estadisticas,
  isOpen,
  onClose,
}: Props) {
  const h2h = useMemo(
    () => calcularH2H(jugador.id, jugadores, partidos),
    [jugador.id, jugadores, partidos]
  );

  const logros = useMemo(
    () => calcularLogros(jugador.id, estadisticas, partidos),
    [jugador.id, estadisticas, partidos]
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card p-5 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {jugador.apodo || jugador.nombre}
            </h2>
            {jugador.apodo && (
              <p className="text-sm text-gray-500">{jugador.nombre}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Stats resumen */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-800">{estadisticas.partidos_jugados}</p>
            <p className="text-xs text-gray-500">PJ</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-lg font-bold text-green-600">{estadisticas.victorias}</p>
            <p className="text-xs text-gray-500">V</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-600">{estadisticas.empates}</p>
            <p className="text-xs text-gray-500">E</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <p className="text-lg font-bold text-red-600">{estadisticas.derrotas}</p>
            <p className="text-xs text-gray-500">D</p>
          </div>
        </div>

        {/* H2H */}
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Head to Head
        </h3>

        {h2h.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Sin enfrentamientos registrados
          </p>
        ) : (
          <div className="space-y-2 mb-5">
            {h2h.map((record, index) => (
              <div
                key={record.oponente.id}
                className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg stagger-item"
                style={{ "--i": index } as React.CSSProperties}
              >
                <p className="font-medium text-gray-800 text-sm">
                  {record.oponente.apodo || record.oponente.nombre}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                    {record.victorias}V
                  </span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-semibold">
                    {record.empates}E
                  </span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                    {record.derrotas}D
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logros */}
        <LogrosJugador logros={logros} />
      </div>
    </div>,
    document.body
  );
}
