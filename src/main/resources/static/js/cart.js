// Carrinho: selo com a quantidade no ícone da navbar e addToCart() para os botões
// "Adicionar" (cards e página do produto). Carrinho exige login.
import { apiFetch } from "./api.js";
import { toast } from "./ui.js";
import { getSession, goToLogin } from "./guard.js";

const MESSAGES = {
    "You can't buy your own product": "Esse produto é da sua loja.",
    "Product is out of stock": "Produto esgotado.",
    "Product is no longer available": "Produto indisponível.",
};

/** Traduz as mensagens de regra da API do carrinho. */
export function cartMessage(error) {
    const msg = error?.body?.message || error?.message || "";
    if (MESSAGES[msg]) return MESSAGES[msg];
    const stock = msg.match(/^Only (\d+) in stock$/);
    if (stock) return `Só ${stock[1]} em estoque.`;
    if (msg.startsWith("Maximum")) return "Máximo de 99 unidades por produto.";
    return "Não foi possível atualizar o carrinho.";
}

/** Atualiza o número no ícone do carrinho (todas as cópias da navbar). */
export function setCartBadge(count) {
    document.querySelectorAll("[data-cart-badge]").forEach(badge => {
        const text = count > 99 ? "99+" : String(count);
        const grew = !badge.hidden && Number(badge.textContent) < count;
        badge.textContent = text;
        badge.hidden = !count;
        if (grew) { // pulinho quando aumenta
            badge.classList.remove("pulo");
            void badge.offsetWidth;
            badge.classList.add("pulo");
        }
    });
}

export async function refreshCartBadge() {
    if (!(await getSession())) return setCartBadge(0);
    try {
        const cart = await apiFetch("/api/me/cart");
        setCartBadge(cart.totalItems);
    } catch {
        setCartBadge(0);
    }
}

/**
 * Adiciona ao carrinho. Sem login, vai para o login (e volta). Devolve o carrinho ou null.
 * quiet: sem o aviso de sucesso (quem chama mostra um só no fim, ex.: "Adicionar todos").
 */
export async function addToCart(productId, quantity = 1, { quiet = false } = {}) {
    if (!(await getSession())) {
        goToLogin();
        return null;
    }
    try {
        const cart = await apiFetch("/api/me/cart/items", { method: "POST", body: { productId, quantity } });
        setCartBadge(cart.totalItems);
        if (!quiet) toast("Adicionado ao carrinho.", "ok", { label: "Ver carrinho", href: "/carrinho.html" });
        return cart;
    } catch (error) {
        if (error.status !== 401) toast(cartMessage(error), "erro");
        return null;
    }
}
