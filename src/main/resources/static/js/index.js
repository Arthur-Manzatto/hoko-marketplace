import { getJson, getJsonCached } from "./api.js";
import { escapeHtml as e, showContent, showError, showSkeleton, showState } from "./ui.js";
import { productCard } from "./cards.js";

const categories_row = document.getElementById("categories_row");
const productHL_row = document.getElementById("highlighted_products");

// ---------------------------------------------------------------- categorias

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

function renderCategories(page) {
    if (page.content.length === 0) {
        showState(categories_row, { message: "Nenhuma categoria cadastrada ainda." });
        return;
    }
    showContent(categories_row, page.content.map(categoryCard).join(""));
}

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

// ------------------------------------------------------------------ produtos

async function carregarHighlights() {
    showSkeleton(productHL_row, "product", 4);
    try {
        const page = await getJson("/api/products?categorySlug=eletronicos&page=0&size=4&sort=name,asc");
        if (page.content.length === 0) {
            showState(productHL_row, { icon: "bi-bag", message: "Nenhum produto por aqui ainda." });
            return;
        }
        showContent(productHL_row, page.content.map(productCard).join(""));
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showError(productHL_row, carregarHighlights);
    }
}

carregarCategorias();
carregarHighlights();
