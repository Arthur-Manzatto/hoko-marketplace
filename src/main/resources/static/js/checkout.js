// checkout.html: endereço (lista + novo), pagamento (PIX/cartão/boleto), revisão por loja e confirmar.
// Confirmar = POST /checkout (1 pedido por loja) + POST /{id}/pay em cada pedido (pagamento simulado).
import { apiFetch } from "./api.js";
import { escapeHtml as e, formatPrice, showError, showState, toast, withBusy } from "./ui.js";
import { requireLogin } from "./guard.js";
import { setCartBadge } from "./cart.js";
import { addressText, isDefaultAddress, setupAddressForm } from "./address-form.js";

const state = document.getElementById("checkout_state");
const page = document.getElementById("checkout_page");
const addressList = document.getElementById("address_list");
const formBox = document.getElementById("address_form_box");
const newAddressToggle = document.getElementById("new_address_toggle");
const installmentsBox = document.getElementById("installments_box");
const installments = document.getElementById("installments");
const errorBox = document.getElementById("checkout_error");
const confirmButton = document.getElementById("confirm_button");

let cart = null;
let addresses = [];

const MESSAGES = {
    "Cart is empty": "Seu carrinho está vazio.",
    "Installments are only allowed for CARD": "Parcelamento só no cartão.",
};

function checkoutMessage(error) {
    const msg = error?.body?.message || "";
    if (MESSAGES[msg]) return MESSAGES[msg];
    if (msg.startsWith("Some items are unavailable")) {
        return "Alguns itens ficaram indisponíveis. Ajuste o carrinho e tente de novo.";
    }
    if (msg.startsWith("Not enough stock")) return "Um produto acabou de esgotar. Ajuste o carrinho e tente de novo.";
    if (error?.status === 404) return "Escolha um endereço válido.";
    return "Não foi possível fechar o pedido. Tente de novo.";
}

// ---------------------------------------------------------------- endereço

const addressForm = setupAddressForm(formBox, {
    submitLabel: "Usar este endereço",
    onCancel: () => toggleForm(false),
    async onSubmit(data, button) {
        try {
            const created = await withBusy(button, apiFetch("/api/me/addresses", { method: "POST", body: data }));
            addresses.push(created);
            renderAddresses(created.id);
            toggleForm(false);
            toast("Endereço salvo.");
        } catch (error) {
            if (error.status !== 401) addressForm.showErrors(error);
        }
    },
});

function toggleForm(show) {
    formBox.hidden = !show;
    newAddressToggle.hidden = show;
    if (show) {
        addressForm.fill(null);
        addressForm.focus();
    }
}

newAddressToggle.addEventListener("click", () => toggleForm(true));

function renderAddresses(selectedId) {
    if (addresses.length === 0) {
        addressList.innerHTML = `<p class="texto-suave mb-2">Você ainda não tem endereço cadastrado.</p>`;
        toggleForm(true);
        return;
    }
    const chosen = selectedId ?? (addresses.find(isDefaultAddress) ?? addresses[0]).id;
    addressList.innerHTML = addresses.map(a => `
        <label class="opcao">
            <input type="radio" name="address" value="${e(a.id)}" ${a.id === chosen ? "checked" : ""}>
            <span>
                <strong>${e(a.label || "Endereço")}${isDefaultAddress(a) ? ' <small class="selo-padrao">Padrão</small>' : ""}</strong>
                <small>${e(addressText(a))}</small>
            </span>
        </label>`).join("");
}

// ---------------------------------------------------------------- pagamento

function paymentMethod() {
    return document.querySelector("input[name=payment]:checked").value;
}

function renderInstallments() {
    const total = Number(cart?.subtotal ?? 0);
    installments.innerHTML = Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        return `<option value="${n}">${n}x de ${formatPrice(total / n)} sem juros</option>`;
    }).join("");
}

document.querySelectorAll("input[name=payment]").forEach(radio => radio.addEventListener("change", () => {
    installmentsBox.hidden = paymentMethod() !== "CARD";
}));

// ---------------------------------------------------------------- revisão

function renderReview() {
    const available = cart.items.filter(i => i.available);
    const unavailable = cart.items.length - available.length;

    // 1 pedido por loja: mostra agrupado do jeito que vai virar pedido
    const byStore = new Map();
    for (const item of available) {
        if (!byStore.has(item.sellerStoreName)) byStore.set(item.sellerStoreName, []);
        byStore.get(item.sellerStoreName).push(item);
    }
    const groups = [...byStore.entries()].map(([store, items]) => `
        <div class="revisao-loja">
            <p class="revisao-loja-nome"><i class="bi bi-shop"></i> ${e(store)}</p>
            ${items.map(i => `
                <div class="revisao-item">
                    <span>${i.quantity}× ${e(i.name)}</span>
                    <span>${formatPrice(i.lineTotal)}</span>
                </div>`).join("")}
        </div>`).join("");

    document.getElementById("review").innerHTML = `
        ${byStore.size > 1 ? `<p class="texto-suave">Seus itens são de ${byStore.size} lojas: serão ${byStore.size} pedidos, cada loja envia o seu.</p>` : ""}
        ${groups}
        ${unavailable ? `<p class="aviso-estoque"><i class="bi bi-exclamation-triangle"></i> ${unavailable} item(ns) indisponível(is) não entram no pedido. <a href="/carrinho.html">Ajustar carrinho</a></p>` : ""}`;

    document.getElementById("summary_items").textContent =
        `${cart.totalItems} ${cart.totalItems === 1 ? "item" : "itens"}`;
    document.getElementById("summary_subtotal").textContent = formatPrice(cart.subtotal);
    document.getElementById("summary_total").textContent = formatPrice(cart.subtotal);
    confirmButton.disabled = cart.totalItems === 0 || unavailable > 0;
}

// ---------------------------------------------------------------- confirmar

confirmButton.addEventListener("click", async () => {
    errorBox.hidden = true;
    const address = document.querySelector("input[name=address]:checked");
    if (!address) {
        errorBox.textContent = "Escolha ou cadastre um endereço de entrega.";
        errorBox.hidden = false;
        return;
    }
    const method = paymentMethod();
    const body = {
        addressId: address.value,
        paymentMethod: method,
        installments: method === "CARD" ? Number(installments.value) : 1,
    };

    try {
        await withBusy(confirmButton, (async () => {
            const orders = await apiFetch("/api/me/orders/checkout", { method: "POST", body });
            // pedidos criados: daqui pra frente sempre vai para "Meus pedidos".
            // pagamento simulado: confirma cada pedido na hora; se algum falhar, ele fica
            // "Aguardando pagamento" e dá para pagar pela tela do pedido.
            let allPaid = true;
            for (const order of orders) {
                try {
                    await apiFetch(`/api/me/orders/${order.id}/pay`, { method: "POST" });
                } catch {
                    allPaid = false;
                }
            }
            setCartBadge(0);
            location.href = allPaid ? "/pedidos.html?novo=1" : "/pedidos.html?novo=pendente";
            await new Promise(() => {}); // segura o botão ocupado até a navegação
        })());
    } catch (error) {
        if (error.status === 401) return;
        errorBox.textContent = checkoutMessage(error);
        errorBox.hidden = false;
    }
});

// ---------------------------------------------------------------- carga

async function load() {
    showState(state, { icon: "bi-hourglass-split", message: "Carregando…" });
    page.hidden = true;
    try {
        const [cartData, addressPage] = await Promise.all([
            apiFetch("/api/me/cart"),
            apiFetch("/api/me/addresses?size=50"),
        ]);
        cart = cartData;
        addresses = addressPage.content;

        if (cart.items.length === 0) {
            showState(state, {
                icon: "bi-cart",
                message: "Seu carrinho está vazio.",
                action: { label: "Ver produtos", href: "/todos-produtos.html" },
            });
            return;
        }
        state.innerHTML = "";
        page.hidden = false;
        renderAddresses();
        renderInstallments();
        renderReview();
    } catch (error) {
        if (error.status === 401) return;
        console.error("Erro ao carregar checkout:", error);
        showError(state, load);
    }
}

await requireLogin();
load();
