INSERT INTO users (id, name, email, phone, created_at, updated_at)
VALUES (gen_random_uuid(), 'Lucas Cirino', 'lucas@gmail.com', '19991710428', NOW(), NOW()),
       (gen_random_uuid(), 'Eduardo Scudeler Rocha', 'eduardo@gmail.com', '19998281820', NOW(), NOW()),
       (gen_random_uuid(), 'Arthur Manzatto de Carvalho Silva', 'arthur@gmail.com', '19998768765', NOW(), NOW()),
       (gen_random_uuid(), 'João Vitor', 'joao@gmail.com', '19998273619', NOW(), NOW())
    ON CONFLICT DO NOTHING;