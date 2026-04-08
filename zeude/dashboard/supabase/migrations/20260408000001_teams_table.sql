-- Create dedicated teams table for team management
CREATE TABLE IF NOT EXISTS zeude_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES zeude_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT zeude_teams_name_check CHECK (name ~ '^[A-Za-z0-9_-]+$')
);

CREATE INDEX IF NOT EXISTS idx_zeude_teams_name ON zeude_teams(name);

-- RLS
ALTER TABLE zeude_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on zeude_teams" ON zeude_teams
  FOR ALL USING (auth.role() = 'service_role');

-- Seed existing teams from users
INSERT INTO zeude_teams (name)
SELECT DISTINCT team FROM zeude_users WHERE team IS NOT NULL
ON CONFLICT (name) DO NOTHING;
