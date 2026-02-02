"use client";

import { Jugador, HabilidadesJugador, HABILIDADES_KEYS, HABILIDADES_LABELS } from "@/lib/supabase";

interface FifaCardProps {
  jugador: Jugador;
  habilidades: HabilidadesJugador | null;
  promedioGrupo?: number;
}

function getStatColor(value: number): string {
  if (value >= 70) return "#4ade80";
  if (value >= 50) return "#fbbf24";
  return "#f87171";
}

function getRankBadge(overall: number, promedio: number): { emoji: string; label: string } {
  const diff = overall - promedio;
  if (diff >= 10) return { emoji: "💎", label: "Elite" };
  if (diff >= 3) return { emoji: "🥇", label: "Crack" };
  if (diff >= -3) return { emoji: "⚡", label: "Titular" };
  return { emoji: "🔥", label: "Promesa" };
}

function RadarChart({ habilidades }: { habilidades: HabilidadesJugador }) {
  const cx = 100;
  const cy = 100;
  const maxRadius = 80;
  const levels = [0.25, 0.5, 0.75, 1];
  const numSkills = HABILIDADES_KEYS.length;

  const getPoint = (index: number, ratio: number) => {
    const angle = (index * 2 * Math.PI) / numSkills - Math.PI / 2;
    return {
      x: cx + maxRadius * ratio * Math.cos(angle),
      y: cy + maxRadius * ratio * Math.sin(angle),
    };
  };

  const gridPolygons = levels.map((level) => {
    const points = Array.from({ length: numSkills }, (_, i) => {
      const p = getPoint(i, level);
      return `${p.x},${p.y}`;
    }).join(" ");
    return points;
  });

  const dataPoints = HABILIDADES_KEYS.map((key, i) => {
    const value = habilidades[key] as number;
    return getPoint(i, value / 99);
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const labelPoints = HABILIDADES_KEYS.map((key, i) => {
    const p = getPoint(i, 1.18);
    return { ...p, label: HABILIDADES_LABELS[key], value: habilidades[key] as number };
  });

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxWidth: 200 }}>
      {/* Grid lines */}
      {gridPolygons.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="rgba(251, 191, 36, 0.2)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: numSkills }, (_, i) => {
        const p = getPoint(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(251, 191, 36, 0.15)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="rgba(74, 222, 128, 0.25)"
        stroke="#4ade80"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#4ade80" />
      ))}

      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255, 255, 255, 0.7)"
          fontSize="7"
          fontWeight="600"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}

export default function FifaCard({ jugador, habilidades, promedioGrupo }: FifaCardProps) {
  const displayName = jugador.apodo || jugador.nombre;

  if (!habilidades) {
    return (
      <div className="fifa-card flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4 opacity-30">⚽</div>
        <p className="fifa-card-name mb-2">{displayName}</p>
        <p className="text-sm opacity-50">Sin datos de habilidades</p>
      </div>
    );
  }

  const rank = getRankBadge(habilidades.overall, promedioGrupo ?? habilidades.overall);

  return (
    <div className="fifa-card">
      {/* Header: Overall + Rank badge */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="fifa-card-overall">{habilidades.overall}</div>
          <div className="text-xs font-bold opacity-60 tracking-wider">F5</div>
        </div>
        <div className="text-right">
          <div className="text-xl">{rank.emoji}</div>
          <div className="text-[10px] font-bold text-amber-300 tracking-wider">{rank.label}</div>
        </div>
      </div>

      {/* Player name */}
      <div className="fifa-card-name text-center mb-3">{displayName}</div>

      {/* Radar chart */}
      <div className="flex justify-center mb-3">
        <RadarChart habilidades={habilidades} />
      </div>

      {/* Stats with bars */}
      <div className="space-y-1.5">
        {HABILIDADES_KEYS.map((key) => {
          const value = habilidades[key] as number;
          const color = getStatColor(value);
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className="font-semibold opacity-70 w-10 text-xs">{HABILIDADES_LABELS[key]}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${value}%`, backgroundColor: color }}
                />
              </div>
              <span className="font-bold w-7 text-right text-xs" style={{ color }}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
