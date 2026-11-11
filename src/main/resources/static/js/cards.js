// Cards reaproveitados pelas páginas. Fica num módulo próprio porque importar
// index.js executaria o carregamento da home em outras páginas.
import { escapeHtml as e, formatPrice } from "./ui.js";

export function productImage(prod) {
    const img = prod.coverImageUrl
        ? `<img src="${e(prod.coverImageUrl)}" alt="${e(prod.name)}" class="product-img"
                loading="lazy" decoding="async"
                onload="this.classList.add('loaded')" onerror="this.remove()">`
        : "";
    // o ícone fica por baixo: aparece enquanto a foto carrega, se não houver foto ou se ela falhar
    return `<div class="img-placeholder" aria-hidden="true"><i class="bi bi-image"></i></div>${img}`;
}

export function productCard(prod) {
    const oldPrice = Math.round(prod.price * 1.2 * 100) / 100;
    return `

        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
        <a href="produtos.html?slug=${e(prod.slug)}">
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
            </a>
        </div>
    `;
}
