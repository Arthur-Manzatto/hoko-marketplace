import { getJson, getJsonCached } from "./api.js";
import { escapeHtml as e, showContent, showError, showSkeleton, showState, formatPrice } from "./ui.js";
import { productCard, productImage } from "./index.js";


const cat_header = document.getElementById("category_header");
const categoriaSlug = new URLSearchParams(window.location.search).get("slug");

function notFound() {
    document.title = "Categoria não encontrada · Hoko";
    showState(cat_header, {
        icon: "bi-search",
        message: "Categoria não encontrada.",
        action: { label: "Voltar para a home", href: "/" },
        wrap: "container",
    });
}

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

const product_section = document.getElementById("product_section");



async function loadProducts() {
    showSkeleton(product_section, "product", 4);
    try {
        const page = await getJson(`/api/products?categorySlug=${encodeURIComponent(categoriaSlug)}`);
        if (page.content.length === 0) {
            showState(product_section, { icon: "bi-bag", message: "Nenhum produto por aqui ainda." });
            return;
        }
        showContent(product_section, page.content.map(productCard).join(""));
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showError(product_section, loadProducts);
    }
}

async function carregarPagina() {
    if (!categoriaSlug) {
        notFound();
        return;
    }

    showSkeleton(cat_header, "categoryHeader");
    try {
        await getJsonCached(`/api/categories/slug/${encodeURIComponent(categoriaSlug)}`, renderHeader);
        await loadProducts();
    } catch (error) {
        if (error.status === 404) {
            notFound();
        } else {
            console.error("Erro ao carregar categoria:", error);
            showError(cat_header, carregarPagina, "container");
        }
    }
}

carregarPagina();
