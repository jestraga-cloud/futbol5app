-- ============================================
-- MIGRACIONES PARA SISTEMA DE PREDICCIONES
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Agregar columna estado a tabla partidos
-- Los partidos existentes serán 'finalizado' por defecto
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'finalizado';

-- Agregar constraint de validación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partidos_estado_check'
  ) THEN
    ALTER TABLE partidos ADD CONSTRAINT partidos_estado_check
      CHECK (estado IN ('programado', 'finalizado'));
  END IF;
END $$;

-- 2. Crear tabla de predicciones
CREATE TABLE IF NOT EXISTS predicciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  prediccion TEXT CHECK (prediccion IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partido_id, session_id)
);

-- 3. Habilitar RLS para predicciones
ALTER TABLE predicciones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para predicciones (acceso público)
-- Todos pueden leer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'predicciones_select'
  ) THEN
    CREATE POLICY "predicciones_select" ON predicciones
      FOR SELECT USING (true);
  END IF;
END $$;

-- Todos pueden insertar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'predicciones_insert'
  ) THEN
    CREATE POLICY "predicciones_insert" ON predicciones
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Todos pueden actualizar (para cambiar predicción)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'predicciones_update'
  ) THEN
    CREATE POLICY "predicciones_update" ON predicciones
      FOR UPDATE USING (true);
  END IF;
END $$;

-- Todos pueden eliminar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'predicciones_delete'
  ) THEN
    CREATE POLICY "predicciones_delete" ON predicciones
      FOR DELETE USING (true);
  END IF;
END $$;

-- 5. Índice para búsqueda rápida por partido
CREATE INDEX IF NOT EXISTS idx_predicciones_partido_id ON predicciones(partido_id);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, verifica con:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partidos';
-- SELECT * FROM predicciones LIMIT 1;
