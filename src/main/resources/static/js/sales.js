// vendas.html: pedidos recebidos pela loja. Abre o detalhe na própria lista e
// permite enviar (com rastreio opcional), marcar entregue e cancelar.
import { apiFetch } from "./api.js";
import {
    escapeHtml as e, formatDate, formatPrice, showError, showState, skeletonRows, statusBadge, toast, withBusy,
} from "./ui.js";
import { requireLogin } from "./guard.js";
import { orderDetailHtml } from "./order-view.js";

const list = document.getElementById("sale_list");
const tabs = document.getElementById("sale_tabs");
const moreButton = document.getElementById("load_more");

let status = "PAID";
let page = 0;

function saleRow(o) {
    return `
        <div class="venda" data-id="${e(o.id)}">
            <button class="lista-item venda-resumo" type="button" aria-expanded="false">
                <div class="lista-icone"><i class="bi bi-receipt"></i></div>
                <div class="lista-info">
                    <span class="lista-nome">${e(o.buyerName)}</span>
                    <span class="texto-suave">#${e(o.id.slice(0, 8).toUpperCase())} · ${formatDate(o.createdAt, true)} · ${o.itemCount} ${o.itemCount === 1 ? "item" : "itens"}</span>
                </div>
                <div class="pedido-status">${statusBadge(o.status)}</div>
                <div class="lista-preco">${formatPrice(o.total)}</div>
                <i class="bi bi-chevron-down texto-suave" aria-hidden="true"></i>
            </button>
            <div class="venda-detalhe" hidden></div>
        </div>`;
}

function actionsHtml(order) {
    const s = order.status;
    return `
        <div class="acoes-pedido">
            ${s === "PAID" ? `
                <form class="enviar-form d-flex flex-wrap" data-ship>
                    <input class="form-control" name="trackingCode" maxlength="40" pattern="[A-Za-z0-9-]*"
                        placeholder="Código de rastreio (opcional)" aria-label="Código de rastreio">
                    <button class="btn btn-custom" type="submit"><i class="bi bi-truck"></i> Marcar como enviado</button>
                </form>` : ""}
            ${s === "SHIPPED" ? `<button class="btn btn-custom" type="button" data-deliver><i class="bi bi-check2-circle"></i> Marcar como entregue</button>` : ""}
            ${s === "PENDING" || s === "PAID" ? `<button class="btn btn-outline-danger" type="button" data-cancel>Cancelar pedido</button>` : ""}
        </div>`;
}

async function openDetail(card) {
    const box = card.querySelector(".venda-detalhe");
    const toggle = card.querySelector(".venda-resumo");
    if (!box.hidden) {
        box.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        return;
    }
    box.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    box.innerHTML = skeletonRows(2);
    try {
        renderDetail(card, await apiFetch(`/api/me/seller/orders/${card.dataset.id}`));
    } catch (error) {
        if (error.status !== 401) showError(box, () => { box.hidden = true; openDetail(card); });
    }
}

function renderDetail(card, order) {
    card.querySelector(".pedido-status").innerHTML = statusBadge(order.status);
    const box = card.querySelector(".venda-detalhe");
    box.innerHTML = orderDetailHtml(order, { role: "seller" }) + actionsHtml(order);

    box.querySelector("[data-ship]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const code = event.currentTarget.trackingCode.value.trim();
        if (code && !/^[A-Za-z0-9-]+$/.test(code)) return toast("Rastreio: só letras, números e hífen.", "erro");
        act(card, event.currentTarget.querySelector("button"), "ship", code ? { trackingCode: code } : undefined, "Pedido marcado como enviado.");
    });
    box.querySelector("[data-deliver]")?.addEventListener("click", (event) =>
        act(card, event.currentTarget, "deliver", undefined, "Pedido marcado como entregue."));
    box.querySelector("[data-cancel]")?.addEventListener("click", (event) => {
        if (confirm("Cancelar este pedido? O estoque volta e o comprador é estornado.")) {
            act(card, event.currentTarget, "cancel", undefined, "Pedido cancelado.");
        }
    });
}

async function act(card, button, action, body, message) {
    try {
        const order = await withBusy(button,
            apiFetch(`/api/me/seller/orders/${card.dataset.id}/${action}`, { method: "POST", body }));
        renderDetail(card, order);
        toast(message);
    } catch (error) {
        if (error.status === 401) return;
        toast(error.status === 422 ? "O pedido mudou de status. Atualize a lista." : "Não foi possível concluir.", "erro");
    }
}

list.addEventListener("click", (event) => {
    const toggle = event.target.closest(".venda-resumo");
    if (toggle) openDetail(toggle.closest(".venda"));
});

function query(pageNumber) {
    const q = new URLSearchParams({ page: pageNumber, size: 10, sort: "createdAt,desc" });
    if (status) q.set("status", status);
    return q;
}

async function load() {
    page = 0;
    moreButton.hidden = true;
    list.innerHTML = skeletonRows(4);
    try {
        const result = await apiFetch(`/api/me/seller/orders?${query(0)}`);
        if (result.content.length === 0) {
            showState(list, { icon: "bi-inbox",
                message: status === "PAID" ? "Nada para despachar agora." : "Nenhuma venda aqui ainda." });
            return;
        }
        list.innerHTML = result.content.map(saleRow).join("");
        moreButton.hidden = result.last;
    } catch (error) {
        if (error.status === 401) return;
        if (error.status === 404) return location.replace("/vender.html"); // sem loja
        console.error("Erro ao carregar vendas:", error);
        showError(list, load);
    }
}

moreButton.addEventListener("click", async () => {
    moreButton.disabled = true;
    try {
        const result = await apiFetch(`/api/me/seller/orders?${query(page + 1)}`);
        page += 1;
        list.insertAdjacentHTML("beforeend", result.content.map(saleRow).join(""));
        moreButton.hidden = result.last;
    } finally {
        moreButton.disabled = false;
    }
});

tabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-status]");
    if (!tab) return;
    tabs.querySelectorAll(".aba").forEach(t => t.classList.toggle("ativa", t === tab));
    status = tab.dataset.status;
    load();
});

await requireLogin();
load();
