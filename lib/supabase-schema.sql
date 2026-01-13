-- Ejecutar este SQL en Supabase SQL Editor

-- Tabla de jugadores
CREATE TABLE jugadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apodo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de partidos
CREATE TABLE partidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  superficie TEXT NOT NULL CHECK (superficie IN ('caucho', 'cemento', 'sintetico')),
  goles_equipo_a INTEGER NOT NULL DEFAULT 0,
  goles_equipo_b INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de participaciones (relación entre jugadores y partidos)
CREATE TABLE participaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  equipo TEXT NOT NULL CHECK (equipo IN ('A', 'B')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partido_id, jugador_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público (sin autenticación)
CREATE POLICY "Acceso público a jugadores" ON jugadores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público a partidos" ON partidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público a participaciones" ON participaciones FOR ALL USING (true) WITH CHECK (true);

-- Índices para mejorar rendimiento
CREATE INDEX idx_participaciones_partido ON participaciones(partido_id);
CREATE INDEX idx_participaciones_jugador ON participaciones(jugador_id);
CREATE INDEX idx_partidos_fecha ON partidos(fecha DESC);
