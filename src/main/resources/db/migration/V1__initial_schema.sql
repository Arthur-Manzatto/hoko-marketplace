-- ============================================================
-- V1 — Schema inicial do marketplace
-- ============================================================

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE categories (
                            id          UUID PRIMARY KEY,
                            name        VARCHAR(50)  NOT NULL UNIQUE,
                            slug        VARCHAR(60)  NOT NULL UNIQUE,
                            created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
                            updated_at  TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ------------------------------------------------------------
-- USERS
-- name_search: coluna normalizada (sem acento, lowercase)
-- para busca insensível a acento e caixa
-- ------------------------------------------------------------
CREATE TABLE users (
                       id           UUID PRIMARY KEY,
                       name         VARCHAR(50)  NOT NULL,
                       email        VARCHAR(60)  NOT NULL UNIQUE,
                       phone        VARCHAR(11)  NOT NULL UNIQUE,
                       name_search  TEXT         NOT NULL,
                       created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
                       updated_at   TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_users_name_search ON users (name_search);

-- ------------------------------------------------------------
-- ADDRESSES
-- user_id é FK → precisa de índice (Postgres não cria sozinho)
-- ------------------------------------------------------------
CREATE TABLE addresses (
                           id            UUID PRIMARY KEY,
                           user_id       UUID NOT NULL REFERENCES users (id),
                           street        VARCHAR(255) NOT NULL,
                           number        VARCHAR(20)  NOT NULL,
                           complement    VARCHAR(100),
                           neighborhood  VARCHAR(100) NOT NULL,
                           city          VARCHAR(100) NOT NULL,
                           state         VARCHAR(2)   NOT NULL,
                           zip_code      VARCHAR(9)   NOT NULL,
                           created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
                           updated_at    TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_addresses_user_id ON addresses (user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ------------------------------------------------------------
-- Categorias
-- slug: gerado pelo SlugUtils.slugify()
-- ON CONFLICT DO NOTHING: seguro pra re-executar
-- ------------------------------------------------------------
INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES
                                                                    (gen_random_uuid(), 'Eletrônicos',      'eletronicos',      now(), now()),
                                                                    (gen_random_uuid(), 'Periféricos',      'perifericos',      now(), now()),
                                                                    (gen_random_uuid(), 'Roupas',           'roupas',           now(), now()),
                                                                    (gen_random_uuid(), 'Casa & Decoração', 'casa-decoracao',   now(), now())
    ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Usuários
-- name_search: valor que SearchUtils.normalize() geraria
-- (NFD → sem acento → lowercase → trim)
-- SQL não dispara @PrePersist, então precisa vir pronto
-- ------------------------------------------------------------
INSERT INTO users (id, name, email, phone, name_search, created_at, updated_at) VALUES
                                                                                    (gen_random_uuid(), 'Lucas Cirino',                    'lucas@gmail.com',   '19991710428', 'lucas cirino',                   now(), now()),
                                                                                    (gen_random_uuid(), 'Eduardo Scudeler Rocha',          'eduardo@gmail.com', '19998281820', 'eduardo scudeler rocha',         now(), now()),
                                                                                    (gen_random_uuid(), 'Arthur Manzatto de Carvalho Silva','arthur@gmail.com', '19998768765', 'arthur manzatto de carvalho silva', now(), now()),
                                                                                    (gen_random_uuid(), 'João Vitor',                      'joao@gmail.com',    '19998273619', 'joao vitor',                     now(), now())
    ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Endereços (precisa vir depois dos users por causa da FK)
-- ------------------------------------------------------------
INSERT INTO addresses (id, user_id, street, number, complement, neighborhood, city, state, zip_code, created_at, updated_at)
SELECT gen_random_uuid(), u.id, 'Rua das Flores', '123', 'Apto 42', 'Centro', 'Campinas', 'SP', '13010000', now(), now()
FROM users u WHERE u.email = 'lucas@gmail.com'
    ON CONFLICT DO NOTHING;

INSERT INTO addresses (id, user_id, street, number, complement, neighborhood, city, state, zip_code, created_at, updated_at)
SELECT gen_random_uuid(), u.id, 'Av. Brasil', '456', NULL, 'Jardim', 'São Paulo', 'SP', '01000000', now(), now()
FROM users u WHERE u.email = 'arthur@gmail.com'
    ON CONFLICT DO NOTHING;