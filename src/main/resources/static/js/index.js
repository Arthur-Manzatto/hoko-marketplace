import { getJson, getJsonCached } from "./api.js";
import { escapeHtml as e, formatPrice, showContent, showError, showSkeleton, showState } from "./ui.js";

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

function productImage(prod) {
    const img = prod.coverImageUrl
        ? `<img src="${e(prod.coverImageUrl)}" alt="${e(prod.name)}" class="product-img"
                loading="lazy" decoding="async"
                onload="this.classList.add('loaded')" onerror="this.remove()">`
        : "";
    // o ícone fica por baixo: aparece enquanto a foto carrega, se não houver foto ou se ela falhar
    return `<div class="img-placeholder" aria-hidden="true"><i class="bi bi-image"></i></div>${img}`;
}

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
