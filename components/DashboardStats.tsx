"use client";

import { DashboardData } from "@/lib/dashboard-stats";

interface Props {
  stats: DashboardData;
}

const superficieLabel: Record<string, string> = {
  caucho: "Caucho 🔴",
  cemento: "Cemento ⬜",
  sintetico: "Sintetico 🟢",
};

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default function DashboardStats({ stats }: Props) {
  const cards = [
    stats.rachaActual && {
      icon: "🔥",
      label: "Racha actual",
      value: `${stats.rachaActual.cantidad}V`,
      detail: stats.rachaActual.jugador,
    },
    stats.rachaHistorica && {
      icon: "👑",
      label: "Record racha",
      value: `${stats.rachaHistorica.cantidad}V`,
      detail: stats.rachaHistorica.jugador,
    },
    stats.goleada && {
      icon: "💥",
      label: "Goleada",
      value: `${stats.goleada.golesA}-${stats.goleada.golesB}`,
      detail: formatFecha(stats.goleada.fecha),
    },
    stats.partidoParejo && {
      icon: "⚡",
      label: "Mas parejo",
      value: `${stats.partidoParejo.golesA}-${stats.partidoParejo.golesB}`,
      detail: formatFecha(stats.partidoParejo.fecha),
    },
  ].filter(Boolean) as { icon: string; label: string; value: string; detail: string }[];

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="card p-3 text-center stagger-item"
          style={{ "--i": index } as React.CSSProperties}
        >
          <div className="text-2xl mb-1">{card.icon}</div>
          <p className="text-lg font-bold text-gray-800">{card.value}</p>
          <p className="text-xs text-gray-500">{card.label}</p>
          <p className="text-xs text-green-600 font-medium mt-0.5">{card.detail}</p>
        </div>
      ))}

      {/* Resumen general */}
      <div
        className="col-span-2 card p-3 flex justify-around stagger-item"
        style={{ "--i": cards.length } as React.CSSProperties}
      >
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">{stats.totalPartidos}</p>
          <p className="text-xs text-gray-500">Partidos</p>
        </div>
        {stats.superficieFavorita && (
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">
              {superficieLabel[stats.superficieFavorita] || stats.superficieFavorita}
            </p>
            <p className="text-xs text-gray-500">Cancha favorita</p>
          </div>
        )}
      </div>
    </div>
  );
}
