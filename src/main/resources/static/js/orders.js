// pedidos.html: pedidos do comprador. Números no topo (um GET size=1 por status, usando totalElements),
// filtros em pílula com contador, pedidos em cards com "Detalhes" e "Pagar" (pendente) e "Carregar mais".
import { apiFetch } from "./api.js";
import {
    escapeHtml as e, formatDate, formatPrice, PAYMENT_METHOD, showError, showState, skeletonRows, statusBadge, toast, withBusy,
} from "./ui.js";
import { requireLogin } from "./guard.js";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELED"];

const list = document.getElementById("order_list");
const tabs = document.getElementById("order_tabs");
const moreButton = document.getElementById("load_more");
const banner = document.getElementById("new_order_banner");
const numbers = document.getElementById("order_numbers");

let status = "";
let page = 0;

const novo = new URLSearchParams(location.search).get("novo");
if (novo) {
    banner.hidden = false;
    if (novo === "pendente") {
        banner.classList.add("aviso-atencao");
        banner.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i> Pedido criado, mas o pagamento não foi confirmado. Clique em "Pagar" no pedido.`;
    }
    history.replaceState(null, "", location.pathname);
}

// ------------------------------------------------------------ números

function numberCard(icon, tone, value, label) {
    return `
        <div class="col-6 col-md-3 mb-4">
            <div class="numero-cartao text-center align-items-center">
                <span class="numero-icone ${tone}"><i class="bi ${icon}" aria-hidden="true"></i></span>
                <span class="numero-valor">${value}</span>
                <span class="numero-rotulo">${label}</span>
            </div>
        </div>`;
}

async function loadNumbers() {
    numbers.innerHTML = Array.from({ length: 4 }, () => `
        <div class="col-6 col-md-3 mb-4"><div class="numero-cartao align-items-center">
            <span class="skeleton numero-icone"></span><span class="skeleton skeleton-title w-25"></span>
            <span class="skeleton skeleton-text w-50"></span></div></div>`).join("");
    try {
        const totals = await Promise.all(["", ...STATUSES].map(s =>
            apiFetch(`/api/me/orders?size=1${s ? `&status=${s}` : ""}`).then(r => r.totalElements)));
        const count = Object.fromEntries(["", ...STATUSES].map((s, i) => [s, totals[i]]));
        numbers.innerHTML =
            numberCard("bi-box-seam", "", count[""], "Total de pedidos") +
            numberCard("bi-truck", "laranja", count.PAID + count.SHIPPED, "A caminho") +
            numberCard("bi-check2-circle", "verde", count.DELIVERED, "Entregues") +
            numberCard("bi-x-circle", "vermelho", count.CANCELED, "Cancelados");
        tabs.querySelectorAll("[data-count]").forEach(el => { el.textContent = count[el.dataset.count]; });
    } catch (error) {
        numbers.innerHTML = ""; // os números são extra; a lista abaixo continua funcionando
    }
}

// ------------------------------------------------------------ lista

function orderCard(o) {
    const href = `/pedido.html?id=${encodeURIComponent(o.id)}`;
    return `
        <article class="pedido-cartao" data-id="${e(o.id)}">
            <span class="pedido-cartao-icone"><i class="bi bi-bag" aria-hidden="true"></i></span>
            <div class="pedido-cartao-info">
                <p class="pedido-cartao-num">#${e(o.id.slice(0, 8).toUpperCase())}</p>
                <p class="pedido-cartao-loja">${e(o.sellerStoreName)} · ${o.itemCount} ${o.itemCount === 1 ? "item" : "itens"}</p>
                <p class="pedido-cartao-data">${e(formatDate(o.createdAt, true))} · ${e(PAYMENT_METHOD[o.paymentMethod] ?? "")}</p>
            </div>
            <div class="pedido-cartao-lado">
                ${statusBadge(o.status)}
                <strong class="pedido-cartao-total">${formatPrice(o.total)}</strong>
                <div class="pedido-cartao-acoes">
                    <a class="btn-mini" href="${href}">Detalhes</a>
                    ${o.status === "PENDING" ? `<button class="btn-mini laranja" type="button" data-pay>Pagar</button>` : ""}
                </div>
            </div>
        </article>`;
}

function query(pageNumber) {
    const q = new URLSearchParams({ page: pageNumber, size: 10, sort: "createdAt,desc" });
    if (status) q.set("status", status);
    return q;
}

async function load() {
    page = 0;
    moreButton.hidden = true;
    list.innerHTML = `<div class="cartao">${skeletonRows(4)}</div>`;
    try {
        const result = await apiFetch(`/api/me/orders?${query(0)}`);
        if (result.content.length === 0) {
            showState(list, status
                ? { icon: "bi-inbox", message: "Nenhum pedido encontrado", text: "Nada com esse status por enquanto." }
                : { icon: "bi-bag", message: "Você ainda não fez nenhum pedido",
                    text: "Quando comprar, você acompanha tudo por aqui.",
                    action: { label: "Ver produtos", href: "/todos-produtos.html" } });
            return;
        }
        list.innerHTML = result.content.map(orderCard).join("");
        moreButton.hidden = result.last;
    } catch (error) {
        if (error.status === 401) return;
        console.error("Erro ao carregar pedidos:", error);
        showError(list, load);
    }
}

moreButton.addEventListener("click", async () => {
    moreButton.disabled = true;
    try {
        const result = await apiFetch(`/api/me/orders?${query(page + 1)}`);
        page += 1;
        list.insertAdjacentHTML("beforeend", result.content.map(orderCard).join(""));
        moreButton.hidden = result.last;
    } finally {
        moreButton.disabled = false;
    }
});

// "Pagar" direto da lista (pagamento simulado)
list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-pay]");
    if (!button) return;
    const card = button.closest("[data-id]");
    try {
        const order = await withBusy(button, apiFetch(`/api/me/orders/${card.dataset.id}/pay`, { method: "POST" }));
        // o detalhe tem outro formato: converte para o do resumo
        card.outerHTML = orderCard({
            ...order,
            itemCount: (order.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
            paymentMethod: order.payment?.method,
        });
        toast("Pagamento confirmado.");
        loadNumbers();
    } catch (error) {
        if (error.status !== 401) toast("Não foi possível pagar agora. Abra o pedido e tente de novo.", "erro");
    }
});

tabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-status]");
    if (!tab) return;
    tabs.querySelectorAll(".pilula").forEach(t => t.classList.toggle("ativa", t === tab));
    status = tab.dataset.status;
    load();
});

await requireLogin();
loadNumbers();
load();
