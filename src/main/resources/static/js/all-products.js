// todos-produtos.html: catálogo com busca, categoria (rádios), faixa de preço, estoque e ordem (js/filters.js).
// As buscas (header e banner) disparam "hoko:search" nesta página e filtram aqui mesmo, sem recarregar.
// No celular os filtros viram uma gaveta que abre pela direita.
import { getJsonCached } from "./api.js";
import { escapeHtml as e } from "./ui.js";
import { setupProductFilters } from "./filters.js";
import { setSearchText } from "./search.js";

const form = document.getElementById("product_filters");
const title = document.getElementById("all_title");
const chip = document.getElementById("search_chip");
const categoriesBox = document.getElementById("f_categories");
const panel = document.getElementById("filters_panel");
const backdrop = document.getElementById("filters_backdrop");
const openButton = document.getElementById("filters_open");
const applyButton = document.getElementById("filters_apply");
const filtersCount = document.getElementById("filters_count");

let categoryNames = {};

// ------------------------------------------------------------ cabeçalho

function updateHeader() {
    const q = form.elements.search.value.trim();
    const slug = form.elements.categorySlug.value;
    if (q) title.textContent = `Resultados para "${q}"`;
    else if (slug && categoryNames[slug]) title.textContent = categoryNames[slug];
    else title.textContent = "Encontre o produto ideal";
    document.title = `${q || categoryNames[slug] || "Produtos"} | Hoko`;

    chip.hidden = !q;
    chip.querySelector("span").textContent = q;
    setSearchText(q);

    // quantos filtros estão ligados (badge do botão "Filtros" no celular)
    const active = [slug, form.elements.inStock.checked, new URLSearchParams(location.search).has("minPrice")
        || new URLSearchParams(location.search).has("maxPrice")].filter(Boolean).length;
    filtersCount.textContent = active;
    filtersCount.hidden = active === 0;
}

function fillCategories(page) {
    const selected = form.elements.categorySlug.value || new URLSearchParams(location.search).get("categorySlug") || "";
    categoryNames = Object.fromEntries(page.content.map(c => [c.slug, c.name]));
    categoriesBox.innerHTML =
        `<label class="filtros-radio"><input type="radio" name="categorySlug" value=""> <span>Todas</span></label>` +
        page.content.map(c => `
            <label class="filtros-radio">
                <input type="radio" name="categorySlug" value="${e(c.slug)}">
                <span>${e(c.name)}</span>
            </label>`).join("");
    form.elements.categorySlug.value = selected;
    updateHeader();
}

// ------------------------------------------------------------ gaveta (celular)

function setDrawer(open) {
    panel.classList.toggle("aberta", open);
    backdrop.hidden = !open;
    openButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("sem-rolagem", open);
}

openButton.addEventListener("click", () => setDrawer(true));
backdrop.addEventListener("click", () => setDrawer(false));
document.getElementById("filters_close").addEventListener("click", () => setDrawer(false));
applyButton.addEventListener("click", () => setDrawer(false));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setDrawer(false); });

// ------------------------------------------------------------ filtros

const products = setupProductFilters({
    form,
    grid: document.getElementById("product_section"),
    moreButton: document.getElementById("load_more"),
    countEl: document.getElementById("products_count"),
    errorEl: document.getElementById("filters_error"),
    priceRoot: document.getElementById("price_range"),
    card: { col: "col-12 col-sm-6 col-xl-4" },
    onCount(total) {
        applyButton.textContent = total == null ? "Ver produtos" : `Ver ${total.toLocaleString("pt-BR")} produtos`;
        updateHeader();
    },
});

/** Troca o termo e reaplica os filtros (submit do form = recalcula a faixa de preço e busca). */
function search(term) {
    form.elements.search.value = term;
    updateHeader();
    form.requestSubmit();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("hoko:search", (event) => search(event.detail));
chip.addEventListener("click", () => search(""));
form.addEventListener("change", updateHeader);
form.addEventListener("filters:cleared", () => setTimeout(updateHeader));

async function start() {
    // categoria da URL vira um rádio provisório até a lista chegar (senão o filtro se perderia)
    const urlSlug = new URLSearchParams(location.search).get("categorySlug");
    if (urlSlug) {
        categoriesBox.insertAdjacentHTML("beforeend",
            `<label class="filtros-radio"><input type="radio" name="categorySlug" value="${e(urlSlug)}"> <span>…</span></label>`);
    }
    getJsonCached("/api/categories?size=50&sort=name,asc", fillCategories)
        .catch(error => console.error("Erro ao carregar categorias:", error)); // a página funciona sem a lista
    await products.load();
    updateHeader();
}

start();
