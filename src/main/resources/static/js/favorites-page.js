// favoritos.html: produtos favoritados neste navegador (js/favorites.js guarda só os ids).
// Busca cada produto na API em paralelo; produto que não existe mais sai da lista sozinho.
import { getJson } from "./api.js";
import { showContent, showSkeleton, showState, toast, withBusy } from "./ui.js";
import { productCard } from "./cards.js";
import { getFavorites, removeFavorite } from "./favorites.js";
import { addToCart } from "./cart.js";

const grid = document.getElementById("fav_grid");
const count = document.getElementById("fav_count");
const cta = document.getElementById("fav_cta");
const addAll = document.getElementById("fav_add_all");

let products = [];

/** O detalhe (GET /api/products/{id}) tem imageUrls; o card usa coverImageUrl. */
function toCard(p) {
    return { ...p, coverImageUrl: p.imageUrls?.[0] ?? null };
}

function render() {
    const ids = getFavorites();
    products = products.filter(p => ids.includes(p.id));
    count.textContent = products.length === 0
        ? "Os produtos que você salvou ficam aqui, neste navegador."
        : `${products.length} ${products.length === 1 ? "produto salvo" : "produtos salvos"} neste navegador.`;
    cta.hidden = !products.some(p => p.quantity > 0);
    if (products.length === 0) {
        showState(grid, {
            icon: "bi-heart",
            message: "Nenhum favorito ainda",
            text: "Toque no coração de um produto para guardar ele aqui.",
            action: { label: "Ver produtos", href: "/todos-produtos.html" },
        });
        return;
    }
    showContent(grid, products.map(p => productCard(p)).join(""));
}

async function load() {
    const ids = getFavorites();
    if (ids.length === 0) return render();
    showSkeleton(grid, "product", Math.min(ids.length, 8));
    const results = await Promise.allSettled(ids.map(id => getJson(`/api/products/${encodeURIComponent(id)}`)));
    products = [];
    results.forEach((r, i) => {
        if (r.status === "fulfilled") products.push(toCard(r.value));
        else if (r.reason?.status === 404) removeFavorite(ids[i]); // produto apagado
    });
    if (products.length === 0 && results.some(r => r.status === "rejected" && r.reason?.status !== 404)) {
        showState(grid, { icon: "bi-wifi-off", message: "Não foi possível carregar.",
            action: { label: "Tentar de novo", onClick: load } });
        return;
    }
    render();
}

// desfavoritou aqui mesmo: o card sai da tela
document.addEventListener("hoko:favorites", () => { if (products.length) render(); });

addAll.addEventListener("click", () => withBusy(addAll, (async () => {
    const available = products.filter(p => p.quantity > 0);
    let added = 0;
    for (const p of available) {
        if (await addToCart(p.id, 1, { quiet: true })) added += 1;
    }
    if (added) toast(`${added} ${added === 1 ? "produto adicionado" : "produtos adicionados"} ao carrinho.`, "ok",
        { label: "Ver carrinho", href: "/carrinho.html" });
})()));

load();
