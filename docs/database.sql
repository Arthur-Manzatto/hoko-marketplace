-- ============================================================================
--  HOKO MARKETPLACE — SCHEMA UNIVERSAL
-- ============================================================================
--  Executa em: Postgres local (docker) E Supabase (SQL Editor).
--
--  ATENÇÃO: este script DESTRÓI todo o schema public (tabelas, views, RLS
--  policies) e recria do zero. Todos os dados são perdidos.
--
--  Aplicação:
--    Local    → subir o app com perfil `local`
--               (Flyway roda o V1, que é symlink pra este arquivo)
--    Supabase → colar o arquivo inteiro no SQL Editor
-- ============================================================================

-- `extensions` só existe no Supabase. Schema inexistente no search_path é
-- ignorado pelo Postgres, então a mesma linha serve pros dois ambientes.
-- No Supabase o pg_trgm fica em `extensions`; localmente cai em `public`.
SET search_path = public, extensions, pg_catalog;

-- ---------------------------------------------------------------------------
--  1. RESET
-- ---------------------------------------------------------------------------
--  Não usamos DROP SCHEMA public CASCADE porque no local isso derrubaria a
--  tabela flyway_schema_history no meio da transação do Flyway, e a gravação
--  do histórico falharia. O loop dropa só as tabelas e preserva a `flyway%`.
--  Usar relkind (e não information_schema.tables) cobre também tabelas
--  particionadas. Policies RLS caem junto com a tabela.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  obj text;
BEGIN
  FOR obj IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'm')
      AND c.relname NOT LIKE 'flyway%'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', obj);
  END LOOP;

  FOR obj IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', obj);
  END LOOP;
END $$;

--  Só pg_trgm. Funções não são dropadas no reset de propósito: localmente o
--  pg_trgm é instalado em `public` e um "DROP ALL FUNCTIONS" quebraria ele.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
--  2. TRIGGER DE updated_at
-- ---------------------------------------------------------------------------
--  Sem isso, editar uma linha pelo dashboard do Supabase deixa updated_at
--  desatualizado: hoje só o Hibernate (@UpdateTimestamp) cuida da coluna.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
--  3. TABELAS
-- ---------------------------------------------------------------------------

-- ============================ CATEGORIES ===================================
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,
  slug        VARCHAR(60) NOT NULL UNIQUE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_length CHECK (char_length(name) BETWEEN 3 AND 50)
);

-- ================================ USERS ====================================
--  Sem DEFAULT em id de propósito: no Supabase o id vem de auth.users.
--  Um gen_random_uuid() aqui geraria um id aleatório e a FK recusaria em
--  silêncio — sem default o erro é "null value in column id", que é claro.
CREATE TABLE public.users (
  id          UUID PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  email       VARCHAR(60) NOT NULL UNIQUE,
  phone       VARCHAR(11) UNIQUE,
  name_search TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT users_name_length  CHECK (char_length(name) BETWEEN 3 AND 50),
  CONSTRAINT users_email_format CHECK (position('@' IN email) > 1),
  CONSTRAINT users_phone_format CHECK (phone ~ '^\d{10,11}$')
);

-- ============================== ADDRESSES ===================================
--  ON DELETE CASCADE: deletar o usuário leva os endereços junto.
--  is_default + índice único parcial (passo 4) garante UM endereço padrão
--  por usuário — sem isso não há como marcar o default do checkout.
CREATE TABLE public.addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  label         VARCHAR(30),
  street        VARCHAR(255) NOT NULL,
  number        VARCHAR(20)  NOT NULL,
  complement    VARCHAR(100),
  neighborhood  VARCHAR(100) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(2)   NOT NULL,
  zip_code      VARCHAR(9)   NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT addresses_state_format CHECK (state ~ '^[A-Z]{2}$'),
  CONSTRAINT addresses_zip_format    CHECK (zip_code ~ '^\d{5}-?\d{3}$')
);

-- =============================== SELLERS ====================================
--  document (CPF/CNPJ) UNIQUE — no dump anterior não era, então dois
--  vendedores com o mesmo CPF passavam.
CREATE TABLE public.sellers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  store_name        VARCHAR(80) NOT NULL,
  store_name_search TEXT       NOT NULL,
  slug              VARCHAR(90) NOT NULL UNIQUE,
  document    VARCHAR(14) NOT NULL UNIQUE,
  description TEXT,
  logo_url    TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT sellers_document_format CHECK (document ~ '^\d{11}(\d{3})?$'),
  CONSTRAINT sellers_status_check    CHECK (status IN ('PENDING','APPROVED','REJECTED'))
);

-- =============================== PRODUCTS ===================================
--  category_id em RESTRICT: não deixa apagar categoria com produto vinculado.
--  ON DELETE CASCADE em seller_id: produto morre com a loja.
CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES public.sellers (id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  name        VARCHAR(120) NOT NULL,
  name_search TEXT        NOT NULL,
  slug        VARCHAR(140) NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 0,
  deleted_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT products_price_check    CHECK (price >= 0),
  CONSTRAINT products_quantity_check CHECK (quantity >= 0)
);

-- ============================ PRODUCT_IMAGES ================================
--  `position` virou `sort_order`: `position` é nome de função no Postgres e
--  atrapalha em queries. UNIQUE (product_id, sort_order) impede duas imagens
--  com o mesmo slot.
CREATE TABLE public.product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT product_images_sort_check CHECK (sort_order >= 0),
  CONSTRAINT product_images_order_unique UNIQUE (product_id, sort_order)
);

-- ============================== FAVORITES ===================================
CREATE TABLE public.favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT favorites_unique UNIQUE (user_id, product_id)
);

-- ================================ CARTS =====================================
CREATE TABLE public.carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================== CART_ITEMS ==================================
--  UNIQUE (cart_id, product_id) faltava: permitia o mesmo produto aparecer
--  duplicado no carrinho.
CREATE TABLE public.cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES public.carts (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT cart_items_unique UNIQUE (cart_id, product_id)
);

-- ================================ ORDERS ====================================
--  user_id em RESTRICT: preserva histórico de pedido, não dá pra apagar
--  usuário que já comprou. Snapshot do endereço (ship_*) é a fonte da verdade;
--  address_id é só o vínculo com o endereço salvo e pode virar NULL.
CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  address_id        UUID REFERENCES public.addresses (id) ON DELETE SET NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  total             NUMERIC(12,2) NOT NULL,
  shipping_cost     NUMERIC(12,2) NOT NULL DEFAULT 0,
  tracking_code     VARCHAR(60),
  ship_street       VARCHAR(255) NOT NULL,
  ship_number       VARCHAR(20)  NOT NULL,
  ship_complement   VARCHAR(100),
  ship_neighborhood VARCHAR(100) NOT NULL,
  ship_city         VARCHAR(100) NOT NULL,
  ship_state        VARCHAR(2)   NOT NULL,
  ship_zip_code     VARCHAR(9)   NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check  CHECK (status IN ('PENDING','PAID','SHIPPED','DELIVERED','CANCELED')),
  CONSTRAINT orders_total_check   CHECK (total >= 0),
  CONSTRAINT orders_shipping_check CHECK (shipping_cost >= 0),
  CONSTRAINT orders_state_format  CHECK (ship_state ~ '^[A-Z]{2}$'),
  CONSTRAINT orders_zip_format    CHECK (ship_zip_code ~ '^\d{5}-?\d{3}$')
);

-- ============================== ORDER_ITEMS =================================
--  product_id nullable + SET NULL: o histórico do pedido não pode quebrar
--  porque alguém apagou o produto. product_name/unit_price são o snapshot.
CREATE TABLE public.order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id   UUID REFERENCES public.products (id) ON DELETE SET NULL,
  product_name VARCHAR(120) NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  quantity     INTEGER NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT order_items_unit_price_check CHECK (unit_price >= 0),
  CONSTRAINT order_items_quantity_check   CHECK (quantity > 0)
);

-- =========================== PRODUCT_REVIEWS ===============================
--  order_item_id UNIQUE: uma avaliação por item comprado — só quem comprou
--  avalia, e não duas vezes.
CREATE TABLE public.product_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items (id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL,
  title         VARCHAR(100),
  comment       TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT product_reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);

-- ================================ PAYMENTS ==================================
CREATE TABLE public.payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  method         VARCHAR(20) NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  amount         NUMERIC(12,2) NOT NULL,
  provider       VARCHAR(30),
  provider_tx_id VARCHAR(100) UNIQUE,
  installments   SMALLINT NOT NULL DEFAULT 1,
  paid_at        TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payments_method_check       CHECK (method IN ('PIX','CARD','BOLETO')),
  CONSTRAINT payments_status_check       CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
  CONSTRAINT payments_amount_check       CHECK (amount >= 0),
  CONSTRAINT payments_installments_check CHECK (installments >= 1)
);

-- ---------------------------------------------------------------------------
--  4. FK COM O SUPABASE AUTH
-- ---------------------------------------------------------------------------
--  Só no Supabase. O bloco é pulado no Postgres local (não existe schema
--  auth). CASCADE: apagar o usuário no Auth leva o perfil junto.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth')
     AND EXISTS (
 SELECT 1 FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'auth' AND c.relname = 'users' AND c.relkind = 'r'
     )
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_id_fkey')
  THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
--  5. ÍNDICES
-- ---------------------------------------------------------------------------
--  Postgres NÃO cria índice automático em coluna de FK — sem isso, buscar
--  produtos de um seller faz seq scan. Os UNIQUE já geram índice próprio.

--  Busca por LIKE '%termo%' não usa índicebtree; precisa de GIN + trgm.
CREATE INDEX idx_categories_slug_trgm
  ON public.categories USING gin (slug gin_trgm_ops);
CREATE INDEX idx_users_name_search_trgm
  ON public.users USING gin (name_search gin_trgm_ops);
CREATE INDEX idx_sellers_store_name_search_trgm
  ON public.sellers USING gin (store_name_search gin_trgm_ops);
CREATE INDEX idx_products_name_search_trgm
  ON public.products USING gin (name_search gin_trgm_ops);

CREATE INDEX idx_addresses_user_id ON public.addresses (user_id);

--  Um (e só um) endereço default por usuário.
CREATE UNIQUE INDEX idx_addresses_user_default
  ON public.addresses (user_id) WHERE is_default;

CREATE INDEX idx_products_seller_id   ON public.products (seller_id);
CREATE INDEX idx_products_category_id ON public.products (category_id);

--  Listagem da vitrine: só produtos não deletados.
CREATE INDEX idx_products_active_category
  ON public.products (category_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_product_images_product_id   ON public.product_images (product_id);
CREATE INDEX idx_favorites_user_id           ON public.favorites (user_id);
CREATE INDEX idx_favorites_product_id        ON public.favorites (product_id);
CREATE INDEX idx_cart_items_cart_id          ON public.cart_items (cart_id);

CREATE INDEX idx_orders_user_created ON public.orders (user_id, created_at DESC);
CREATE INDEX idx_orders_status       ON public.orders (status);

CREATE INDEX idx_order_items_order_id     ON public.order_items (order_id);
CREATE INDEX idx_order_items_product_id   ON public.order_items (product_id);
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews (product_id);

-- ---------------------------------------------------------------------------
--  6. TRIGGERS DE updated_at
-- ---------------------------------------------------------------------------
--  Roda depois da criação das tabelas, porque o reset acima dropou as
--  antigas (e os triggers delas junto). favorites fica de fora: é append-only.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'categories', 'users', 'addresses', 'sellers', 'products',
    'product_images', 'carts', 'cart_items', 'orders',
    'order_items', 'product_reviews', 'payments'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I '
 'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
--  7. GRANTS
-- ---------------------------------------------------------------------------
--  Depois do DROP/CREATE as tabelas perdem os grants que o Supabase dava por
--  default. Isso restaura o comportamento de hoje (publishable key lê as
--  tabelas). No Postgres local esses roles não existem — daí o teste.
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', r);
      EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA public TO %I', r);
      EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %I', r);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
--  8. SEED
-- ---------------------------------------------------------------------------
--  Categorias: sempre (não dependem de usuário).
INSERT INTO public.categories (name, slug) VALUES
  ('Eletrônicos',      'eletronicos'),
  ('Periféricos',      'perifericos'),
  ('Roupas',           'roupas'),
  ('Casa & Decoração', 'casa-decoracao')
ON CONFLICT DO NOTHING;

--  Usuários/endereços/produtos: só onde NÃO existe Supabase Auth.
--  No Supabase um INSERT aqui violaria users_id_fkey, porque os ids
--  aleatórios não existem em auth.users — lá o usuário nasce pelo signup.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    RAISE NOTICE 'Seed de dados omitido: schema auth detectado (Supabase).';
    RETURN;
  END IF;

  --  name_search já vem normalizado (NFD → sem acento → lowercase),
  --  igual ao SearchUtils.normalize() faria.
  INSERT INTO public.users (id, name, email, phone, name_search) VALUES
    (gen_random_uuid(), 'Lucas Cirino',                    'lucas@gmail.com',   '19991710428', 'lucas cirino'),
    (gen_random_uuid(), 'Eduardo Scudeler Rocha',          'eduardo@gmail.com', '19998281820', 'eduardo scudeler rocha'),
    (gen_random_uuid(), 'Arthur Manzatto de Carvalho Silva','arthur@gmail.com', '19998768765', 'arthur manzatto de carvalho silva'),
    (gen_random_uuid(), 'João Vitor',                      'joao@gmail.com',    '19998273619', 'joao vitor');

  INSERT INTO public.addresses
    (user_id, label, street, number, complement, neighborhood, city, state, zip_code, is_default)
  SELECT u.id, 'Casa', 'Rua das Flores', '123', 'Apto 42', 'Centro', 'Campinas', 'SP', '13010000', true
  FROM public.users u WHERE u.email = 'lucas@gmail.com';

  INSERT INTO public.addresses
    (user_id, label, street, number, neighborhood, city, state, zip_code)
  SELECT u.id, 'Trabalho', 'Av. Brasil', '456', 'Jardim', 'São Paulo', 'SP', '01000000'
  FROM public.users u WHERE u.email = 'arthur@gmail.com';

  INSERT INTO public.sellers (user_id, store_name, store_name_search, slug, document, description, status)
  SELECT u.id, 'Hoko Store', 'hoko store', 'hoko-store', '12345678901',
         'Loja oficial de eletrônicos.', 'APPROVED'
  FROM public.users u WHERE u.email = 'lucas@gmail.com';

  INSERT INTO public.products (seller_id, category_id, name, name_search, slug, description, price, quantity)
  SELECT s.id, c.id, p.name, p.name_search, p.slug, p.description, p.price, p.quantity
  FROM public.sellers s
  CROSS JOIN (VALUES
    ('eletronicos',    'Smartphone Galaxy',        'smartphone galaxy',        'smartphone-galaxy',        'Tela AMOLED de 6.1 polegadas.',           1899.90, 25),
    ('eletronicos',    'Fone Bluetooth TWS',       'fone bluetooth tws',       'fone-bluetooth-tws',       'Cancelamento de ruído ativo.',               249.00, 80),
    ('perifericos',    'Teclado Mecânico Gamer',   'teclado mecanico gamer',   'teclado-mecanico-gamer',   'Switches vermelhos e ABNT2.',                459.90, 40),
    ('perifericos',    'Mouse Sem Fio Ergonômico', 'mouse sem fio ergonomico', 'mouse-sem-fio-ergonomico', 'Conexão Bluetooth e bateria recarregável.',  129.90, 60),
    ('roupas',         'Camiseta Premium Algodão', 'camiseta premium algodao', 'camiseta-premium-algodao', 'Malha 100% algodão penteado.',                79.90, 120),
    ('casa-decoracao', 'Luminária de Mesa LED',    'luminaria de mesa led',    'luminaria-de-mesa-led',    'Luz quente regulável.',                      159.90, 35)
  ) AS p(category_slug, name, name_search, slug, description, price, quantity)
  JOIN public.categories c ON c.slug = p.category_slug;

  INSERT INTO public.product_images (product_id, url, sort_order)
  SELECT p.id, 'https://placehold.co/800x800/png?text=' || p.slug, 0
  FROM public.products p;
END $$;
