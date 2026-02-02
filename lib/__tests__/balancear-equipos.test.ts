import { describe, it, expect } from "vitest";
import {
  calcularPorcentajeAjustado,
  balancearEquipos,
  calcularPrediccion,
} from "../balancear-equipos";
import { Jugador, EstadisticasJugador, HabilidadesJugador } from "../supabase";

// Helpers
function crearJugador(id: string, nombre: string): Jugador {
  return { id, nombre, created_at: new Date().toISOString() };
}

function crearEstadisticas(
  jugador: Jugador,
  partidos: number,
  victorias: number
): EstadisticasJugador {
  const derrotas = Math.floor((partidos - victorias) / 2);
  const empates = partidos - victorias - derrotas;
  return {
    jugador,
    partidos_jugados: partidos,
    victorias,
    derrotas,
    empates,
    porcentaje_victorias: partidos > 0 ? (victorias / partidos) * 100 : 0,
  };
}

function crearHabilidades(
  jugadorId: string,
  overall: number
): HabilidadesJugador {
  return {
    id: "hab-" + jugadorId,
    jugador_id: jugadorId,
    fuerza: overall,
    arquero: overall,
    tiro: overall,
    regate: overall,
    pase: overall,
    defensa: overall,
    estado_fisico: overall,
    reaccion: overall,
    overall,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────
// calcularPorcentajeAjustado
// ──────────────────────────────────────────────
describe("calcularPorcentajeAjustado", () => {
  it("devuelve 50 para 0 partidos jugados", () => {
    expect(calcularPorcentajeAjustado(80, 0)).toBe(50);
  });

  it("devuelve el porcentaje real para 10+ partidos", () => {
    expect(calcularPorcentajeAjustado(80, 10)).toBe(80);
    expect(calcularPorcentajeAjustado(80, 20)).toBe(80);
    expect(calcularPorcentajeAjustado(30, 15)).toBe(30);
  });

  it("interpola linealmente para partidos intermedios", () => {
    // 5 partidos = confianza 0.5
    // 50 + (80 - 50) * 0.5 = 65
    expect(calcularPorcentajeAjustado(80, 5)).toBe(65);
  });

  it("con 1 partido la confianza es 0.1", () => {
    // 50 + (100 - 50) * 0.1 = 55
    expect(calcularPorcentajeAjustado(100, 1)).toBe(55);
  });

  it("con 50% de winrate devuelve 50 sin importar partidos", () => {
    expect(calcularPorcentajeAjustado(50, 0)).toBe(50);
    expect(calcularPorcentajeAjustado(50, 5)).toBe(50);
    expect(calcularPorcentajeAjustado(50, 10)).toBe(50);
  });
});

// ──────────────────────────────────────────────
// balancearEquipos
// ──────────────────────────────────────────────
describe("balancearEquipos", () => {
  it("distribuye jugadores en dos equipos del mismo tamaño (par)", () => {
    const jugadores = Array.from({ length: 6 }, (_, i) =>
      crearJugador(`j${i}`, `Jugador ${i}`)
    );
    const stats = jugadores.map((j) => crearEstadisticas(j, 10, 5));

    const resultado = balancearEquipos(jugadores, stats);

    expect(resultado.equipoA).toHaveLength(3);
    expect(resultado.equipoB).toHaveLength(3);
    expect(resultado.explicacion).toBeTruthy();
  });

  it("maneja numero impar de jugadores (3+2)", () => {
    const jugadores = Array.from({ length: 5 }, (_, i) =>
      crearJugador(`j${i}`, `Jugador ${i}`)
    );
    const stats = jugadores.map((j) => crearEstadisticas(j, 10, 5));

    const resultado = balancearEquipos(jugadores, stats);

    expect(resultado.equipoA).toHaveLength(3);
    expect(resultado.equipoB).toHaveLength(2);
  });

  it("balancea equipos con jugadores de distinto nivel", () => {
    const j1 = crearJugador("j1", "Crack");
    const j2 = crearJugador("j2", "Bueno");
    const j3 = crearJugador("j3", "Regular");
    const j4 = crearJugador("j4", "Malo");
    const jugadores = [j1, j2, j3, j4];

    const stats = [
      crearEstadisticas(j1, 20, 16), // 80%
      crearEstadisticas(j2, 20, 12), // 60%
      crearEstadisticas(j3, 20, 8), // 40%
      crearEstadisticas(j4, 20, 4), // 20%
    ];

    const resultado = balancearEquipos(jugadores, stats);

    // El mejor (80%) y peor (20%) deberían estar en equipos distintos
    const equipoAIds = resultado.equipoA.map((j) => j.id);
    const equipoBIds = resultado.equipoB.map((j) => j.id);

    // j1 (80%) y j4 (20%) deben ir juntos, j2 (60%) y j3 (40%) juntos
    const j1EnA = equipoAIds.includes("j1");
    const j4EnA = equipoAIds.includes("j4");
    expect(j1EnA).toBe(j4EnA); // ambos en el mismo equipo
  });

  it("todos los jugadores aparecen exactamente una vez", () => {
    const jugadores = Array.from({ length: 8 }, (_, i) =>
      crearJugador(`j${i}`, `Jugador ${i}`)
    );
    const stats = jugadores.map((j, i) =>
      crearEstadisticas(j, 10, i + 1)
    );

    const resultado = balancearEquipos(jugadores, stats);
    const todosIds = [
      ...resultado.equipoA.map((j) => j.id),
      ...resultado.equipoB.map((j) => j.id),
    ];

    expect(todosIds).toHaveLength(8);
    expect(new Set(todosIds).size).toBe(8);
  });

  it("incluye habilidades en el balanceo cuando se proporcionan", () => {
    const j1 = crearJugador("j1", "Habil");
    const j2 = crearJugador("j2", "Normal");
    const jugadores = [j1, j2];

    // Mismo winrate
    const stats = [
      crearEstadisticas(j1, 10, 5),
      crearEstadisticas(j2, 10, 5),
    ];

    const habilidades = [
      crearHabilidades("j1", 90),
      crearHabilidades("j2", 30),
    ];

    const resultado = balancearEquipos(jugadores, stats, habilidades);

    // Con habilidades, la explicacion debe mencionarlo
    expect(resultado.explicacion).toContain("habilidades");
  });

  it("jugadores sin estadisticas se tratan como 50%", () => {
    const jugadores = [crearJugador("j1", "Nuevo"), crearJugador("j2", "Otro")];
    const stats: EstadisticasJugador[] = []; // sin stats

    const resultado = balancearEquipos(jugadores, stats);

    expect(resultado.equipoA).toHaveLength(1);
    expect(resultado.equipoB).toHaveLength(1);
    expect(resultado.explicacion).toContain("sin historial");
  });

  it("menciona jugadores sin habilidades en la explicacion", () => {
    const j1 = crearJugador("j1", "Con hab");
    const j2 = crearJugador("j2", "Sin hab");
    const jugadores = [j1, j2];
    const stats = jugadores.map((j) => crearEstadisticas(j, 10, 5));
    const habilidades = [crearHabilidades("j1", 70)]; // solo j1

    const resultado = balancearEquipos(jugadores, stats, habilidades);
    expect(resultado.explicacion).toContain("sin habilidades");
  });
});

// ──────────────────────────────────────────────
// calcularPrediccion
// ──────────────────────────────────────────────
describe("calcularPrediccion", () => {
  it("devuelve 50-50 cuando no hay estadisticas", () => {
    const resultado = calcularPrediccion(["j1", "j2"], ["j3", "j4"], []);
    expect(resultado.promedioA).toBe(50);
    expect(resultado.promedioB).toBe(50);
    expect(resultado.analisis).toBe("Muy parejos");
  });

  it("detecta ventaja del equipo A", () => {
    const j1 = crearJugador("j1", "Crack A");
    const j2 = crearJugador("j2", "Malo B");

    const stats = [
      crearEstadisticas(j1, 20, 18), // 90%
      crearEstadisticas(j2, 20, 2), // 10%
    ];

    const resultado = calcularPrediccion(["j1"], ["j2"], stats);
    expect(resultado.promedioA).toBeGreaterThan(resultado.promedioB);
    expect(resultado.analisis).toBe("Equipo A tiene ventaja");
  });

  it("detecta ventaja del equipo B", () => {
    const j1 = crearJugador("j1", "Malo A");
    const j2 = crearJugador("j2", "Crack B");

    const stats = [
      crearEstadisticas(j1, 20, 2), // 10%
      crearEstadisticas(j2, 20, 18), // 90%
    ];

    const resultado = calcularPrediccion(["j1"], ["j2"], stats);
    expect(resultado.promedioB).toBeGreaterThan(resultado.promedioA);
    expect(resultado.analisis).toBe("Equipo B tiene ventaja");
  });

  it("equipos vacíos devuelven promedio 50", () => {
    const resultado = calcularPrediccion([], [], []);
    expect(resultado.promedioA).toBe(50);
    expect(resultado.promedioB).toBe(50);
  });
});
