// Cards reaproveitados pelas páginas. Fica num módulo próprio porque importar
// index.js executaria o carregamento da home em outras páginas.
import { escapeHtml as e, formatPrice, withBusy } from "./ui.js";
import { addToCart } from "./cart.js";
import { heartHtml, isFavorite } from "./favorites.js";

const NEW_DAYS = 14;
const LOW_STOCK = 3;

export function productImage(prod) {
    const img = prod.coverImageUrl
        ? `<img src="${e(prod.coverImageUrl)}" alt="${e(prod.name)}" class="product-img"
                loading="lazy" decoding="async"
                onload="this.classList.add('loaded')" onerror="this.remove()">`
        : "";
    // o ícone fica por baixo: aparece enquanto a foto carrega, se não houver foto ou se ela falhar
    return `<div class="img-placeholder" aria-hidden="true"><i class="bi bi-image"></i></div>${img}`;
}

/** "12x de R$ 3,33" (sem juros: o checkout aceita até 12x no cartão). */
export function installmentText(price) {
    return `12x de ${formatPrice(Number(price) / 12)}`;
}

/** Selo do canto do card: só informação real (estoque e produto recém-cadastrado). */
function badge(prod) {
    if (prod.quantity === 0) return `<span class="product-obs product-obs-esgotado">Esgotado</span>`;
    if (prod.quantity <= LOW_STOCK) return `<span class="product-obs">Últimas unidades</span>`;
    const created = Date.parse(prod.createdAt);
    if (created && Date.now() - created < NEW_DAYS * 86400000) {
        return `<span class="product-obs product-obs-novo">Novo</span>`;
    }
    return "";
}

/**
 * Card de produto. O link cobre o card inteiro (::after) e o coração e o botão
 * ficam por cima dele, então não há botão dentro de link.
 * `col` troca as classes da coluna (padrão: 1/2/3/4 por linha conforme a tela).
 */
export function productCard(prod, { col = "col-12 col-sm-6 col-md-4 col-lg-3" } = {}) {
    const soldOut = prod.quantity === 0;
    const fav = isFavorite(prod.id);
    const href = `/produtos.html?slug=${encodeURIComponent(prod.slug)}`;
    return `
        <div class="${col} mb-4">
            <article class="product-card">
                <div class="pimg-container">
                    ${productImage(prod)}
                    ${badge(prod)}
                    <button type="button" class="product-favorite ${fav ? "ativo" : ""}" data-favorite="${e(prod.id)}"
                        aria-pressed="${fav}" aria-label="${fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}">
                        ${heartHtml(fav)}
                    </button>
                </div>

                <div class="product-info">
                    <div class="product-rating">
                        <i class="bi bi-shop" aria-hidden="true"></i>
                        <span class="product-store">${e(prod.sellerStoreName)}</span>
                    </div>

                    <h3 class="product-name"><a class="product-link" href="${href}">${e(prod.name)}</a></h3>

                    <div class="product-prices">
                        <span class="product-price">${formatPrice(prod.price)}</span>
                        <span class="product-parcela">ou ${installmentText(prod.price)}</span>
                    </div>

                    <button type="button" class="product-add" data-add-to-cart="${e(prod.id)}" ${soldOut ? "disabled" : ""}>
                        <i class="bi bi-cart3" aria-hidden="true"></i>
                        ${soldOut ? "Esgotado" : "Adicionar"}
                    </button>
                </div>
            </article>
        </div>
    `;
}

// botão "Adicionar" dos cards
document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (!button) return;
    event.preventDefault();
    if (!button.disabled) withBusy(button, addToCart(button.dataset.addToCart, 1));
});
