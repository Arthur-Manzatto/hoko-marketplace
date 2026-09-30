INSERT INTO categories (id, name, slug, created_at, updated_at)
VALUES (gen_random_uuid(), 'Eletrônicos', 'eletronicos', NOW(), NOW()),
       (gen_random_uuid(), 'Periféricos', 'perifericos', NOW(), NOW()),
       (gen_random_uuid(), 'Roupas', 'roupas', NOW(), NOW())
    ON CONFLICT DO NOTHING;