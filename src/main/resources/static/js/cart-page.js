// carrinho.html: itens com +/−/remover, resumo e "Fechar pedido". Toda ação usa o carrinho
// que a API devolve para redesenhar (sem segunda chamada).
import { apiFetch } from "./api.js";
import { escapeHtml as e, formatPrice, showError, showState, skeletonRows, toast } from "./ui.js";
import { requireLogin } from "./guard.js";
import { cartMessage, setCartBadge } from "./cart.js";

const MAX_PER_ITEM = 99;

const list = document.getElementById("cart_items");
const summary = document.getElementById("cart_summary");
const checkoutButton = document.getElementById("checkout_button");

function itemRow(item) {
    const max = Math.min(item.stock, MAX_PER_ITEM);
    const warning = !item.available
        ? (item.stock === 0 ? "Indisponível" : `Só restam ${item.stock}`)
        : "";
    const img = item.coverImageUrl
        ? `<img src="${e(item.coverImageUrl)}" alt="" loading="lazy" onerror="this.remove()">` : "";
    return `
        <div class="lista-item carrinho-item ${item.available ? "" : "indisponivel"}" data-item="${e(item.id)}">
            <a class="lista-foto" href="/produtos.html?slug=${encodeURIComponent(item.slug)}"><i class="bi bi-image"></i>${img}</a>
            <div class="lista-info">
                <a class="lista-nome" href="/produtos.html?slug=${encodeURIComponent(item.slug)}">${e(item.name)}</a>
                <span class="texto-suave">${e(item.sellerStoreName)} · ${formatPrice(item.unitPrice)} cada</span>
                ${warning ? `<span class="aviso-estoque"><i class="bi bi-exclamation-triangle"></i> ${e(warning)}</span>` : ""}
            </div>
            <div class="quantidade" aria-label="Quantidade">
                <button type="button" class="qtd-btn" data-qty="${item.quantity - 1}" ${item.quantity <= 1 ? "disabled" : ""} aria-label="Diminuir">−</button>
                <span class="qtd-valor">${item.quantity}</span>
                <button type="button" class="qtd-btn" data-qty="${item.quantity + 1}" ${item.quantity >= max ? "disabled" : ""} aria-label="Aumentar">+</button>
            </div>
            <div class="lista-preco">${formatPrice(item.lineTotal)}</div>
            <button type="button" class="btn-icone texto-perigo" data-remove aria-label="Remover ${e(item.name)}"><i class="bi bi-trash"></i></button>
        </div>`;
}

function render(cart) {
    setCartBadge(cart.totalItems);
    if (cart.items.length === 0) {
        summary.hidden = true;
        showState(list, {
            icon: "bi-cart",
            message: "Seu carrinho está vazio.",
            action: { label: "Ver produtos", href: "/todos-produtos.html" },
        });
        return;
    }
    list.removeAttribute("aria-busy");
    list.innerHTML = cart.items.map(itemRow).join("");
    summary.hidden = false;
    document.getElementById("summary_items").textContent =
        `${cart.totalItems} ${cart.totalItems === 1 ? "item" : "itens"}`;
    document.getElementById("summary_subtotal").textContent = formatPrice(cart.subtotal);
    document.getElementById("summary_total").textContent = formatPrice(cart.subtotal);
    const nothingAvailable = cart.totalItems === 0;
    checkoutButton.classList.toggle("disabled", nothingAvailable);
    checkoutButton.setAttribute("aria-disabled", String(nothingAvailable));
}

async function change(row, request) {
    row.classList.add("ocupado");
    try {
        render(await request);
    } catch (error) {
        row.classList.remove("ocupado");
        if (error.status !== 401) toast(cartMessage(error), "erro");
    }
}

list.addEventListener("click", (event) => {
    const row = event.target.closest("[data-item]");
    if (!row) return;
    const id = row.dataset.item;
    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton) {
        change(row, apiFetch(`/api/me/cart/items/${id}`, { method: "PATCH", body: { quantity: Number(qtyButton.dataset.qty) } }));
    } else if (event.target.closest("[data-remove]")) {
        change(row, apiFetch(`/api/me/cart/items/${id}`, { method: "DELETE" }));
    }
});

document.getElementById("clear_cart").addEventListener("click", async () => {
    if (!confirm("Tirar todos os itens do carrinho?")) return;
    try {
        await apiFetch("/api/me/cart", { method: "DELETE" });
        render({ items: [], totalItems: 0, subtotal: 0 });
    } catch (error) {
        toast("Não foi possível esvaziar o carrinho.", "erro");
    }
});

checkoutButton.addEventListener("click", (event) => {
    if (checkoutButton.classList.contains("disabled")) event.preventDefault();
});

async function load() {
    list.setAttribute("aria-busy", "true");
    list.innerHTML = skeletonRows(3);
    try {
        render(await apiFetch("/api/me/cart"));
    } catch (error) {
        if (error.status === 401) return;
        console.error("Erro ao carregar carrinho:", error);
        showError(list, load);
    }
}

await requireLogin();
load();
