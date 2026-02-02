-- Ejecutar este SQL en Supabase SQL Editor para agregar la funcionalidad de Mundiales

-- Tabla para trackear el estado del mundial de cada jugador
CREATE TABLE mundial_estado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  fase TEXT NOT NULL DEFAULT 'grupos' CHECK (fase IN ('grupos', 'octavos', 'cuartos', 'semifinal', 'final', 'campeon')),
  partidos_fase INTEGER NOT NULL DEFAULT 0,
  victorias_grupos INTEGER NOT NULL DEFAULT 0,
  empates_grupos INTEGER NOT NULL DEFAULT 0,
  derrotas_grupos INTEGER NOT NULL DEFAULT 0,
  mundiales_ganados INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(jugador_id)
);

-- Tabla para historial de mundiales completados
CREATE TABLE mundial_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  resultado TEXT NOT NULL CHECK (resultado IN ('campeon', 'final', 'semifinal', 'cuartos', 'octavos', 'grupos')),
  fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE mundial_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundial_historial ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público
CREATE POLICY "Acceso público a mundial_estado" ON mundial_estado FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público a mundial_historial" ON mundial_historial FOR ALL USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX idx_mundial_estado_jugador ON mundial_estado(jugador_id);
CREATE INDEX idx_mundial_historial_jugador ON mundial_historial(jugador_id);
