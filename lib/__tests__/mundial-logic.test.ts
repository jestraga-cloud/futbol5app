import { describe, it, expect } from "vitest";
import { calcularNuevoEstadoMundial, MundialUpdate } from "../mundial-logic";
import { FaseMundial } from "../supabase";

function crearEstado(overrides: Partial<{
  fase: FaseMundial;
  partidos_fase: number;
  victorias_grupos: number;
  empates_grupos: number;
  derrotas_grupos: number;
  mundiales_ganados: number;
}> = {}) {
  return {
    fase: "grupos" as FaseMundial,
    partidos_fase: 0,
    victorias_grupos: 0,
    empates_grupos: 0,
    derrotas_grupos: 0,
    mundiales_ganados: 0,
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// Sin estado previo (jugador nuevo)
// ──────────────────────────────────────────────
describe("sin estado previo", () => {
  it("crea nuevo mundial en grupos con victoria", () => {
    const result = calcularNuevoEstadoMundial(null, "victoria");
    expect(result.fase).toBe("grupos");
    expect(result.victorias_grupos).toBe(1);
    expect(result.empates_grupos).toBe(0);
    expect(result.derrotas_grupos).toBe(0);
    expect(result.mundiales_ganados).toBe(0);
    expect(result.eliminado).toBe(false);
  });

  it("crea nuevo mundial en grupos con empate", () => {
    const result = calcularNuevoEstadoMundial(null, "empate");
    expect(result.empates_grupos).toBe(1);
  });

  it("crea nuevo mundial en grupos con derrota", () => {
    const result = calcularNuevoEstadoMundial(null, "derrota");
    expect(result.derrotas_grupos).toBe(1);
  });
});

// ──────────────────────────────────────────────
// Fase de grupos
// ──────────────────────────────────────────────
describe("fase de grupos", () => {
  it("actualiza contadores sin cambiar fase (menos de 3 partidos)", () => {
    const estado = crearEstado({ victorias_grupos: 1 });
    const result = calcularNuevoEstadoMundial(estado, "victoria");

    expect(result.fase).toBe("grupos");
    expect(result.victorias_grupos).toBe(2);
    expect(result.eliminado).toBe(false);
  });

  it("clasifica a octavos con 3 victorias (9 puntos)", () => {
    const estado = crearEstado({ victorias_grupos: 2 }); // 2V, ahora gana la 3ra
    const result = calcularNuevoEstadoMundial(estado, "victoria");

    expect(result.fase).toBe("octavos");
    expect(result.victorias_grupos).toBe(3);
    expect(result.eliminado).toBe(false);
  });

  it("clasifica con 2V+1E (7 puntos >= 4)", () => {
    const estado = crearEstado({ victorias_grupos: 2 });
    const result = calcularNuevoEstadoMundial(estado, "empate");

    expect(result.fase).toBe("octavos");
    expect(result.victorias_grupos).toBe(2);
    expect(result.empates_grupos).toBe(1);
  });

  it("clasifica con 1V+2E (5 puntos >= 4)", () => {
    const estado = crearEstado({ victorias_grupos: 1, empates_grupos: 1 });
    const result = calcularNuevoEstadoMundial(estado, "empate");

    expect(result.fase).toBe("octavos");
    expect(result.victorias_grupos).toBe(1);
    expect(result.empates_grupos).toBe(2);
  });

  it("eliminado con 1V+2D (3 puntos < 4)", () => {
    const estado = crearEstado({ victorias_grupos: 1, derrotas_grupos: 1 });
    const result = calcularNuevoEstadoMundial(estado, "derrota");

    expect(result.eliminado).toBe(true);
    expect(result.victorias_grupos).toBe(0); // reiniciado
    expect(result.derrotas_grupos).toBe(0);
    expect(result.fase).toBe("grupos");
  });

  it("eliminado con 3D (0 puntos)", () => {
    const estado = crearEstado({ derrotas_grupos: 2 });
    const result = calcularNuevoEstadoMundial(estado, "derrota");

    expect(result.eliminado).toBe(true);
  });

  it("eliminado con 1E+2D (1 punto < 4)", () => {
    const estado = crearEstado({ empates_grupos: 1, derrotas_grupos: 1 });
    const result = calcularNuevoEstadoMundial(estado, "derrota");

    expect(result.eliminado).toBe(true);
  });

  it("conserva mundiales_ganados al ser eliminado", () => {
    const estado = crearEstado({ derrotas_grupos: 2, mundiales_ganados: 3 });
    const result = calcularNuevoEstadoMundial(estado, "derrota");

    expect(result.eliminado).toBe(true);
    expect(result.mundiales_ganados).toBe(3);
  });
});

// ──────────────────────────────────────────────
// Fases eliminatorias
// ──────────────────────────────────────────────
describe("fases eliminatorias", () => {
  const fases: FaseMundial[] = ["octavos", "cuartos", "semifinal"];
  const siguientes: Record<string, FaseMundial> = {
    octavos: "cuartos",
    cuartos: "semifinal",
    semifinal: "final",
  };

  for (const fase of fases) {
    it(`victoria en ${fase} avanza a ${siguientes[fase]}`, () => {
      const estado = crearEstado({ fase });
      const result = calcularNuevoEstadoMundial(estado, "victoria");

      expect(result.fase).toBe(siguientes[fase]);
      expect(result.partidos_fase).toBe(0);
      expect(result.eliminado).toBe(false);
    });

    it(`derrota en ${fase} elimina y reinicia a grupos`, () => {
      const estado = crearEstado({ fase, mundiales_ganados: 2 });
      const result = calcularNuevoEstadoMundial(estado, "derrota");

      expect(result.eliminado).toBe(true);
      expect(result.fase).toBe("grupos");
      expect(result.mundiales_ganados).toBe(2);
    });

    it(`empate en ${fase} incrementa partidos_fase`, () => {
      const estado = crearEstado({ fase, partidos_fase: 0 });
      const result = calcularNuevoEstadoMundial(estado, "empate");

      expect(result.fase).toBe(fase);
      expect(result.partidos_fase).toBe(1);
      expect(result.eliminado).toBe(false);
    });
  }
});

// ──────────────────────────────────────────────
// Final
// ──────────────────────────────────────────────
describe("final", () => {
  it("victoria en final -> campeon, incrementa mundiales_ganados", () => {
    const estado = crearEstado({ fase: "final", mundiales_ganados: 0 });
    const result = calcularNuevoEstadoMundial(estado, "victoria");

    expect(result.fase).toBe("campeon");
    expect(result.mundiales_ganados).toBe(1);
    expect(result.campeon).toBe(true);
  });

  it("derrota en final elimina", () => {
    const estado = crearEstado({ fase: "final", mundiales_ganados: 1 });
    const result = calcularNuevoEstadoMundial(estado, "derrota");

    expect(result.eliminado).toBe(true);
    expect(result.mundiales_ganados).toBe(1);
  });

  it("empate en final sigue en final", () => {
    const estado = crearEstado({ fase: "final", partidos_fase: 0 });
    const result = calcularNuevoEstadoMundial(estado, "empate");

    expect(result.fase).toBe("final");
    expect(result.partidos_fase).toBe(1);
  });

  it("multiples mundiales ganados se acumulan", () => {
    const estado = crearEstado({ fase: "final", mundiales_ganados: 5 });
    const result = calcularNuevoEstadoMundial(estado, "victoria");

    expect(result.mundiales_ganados).toBe(6);
    expect(result.campeon).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Campeon
// ──────────────────────────────────────────────
describe("campeon", () => {
  it("no cambia nada si ya es campeon", () => {
    const estado = crearEstado({ fase: "campeon", mundiales_ganados: 3 });
    const result = calcularNuevoEstadoMundial(estado, "victoria");

    expect(result.fase).toBe("campeon");
    expect(result.mundiales_ganados).toBe(3);
    expect(result.eliminado).toBe(false);
    expect(result.campeon).toBe(false); // no es un nuevo campeonato
  });
});
