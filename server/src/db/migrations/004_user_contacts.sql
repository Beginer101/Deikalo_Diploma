-- Міграція 004: опціональні контакти користувача (особистий профіль).
-- Для існуючих БД:
--   psql $DATABASE_URL -f src/db/migrations/004_user_contacts.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord  VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone    VARCHAR(30);
