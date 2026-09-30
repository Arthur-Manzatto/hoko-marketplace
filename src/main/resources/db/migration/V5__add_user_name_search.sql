CREATE EXTENSION IF NOT EXISTS unaccent;
ALTER TABLE users ADD COLUMN name_search text;
UPDATE users SET name_search = lower(unaccent(name));
CREATE INDEX idx_users_name_search ON users (name_search);