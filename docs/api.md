# Hoko API

Documentação dos endpoints disponíveis para o frontend.

## 1. Sobre a API

**Base URL**

```
Local:      http://localhost:8080
Produção:   https://hoko-api.onrender.com
```

**Content-Type:** toda requisição com body usa `application/json`.

**Autenticação:** nenhuma no momento. Todos os endpoints são públicos enquanto a API está em desenvolvimento; o Spring Security entra quando os módulos estiverem prontos.

**Banco:** a API usa o Postgres do Supabase. Não existe banco local: rodando na sua máquina, a API também conecta no Supabase.

## 2. Antes de começar

### De onde vêm os usuários

Não existe `POST /api/users`. O usuário nasce no **cadastro do Supabase Auth** (`supabase.auth.signUp` no front): um trigger no banco copia ele para `public.users`, com o mesmo `id`.

- `name` e `phone` vêm do `options.data` do `signUp`
- Telefone inválido ou já usado por outra conta é salvo como `null`, e o cadastro não falha
- O e-mail é sempre o do Auth. Para trocar, use `supabase.auth.updateUser({ email })`; o banco atualiza sozinho

Para pegar o `userId` no front: `(await supabase.auth.getUser()).data.user.id`.

### Cold start

O plano gratuito do Render desliga o serviço depois de **15 minutos sem tráfego**. O primeiro request depois disso leva cerca de **1 minuto** para responder.

Não é bug da API. Se aparecer um loading page ou um request pendurado, é isso. Rodando a API na sua máquina isso não acontece.

## 3. Convenções

- **IDs** são UUID no formato `550e8400-e29b-41d4-a716-446655440000`, nunca inteiros
- **Datas** em ISO 8601 com timezone UTC: `2026-10-05T16:53:12Z`
- **Não há envelope** — a resposta é o objeto direto, não `{ "data": ... }`
- **Não há header `Authorization`** para mandar

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
| `404` | Registro não encontrado |
| `409` | Conflito com o banco: valor duplicado (nome de categoria, documento de loja, telefone…) ou delete barrado por referência (categoria com produto) |
| `422` | Falha de validação de campo (tamanho, formato, obrigatório) |
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

Funciona em local e produção.

Já existem 18 categorias no banco, cada uma com ícone: `eletronicos`, `perifericos`, `roupas`, `casa-decoracao`, `games`, `livros`, `esportes`, `brinquedos`, `beleza-perfumaria`, `saude`, `ferramentas`, `automotivo`, `mercado`, `jardim`, `joias-acessorios`, `papelaria`, `eletrodomesticos`, `bebes`.

### Modelo

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Eletrônicos",
  "slug": "eletronicos",
  "icon": "bi-phone",
  "createdAt": "2026-10-05T16:53:12Z",
  "updatedAt": "2026-10-05T16:53:12Z"
}
```

O `slug` é gerado pelo backend a partir do `name`: minúsculo, sem acento, hífen no lugar de espaço. `"Casa & Decoração"` vira `casa-decoracao`. **Você não manda o slug no body** — só `name` e `icon`.

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

Body — `name` e `icon` (os dois obrigatórios):

```json
{ "name": "Instrumentos Musicais", "icon": "bi-music-note-beamed" }
```

Resposta: **`201`** com o objeto criado e header `Location` com a URL do recurso novo.

```js
const res = await fetch(`${API}/api/categories`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Instrumentos Musicais', icon: 'bi-music-note-beamed' }),
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
}
```

**Validação do body:**

| Campo | Regra | Erro |
|---|---|---|
| `name` | Obrigatório | `Name is required` |
| `name` | Entre 3 e 50 caracteres | `Name must be between 3 and 50 characters` |
| `icon` | Obrigatório | `Icon is required` |
| `icon` | Formato `bi-` + letras minúsculas, números e hífen (máx. 50) | `Icon must be a Bootstrap Icons class, e.g. bi-phone` |

### Atualizar

```
PUT /api/categories/{id}
```

Mesma validação e mesmo body do `POST`. Resposta **`200`** com a categoria atualizada.

```js
const res = await fetch(`${API}/api/categories/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Informática', icon: 'bi-laptop' }),
});
```

Se mandar o mesmo `name` e o mesmo `icon` que já estão no banco, a API responde `200` **sem executar o UPDATE** — otimização para evitar gravação à toa.

O `slug` é recalculado só quando o `name` muda; trocar só o `icon` mantém o slug.

### Deletar

```
DELETE /api/categories/{id}
```

Resposta: **`204` sem body**.

```js
const res = await fetch(`${API}/api/categories/${id}`, { method: 'DELETE' });

if (res.status === 204) {
  // deletado
}

// 409: categoria tem produto vinculado ("Category has products linked to it")
```

---

## 7. Endereços

O `userId` precisa ser de um usuário que já se cadastrou (ver seção 2).

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
GET /api/users/{userId}/addresses
```

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | int | `0` | Índice da página |
| `size` | int | `20` | Itens por página |
| `sort` | string | — | Ordenação, ex: `sort=createdAt,desc` |
| `includeDeleted` | boolean | `false` | Incluir endereços deletados (soft-delete) |

```js
// Apenas endereços ativos
const res = await fetch(`${API}/api/users/${userId}/addresses?size=10`);
const page = await res.json();
page.content; // array de endereços (deletedAt = null)

// Incluir deletados
const res2 = await fetch(`${API}/api/users/${userId}/addresses?includeDeleted=true&size=10`);
const page2 = await res2.json();
page2.content; // todos os endereços (incluindo deletedAt != null)
```

### Buscar por id

```
GET /api/users/{userId}/addresses/{id}
```

| Query param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `includeDeleted` | boolean | `false` | Incluir endereço se deletado (soft-delete) |

Retorna `404` se o endereço não existir **ou** não pertencer a esse usuário — é a mesma resposta nos dois casos, o que evita vazar a existência do endereço de outra pessoa.

```js
// Buscar endereço ativo
const res = await fetch(`${API}/api/users/${userId}/addresses/${id}`);

// Buscar endereço mesmo que deletado
const res2 = await fetch(`${API}/api/users/${userId}/addresses/${id}?includeDeleted=true`);
```

### Criar

```
POST /api/users/{userId}/addresses
```

Resposta: **`201`** com o endereço criado e header `Location`.

```js
const res = await fetch(`${API}/api/users/${userId}/addresses`, {
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
PUT /api/users/{userId}/addresses/{id}
```

Mesmo body da criação. Resposta **`200`**.

Assim como em categorias, se o conteúdo normalizado for idêntico ao que já está no banco, a API responde sem gravar.

### Marcar como principal

```
PATCH /api/users/{userId}/addresses/{id}/default
```

Sem body. Desmarca todos os outros endereços do usuário e marca esse. Resposta **`200`** com o endereço atualizado.

```js
const res = await fetch(
  `${API}/api/users/${userId}/addresses/${id}/default`,
  { method: 'PATCH' }
);

const atualizado = await res.json();
atualizado.isDefault; // true
```

Padrão do frontend: usar `PATCH` só quando o usuário marcar, nunca no `PUT`. O `PUT` não mexe em `isDefault`.

### Deletar

```
DELETE /api/users/{userId}/addresses/{id}
```

Resposta: **`204` sem body**. Se era o endereço principal, ele deixa de ser (o usuário fica sem principal até marcar outro).

---

## 8. Usuários

Endpoints de gestão de usuários com suporte a soft-delete. Não há criação por aqui: ver seção 2.

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
const res = await fetch(`${API}/api/users?size=10`);
const page = await res.json();
page.content; // array de usuários (deletedAt = null)

// Buscar por nome
const res2 = await fetch(`${API}/api/users?search=joão&size=10`);
const page2 = await res2.json();

// Incluir deletados
const res3 = await fetch(`${API}/api/users?includeDeleted=true&size=10`);
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
const res = await fetch(`${API}/api/users/${id}`);
const usuario = await res.json();

// Buscar mesmo que deletado
const res2 = await fetch(`${API}/api/users/${id}?includeDeleted=true`);
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
const res = await fetch(`${API}/api/users/email/joao@example.com`);
const usuario = await res.json();
```

### Atualizar

```
PUT /api/users/{id}
```

Resposta **`200`** com o usuário atualizado. `409` se o telefone já pertence a outro usuário.

```js
const res = await fetch(`${API}/api/users/${id}`, {
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
const res = await fetch(`${API}/api/users/${id}`, { method: 'DELETE' });

if (res.status === 204) {
  // deletado
}
```

---

## 9. Lojas (vendedores)

Cada usuário pode ter **uma** loja. Há duas visões:

- **Vitrine (pública):** `/api/sellers`, sem o documento (CPF/CNPJ)
- **Dono da loja:** `/api/users/{userId}/seller`, com o documento

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
  "document": "12345678901",
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
  "document": "12345678901"
}
```

| Campo | Obrigatório | Limite | Validação |
|---|---|---|---|
| `storeName` | **sim** | 80 | Entre 3 e 80 caracteres |
| `document` | **sim** | 14 | Só dígitos: 11 (CPF) ou 14 (CNPJ). Único entre lojas ativas |

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
GET    /api/users/{userId}/seller   → 200 | 404 se o usuário não tem loja
POST   /api/users/{userId}/seller   → 201 | 409 se já tem loja ou documento em uso
PUT    /api/users/{userId}/seller   → 200 | 409 documento em uso
DELETE /api/users/{userId}/seller   → 204 (soft-delete; os produtos da loja também são marcados como deletados)
```

```js
const res = await fetch(`${API}/api/users/${userId}/seller`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ storeName: 'Hoko Store', document: '12345678901' }),
});
```

Depois de um soft-delete, o mesmo documento pode ser usado de novo. O mesmo usuário, porém, não abre outra loja (é uma por usuário, contando as deletadas).

---

## 10. Produtos

Produtos pertencem a uma loja e têm até **8 fotos**. Há duas visões:

- **Vitrine (pública):** `/api/products`
- **Dono da loja:** `/api/users/{userId}/seller/products`

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
GET    /api/users/{userId}/seller/products              ?includeDeleted=&page=&size=&sort=   → 200 (modelo de lista)
POST   /api/users/{userId}/seller/products                                                    → 201 + Location
PUT    /api/users/{userId}/seller/products/{id}                                               → 200
PATCH  /api/users/{userId}/seller/products/{id}/stock    body { "quantity": 5 }               → 200
DELETE /api/users/{userId}/seller/products/{id}                                               → 204 (soft-delete)
```

```js
const res = await fetch(`${API}/api/users/${userId}/seller/products`, {
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

## 11. Como testar com curl

```bash
API=https://hoko-api.onrender.com

# Health check
curl $API/api/categories

# Busca
curl "$API/api/categories?search=eletronicos"

# Por slug
curl $API/api/categories/slug/eletronicos

# Criar
curl -X POST $API/api/categories \
  -H 'Content-Type: application/json' \
  -d '{"name":"Instrumentos Musicais","icon":"bi-music-note-beamed"}'

# Atualizar
curl -X PUT $API/api/categories/{id} \
  -H 'Content-Type: application/json' \
  -d '{"name":"Informática","icon":"bi-laptop"}'

# Deletar
curl -X DELETE $API/api/categories/{id}
```

Rodando a API na sua máquina (conecta no mesmo Supabase, mas sem cold start):

```bash
API=http://localhost:8080
```

---

## 12. Pendências conhecidas

| Item | Impacto |
|---|---|
| Sem autenticação | Endpoints abertos, inclusive `includeDeleted`, edição e exclusão de qualquer usuário. Só para desenvolvimento |
| Cold start de ~1 min a cada 15 min | Esperar no primeiro request |
