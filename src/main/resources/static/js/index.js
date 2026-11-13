// Home: categorias, números do hero e duas vitrines (lançamentos e até R$ 50).
import { getJson, getJsonCached } from "./api.js";
import { escapeHtml as e, showContent, showError, showSkeleton, showState } from "./ui.js";
import { productCard } from "./cards.js";

const categoriesBox = document.getElementById("categories_row");
const statCategories = document.getElementById("stat_categories");
const statProducts = document.getElementById("stat_products");

// "Ver todas" das categorias abre o menu lateral, que lista todas
document.querySelector("[data-open-sidebar]")?.addEventListener("click", () =>
    document.dispatchEvent(new Event("hoko:open-sidebar")));

// ---------------------------------------------------------------- categorias

function categoryCard(cat) {
    return `
        <a href="/categorias.html?slug=${encodeURIComponent(cat.slug)}" class="categoria-card">
            <span class="categoria-icon"><i class="bi ${e(cat.icon)}" aria-hidden="true"></i></span>
            <span class="categoria-nome">${e(cat.name)}</span>
        </a>`;
}

function renderCategories(page) {
    statCategories.textContent = page.totalElements;
    if (page.content.length === 0) {
        showState(categoriesBox, { message: "Nenhuma categoria cadastrada ainda." });
        categoriesBox.classList.remove("categorias-grade");
        return;
    }
    showContent(categoriesBox, page.content.slice(0, 8).map(categoryCard).join(""));
}

async function loadCategories() {
    showSkeleton(categoriesBox, "category", 8);
    try {
        // mesma chamada do menu lateral: as duas usam a mesma cópia em cache
        await getJsonCached("/api/categories?size=50&sort=name,asc", renderCategories);
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        categoriesBox.classList.remove("categorias-grade");
        showError(categoriesBox, () => { categoriesBox.classList.add("categorias-grade"); loadCategories(); });
    }
}

// ------------------------------------------------------------------ vitrines

async function loadShelf(box, query, emptyMessage, onPage) {
    showSkeleton(box, "product", 4);
    try {
        const page = await getJson(`/api/products?${query}`);
        onPage?.(page);
        if (page.content.length === 0) {
            showState(box, { icon: "bi-bag", message: emptyMessage });
            return;
        }
        showContent(box, page.content.map(p => productCard(p)).join(""));
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showError(box, () => loadShelf(box, query, emptyMessage, onPage));
    }
}

loadCategories();
loadShelf(document.getElementById("highlighted_products"),
    "page=0&size=8&sort=createdAt,desc", "Nenhum produto por aqui ainda.",
    (page) => { statProducts.textContent = page.totalElements.toLocaleString("pt-BR"); });
loadShelf(document.getElementById("cheap_products"),
    "page=0&size=4&maxPrice=50&inStock=true&sort=price,desc", "Nenhum produto até R$ 50 agora.");
