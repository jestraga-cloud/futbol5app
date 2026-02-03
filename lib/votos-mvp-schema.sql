CREATE TABLE IF NOT EXISTS votos_mvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partido_id, session_id)
);

ALTER TABLE votos_mvp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votos_mvp_select" ON votos_mvp FOR SELECT USING (true);
CREATE POLICY "votos_mvp_insert" ON votos_mvp FOR INSERT WITH CHECK (true);

CREATE INDEX idx_votos_mvp_partido ON votos_mvp(partido_id);
