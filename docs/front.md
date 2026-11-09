# Hoko — Guia do front

Como as telas que já existem puxam dados da API e montam os cards. Tudo aqui é o código atual explicado; para repetir em telas novas, siga o mesmo molde.

Os endpoints e modelos de resposta estão no [`api.md`](api.md). Este guia é sobre o **lado do navegador**.

---

## 1. Visão geral

Toda seção que mostra dado da API segue o mesmo fluxo:

```
HTML: container vazio com id
        │
        ▼
módulo JS da página (index.js, categories.js)
        │
        ├─ showSkeleton(...)        → placeholders cinzas na hora
        ├─ getJson / getJsonCached  → busca na API
        │
        ├─ deu certo, tem dados  → showContent(container, cards)   (com fade)
        ├─ deu certo, veio vazio → showState(container, {...})     ("Nenhum ... ainda")
        └─ deu erro              → showError(container, retry)     (botão "Tentar de novo")
```

### Arquivos

| Arquivo | Papel |
|---|---|
| `js/api.js` | Fala com a API: `API_BASE`, `getJson`, `getJsonCached`, `apiFetch` |
| `js/ui.js` | Peças de tela reaproveitáveis: skeleton, estados, escape, preço, aviso de cold start |
| `js/index.js` | Home: categorias e produtos em destaque |
| `js/categories.js` | `categorias.html`: cabeçalho da categoria |
| `js/session.js` | Navbar: troca "Entrar" pelo avatar quando está logado |
| `js/sidebar.js` | Menu lateral (script comum, não módulo) |
| `css/style.css` | Inclui o bloco "Carregamento: skeletons, fade e estados" |

### O HTML só tem a "caixa" vazia

```html
<div class="row" id="categories_row"></div>
<div class="row" id="highlighted_products"></div>
<section class="categoria-header-section" id="category_header"></section>
```

O JS pega a caixa pelo `id` e escreve o conteúdo dentro. A caixa já tem o `row` do Bootstrap, então cada card vem dentro de uma coluna (`col-*`).

### Ordem dos scripts (fim do `<body>`)

```html
<script src=".../jquery.slim.min.js"></script>
<script src=".../bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/sidebar.js"></script>
<script type="module" src="/js/index.js"></script>   <!-- o JS da página -->
<script type="module" src="/js/session.js"></script>
```

- O Supabase vem **antes** dos módulos, porque o `supabase-client.js` usa o `window.supabase` que ele cria.
- O JS da página é `type="module"`, porque é isso que permite usar `import { ... } from "./api.js"`. Um módulo também já roda depois do HTML pronto, então o `getElementById` sempre encontra a caixa.

---

## 2. `js/api.js`: falar com a API

### `API_BASE`

```js
const SERVED_BY_API = location.port === "8080" || location.hostname.endsWith("onrender.com");
export const API_BASE = SERVED_BY_API ? "" : "https://hoko-api.onrender.com";
```

- **A página veio do próprio Spring** (`localhost:8080` ou Render): `API_BASE` fica vazio e as chamadas vão para `/api/...` na mesma origem.
- **A página veio do Live Server do VS Code** (ex.: porta 5500): as chamadas vão para a API do Render.

Nunca escreva a URL da API à mão nas páginas: use sempre os caminhos começando com `/api/...` nas funções abaixo.

### `getJson(path, { notice })`: GET público

```js
const page = await getJson("/api/products?categorySlug=eletronicos&page=0&size=4&sort=name,asc");
```

- Faz `fetch(API_BASE + path)` **sem token**. É para a vitrine: categorias, lojas e produtos.
- Se a resposta não for 2xx, **lança um erro** com `error.status` (ex.: `404`). Quem chama decide o que mostrar.
- Com `notice` (o padrão é `true`), mostra o aviso "Acordando o servidor…" se a resposta demorar mais de 4 s (ver `withSlowNotice`).

### `getJsonCached(path, render, maxAgeMs)`: GET com cache

```js
await getJsonCached("/api/categories?size=8&sort=name,asc", renderCategories);
```

Em vez de devolver o dado, ela **chama `render(dado)`**, às vezes duas vezes:

1. Se existe uma cópia no `sessionStorage` com menos de `maxAgeMs` (o padrão é 5 min), chama `render(cópia)` **na hora**, sem esperar a rede.
2. Busca na API. Se o dado mudou, chama `render(novo)` de novo.
3. Só lança erro se a API falhou **e** não havia cópia nenhuma para mostrar.

Por isso o `render` tem que poder rodar mais de uma vez: ele sempre substitui o conteúdo, nunca acrescenta. Use só para dado que **muda pouco**, como categorias. Produto (preço, estoque) usa `getJson`.

### `apiFetch(path, { method, body })`: rotas de logado

```js
const me = await apiFetch("/api/me");
await apiFetch("/api/me/seller", { method: "POST", body: { storeName, document } });
```

- Pega o token da sessão do Supabase e manda no `Authorization: Bearer ...`.
- Converte o `body` em JSON e devolve o JSON da resposta (`null` no `204`).
- No erro, lança com `error.status` e `error.body`: o JSON de erro da API, que tem `message` e, no `422`, a lista `errors`.

⚠️ **Não use `apiFetch` em rota pública.** Um token vencido faz a API responder `401` até na vitrine. Vitrine é `getJson`; `apiFetch` só para `/api/me/**` e admin.

---

## 3. `js/ui.js`: peças de tela

### `escapeHtml(texto)`: importado como `e`

```js
import { escapeHtml as e } from "./ui.js";
`<h3 class="product-name">${e(prod.name)}</h3>`
```

Troca `< > & " '` por entidades HTML. **Todo texto que vem da API e vai para `innerHTML` passa por `e()`**: nome, loja, descrição, URL de imagem, ícone. Quem cadastra produto é qualquer usuário. Sem o escape, um nome como `<img src=x onerror=...>` rodaria script na página de todo mundo.

Não precisa de `e()` em número que você formatou (`formatPrice`) nem em texto fixo seu.

### `formatPrice(valor)`

```js
formatPrice(459.9)  // "R$ 459,90"
```

Formata em real brasileiro com `Intl.NumberFormat`. Use sempre ele para preço, nunca `"R$ " + prod.price`: isso dá `R$ 459.9`.

### `showSkeleton(container, kind, count)`

```js
showSkeleton(productHL_row, "product", 4);
```

Enche o container com `count` cópias do placeholder `kind` e marca `aria-busy="true"`, para o leitor de tela saber que está carregando. Os kinds que existem hoje:

| kind | Usado em | Imita |
|---|---|---|
| `category` | Home, categorias | O card redondo de categoria |
| `product` | Home, destaques | O card de produto (foto, 3 linhas e botão) |
| `categoryHeader` | `categorias.html` | O cabeçalho com ícone, título e descrição |

Use o **mesmo número** de skeletons que de itens pedidos (`size=4` → `count` 4), para a tela não mudar de altura quando os dados chegam.

### `showContent(container, html)`

```js
showContent(productHL_row, page.content.map(productCard).join(""));
```

Troca o conteúdo pelo HTML real, tira o `aria-busy` e aplica a classe `.fade-in`, que faz o conteúdo aparecer suavemente em vez de "pular" na tela.

### `showState(container, { icon, message, action, wrap })`

Mensagem no lugar do conteúdo, para lista vazia, "não encontrado" etc.:

```js
showState(productHL_row, { icon: "bi-bag", message: "Nenhum produto por aqui ainda." });

showState(cat_header, {
    icon: "bi-search",
    message: "Categoria não encontrada.",
    action: { label: "Voltar para a home", href: "/" },  // link
    wrap: "container",
});
```

| Opção | O que faz |
|---|---|
| `icon` | Classe do Bootstrap Icons (o padrão é `bi-inbox`) |
| `message` | Texto (já é escapado) |
| `action` | Botão opcional: `{ label, onClick }` vira `<button>`, `{ label, href }` vira link |
| `wrap` | `"container"` embrulha num `.container`. Use quando a caixa é uma `<section>` de largura total (como o `category_header`) e não um `.row` |

### `showError(container, retry, wrap)`

```js
showError(productHL_row, carregarHighlights);
```

Atalho de `showState` com ícone de wifi cortado, "Não foi possível carregar." e um botão **"Tentar de novo"** que chama `retry`. Passe **a própria função de carregar**: ao clicar, ela mostra o skeleton e tenta de novo.

### `withSlowNotice(promise, delay)`

O Render grátis dorme depois de 15 min sem acesso e a primeira chamada pode levar até 1 min. Se a promise demorar mais que `delay` (4 s), aparece um aviso fixo no rodapé: "Acordando o servidor…". Ele some quando **todas** as chamadas em andamento terminam.

Você não precisa chamar direto: o `getJson` já usa.

---

## 4. Skeleton por dentro

Cada kind é um template no objeto `SKELETONS` do `ui.js`. O de produto:

```js
product: () => `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">     <!-- mesma coluna do card real -->
        <div class="product-card" aria-hidden="true">          <!-- mesma "casca" do card real -->
            <div class="pimg-container skeleton"></div>        <!-- área da foto -->
            <div class="product-info">
                <span class="skeleton skeleton-text w-50"></span>  <!-- linha da nota/loja -->
                <span class="skeleton skeleton-text"></span>       <!-- nome -->
                <span class="skeleton skeleton-text w-75"></span>  <!-- preço -->
                <span class="skeleton skeleton-btn"></span>        <!-- botão Adicionar -->
            </div>
        </div>
    </div>`,
```

O truque é **reaproveitar as mesmas classes do card real** (`col-*`, `product-card`, `pimg-container`, `product-info`). Assim o placeholder ocupa exatamente o mesmo espaço e nada se mexe quando o conteúdo entra. O `aria-hidden="true"` esconde o placeholder do leitor de tela.

### Classes de skeleton (`style.css`)

| Classe | O que é |
|---|---|
| `.skeleton` | Fundo cinza com brilho passando (animação `skeleton-shimmer`). Vai em qualquer bloco |
| `.skeleton-text` | Linha de texto: 14px de altura, largura total |
| `.skeleton-title` | Título: 26px de altura, 40% de largura |
| `.skeleton-circle` | Círculo de 48px (ícone da categoria) |
| `.skeleton-btn` | Botão: 50px de altura, cantos arredondados |
| `.skeleton-card` | Desliga o clique no card falso |
| `w-50`, `w-75` | Larguras do Bootstrap: deixam as linhas com tamanhos diferentes, como texto de verdade |

Quem tem "reduzir movimento" ligado no sistema vê o cinza parado, sem a animação.

### Criar um kind novo

Adicione uma entrada no `SKELETONS` imitando o HTML do card que você vai mostrar, e chame pelo nome:

```js
// ui.js
const SKELETONS = {
    // ...
    store: () => `
        <div class="col-6 col-md-3 mb-3">
            <div class="store-card" aria-hidden="true">
                <span class="skeleton skeleton-circle"></span>
                <span class="skeleton skeleton-text w-75"></span>
            </div>
        </div>`,
};

// na página
showSkeleton(lojasRow, "store", 8);
```

---

## 5. Card de categoria (`index.js`)

Dado da API (`GET /api/categories`, modelo na seção 6 do `api.md`):

```json
{ "name": "Eletrônicos", "slug": "eletronicos", "icon": "bi-phone", "description": "..." }
```

Card:

```js
function categoryCard(cat) {
    return `
        <div class="col-6 col-md-3 col-lg-custom mb-3">
            <a href="/categorias.html?slug=${encodeURIComponent(cat.slug)}" class="categoria-card">
                <div class="categoria-icon">
                    <i class="bi ${e(cat.icon)}"></i>
                </div>
                <span class="categoria-nome">${e(cat.name)}</span>
            </a>
        </div>`;
}
```

| Pedaço | Campo da API | Por quê |
|---|---|---|
| `href="/categorias.html?slug=..."` | `slug` | A página da categoria lê o `slug` da URL. `encodeURIComponent` porque vai numa URL |
| `<i class="bi ...">` | `icon` | O ícone já vem como classe do Bootstrap Icons (ex.: `bi-phone`) |
| `categoria-nome` | `name` | Texto, com `e()` |

Renderizar a lista:

```js
function renderCategories(page) {
    if (page.content.length === 0) {
        showState(categories_row, { message: "Nenhuma categoria cadastrada ainda." });
        return;
    }
    showContent(categories_row, page.content.map(categoryCard).join(""));
}
```

A API devolve uma **página** (seção 4 do `api.md`): os itens ficam em `page.content`. O `map(categoryCard)` vira uma lista de strings HTML, e o `join("")` cola tudo numa só.

---

## 6. Card de produto (`index.js`)

Dado da API (`GET /api/products`, modelo "lista (cards)" na seção 10 do `api.md`):

```json
{
  "name": "Fone Bluetooth HoKo Sound",
  "slug": "fone-bluetooth-hoko-sound",
  "price": 249.90,
  "quantity": 25,
  "coverImageUrl": "https://images.unsplash.com/...",
  "sellerStoreName": "TechStore Oficial",
  "categorySlug": "eletronicos"
}
```

### A foto: `productImage`

```js
function productImage(prod) {
    const img = prod.coverImageUrl
        ? `<img src="${e(prod.coverImageUrl)}" alt="${e(prod.name)}" class="product-img"
                loading="lazy" decoding="async"
                onload="this.classList.add('loaded')" onerror="this.remove()">`
        : "";
    // o ícone fica por baixo: aparece enquanto a foto carrega, se não houver foto ou se ela falhar
    return `<div class="img-placeholder" aria-hidden="true"><i class="bi bi-image"></i></div>${img}`;
}
```

São duas camadas, uma em cima da outra dentro do `.pimg-container`:

1. **Embaixo:** `.img-placeholder`, com um ícone cinza de imagem. Sempre existe.
2. **Em cima:** a `<img>`, que começa invisível (`opacity: 0` no CSS).
   - `onload`: quando a foto termina de baixar, ganha a classe `loaded` e aparece com fade.
   - `onerror`: se o link estiver quebrado, a `<img>` se remove e fica o ícone.
   - `coverImageUrl` `null` (produto sem foto): nem cria a `<img>`.
   - `loading="lazy"`: só baixa quando o card chega perto da tela.

Resultado: o card nunca fica com buraco branco nem com ícone de imagem quebrada.

### O card: `productCard`

```js
function productCard(prod) {
    const oldPrice = Math.round(prod.price * 1.2 * 100) / 100;
    return `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="product-card">
                <div class="pimg-container">
                    ${productImage(prod)}
                    <span class="product-obs">Mais vendido</span>
                    <button type="button" class="product-favorite" aria-label="Adicionar aos favoritos">
                        <i class="bi bi-heart"></i>
                    </button>
                </div>

                <div class="product-info">
                    <div class="product-rating">
                        <i class="bi bi-star-fill"></i>
                        <span>4.8</span>
                        <span class="product-store">· ${e(prod.sellerStoreName)}</span>
                    </div>

                    <h3 class="product-name">${e(prod.name)}</h3>

                    <div class="product-prices">
                        <span class="product-price">${formatPrice(prod.price)}</span>
                        <span class="product-old-price">${formatPrice(oldPrice)}</span>
                    </div>

                    <button type="button" class="product-add">
                        <i class="bi bi-cart3"></i>
                        Adicionar
                    </button>
                </div>
            </div>
        </div>`;
}
```

| Pedaço | Vem de | Observação |
|---|---|---|
| Coluna `col-12 col-sm-6 col-md-4 col-lg-3` | Fixo | 1 por linha no celular e 4 no desktop. O skeleton `product` usa a mesma |
| Foto | `coverImageUrl` | Ver `productImage` acima |
| `product-store` | `sellerStoreName` | Com `e()` |
| `product-name` | `name` | Com `e()` |
| `product-price` | `price` | Com `formatPrice` |

### ⚠️ O que ainda é fixo no card

Estes pedaços **não vêm da API**. Não copie para telas novas como se fossem dados reais:

| Pedaço | Situação |
|---|---|
| Selo "Mais vendido" | Aparece em todo produto. Não existe contagem de vendas ainda |
| Nota `4.8` | Inventada. Não existem avaliações ainda |
| Preço antigo (`price * 1.2`) | Inventa um desconto de 20% que não existe. A API não tem preço promocional |
| Coração (favoritar) | Sem ação. Não existe favoritos na API |
| Botão "Adicionar" | Sem ação. Vai funcionar quando o carrinho (`/api/me/cart`) existir |

Se quiser deixar o card honesto até lá, dá para trocar o selo por "Esgotado" quando `prod.quantity === 0` e tirar a nota e o preço antigo.

---

## 7. Carregando as seções da home

### Produtos em destaque

```js
async function carregarHighlights() {
    showSkeleton(productHL_row, "product", 4);                                  // 1
    try {
        const page = await getJson("/api/products?categorySlug=eletronicos&page=0&size=4&sort=name,asc"); // 2
        if (page.content.length === 0) {                                        // 3
            showState(productHL_row, { icon: "bi-bag", message: "Nenhum produto por aqui ainda." });
            return;
        }
        showContent(productHL_row, page.content.map(productCard).join(""));    // 4
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showError(productHL_row, carregarHighlights);                           // 5
    }
}

carregarHighlights();
```

1. **Skeleton primeiro**, antes de qualquer `await`: o usuário vê a estrutura na hora.
2. **Busca na API.** Parâmetros da URL:
   - `categorySlug=eletronicos`: só produtos dessa categoria;
   - `page=0&size=4`: primeira página, 4 itens (o mesmo `4` do skeleton);
   - `sort=name,asc`: ordem alfabética.

   Os outros filtros de `/api/products` (`search`, `sellerId`, `minPrice`, `maxPrice`, `inStock`) estão na seção 10 do `api.md`.
3. **Vazio:** a API respondeu certo, mas sem itens.
4. **Conteúdo:** os cards com fade.
5. **Erro** (sem internet, API fora): mensagem e botão que chama `carregarHighlights` de novo, voltando ao passo 1.

### Categorias

```js
async function carregarCategorias() {
    showSkeleton(categories_row, "category", 8);
    try {
        // categorias mudam pouco: com cache, a 2ª visita mostra na hora
        await getJsonCached("/api/categories?size=8&sort=name,asc", renderCategories);
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        showError(categories_row, carregarCategorias);
    }
}
```

O fluxo é o mesmo, mas com `getJsonCached`: quem passa uma segunda vez pela home vê as categorias na hora, sem skeleton, porque o `renderCategories` roda com a cópia do cache antes da rede responder.

As duas funções são chamadas uma depois da outra **sem `await`**, então as duas buscas acontecem ao mesmo tempo.

---

## 8. Cabeçalho da categoria (`categories.js`)

`categorias.html?slug=eletronicos` mostra ícone, nome e descrição da categoria.

```js
const categoriaSlug = new URLSearchParams(window.location.search).get("slug");  // "eletronicos"

async function carregarPagina() {
    if (!categoriaSlug) {          // abriu categorias.html sem ?slug=
        notFound();
        return;
    }

    showSkeleton(cat_header, "categoryHeader");
    try {
        await getJsonCached(`/api/categories/slug/${encodeURIComponent(categoriaSlug)}`, renderHeader);
    } catch (error) {
        if (error.status === 404) {    // slug que não existe
            notFound();
        } else {                       // rede/servidor
            console.error("Erro ao carregar categoria:", error);
            showError(cat_header, carregarPagina, "container");
        }
    }
}
```

O que tem de diferente da home:

- **O dado depende da URL.** O `URLSearchParams` lê o `?slug=` que o card de categoria colocou no link.
- **Distingue 404 de erro.** Como o `getJson` põe o `status` no erro, dá para mostrar "Categoria não encontrada" (com link para a home) em vez de "Tentar de novo", porque tentar de novo não resolve um slug errado.
- **`wrap: "container"`.** O `#category_header` é uma `<section>` de largura total, então a mensagem precisa de um `.container` em volta para ficar alinhada com o resto.
- **`document.title`.** O `renderHeader` e o `notFound` atualizam o título da aba (`Eletrônicos · Hoko`).

```js
function renderHeader(cat) {
    document.title = `${cat.name} · Hoko`;
    showContent(cat_header, `
        <div class="container">
            <div class="categoria-header" id="categoriaHeader" data-slug="${e(cat.slug)}">
                <div class="categoria-header-icon">
                    <i class="bi ${e(cat.icon)}"></i>
                </div>
                <div class="categoria-header-info">
                    <h1 class="categoria-header-titulo" id="categoriaName">${e(cat.name)}</h1>
                    <p class="categoria-header-desc" id="categoriaDescription">${e(cat.description)}</p>
                </div>
            </div>
        </div>`);
}
```

`description` pode vir `null`. O `e()` transforma `null` em texto vazio, então o parágrafo só fica em branco.

---

## 9. Fazendo uma seção nova igual

Molde (exemplo: produtos da categoria na `categorias.html`):

```html
<div class="container">
    <div class="row" id="category_products"></div>
</div>
```

```js
import { getJson } from "./api.js";
import { escapeHtml as e, formatPrice, showContent, showError, showSkeleton, showState } from "./ui.js";

const productsRow = document.getElementById("category_products");

async function carregarProdutos() {
    showSkeleton(productsRow, "product", 8);
    try {
        const page = await getJson(
            `/api/products?categorySlug=${encodeURIComponent(categoriaSlug)}&page=0&size=8&sort=name,asc`);
        if (page.content.length === 0) {
            showState(productsRow, { icon: "bi-bag", message: "Nenhum produto nesta categoria ainda." });
            return;
        }
        showContent(productsRow, page.content.map(productCard).join(""));
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showError(productsRow, carregarProdutos);
    }
}

carregarProdutos();
```

Para não copiar o `productCard` e o `productImage` em cada página, mova os dois para um arquivo próprio (ex.: `js/cards.js`, com `export function productCard`) e importe onde precisar.

### Checklist

- [ ] Container vazio com `id` no HTML, dentro de um `.row` se forem cards
- [ ] `showSkeleton` antes do `await`, com o mesmo número de itens do `size`
- [ ] Estado vazio com mensagem útil (`showState`)
- [ ] Erro com retry passando a própria função (`showError`)
- [ ] 404 tratado separado quando o dado vem de um `slug` da URL
- [ ] `e()` em **todo** texto da API que vai para o HTML
- [ ] `formatPrice` em todo preço
- [ ] `encodeURIComponent` em slug ou busca que entra numa URL
- [ ] `getJson` (sem token) para vitrine; `apiFetch` só para `/api/me/**`
- [ ] Testar com a API dormindo: o aviso de cold start aparece e o skeleton segura a tela
