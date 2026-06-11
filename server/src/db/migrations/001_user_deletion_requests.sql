-- Міграція: додає тип і таблицю запитів на видалення користувачів.
-- Безпечно застосовувати до вже наявної БД (ідемпотентно).
-- Запуск:  psql "$DATABASE_URL" -f src/db/migrations/001_user_deletion_requests.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deletion_request_status') THEN
        CREATE TYPE deletion_request_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS user_deletion_requests (
    id              SERIAL PRIMARY KEY,
    target_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason          TEXT,
    status          deletion_request_status NOT NULL DEFAULT 'pending',
    reviewed_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deletion_req_status ON user_deletion_requests(status);
