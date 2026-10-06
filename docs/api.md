# Hoko API

Documentação dos endpoints disponíveis para o frontend.

## 1. Sobre a API

**Base URL**

```
Local:      http://localhost:8080
Produção:   https://hoko-api.onrender.com
```

**Content-Type:** toda requisição com body usa `application/json`.

**Autenticação:** nenhuma no momento. Todos os endpoints são públicos.

## 2. Antes de começar

### Endereços não funcionam em produção (ainda)

Os endpoints de endereço estão implementados e funcionam **localmente**, mas em produção retornam `404`. Isso não é bug do frontend.

O motivo: o `userId` dos endereços precisa existir na tabela `public.users`, e hoje essa linha só é criada junto com a autenticação — que entra no final do projeto, junto com o Spring Security.

```
GET /api/users/{userId}/addresses   →  404 em produção
```

**Use as categorias para começar a codar.** Elas estão 100% funcionais nos dois ambientes.

### Cold start

O plano gratuito do Render desliga o serviço depois de **15 minutos sem tráfego**. O primeiro request depois disso leva cerca de **1 minuto** para responder.

Não é bug da API. Se aparecer um loading page ou um request pendurado, é isso. Em desenvolvimento local isso não acontece.

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
| `400` | Delete/update falhou (referenciado por outra entidade), UUID malformado na URL, JSON inválido |
| `404` | Registro não encontrado |
| `409` | `name` ou `slug` duplicado em categoria |
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

Já existem 4 categorias no banco: `eletronicos`, `perifericos`, `roupas`, `casa-decoracao`.

### Modelo

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Eletrônicos",
  "slug": "eletronicos",
  "createdAt": "2026-10-05T16:53:12Z",
  "updatedAt": "2026-10-05T16:53:12Z"
}
```

O `slug` é gerado pelo backend a partir do `name`: minúsculo, sem acento, hífen no lugar de espaço. `"Casa & Decoração"` vira `casa-decoracao`. **Você não manda o slug no body** — só o `name`.

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

Body — só `name`:

```json
{ "name": "Instrumentos Musicais" }
```

Resposta: **`201`** com o objeto criado e header `Location` com a URL do recurso novo.

```js
const res = await fetch(`${API}/api/categories`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Instrumentos Musicais' }),
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
}
```

**Validação do `name`:**

| Regra | Erro |
|---|---|
| Obrigatório | `Name is required` |
| Entre 3 e 50 caracteres | `Name must be between 3 and 50 characters` |

### Atualizar

```
PUT /api/categories/{id}
```

Mesma validação e mesmo body do `POST`. Resposta **`200`** com a categoria atualizada.

```js
const res = await fetch(`${API}/api/categories/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Informática' }),
});
```

Se mandar o mesmo `name` que já está no banco, a API responde `200` **sem executar o UPDATE** — otimização para evitar gravação à toa.

O `slug` é recalculado quando o `name` muda.

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

// 400: categoria referenciada por algum produto
```

⚠️ O delete retorna `400` quando falha por referência, não `409`. É o comportamento atual da API — não trate como erro de validação no frontend.

---

## 7. Endereços

⚠️ **Funciona apenas local.** Ver seção 2.

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
| `state` | **sim** | **2** | Sigla UF. Lowercase é convertido para maiúsculo (`"sp"` vira `"SP"`) |
| `zipCode` | **sim** | 9 | Com ou sem hífen: `"13010000"` ou `"13010-000"` |

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

Resposta: **`204` sem body**.

---

## 8. Usuários

Endpoints de gestão de usuários com suporte a soft-delete.

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

### Body de criação/edição

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321"
}
```

| Campo | Obrigatório | Limite | Validação |
|---|---|---|---|
| `name` | **sim** | 50 | Entre 3 e 50 caracteres |
| `email` | **sim** | 60 | Email válido, único no banco |
| `phone` | não | 11 | Exatamente 10 ou 11 dígitos numéricos |

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

### Criar

```
POST /api/users
```

Resposta: **`201`** com o usuário criado e header `Location`.

```js
const res = await fetch(`${API}/api/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11987654321',
  }),
});

if (res.status === 201) {
  const criado = await res.json();
  console.log(criado.id);
}

if (res.status === 409) {
  // email já existe
}

if (res.status === 422) {
  // validação falhou
}
```

### Atualizar

```
PUT /api/users/{id}
```

Mesmo body da criação. Resposta **`200`** com o usuário atualizado.

```js
const res = await fetch(`${API}/api/users/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'João Santos',
    email: 'joao.santos@example.com',
    phone: '11999998888',
  }),
});
```

Se o conteúdo normalizado for idêntico ao que já está no banco, a API responde sem gravar.

### Deletar

```
DELETE /api/users/{id}
```

Resposta: **`204` sem body**. O usuário é marcado como deletado (soft-delete) e seus endereços também.

```js
const res = await fetch(`${API}/api/users/${id}`, { method: 'DELETE' });

if (res.status === 204) {
  // deletado
}
```

---

## 9. Como testar com curl

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
  -d '{"name":"Instrumentos Musicais"}'

# Atualizar
curl -X PUT $API/api/categories/{id} \
  -H 'Content-Type: application/json' \
  -d '{"name":"Informática"}'

# Deletar
curl -X DELETE $API/api/categories/{id}
```

Pra criar categoria local, que é mais rápido que produção e não depende do cold start:

```bash
API=http://localhost:8080
```

---

## 10. Pendências conhecidas

| Item | Impacto |
|---|---|
| Endereços retornam `404` em produção | Usar categorias para começar |
| Sem autenticação | Endpoints abertos — só em ambiente de desenvolvimento |
| Delete falho retorna `400` em vez de `409` | Tratar como erro genérico, não de validação |
| Cold start de ~1 min a cada 15 min | Esperar no primeiro request |