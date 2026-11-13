# Hoko API

Documentação dos endpoints disponíveis para o frontend.

> Como as telas puxam esses dados (skeleton, cards, estados de vazio e erro): ver o [guia do front](front.md).

## 1. Sobre a API

**Base URL**

```
Local:      http://localhost:8080
Produção:   https://hoko-api.onrender.com
```

**Content-Type:** toda requisição com body usa `application/json`.

**Autenticação:** token do Supabase Auth no header `Authorization: Bearer <token>`. A vitrine (categorias, lojas e produtos) é pública; conta, loja e produtos do vendedor exigem login; administração exige admin. Detalhes na seção 2.

**Banco:** a API usa o Postgres do Supabase. Não existe banco local: rodando na sua máquina, a API também conecta no Supabase.

## 2. Antes de começar

### De onde vêm os usuários

Não existe `POST /api/users`. O usuário nasce no **cadastro do Supabase Auth** (`supabase.auth.signUp` no front): um trigger no banco copia ele para `public.users`, com o mesmo `id`.

- `name` e `phone` vêm do `options.data` do `signUp`
- Telefone inválido ou já usado por outra conta é salvo como `null`, e o cadastro não falha
- O e-mail é sempre o do Auth. Para trocar, use `supabase.auth.updateUser({ email })`; o banco atualiza sozinho

A API não recebe `userId` na URL: quem é o usuário vem do token (rotas `/api/me`).

### Autenticação

Toda rota que não é vitrine pública exige o token da sessão do Supabase:

```
Authorization: Bearer <access_token>
```

| Quem | Rotas |
|---|---|
| **Qualquer um** (sem token) | `GET /api/categories/**`, `GET /api/sellers/**`, `GET /api/products/**` |
| **Logado** | `/api/me/**` (perfil, loja, produtos da loja, endereços, carrinho, pedidos, vendas da loja) |
| **Admin** | criar/editar/apagar categorias, `/api/users/**` |

O `apiFetch` do `js/api.js` já manda o token. Nos exemplos deste documento, `authFetch` é um `fetch` com o token:

```js
import { supabase } from "./supabase-client.js";

async function authFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${data.session?.access_token}` },
  });
}
```

⚠️ **Rotas públicas: não mande token.** Um token vencido ou inválido faz a API responder `401` até numa rota pública. Para a vitrine use `getJson`/`fetch` sem header (como o front já faz); `apiFetch`/`authFetch` só para `/api/me/**` e admin.

**Erros de autenticação** vêm no formato padrão (seção 5):

| Status | `message` | Quando |
|---|---|---|
| `401` | `Authentication required` | Sem token, token vencido ou inválido. No front: mandar para o login |
| `403` | `Access denied` | Logado, mas sem permissão (ex.: não-admin criando categoria) |

**Admin** é quem tem `app_metadata.role = "admin"` no Supabase Auth. Só dá para definir pelo SQL Editor ou pela service key, nunca pelo site:

```sql
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE email = '...';
```

Vale a partir do próximo login (o token antigo não tem a role).

### Cold start

O plano gratuito do Render desliga o serviço depois de **15 minutos sem tráfego**. O primeiro request depois disso leva cerca de **1 minuto** para responder.

Não é bug da API. Se aparecer um loading page ou um request pendurado, é isso. Rodando a API na sua máquina isso não acontece.

## 3. Convenções

- **IDs** são UUID no formato `550e8400-e29b-41d4-a716-446655440000`, nunca inteiros
- **Datas** em ISO 8601 com timezone UTC: `2026-10-05T16:53:12Z`
- **Não há envelope** — a resposta é o objeto direto, não `{ "data": ... }`
- **Header `Authorization`** só nas rotas de logado e admin (seção 2)

## 4. Paginação

Listagens aceitam três query params:

| Param | Padrão | Descrição |
|---|---|---|
| `page` | `0` | Índice da página, começando em **0** |
| `size` | `20` | Itens por página |
| `sort` | — | Ordenação, ex: `sort=name,asc` |

Formato da resposta:

```json
{
  "content": [],
  "totalElements": 4,
  "totalPages": 1,
  "number": 0,
  "size": 20,
  "first": true,
  "last": true,
  "empty": false
}
```

A lista de itens está em `content`.

## 5. Erros

### Status codes

| Status | Quando acontece |
|---|---|
| `400` | UUID malformado na URL, JSON inválido, parâmetro de filtro inválido (`sort` com campo inexistente, `minPrice > maxPrice`) |
| `401` | Sem token, ou token vencido/inválido (seção 2) |
| `403` | Logado, mas sem permissão para a rota (seção 2) |
| `404` | Registro, rota ou arquivo não encontrado |
| `405` | Método HTTP não aceito na rota (ex.: `DELETE` onde só existe `GET`) |
| `409` | Conflito com o banco: valor duplicado (nome de categoria, documento de loja, telefone…) ou delete barrado por referência (categoria com produto) |
| `422` | Falha de validação de campo (tamanho, formato, obrigatório) ou regra de negócio (`error: "Business rule"`, ex.: sem estoque) |
| `500` | Erro inesperado |

### Formato padrão

```json
{
  "timestamp": "2026-10-05T16:53:12Z",
  "status": 404,
  "error": "Resource not found",
  "message": "Category not found with id 550e8400-e29b-41d4-a716-446655440000",
  "path": "/api/categories/550e8400-e29b-41d4-a716-446655440000"
}
```

### Formato de validação (422)

Quando a falha é de campo, vem um array `errors` a mais:

```json
{
  "timestamp": "2026-10-05T16:53:12Z",
  "status": 422,
  "error": "Validation error",
  "message": "Invalid input data",
  "path": "/api/categories",
  "errors": [
    { "fieldName": "name", "message": "Name is required" },
    { "fieldName": "name", "message": "Name must be between 3 and 50 characters" }
  ]
}
```

Pra mostrar erro de validação em input, itere `errors`:

```js
const body = await res.json();
body.errors?.forEach(e => {
  setFieldError(e.fieldName, e.message);
});
```

---

## 6. Categorias

Listar e buscar são **públicos**. Criar, atualizar e deletar exigem **admin** (`401` sem token, `403` para quem não é admin).

Já existem 18 categorias no banco, cada uma com ícone e descrição: `eletronicos`, `perifericos`, `roupas`, `casa-decoracao`, `games`, `livros`, `esportes`, `brinquedos`, `beleza-perfumaria`, `saude`, `ferramentas`, `automotivo`, `mercado`, `jardim`, `joias-acessorios`, `papelaria`, `eletrodomesticos`, `bebes`.

### Modelo

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Eletrônicos",
  "slug": "eletronicos",
  "icon": "bi-phone",
  "description": "Smartphones, notebooks, fones e muito mais",
  "createdAt": "2026-10-05T16:53:12Z",
  "updatedAt": "2026-10-05T16:53:12Z"
}
```

O `slug` é gerado pelo backend a partir do `name`: minúsculo, sem acento, hífen no lugar de espaço. `"Casa & Decoração"` vira `casa-decoracao`. **Você não manda o slug no body** — só `name`, `icon` e, opcionalmente, `description`.

A `description` é o subtítulo da categoria (ex: no cabeçalho de `categorias.html`). Pode vir `null` se a categoria não tiver descrição, então use `${cat.description ?? ''}` no template.

O `icon` é a classe do ícone do [Bootstrap Icons](https://icons.getbootstrap.com) **sem o `bi` base** (ex: `bi-phone`, não `bi bi-phone`). O `bi` é a classe base da fonte, igual pra todos, então vai no template:

```js
container.innerHTML = page.content.map(cat => `
  <a href="/categorias.html?slug=${cat.slug}" class="categoria-card">
    <div class="categoria-icon"><i class="bi ${cat.icon}"></i></div>
    <span class="categoria-nome">${cat.name}</span>
  </a>`).join('');
```

### Listar

```
GET /api/categories
```

| Query param | Tipo | Descrição |
|---|---|---|
| `search` | string | Busca parcial por nome, sem acento e sem diferenciar maiúsculas |
| `page` | int | padrão `0` |
| `size` | int | padrão `20` |
| `sort` | string | ex: `sort=name,asc` |

```js
const API = 'https://hoko-api.onrender.com';

const res = await fetch(`${API}/api/categories?size=12&sort=name,asc`);
const page = await res.json();

page.content;       // array de categorias
page.totalElements; // total no banco
page.totalPages;
```

Com busca:

```js
const res = await fetch(`${API}/api/categories?search=eletronicos`);
const page = await res.json();
```

### Buscar por id

```
GET /api/categories/{id}
```

```js
const res = await fetch(`${API}/api/categories/${id}`);

if (res.status === 404) {
  // categoria não existe
}

const categoria = await res.json();
```

### Buscar por slug

```
GET /api/categories/slug/{slug}
```

Útil pra rotas amigáveis, tipo `/categorias/eletronicos`.

```js
const res = await fetch(`${API}/api/categories/slug/eletronicos`);
const categoria = await res.json();
```

### Criar

```
POST /api/categories
```

Body — `name` e `icon` obrigatórios, `description` opcional:

```json
{
  "name": "Instrumentos Musicais",
  "icon": "bi-music-note-beamed",
  "description": "Violões, teclados, baterias e acessórios"
}
```

Resposta: **`201`** com o objeto criado e header `Location` com a URL do recurso novo.

```js
const res = await authFetch(`${API}/api/categories`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Instrumentos Musicais',
    icon: 'bi-music-note-beamed',
    description: 'Violões, teclados, baterias e acessórios',
  }),
});

if (res.status === 201) {
  const criada = await res.json();
  console.log(criada.slug); // "instrumentos-musicais"
}

if (res.status === 409) {
  // name ou slug já existe
}

if (res.status === 422) {
  // name vazio ou com menos de 3 / mais de 50 caracteres
  // icon vazio ou fora do formato bi-xxx
  // description com mais de 160 caracteres
}
```

**Validação do body:**

| Campo | Regra | Erro |
|---|---|---|
| `name` | Obrigatório | `Name is required` |
| `name` | Entre 3 e 50 caracteres | `Name must be between 3 and 50 characters` |
| `icon` | Obrigatório | `Icon is required` |
| `icon` | Formato `bi-` + letras minúsculas, números e hífen (máx. 50) | `Icon must be a Bootstrap Icons class, e.g. bi-phone` |
| `description` | Opcional, até 160 caracteres. Vazio ou só espaços vira `null` | `Description must be at most 160 characters` |

### Atualizar

```
PUT /api/categories/{id}
```

Mesma validação e mesmo body do `POST`. Resposta **`200`** com a categoria atualizada.

```js
const res = await authFetch(`${API}/api/categories/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Informática',
    icon: 'bi-laptop',
    description: 'Notebooks, monitores e componentes',
  }),
});
```

O `PUT` substitui a categoria inteira: se a `description` não vier no body, ela fica `null`. Para manter a descrição atual, mande ela de novo.

Se mandar o mesmo `name`, `icon` e `description` que já estão no banco, a API responde `200` **sem executar o UPDATE** — otimização para evitar gravação à toa.

O `slug` é recalculado só quando o `name` muda; trocar só o `icon` ou a `description` mantém o slug.

### Deletar

```
DELETE /api/categories/{id}
```

Resposta: **`204` sem body**.

```js
const res = await authFetch(`${API}/api/categories/${id}`, { method: 'DELETE' });

if (res.status === 204) {
  // deletado
}

// 409: categoria tem produto vinculado ("Category has products linked to it")
```

---

## 7. Endereços

Todas as rotas exigem **login** (seção 2) e mexem só nos endereços do dono do token. Endereço de outra pessoa responde `404`.

### Modelo

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "label": "Casa",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apto 42",
  "neighborhood": "Centro",
  "city": "Campinas",
  "state": "SP",
  "zipCode": "13010-000",
  "isDefault": true,
  "createdAt": "2026-10-05T16:53:12Z",
  "updatedAt": "2026-10-05T16:53:12Z",
  "deletedAt": null
}
```

**Soft-delete:** Endereços deletados permanecem no banco com `deletedAt` preenchido. Use `includeDeleted=true` para recuperá-los.

### Body de criação/edição

```json
{
  "label": "Casa",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apto 42",
  "neighborhood": "Centro",
  "city": "Campinas",
  "state": "SP",
  "zipCode": "13010-000"
}
```

| Campo | Obrigatório | Limite | Observação |
|---|---|---|---|
| `label` | não | 30 | Texto livre ("Casa", "Trabalho") |
| `street` | **sim** | 255 | |
| `number` | **sim** | 20 | Aceita letra: `"123-A"` |
| `complement` | não | 100 | |
| `neighborhood` | **sim** | 100 | Bairro |
| `city` | **sim** | 100 | |
| `state` | **sim** | **2** | Duas letras da UF. Lowercase é convertido para maiúsculo (`"sp"` vira `"SP"`) |
| `zipCode` | **sim** | 9 | 8 dígitos, com ou sem hífen: `"13010000"` ou `"13010-000"` |

Campos opcionais omitidos, ou enviados como `null`, são salvos como `null`.

### Listar

```
GET /api/me/addresses
```

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | int | `0` | Índice da página |
| `size` | int | `20` | Itens por página |
| `sort` | string | — | Ordenação, ex: `sort=createdAt,desc` |
| `includeDeleted` | boolean | `false` | Incluir endereços deletados (soft-delete) |

```js
// Apenas endereços ativos
const res = await authFetch(`${API}/api/me/addresses?size=10`);
const page = await res.json();
page.content; // array de endereços (deletedAt = null)

// Incluir deletados
const res2 = await authFetch(`${API}/api/me/addresses?includeDeleted=true&size=10`);
const page2 = await res2.json();
page2.content; // todos os endereços (incluindo deletedAt != null)
```

### Buscar por id

```
GET /api/me/addresses/{id}
```

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `includeDeleted` | boolean | `false` | Incluir endereço se deletado (soft-delete) |

Retorna `404` se o endereço não existir **ou** não pertencer a esse usuário — é a mesma resposta nos dois casos, o que evita vazar a existência do endereço de outra pessoa.

```js
// Buscar endereço ativo
const res = await authFetch(`${API}/api/me/addresses/${id}`);

// Buscar endereço mesmo que deletado
const res2 = await authFetch(`${API}/api/me/addresses/${id}?includeDeleted=true`);
```

### Criar

```
POST /api/me/addresses
```

Resposta: **`201`** com o endereço criado e header `Location`.

```js
const res = await authFetch(`${API}/api/me/addresses`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    label: 'Casa',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 42',
    neighborhood: 'Centro',
    city: 'Campinas',
    state: 'sp',
    zipCode: '13010-000',
  }),
});
```

### Atualizar

```
PUT /api/me/addresses/{id}
```

Mesmo body da criação. Resposta **`200`**.

Assim como em categorias, se o conteúdo normalizado for idêntico ao que já está no banco, a API responde sem gravar.

### Marcar como principal

```
PATCH /api/me/addresses/{id}/default
```

Sem body. Desmarca todos os outros endereços do usuário e marca esse. Resposta **`200`** com o endereço atualizado.

```js
const res = await authFetch(
  `${API}/api/me/addresses/${id}/default`,
  { method: 'PATCH' }
);

const atualizado = await res.json();
atualizado.isDefault; // true
```

Padrão do frontend: usar `PATCH` só quando o usuário marcar, nunca no `PUT`. O `PUT` não mexe em `isDefault`.

### Deletar

```
DELETE /api/me/addresses/{id}
```

Resposta: **`204` sem body**. Se era o endereço principal, ele deixa de ser (o usuário fica sem principal até marcar outro).

---

## 8. Usuários

### Minha conta: `/api/me`

Para o usuário logado (qualquer um):

```
GET /api/me    → perfil + loja + se é admin
PUT /api/me    → edita nome e telefone (mesmo body de "Body de edição" abaixo)
```

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321",
  "createdAt": "2026-10-05T16:53:12Z",
  "admin": false,
  "seller": null
}
```

`seller` é a loja do usuário (modelo "dono da loja" da seção 9) ou `null` se ainda não é vendedor. Com uma chamada o front sabe se mostra "Minha loja" ou "Vender".

```js
const res = await authFetch(`${API}/api/me`);
if (res.status === 401) location.href = "/login.html";
const me = await res.json();
```

### Gestão de usuários (admin)

As rotas abaixo (`/api/users/**`) são **só para admin**. Não há criação por aqui: ver seção 2.

### Modelo

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321",
  "createdAt": "2026-10-05T16:53:12Z",
  "updatedAt": "2026-10-05T16:53:12Z",
  "deletedAt": null
}
```

**Soft-delete:** Usuários deletados permanecem no banco com `deletedAt` preenchido. Use `includeDeleted=true` para recuperá-los.

### Body de edição

```json
{
  "name": "João Silva",
  "phone": "11987654321"
}
```

| Campo | Obrigatório | Limite | Validação |
|---|---|---|---|
| `name` | **sim** | 50 | Entre 3 e 50 caracteres |
| `phone` | não | 11 | Exatamente 10 ou 11 dígitos numéricos, único no banco. `null` remove |

O `email` não é editável pela API (ver seção 2). Se vier no body, é ignorado.

### Listar

```
GET /api/users
```

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `search` | string | — | Busca por nome, sem acento |
| `page` | int | `0` | Índice da página |
| `size` | int | `20` | Itens por página |
| `sort` | string | — | Ordenação, ex: `sort=name,asc` |
| `includeDeleted` | boolean | `false` | Incluir usuários deletados (soft-delete) |

```js
// Apenas usuários ativos
const res = await authFetch(`${API}/api/users?size=10`);
const page = await res.json();
page.content; // array de usuários (deletedAt = null)

// Buscar por nome
const res2 = await authFetch(`${API}/api/users?search=joão&size=10`);
const page2 = await res2.json();

// Incluir deletados
const res3 = await authFetch(`${API}/api/users?includeDeleted=true&size=10`);
const page3 = await res3.json();
```

### Buscar por id

```
GET /api/users/{id}
```

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `includeDeleted` | boolean | `false` | Incluir se deletado (soft-delete) |

```js
// Buscar usuário ativo
const res = await authFetch(`${API}/api/users/${id}`);
const usuario = await res.json();

// Buscar mesmo que deletado
const res2 = await authFetch(`${API}/api/users/${id}?includeDeleted=true`);
const usuarioDeletado = await res2.json();
```

### Buscar por email

```
GET /api/users/email/{email}
```

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `includeDeleted` | boolean | `false` | Incluir se deletado (soft-delete) |

```js
const res = await authFetch(`${API}/api/users/email/joao@example.com`);
const usuario = await res.json();
```

### Atualizar

```
PUT /api/users/{id}
```

Resposta **`200`** com o usuário atualizado. `409` se o telefone já pertence a outro usuário.

```js
const res = await authFetch(`${API}/api/users/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'João Santos',
    phone: '11999998888',
  }),
});
```

Se o conteúdo normalizado for idêntico ao que já está no banco, a API responde sem gravar.

### Deletar

```
DELETE /api/users/{id}
```

Resposta: **`204` sem body**. O usuário é marcado como deletado (soft-delete), e o banco marca junto os endereços e a loja dele.

```js
const res = await authFetch(`${API}/api/users/${id}`, { method: 'DELETE' });

if (res.status === 204) {
  // deletado
}
```

---

## 9. Lojas (vendedores)

Cada usuário pode ter **uma** loja. Há duas visões:

- **Vitrine (pública):** `/api/sellers`, sem o documento (CPF/CNPJ)
- **Dono da loja:** `/api/me/seller`, com o documento (exige login)

### Modelo — vitrine

```json
{
  "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
  "storeName": "Hoko Store",
  "slug": "hoko-store",
  "createdAt": "2026-10-05T16:53:12Z",
  "deletedAt": null
}
```

### Modelo — dono da loja

```json
{
  "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
  "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "storeName": "Hoko Store",
  "slug": "hoko-store",
  "document": "52998224725",
  "createdAt": "2026-10-05T16:53:12Z",
  "updatedAt": "2026-10-05T16:53:12Z",
  "deletedAt": null
}
```

O `slug` é gerado a partir do `storeName`, como nas categorias. Se já existir, ganha sufixo: `hoko-store-1`.

### Body de criação/edição

```json
{
  "storeName": "Hoko Store",
  "document": "52998224725"
}
```

| Campo | Obrigatório | Limite | Validação |
|---|---|---|---|
| `storeName` | **sim** | 80 | Entre 3 e 80 caracteres |
| `document` | **sim** | 14 | Só dígitos: 11 (CPF) ou 14 (CNPJ), **com dígitos verificadores válidos** (senão `422 "Invalid CPF or CNPJ"`). Único entre lojas ativas. No `PUT`, só é conferido se mudou |

### Vitrine

```
GET /api/sellers                 ?search=&includeDeleted=&page=&size=&sort=
GET /api/sellers/{id}            ?includeDeleted=
GET /api/sellers/slug/{slug}     ?includeDeleted=
```

`search` busca parcial no nome da loja, sem acento.

```js
const res = await fetch(`${API}/api/sellers/slug/hoko-store`);
const loja = await res.json();
```

### Dono da loja

```
GET    /api/me/seller   → 200 | 404 se o usuário não tem loja
POST   /api/me/seller   → 201 | 409 se já tem loja ativa ou documento em uso | 422 CPF/CNPJ inválido
PUT    /api/me/seller   → 200 | 409 documento em uso | 422 CPF/CNPJ novo inválido
DELETE /api/me/seller   → 204 (soft-delete; os produtos da loja também são marcados como deletados)
```

```js
const res = await authFetch(`${API}/api/me/seller`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ storeName: 'Hoko Store', document: '52998224725' }),
});
```

É uma loja por usuário. Quem apagou a loja e faz `POST` de novo tem a **mesma loja reativada** com os dados novos (mesmo `id`, nome/documento/slug atualizados); os produtos antigos continuam deletados. Depois de um soft-delete, o documento pode ser usado por outra loja.

Na vitrine, `includeDeleted=true` só tem efeito para admin; para os outros é ignorado.

---

## 10. Produtos

Produtos pertencem a uma loja e têm até **8 fotos**. Há duas visões:

- **Vitrine (pública):** `/api/products`
- **Dono da loja:** `/api/me/seller/products` (exige login e loja)

O usuário precisa ter uma loja (seção 9) para cadastrar produtos.

### Modelo — lista (cards)

Usado em `GET /api/products` e na listagem do dono. Traz só a foto de capa:

```json
{
  "id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
  "name": "Teclado Mecânico",
  "slug": "teclado-mecanico",
  "price": 459.90,
  "quantity": 10,
  "coverImageUrl": "https://ufdgevqpgowaaxblrnwf.supabase.co/storage/v1/object/public/product-images/<userId>/a1b2.webp",
  "categoryName": "Periféricos",
  "categorySlug": "perifericos",
  "sellerStoreName": "Hoko Store",
  "sellerSlug": "hoko-store"
}
```

`coverImageUrl` é a primeira foto, ou `null` se o produto não tem foto.

### Modelo — detalhe

Usado em `GET /api/products/{id}`, `/slug/{slug}` e nas respostas de criar e editar:

```json
{
  "id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
  "name": "Teclado Mecânico",
  "slug": "teclado-mecanico",
  "description": "Switches vermelhos, ABNT2.",
  "price": 459.90,
  "quantity": 10,
  "imageUrls": [
    "https://.../product-images/<userId>/a1b2.webp",
    "https://.../product-images/<userId>/c3d4.webp"
  ],
  "sellerId": "d4e5f6a7-b8c9-0123-def0-234567890123",
  "sellerStoreName": "Hoko Store",
  "sellerSlug": "hoko-store",
  "categoryId": "53a8e026-0b6d-44ba-b5d4-54b57b9d2485",
  "categoryName": "Periféricos",
  "categorySlug": "perifericos",
  "createdAt": "2026-10-21T16:53:12Z",
  "updatedAt": "2026-10-21T16:53:12Z",
  "deletedAt": null
}
```

`imageUrls` vem na ordem das fotos, e a primeira é a capa. Produto sem foto devolve `[]`.

O `slug` é gerado a partir do `name`, como nas categorias. Se já existir, ganha sufixo: `teclado-mecanico-1`. Só muda quando o `name` muda.

### Body de criação/edição

```json
{
  "name": "Teclado Mecânico",
  "description": "Switches vermelhos, ABNT2.",
  "price": 459.90,
  "quantity": 10,
  "categoryId": "53a8e026-0b6d-44ba-b5d4-54b57b9d2485",
  "imageUrls": [
    "https://.../product-images/<userId>/a1b2.webp",
    "https://.../product-images/<userId>/c3d4.webp"
  ]
}
```

| Campo | Obrigatório | Validação |
|---|---|---|
| `name` | **sim** | Entre 3 e 120 caracteres |
| `description` | não | Até 5000 caracteres. Vazio vira `null` |
| `price` | **sim** | `>= 0`, no máximo 2 casas decimais |
| `quantity` | **sim** | Inteiro `>= 0` (estoque) |
| `categoryId` | **sim** | Id de uma categoria existente (senão `404`) |
| `imageUrls` | não | Até **8** URLs, cada uma `https://` e com até 2048 caracteres |

Sobre `imageUrls`:
- A **ordem do array é a ordem das fotos**, e a primeira é a capa.
- No `PUT`, o array **substitui todas** as fotos. Para reordenar, mande na nova ordem; para remover uma, mande sem ela.
- `[]` ou campo ausente = produto sem fotos.
- Erro de validação numa URL vem com o índice: `"fieldName": "imageUrls[2]"`.

### Vitrine

```
GET /api/products                ?search=&categoryId=&categorySlug=&sellerId=&minPrice=&maxPrice=&inStock=&page=&size=&sort=
GET /api/products/{id}
GET /api/products/slug/{slug}
```

Só lista produtos ativos (não deletados).

| Filtro | Tipo | Descrição |
|---|---|---|
| `search` | string | Busca parcial no nome, sem acento e sem diferenciar maiúsculas |
| `categoryId` | UUID | Produtos de uma categoria |
| `categorySlug` | string | O mesmo, pelo slug: `perifericos` |
| `sellerId` | UUID | Produtos de uma loja (vitrine da loja). Loja inexistente → `404` |
| `minPrice` | número | Preço `>=` |
| `maxPrice` | número | Preço `<=`. Se `minPrice > maxPrice` → `400` |
| `inStock` | boolean | `true` = só com `quantity > 0` |
| `page`, `size` | int | Paginação (seção 4) |
| `sort` | string | `price,asc`, `price,desc`, `createdAt,desc`, `name,asc` |

Os filtros se combinam (AND). Filtro não enviado não restringe nada.

```js
// Página de categoria, mais baratos primeiro, só com estoque
const res = await fetch(
  `${API}/api/products?categorySlug=perifericos&inStock=true&sort=price,asc&size=12`
);
const page = await res.json();
page.content; // cards (modelo de lista)

// Página do produto
const produto = await (await fetch(`${API}/api/products/slug/teclado-mecanico`)).json();
produto.imageUrls; // galeria
```

### Dono da loja

```
GET    /api/me/seller/products              ?includeDeleted=&page=&size=&sort=   → 200 (modelo de lista)
POST   /api/me/seller/products                                                    → 201 + Location (/api/products/{id})
PUT    /api/me/seller/products/{id}                                               → 200
PATCH  /api/me/seller/products/{id}/stock    body { "quantity": 5 }               → 200
DELETE /api/me/seller/products/{id}                                               → 204 (soft-delete)
```

```js
const res = await authFetch(`${API}/api/me/seller/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Teclado Mecânico',
    description: 'Switches vermelhos, ABNT2.',
    price: 459.90,
    quantity: 10,
    categoryId,
    imageUrls, // URLs já enviadas ao Storage (ver abaixo)
  }),
});

if (res.status === 201) {
  const produto = await res.json();
}
```

Se o `PUT` mandar exatamente o que já está salvo, a API responde `200` sem gravar.

### Erros do módulo

| Status | Quando |
|---|---|
| `404` | Produto inexistente ou deletado; `categoryId` inexistente; usuário sem loja; produto de **outra** loja (mesma resposta, para não revelar que o produto existe) |
| `409` | Slug duplicado (raro, porque o slug ganha sufixo automático) |
| `422` | Validação de campo (`fieldName` como `price`, `imageUrls[0]`…) |
| `400` | `minPrice > maxPrice`, ou `sort` com campo inexistente |

**Soft-delete:** produto deletado some da vitrine e do detalhe, mas continua no banco. Aparece para o dono com `includeDeleted=true`. Apagar a loja ou o usuário também marca os produtos como deletados.

### Upload das fotos (front)

As fotos **não passam pela API**. O front sobe o arquivo direto no **Supabase Storage** e manda só as URLs em `imageUrls`.

- Bucket: `product-images` (público para leitura)
- Limites: até **5 MB** por arquivo; `image/jpeg`, `image/png` ou `image/webp`
- Caminho obrigatório: `{userId}/{qualquer-nome}`. O usuário precisa estar logado e só pode subir (e apagar) dentro da própria pasta; fora dela, o Storage recusa.

```js
import { supabase } from "./supabase-client.js";

export async function uploadProductImage(file) {
  const { data: { user } } = await supabase.auth.getUser();
  const ext = file.name.split(".").pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("product-images").upload(path, file);
  if (error) throw error;

  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
```

Fluxo da tela de cadastro e edição:
1. O usuário escolhe as fotos. Para cada uma, chame `uploadProductImage` e guarde a URL.
2. Deixe reordenar na tela (a primeira é a capa).
3. Mande o array de URLs em `imageUrls` no `POST` ou `PUT`.
4. Ao **remover** uma foto, apague também o arquivo: `supabase.storage.from("product-images").remove([path])`. A API só tira a URL do produto; o arquivo no Storage fica lá se o front não apagar.

---

## 11. Carrinho (`/api/me/cart`)

Um carrinho por usuário. Todas as rotas exigem **login** (seção 2) e mexem só no carrinho do dono do token. Não precisa criar o carrinho: ele sempre existe, vazio é só sem itens.

### Modelo

Toda rota (menos o "esvaziar") devolve o **carrinho inteiro** já atualizado. O front só redesenha, sem precisar de um `GET` depois.

```json
{
  "items": [
    {
      "id": "0c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
      "productId": "94541e5c-8609-4e5c-be26-2770b2696f5d",
      "name": "Fone Bluetooth HoKo Sound",
      "slug": "fone-bluetooth-hoko-sound",
      "coverImageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "sellerStoreName": "TechStore Oficial",
      "unitPrice": 249.90,
      "quantity": 2,
      "lineTotal": 499.80,
      "stock": 25,
      "available": true
    }
  ],
  "totalItems": 2,
  "subtotal": 499.80
}
```

| Campo | O que é |
|---|---|
| `id` | Id do **item do carrinho**: é ele que vai na URL do `PATCH`/`DELETE`, não o `productId` |
| `unitPrice` | Preço **atual** do produto. Se o vendedor mudar o preço, o carrinho acompanha |
| `lineTotal` | `unitPrice × quantity` |
| `stock` | Estoque atual do produto (para mostrar "Só restam N") |
| `available` | `false` se o produto foi apagado ou não tem estoque para a quantidade do item |
| `totalItems` | Soma das quantidades dos itens **disponíveis** (bom para o número no ícone do carrinho) |
| `subtotal` | Soma dos `lineTotal` dos itens **disponíveis** |

Item indisponível **continua na lista** (para o usuário ver "Indisponível" e tirar ou diminuir), mas não entra no `totalItems` nem no `subtotal`.

### Rotas

```
GET    /api/me/cart                  → 200 carrinho
POST   /api/me/cart/items            → 200 carrinho     body { "productId": "...", "quantity": 1 }
PATCH  /api/me/cart/items/{itemId}   → 200 carrinho     body { "quantity": 3 }
DELETE /api/me/cart/items/{itemId}   → 200 carrinho
DELETE /api/me/cart                  → 204 (esvazia)
```

`quantity` é obrigatório e vai de 1 a 99. Para tirar um item, use o `DELETE`, não `quantity: 0`.

### Regras

- **Adicionar um produto que já está no carrinho soma** as quantidades: dois `POST` de 1 dão 2. Para trocar o valor, use o `PATCH`.
- A quantidade final não passa do **estoque** do produto nem de **99**.
- Não dá para pôr o **próprio produto** no carrinho.
- O carrinho **não reserva estoque**: outra pessoa pode comprar antes. Por isso o `available` é recalculado a cada resposta.

### Erros do módulo

| Status | `message` | Quando |
|---|---|---|
| `404` | `Product not found with id: ...` | `POST` de produto inexistente ou apagado |
| `404` | `Cart item not found with id: ...` | `itemId` que não existe ou é do carrinho de outra pessoa |
| `409` | `Product is already in the cart` | Dois `POST` do mesmo produto ao mesmo tempo (duplo clique). Basta recarregar o carrinho |
| `422` | `Only N in stock` / `Product is out of stock` | Quantidade final maior que o estoque |
| `422` | `Maximum 99 units per product` | Quantidade final maior que 99 |
| `422` | `You can't buy your own product` | O produto é da loja de quem está logado |
| `422` | `Product is no longer available` | `PATCH` num item cujo produto foi apagado (só dá para remover) |
| `422` | `Invalid input data` (com `errors`) | `quantity` fora de 1–99 ou `productId` faltando |

Os `422` de regra vêm com `"error": "Business rule"`; os de validação, com `"error": "Validation error"` e a lista `errors` (seção 5).

### Exemplos (front)

```js
// adicionar (botão "Adicionar" do card)
const res = await authFetch(`${API}/api/me/cart/items`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ productId: prod.id, quantity: 1 }),
});
if (res.status === 401) location.href = "/login.html";
const cart = await res.json();
if (!res.ok) alert(cart.message);          // ex.: "Only 3 in stock"
else badge.textContent = cart.totalItems;  // número no ícone do carrinho

// mudar a quantidade de um item
await authFetch(`${API}/api/me/cart/items/${item.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ quantity: 3 }),
});

// remover um item
await authFetch(`${API}/api/me/cart/items/${item.id}`, { method: "DELETE" });

// esvaziar
await authFetch(`${API}/api/me/cart`, { method: "DELETE" });  // 204, sem corpo
```

---

## 12. Pedidos (`/api/me/orders`)

Pedidos do usuário logado, como **comprador**. Todas as rotas exigem **login** (seção 2) e só enxergam os pedidos do dono do token.

### Fluxo

```
carrinho ──POST /checkout──▶ pedido(s) PENDING ──POST /{id}/pay──▶ PAID ──(vendedor)──▶ SHIPPED ──▶ DELIVERED
                                   │                                  │
                                   └──────────POST /{id}/cancel───────┴──▶ CANCELED
```

- **Um pedido por loja.** Se o carrinho tem produtos de 2 lojas, o checkout cria 2 pedidos, cada um com seu total, status e pagamento. Cada loja despacha o seu.
- **O checkout baixa o estoque** e **esvazia o carrinho**. É tudo ou nada: se um item falhar, nenhum pedido é criado e o carrinho fica como estava.
- **Preço, nome, foto e endereço são copiados** no pedido. Se o vendedor mudar o preço ou o comprador editar o endereço depois, o pedido não muda.
- **Frete:** sempre `0` por enquanto (`shippingCost`).
- **Pagamento simulado:** não existe gateway. O checkout cria o pagamento `PENDING`, e o `POST /{id}/pay` confirma na hora, como se o PIX tivesse caído.
- `SHIPPED` e `DELIVERED` são marcados pelo **vendedor** (seção 13). A loja também pode cancelar um pedido que ainda não enviou.

### Status

| Pedido (`status`) | Significado |
|---|---|
| `PENDING` | Criado no checkout, esperando pagamento |
| `PAID` | Pago |
| `SHIPPED` | Enviado pela loja |
| `DELIVERED` | Entregue |
| `CANCELED` | Cancelado (o estoque voltou) |

| Pagamento (`payment.status`) | Significado |
|---|---|
| `PENDING` | Aguardando |
| `PAID` | Pago (`paidAt` preenchido) |
| `FAILED` | Pedido cancelado antes de pagar |
| `REFUNDED` | Pedido cancelado depois de pago |

`paymentMethod` é `PIX`, `CARD` ou `BOLETO`. Parcelas (`installments`, de 1 a 12) só no `CARD`.

### Modelo — lista

`GET /api/me/orders` devolve uma página (seção 4) disto:

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "PENDING",
  "total": 499.80,
  "itemCount": 2,
  "sellerStoreName": "TechStore Oficial",
  "sellerSlug": "techstore-oficial",
  "paymentMethod": "PIX",
  "paymentStatus": "PENDING",
  "createdAt": "2026-11-11T17:02:41Z"
}
```

`itemCount` é a soma das quantidades.

### Modelo — detalhe

Usado no detalhe e na resposta do checkout, do pagar e do cancelar:

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "PAID",
  "subtotal": 499.80,
  "shippingCost": 0.00,
  "total": 499.80,
  "sellerStoreName": "TechStore Oficial",
  "sellerSlug": "techstore-oficial",
  "buyerName": "João Silva",
  "shippingAddress": {
    "street": "Rua das Flores",
    "number": "123",
    "complement": "Apto 4",
    "neighborhood": "Centro",
    "city": "Campinas",
    "state": "SP",
    "zipCode": "13010-000"
  },
  "items": [
    {
      "productId": "94541e5c-8609-4e5c-be26-2770b2696f5d",
      "productName": "Fone Bluetooth HoKo Sound",
      "productSlug": "fone-bluetooth-hoko-sound",
      "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "unitPrice": 249.90,
      "quantity": 2,
      "lineTotal": 499.80
    }
  ],
  "payment": {
    "method": "PIX",
    "status": "PAID",
    "amount": 499.80,
    "installments": 1,
    "paidAt": "2026-11-11T17:03:10Z"
  },
  "trackingCode": null,
  "shippedAt": null,
  "deliveredAt": null,
  "createdAt": "2026-11-11T17:02:41Z",
  "updatedAt": "2026-11-11T17:03:10Z"
}
```

- `unitPrice` é o preço **do dia da compra**.
- `productSlug` vem `null` quando o produto saiu da vitrine (apagado). O item continua no pedido, só não dá para linkar.
- `trackingCode`, `shippedAt` e `deliveredAt` são preenchidos pela loja ao enviar e entregar. `trackingCode` pode ficar `null` mesmo depois de enviado (é opcional).
- `buyerName` é o nome de quem comprou (aparece para o vendedor; para o comprador é o próprio nome).

### Rotas

```
POST /api/me/orders/checkout        → 201 [pedido, pedido, ...]   (um por loja)
GET  /api/me/orders                 ?status=&page=&size=&sort=     → 200 (modelo de lista, padrão sort=createdAt,desc)
GET  /api/me/orders/{id}            → 200 (detalhe)
POST /api/me/orders/{id}/pay        → 200 (detalhe)   pagamento simulado
POST /api/me/orders/{id}/cancel     → 200 (detalhe)
```

**Body do checkout:**

```json
{
  "addressId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "paymentMethod": "CARD",
  "installments": 3
}
```

| Campo | Regra |
|---|---|
| `addressId` | Obrigatório. Um endereço do usuário (seção 7) |
| `paymentMethod` | Obrigatório. `PIX`, `CARD` ou `BOLETO` |
| `installments` | Opcional (padrão `1`). De 1 a 12, e maior que 1 só no `CARD` |

**Cancelar** vale para pedido `PENDING` ou `PAID`: o estoque volta para os produtos e o pagamento vira `FAILED` ou `REFUNDED`. Depois de enviado não dá mais.

### Erros do módulo

| Status | `message` | Quando |
|---|---|---|
| `404` | `Address not found...` | `addressId` não existe, foi apagado ou é de outra pessoa |
| `404` | `Order not found with id: ...` | Pedido que não existe ou é de outra pessoa |
| `422` | `Cart is empty` | Checkout com o carrinho vazio |
| `422` | `Some items are unavailable: X, Y` | Algum item do carrinho está com `available: false` (seção 11). Ajuste o carrinho e tente de novo |
| `422` | `Not enough stock for X` | Outra pessoa comprou o estoque no meio do checkout. Nada foi criado |
| `422` | `Installments are only allowed for CARD` | Parcelado no PIX ou boleto |
| `422` | `Order can't be paid (status X)` | Pagar pedido que não está `PENDING` |
| `422` | `Order is already canceled` / `Order can't be canceled after shipping` | Cancelar pedido cancelado, enviado ou entregue |
| `422` | `Invalid input data` (com `errors`) | Body do checkout inválido |
| `400` | `Invalid value for parameter 'status'` | `?status=` com valor fora da tabela |

### Exemplos (front)

```js
// fechar o carrinho
const res = await authFetch(`${API}/api/me/orders/checkout`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ addressId, paymentMethod: "PIX" }),
});
const body = await res.json();
if (!res.ok) return alert(body.message);   // ex.: "Some items are unavailable: Fone..."
const orders = body;                        // um por loja

// "pagar" (simulado) cada pedido criado
for (const order of orders) {
  await authFetch(`${API}/api/me/orders/${order.id}/pay`, { method: "POST" });
}

// meus pedidos (mais recentes primeiro)
const page = await (await authFetch(`${API}/api/me/orders?size=10`)).json();

// cancelar
await authFetch(`${API}/api/me/orders/${id}/cancel`, { method: "POST" });
```

---

## 13. Vendas (vendedor) — `/api/me/seller/orders`

Os pedidos que a **loja do usuário logado** recebeu. Exige login e loja ativa: quem não tem loja recebe `404` (como em `/api/me/seller`). Pedido de outra loja também é `404`.

### O que o vendedor faz

| De → Para | Quem | Rota |
|---|---|---|
| `PENDING` → `PAID` | Comprador | `POST /api/me/orders/{id}/pay` (seção 12) |
| `PAID` → `SHIPPED` | **Vendedor** | `POST /api/me/seller/orders/{id}/ship` |
| `SHIPPED` → `DELIVERED` | **Vendedor** | `POST /api/me/seller/orders/{id}/deliver` |
| `PENDING`/`PAID` → `CANCELED` | Comprador **ou vendedor** | `.../cancel` |

Qualquer outra transição responde `422` com o status atual (ex.: `Only paid orders can be shipped (status PENDING)`). O cancelamento pela loja tem o mesmo efeito do cancelamento pelo comprador: o estoque volta e o pagamento vira `REFUNDED` (se pago) ou `FAILED`.

### Rotas

```
GET  /api/me/seller/orders           ?status=&page=&size=&sort=   → 200 (modelo de lista abaixo, padrão sort=createdAt,desc)
GET  /api/me/seller/orders/summary                                 → 200 (resumo abaixo)
GET  /api/me/seller/orders/{id}                                    → 200 (mesmo detalhe da seção 12)
POST /api/me/seller/orders/{id}/ship     body opcional { "trackingCode": "AA123456789BR" } → 200 (detalhe)
POST /api/me/seller/orders/{id}/deliver                            → 200 (detalhe)
POST /api/me/seller/orders/{id}/cancel                             → 200 (detalhe)
```

**`trackingCode`** é opcional: até 40 caracteres, só letras, números e hífen. A API salva em maiúsculas (`aa123...br` vira `AA123...BR`). O body pode ser omitido para enviar sem rastreio.

### Modelo — lista

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "PAID",
  "total": 499.80,
  "itemCount": 2,
  "buyerName": "João Silva",
  "paymentMethod": "PIX",
  "paymentStatus": "PAID",
  "createdAt": "2026-11-11T17:02:41Z",
  "shippedAt": null
}
```

Do comprador, a loja vê só o **nome** e, no detalhe, o **endereço de entrega**. E-mail e telefone não são expostos.

### Resumo

`GET /api/me/seller/orders/summary`:

```json
{
  "ordersByStatus": { "PENDING": 1, "PAID": 2, "SHIPPED": 0, "DELIVERED": 1, "CANCELED": 3 },
  "revenue": 150.00,
  "pendingRevenue": 30.00,
  "toShip": 2
}
```

| Campo | O que é |
|---|---|
| `ordersByStatus` | Quantidade de pedidos em cada status (todos aparecem, com `0` se não houver) |
| `revenue` | Soma dos pedidos já pagos: `PAID` + `SHIPPED` + `DELIVERED` |
| `pendingRevenue` | Soma dos pedidos `PENDING` (aguardando pagamento) |
| `toShip` | Pedidos `PAID` esperando a loja despachar |

### Erros do módulo

| Status | `message` | Quando |
|---|---|---|
| `404` | `Seller not found...` | O usuário não tem loja (ou ela foi apagada) |
| `404` | `Order not found with id ... for this store` | Pedido não existe ou é de outra loja |
| `422` | `Only paid orders can be shipped (status X)` | `ship` em pedido que não está `PAID` |
| `422` | `Only shipped orders can be delivered (status X)` | `deliver` em pedido que não está `SHIPPED` |
| `422` | `Order can't be canceled after shipping` / `Order is already canceled` | `cancel` depois de enviado |
| `422` | `Invalid input data` (com `errors`) | `trackingCode` com espaço, símbolo ou mais de 40 caracteres |

### Exemplos (front)

```js
// painel da loja
const summary = await (await authFetch(`${API}/api/me/seller/orders/summary`)).json();
const toShip = await (await authFetch(`${API}/api/me/seller/orders?status=PAID`)).json();

// marcar como enviado (com ou sem rastreio)
await authFetch(`${API}/api/me/seller/orders/${id}/ship`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ trackingCode: "AA123456789BR" }),
});

// marcar como entregue
await authFetch(`${API}/api/me/seller/orders/${id}/deliver`, { method: "POST" });
```

---

## 14. Como testar com curl

```bash
API=https://hoko-api.onrender.com

# Health check
curl $API/api/categories

# Busca
curl "$API/api/categories?search=eletronicos"

# Por slug
curl $API/api/categories/slug/eletronicos

# Criar (admin: TOKEN = access_token de uma conta admin)
curl -X POST $API/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Instrumentos Musicais","icon":"bi-music-note-beamed","description":"Violões, teclados e acessórios"}'

# Atualizar (admin)
curl -X PUT $API/api/categories/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Informática","icon":"bi-laptop","description":"Notebooks, monitores e componentes"}'

# Deletar (admin)
curl -X DELETE $API/api/categories/{id} -H "Authorization: Bearer $TOKEN"

# Minha conta (logado)
curl $API/api/me -H "Authorization: Bearer $TOKEN"

# Fechar o carrinho (logado)
curl -X POST $API/api/me/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"addressId":"<id do endereço>","paymentMethod":"PIX"}'

# Marcar venda como enviada (dono da loja)
curl -X POST $API/api/me/seller/orders/{id}/ship \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"trackingCode":"AA123456789BR"}'

# Carrinho (logado)
curl $API/api/me/cart -H "Authorization: Bearer $TOKEN"
curl -X POST $API/api/me/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"productId":"<id do produto>","quantity":1}'
```

Rodando a API na sua máquina (conecta no mesmo Supabase, mas sem cold start):

```bash
API=http://localhost:8080
```

---

## 15. Pendências conhecidas

| Item | Impacto |
|---|---|
| Cold start de ~1 min a cada 15 min | Esperar no primeiro request |
