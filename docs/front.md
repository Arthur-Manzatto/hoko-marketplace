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
| `js/cards.js`, `filters.js`, `search.js` | Card de produto, filtros e busca da navbar (seções 6 e 11) |
| Telas logadas | Carrinho, checkout, pedidos, conta, loja e vendas: ver a seção 12 |

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

## 6. Card de produto (`cards.js`)

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

### O que o card mostra (e o que não)

- **Sem dado inventado:** sem "Mais vendido", nota ★ ou preço riscado. O card mostra a loja (`bi-shop` + `sellerStoreName`), o preço e "ou 12x de R$ X".
- **Selo do canto (só informação real):** "Esgotado" (`quantity === 0`, botão desabilitado) → "Últimas unidades" (`quantity <= 3`) → "Novo" (só se o produto tiver `createdAt` de até 14 dias; a listagem não manda esse campo, então hoje aparece só onde o detalhe é usado, como em Favoritos).
- **Estrutura:** `<article class="product-card">` com o nome num `<a class="product-link">` cujo `::after` cobre o card inteiro (o card todo abre o produto). O coração e o botão ficam com `z-index` acima, então não existe botão dentro de link.
- **"Adicionar":** `data-add-to-cart="<id>"`. Um único listener no `document` (em `cards.js`) chama `addToCart(id, 1)` do `cart.js` com `withBusy`. Deslogado → login com `?next=`.
- **Coração:** `data-favorite="<id>"`, tratado pelo `favorites.js` (seção 13).
- `productCard(prod, { col })` aceita as classes da coluna (padrão `col-12 col-sm-6 col-md-4 col-lg-3`). Com a grade marcada `.grade-produtos`, o celular mostra 2 por linha.

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

O `productCard` e o `productImage` ficam em `js/cards.js`: importe de lá (`import { productCard } from "./cards.js"`). **Nunca importe de `index.js`** — importar um módulo executa o código dele, e a página rodaria o carregamento da home (erro no console em elementos que não existem).

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

---

## 10. Página do produto (`produtos.html` + `product.js`)

`produtos.html?slug=<slug>` mostra um produto (`GET /api/products/slug/{slug}`, modelo "detalhe" na seção 10 do `api.md`).

- **Skeleton escrito no HTML** (`#product_skeleton`): aparece antes do JS carregar. O conteúdo real (`#product_view`) começa com `hidden` e o `render()` troca um pelo outro com `.fade-in`.
- **Estados:** sem `?slug=` ou `404` → "Produto não encontrado" + link pra home; outro erro → `showError` com "Tentar de novo" (volta ao skeleton e busca de novo).
- **Textos** são preenchidos com `textContent` (não precisa de `e()`, o navegador nunca interpreta como HTML).
- **Fotos:** `imageUrls[0]` na principal, miniaturas quando há 2 ou mais (clique troca a principal). Foto quebrada some e fica o placeholder.
- **Descrição:** `white-space: pre-line` respeita as quebras de linha; sem descrição mostra um texto cinza.
- **Estoque:** o select vai de 1 até `min(quantity, 10)`; `quantity = 0` mostra "Esgotado" e desabilita select e botões.
- Os botões "Adicionar ao carrinho" / "Comprar agora" ainda não chamam a API (`POST /api/me/cart/items` exige login).


---

## 11. Filtros de produtos (`js/filters.js` + `js/price-range.js`)

Usado em `categorias.html` (barra horizontal) e em `todos-produtos.html` (lateral). Os campos são lidos pelo `name`, todos opcionais:

| Campo | Elemento | Onde |
|---|---|---|
| `search` | input hidden, preenchido pela busca da navbar | só em todos-produtos |
| `categorySlug` | select (preenchido por `GET /api/categories`) | só em todos-produtos |
| slider de preço | `#price_range` com 2 `input[type=range]` (`data-lo`, `data-hi`) | as duas |
| `inStock` | checkbox | as duas |
| `sort` | select (`name,asc`, `price,asc`, `price,desc`, `createdAt,desc`) | as duas |

```js
import { setupProductFilters } from "./filters.js";

const products = setupProductFilters({
    form, grid, moreButton, countEl, errorEl,
    priceRoot: document.getElementById("price_range"),
    base: { categorySlug: "eletronicos" },   // filtro fixo da página (não vai pra URL); todos-produtos não tem base
});
products.load();
```

- **Slider de preço:** os limites são o menor e o maior preço do que está sendo filtrado (2 chamadas `size=1` com `sort=price,asc` e `price,desc`), arredondados de 10 em 10. Mudar busca/categoria/estoque recalcula os limites e solta o preço. Filtra quando solta a bolinha; bolinha encostada na ponta não manda `minPrice`/`maxPrice`.
- **URL:** `?search=&categorySlug=&minPrice=&maxPrice=&inStock=&sort=` — F5, voltar e link compartilhado mantêm a tela.
- **Busca: qualquer `<form data-search>`** (header de todas as páginas, hero da home e banner do catálogo) com um `<input>` e um botão `[data-search-button]`. O `js/search.js` (importado pelo `session.js`) liga todas:
  - enquanto digita (2+ letras, 250 ms de pausa) mostra até **4 sugestões** (`GET /api/products?search=&size=4`) com foto, categoria e preço; setas ↑/↓ + Enter abrem o produto, Esc fecha, clique fora fecha; resultados ficam em cache por termo e respostas atrasadas são descartadas;
  - Enter sem sugestão marcada, "Buscar" ou "Ver todos os resultados" → `todos-produtos.html?search=`;
  - **dentro** de `todos-produtos.html` a busca filtra ali mesmo (evento `hoko:search`, sem recarregar e mantendo os outros filtros) e aparece o chip "🔍 termo ✕" para remover a busca. A lateral não tem campo de busca próprio (só um `input hidden name="search"`).
- Os "Ver todas" da home levam para `todos-produtos.html` (o dos destaques com `sort=createdAt,desc`).
- "Carregar mais" de 12 em 12; sem resultado com filtro → "Nenhum produto com esses filtros" + "Limpar filtros".


---

## 12. Telas de logado (compra, conta e vendedor)

### Peças compartilhadas

| Arquivo | O que faz |
|---|---|
| `js/guard.js` | `requireLogin()`: sem sessão manda para `/login.html?next=<página atual>` e **trava** o resto do módulo (promise que nunca resolve). Toda tela logada termina com `await requireLogin(); load();` |
| `js/auth.js` | Depois de entrar/cadastrar volta para o `?next=` (só aceita caminho relativo `/...`, nunca `//site`) |
| `js/api.js` | `apiFetch` com 401 → login com `next` (token vencido) |
| `js/cart.js` | `addToCart(productId, qty)`, `refreshCartBadge()`, `setCartBadge(n)` e `cartMessage(error)` (traduz os erros da API do carrinho) |
| `js/address-form.js` | Form de endereço reaproveitado em Conta e Checkout: `setupAddressForm(box, { onSubmit, onCancel, submitLabel })` → `{ form, fill, showErrors, focus }`; também `addressText(a)` e `isDefaultAddress(a)` |
| `js/order-view.js` | `orderDetailHtml(order, { role })`: linha do tempo, itens, entrega e pagamento. Usado em `pedido.html` (comprador) e `vendas.html` (vendedor); os botões ficam com cada página |
| `js/ui.js` | `toast(msg, "ok"\|"erro"\|"info")`, `withBusy(botão, promise)`, `clearFieldErrors(form)`, `showFieldErrors(form, error, traduções)` (422 `errors[]` → `.is-invalid` no campo; resto → `.form-erro` no topo), `formatDate(iso, comHora)`, `statusBadge(status, "order"\|"payment")`, `skeletonRows(n)` |

Navbar (todas as páginas): ícone do carrinho → `/carrinho.html` com o selo `[data-cart-badge]` (total de itens, atualizado pelo `session.js`); menu do avatar → Minha conta, Meus pedidos, Minha loja, Sair.

### As telas

| Página | JS | API | Observações |
|---|---|---|---|
| `lancamentos.html` | `launches.js` | `GET /api/products?sort=createdAt,desc` | Pública. `setupProductFilters` com `base: { sort }` e "Só com estoque" |
| `favoritos.html` | `favorites-page.js` | `GET /api/products/{id}` (um por favorito, em paralelo) | Pública. Ids no `localStorage`; produto apagado (404) sai da lista; "Adicionar todos" ao carrinho |
| `relatorios.html` | `reports.js` | `GET /api/me/seller/orders` (todas as páginas, `size=100`) | Calcula no navegador: faturamento e pedidos por mês (6 meses, barras em CSS), pedidos por status, tabela mês a mês |
| `loja.html?slug=` | `store.js` | `GET /api/sellers/slug/{slug}`, produtos com `sellerId` | Pública. Cabeçalho da loja + filtros (mesmo `setupProductFilters`). O nome da loja na página do produto leva para cá |
| `carrinho.html` | `cart-page.js` | `GET/DELETE /api/me/cart`, `PATCH/DELETE /items/{id}` | −/+ limitado a `min(stock, 99)`; item `available:false` fica apagado com "Indisponível" ou "Só restam N"; toda ação redesenha com o carrinho que volta na resposta |
| `checkout.html` | `checkout.js` | carrinho, endereços, `POST /api/me/orders/checkout`, `POST /orders/{id}/pay` | 1) endereço (rádio, padrão marcado, "+ Novo endereço" inline) 2) PIX / Cartão (1–12x) / Boleto 3) revisão **agrupada por loja** (vira 1 pedido por loja). Confirmar fica desabilitado se tem item indisponível |
| `pedidos.html` | `orders.js` | `GET /api/me/orders?status=` | Abas por status, "Carregar mais". `?novo=1` mostra "Pedido realizado!"; `?novo=pendente` avisa que falta pagar |
| `pedido.html?id=` | `order.js` | `GET /api/me/orders/{id}`, `/pay`, `/cancel` | Linha do tempo + rastreio. "Pagar agora" (PENDING) e "Cancelar pedido" (PENDING/PAID) |
| `conta.html` | `account.js` | `GET/PUT /api/me`, `/api/me/addresses` (+ `PATCH /{id}/default`) | Nome e telefone; e-mail só leitura. Endereços: editar, excluir, tornar padrão |
| `vender.html` | `sell.js` | `GET /api/me`, `POST /api/me/seller` | Quem já tem loja vai direto para `minha-loja.html`. O mesmo POST reabre loja fechada. Documento: só dígitos (11 ou 14) |
| `minha-loja.html?aba=` | `my-store.js` | `/api/me/seller`, `/seller/orders/summary`, `/seller/products` | Abas `overview` (faturamento, pendente, a despachar, total), `products` (estoque rápido com `PATCH /stock` ao sair do campo, editar, excluir) e `settings` (nome/documento, fechar loja). Sem loja (404) → `vender.html` |
| `produto-form.html[?id=]` | `product-form.js` | `GET /api/products/{id}`, `POST/PUT /api/me/seller/products` | Fotos sobem do navegador direto para o Storage (`product-images/{userId}/{uuid}.ext`): JPG/PNG/WebP até 5 MB, no máximo 8, setas para reordenar (a 1ª é a capa). Ao salvar, apaga do Storage as fotos que saíram. Preço aceita `99,90` e `1.234,56` |
| `vendas.html` | `sales.js` | `GET /api/me/seller/orders?status=`, `/{id}`, `/ship`, `/deliver`, `/cancel` | Abre na aba "A despachar" (PAID). Clique na linha expande o detalhe. Enviar com rastreio opcional (letras, números, hífen) |

### Fluxo de compra

```
card / página do produto ── Adicionar ──► POST /api/me/cart/items ──► selo do carrinho
        │ "Comprar agora" = adiciona + vai pro checkout
        ▼
carrinho.html ── Fechar pedido ──► checkout.html
        │ POST /orders/checkout  →  1 pedido por loja (PENDING, estoque reservado)
        │ POST /orders/{id}/pay  →  cada pedido vira PAID (pagamento simulado)
        ▼
pedidos.html?novo=1 ──► pedido.html?id=  (comprador acompanha / cancela)
                              ▲
vendas.html (vendedor) ── ship (rastreio) ──► SHIPPED ── deliver ──► DELIVERED
```

- Se o `pay` de algum pedido falhar, o pedido fica PENDING e a tela vai para `?novo=pendente`; dá para pagar depois em `pedido.html`.
- Cancelar (comprador ou vendedor, enquanto PENDING/PAID) devolve o estoque e estorna o pagamento (`REFUNDED`).
- A API não deixa comprar o próprio produto: para testar a compra, use uma conta que **não** é dona da loja.

### Testando sem servidor de verdade

As telas logadas dependem do back de carrinho/pedidos/vendas publicado no Render. Deslogado, todas redirecionam para o login com `next`. O CSS dessas telas fica no bloco "Telas internas" do `style.css`.


---

## 13. Visual (design do Figma) e casca das páginas

O visual segue o design do Figma Make que está em `inspiration/` (React + Tailwind, **só referência**: não é usado pelo site). Aqui ele foi traduzido para CSS próprio, sem React e sem Tailwind. O Bootstrap 4 continua só pelo grid e pelos utilitários.

### Tokens (`:root` no topo do `style.css`)

| Token | Valor | Uso |
|---|---|---|
| `--azul` / `--azul-claro` / `--azul-claro-2` | `#013095` / `#eef3ff` / `#dbe4ff` | identidade, ícones em quadrado, botão "Adicionar ao carrinho" |
| `--laranja` / `--laranja-claro` | `#FE6901` / `#fff3eb` | CTAs (Buscar, Adicionar, Comprar) |
| `--fundo`, `--borda`, `--borda-forte` | `#f9fafb`, `#f1f3f6`, `#e5e7eb` | fundo da página e bordas |
| `--texto`, `--cinza`, `--cinza-claro` | `#111827`, `#6b7280`, `#9ca3af` | títulos, texto, apoio |
| `--raio`, `--raio-grande`, `--raio-botao` | 16, 24, 12px | cards, blocos grandes, botões |

Para mudar uma cor do site, mude o token, não a regra.

### Componentes

| Classe | O que é |
|---|---|
| `.topo`, `.busca`, `.topo-icone`, `.topo-selo` | header sticky com blur; busca em pílula; ícones com selo (carrinho e favoritos) |
| `.sidebar` + `.menu-*` | menu lateral (☰) |
| `.rodape` | rodapé |
| `.pagina-cabecalho` + `.pagina-icone` | título de página com ícone num quadrado azul-claro |
| `.banner` (+ `.banner-rotulo`, `.banner-cta`, `.banner-chip`, `.loja-banner`) | bloco azul em gradiente |
| `.pilulas` / `.pilula` (`.ativa`, ou `<label class="pilula">` com rádio dentro) | ordenação, filtros de status, abas |
| `.numero-cartao` + `.numero-icone` (`.laranja`, `.verde`, `.vermelho`) | cards de número |
| `.status-selo status-*` | selo de status com bolinha |
| `.state-box` (via `showState`) | vazio/erro: ícone num círculo, título, texto (`text`) e botão |
| `.btn-custom` (laranja), `.btn-azul`, `.btn-contorno`, `.btn-mini` | botões |

### Casca: header, menu lateral e rodapé

- **Header:** o bloco `<header class="topo">` + `#sidebarOverlay` + `<aside id="sidebar">` é idêntico em todas as páginas (menos `login.html`). Mudou em uma, copie o bloco inteiro para as outras (ou faça um replace no projeto todo).
- **`js/sidebar.js`** (módulo, em todas as páginas):
  - **monta o menu lateral** dentro do `<aside id="sidebar">` vazio. Ele tem o cartão do usuário (ou "Entrar"), Principal, **todas as categorias da API**, Minha conta e Vendedor. Vendedor mostra "Minha loja / Vendas / Relatórios", ou "Vender na Hoko" se não tiver loja: usa o `GET /api/me`, guardado 5 min no `sessionStorage` (`hoko:me`). Quem cria ou fecha a loja chama `forgetMe()`;
  - **monta o rodapé** no `<footer id="site_footer">`;
  - **abre e fecha o menu:** ☰, overlay e Esc. O evento `hoko:open-sidebar` abre de qualquer lugar (o "Ver todas" das categorias da home usa).
- **Favoritos (`js/favorites.js`):** ids no `localStorage` (`hoko:favoritos`), sem login.
  - Qualquer botão `[data-favorite="<id>"]` vira coração.
  - O evento `hoko:favorites` atualiza os corações e o selo do header `[data-favorites-badge]`.

### Comportamentos novos

- **Catálogo:** no celular os filtros viram gaveta pela direita, com "Ver N produtos" e um contador de filtros ativos. O `setupProductFilters` aceita `onCount(total)` e `card: { col }`, e lê os campos por `form.elements`, então categoria e ordem podem ser `select` ou rádios/pílulas.
- **Filtros:** a grade carrega **em paralelo** com os limites do slider. O slider fica como skeleton (`.price-range:not(.pronto)`) até os limites chegarem.
- **Produto:**
  - CEP com máscara e ViaCEP ("Frete grátis para Cidade/UF"); o form não navega mais;
  - cartão "Vendido por" e "Compra garantida";
  - "Você também pode gostar": 4 da mesma categoria, com estoque;
  - no celular, os botões de compra ficam colados embaixo.
- **Carrinho:** o selo do header dá um pulinho quando aumenta; o toast "Adicionado" tem o link "Ver carrinho".
- **Configurações (`conta.html`):** "Alterar senha" usa `supabase.auth.updateUser({ password })`.
- **Login:**
  - sem os botões sociais (não há provider configurado);
  - "Esqueceu sua senha?" chama `resetPasswordForEmail` com `redirectTo: /login.html?reset=1`, e na volta o form vira "Crie uma nova senha";
  - **no Supabase (Authentication → URL Configuration) o endereço do site precisa estar em "Redirect URLs"** (`https://hoko-api.onrender.com/login.html` e, para testar local, `http://localhost:5500/login.html`).

### CEP e CPF/CNPJ (`js/br.js`)

- **`lookupCep(cep)`** → `{ street, neighborhood, city, state }`, ou `null` se o CEP não existe.
  - Usa o ViaCEP; se ele cair, a BrasilAPI. Guarda em cache por CEP.
  - Só lança erro se os dois serviços estiverem fora do ar.
- **Formulário de endereço** (`address-form.js`, usado no checkout e em Configurações):
  - ao completar os 8 números, preenche rua, bairro, cidade e UF e leva o cursor para o número;
  - não apaga o que o usuário digitou à mão;
  - CEP inexistente marca o campo e impede salvar.
- **Página do produto:** o frete é calculado sozinho ao completar o CEP.
- **`setupDocumentField(input)`** (em `vender.html` e nas configurações da loja):
  - máscara de CPF (`000.000.000-00`) ou CNPJ (`00.000.000/0000-00`) conforme o tamanho;
  - confere os dígitos verificadores enquanto digita ("CPF válido" / "CNPJ inválido") e bloqueia o envio se estiver errado;
  - manda só os dígitos para a API.
- **A API faz a mesma checagem** (`DocumentUtils` + `SellerService`): `422 "Invalid CPF or CNPJ"`. Na edição da loja só confere se o documento mudou, então lojas antigas com documento de teste ainda conseguem trocar o nome.
- Para testar, use documentos de exemplo públicos: CPF `529.982.247-25`, CNPJ `11.222.333/0001-81`.
