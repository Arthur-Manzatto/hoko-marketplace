// categorias.html?slug=: cabeçalho da categoria + produtos com ordenação em pílulas,
// faixa de preço e estoque (js/filters.js). Os filtros ficam na URL.
import { getJsonCached } from "./api.js";
import { escapeHtml as e, showContent, showError, showSkeleton, showState } from "./ui.js";
import { setupProductFilters } from "./filters.js";

const header = document.getElementById("category_header");
const filtersForm = document.getElementById("product_filters");
const slug = new URLSearchParams(location.search).get("slug");

let total = null;

function setTotal(value) {
    total = value;
    const el = document.getElementById("category_total");
    if (el) el.textContent = value == null ? "" : value === 1 ? "1 produto encontrado" : `${value} produtos encontrados`;
}

function notFound() {
    filtersForm.closest("section").hidden = true;
    document.title = "Categoria não encontrada | Hoko";
    showState(header, {
        icon: "bi-search",
        message: "Categoria não encontrada",
        text: "Ela pode ter sido removida. Veja todas as categorias no menu.",
        action: { label: "Voltar para a home", href: "/" },
        wrap: "container",
    });
}

function renderHeader(cat) {
    document.title = `${cat.name} | Hoko`;
    showContent(header, `
        <div class="container">
            <nav class="produto-caminho" aria-label="Caminho de navegação">
                <a href="/">Início</a> <span aria-hidden="true">/</span>
                <a href="/todos-produtos.html">Produtos</a> <span aria-hidden="true">/</span>
                <span aria-current="page">${e(cat.name)}</span>
            </nav>
            <div class="categoria-header" data-slug="${e(cat.slug)}">
                <div class="categoria-header-icon"><i class="bi ${e(cat.icon)}" aria-hidden="true"></i></div>
                <div>
                    <h1 class="categoria-header-titulo">${e(cat.name)}</h1>
                    <p class="categoria-header-desc">${e(cat.description ?? "")}</p>
                    <p class="categoria-header-total" id="category_total" aria-live="polite"></p>
                </div>
            </div>
        </div>`);
    setTotal(total);
}

const products = setupProductFilters({
    form: filtersForm,
    grid: document.getElementById("product_section"),
    moreButton: document.getElementById("load_more"),
    errorEl: document.getElementById("filters_error"),
    priceRoot: document.getElementById("price_range"),
    base: { categorySlug: slug ?? "" },
    onCount: setTotal,
});

async function loadPage() {
    if (!slug) return notFound();
    showSkeleton(header, "categoryHeader");
    // cabeçalho e produtos ao mesmo tempo
    products.load();
    try {
        await getJsonCached(`/api/categories/slug/${encodeURIComponent(slug)}`, renderHeader);
    } catch (error) {
        if (error.status === 404) return notFound();
        console.error("Erro ao carregar categoria:", error);
        showError(header, loadPage, "container");
    }
}

loadPage();
