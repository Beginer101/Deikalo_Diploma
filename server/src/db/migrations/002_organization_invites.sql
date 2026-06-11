-- Міграція 002: одноразові тимчасові запрошення до організацій.
-- Для існуючих БД (без повного перестворення схеми):
--   psql $DATABASE_URL -f src/db/migrations/002_organization_invites.sql

CREATE TABLE IF NOT EXISTS organization_invites (
    id              SERIAL PRIMARY KEY,
    token           VARCHAR(64) NOT NULL UNIQUE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role            user_role NOT NULL DEFAULT 'member',
    created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
