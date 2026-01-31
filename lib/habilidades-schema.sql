-- Ejecutar este SQL en Supabase SQL Editor para agregar habilidades de jugadores

CREATE TABLE habilidades_jugador (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  fuerza INTEGER NOT NULL CHECK (fuerza BETWEEN 1 AND 99),
  arquero INTEGER NOT NULL CHECK (arquero BETWEEN 1 AND 99),
  tiro INTEGER NOT NULL CHECK (tiro BETWEEN 1 AND 99),
  regate INTEGER NOT NULL CHECK (regate BETWEEN 1 AND 99),
  pase INTEGER NOT NULL CHECK (pase BETWEEN 1 AND 99),
  defensa INTEGER NOT NULL CHECK (defensa BETWEEN 1 AND 99),
  estado_fisico INTEGER NOT NULL CHECK (estado_fisico BETWEEN 1 AND 99),
  reaccion INTEGER NOT NULL CHECK (reaccion BETWEEN 1 AND 99),
  overall INTEGER GENERATED ALWAYS AS (
    (fuerza + arquero + tiro + regate + pase + defensa + estado_fisico + reaccion) / 8
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(jugador_id)
);

-- Habilitar RLS
ALTER TABLE habilidades_jugador ENABLE ROW LEVEL SECURITY;

-- Politica de acceso publico
CREATE POLICY "Acceso publico a habilidades_jugador" ON habilidades_jugador
  FOR ALL USING (true) WITH CHECK (true);

-- Indice para busquedas por jugador
CREATE INDEX idx_habilidades_jugador ON habilidades_jugador(jugador_id);
