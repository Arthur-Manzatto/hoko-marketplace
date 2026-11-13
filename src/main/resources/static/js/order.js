// pedido.html?id= : detalhe do pedido do comprador, com "Pagar" (pendente) e "Cancelar" (antes do envio).
import { apiFetch } from "./api.js";
import { showError, showState, skeletonRows, toast, withBusy } from "./ui.js";
import { requireLogin } from "./guard.js";
import { orderDetailHtml } from "./order-view.js";

const id = new URLSearchParams(location.search).get("id");
const view = document.getElementById("order_view");

function notFound() {
    document.title = "Pedido não encontrado | Hoko";
    showState(view, {
        icon: "bi-search",
        message: "Pedido não encontrado.",
        action: { label: "Ver meus pedidos", href: "/pedidos.html" },
    });
}

function render(order) {
    const code = order.id.slice(0, 8).toUpperCase();
    document.title = `Pedido #${code} | Hoko`;
    document.getElementById("order_crumb").textContent = `Pedido #${code}`;

    const canPay = order.status === "PENDING";
    const canCancel = order.status === "PENDING" || order.status === "PAID";
    view.innerHTML = `
        <div class="cartao">
            ${orderDetailHtml(order, { role: "buyer" })}
            ${canPay || canCancel ? `
                <div class="acoes-pedido d-flex flex-wrap justify-content-end">
                    ${canCancel ? `<button class="btn btn-outline-danger" type="button" data-cancel>Cancelar pedido</button>` : ""}
                    ${canPay ? `<button class="btn btn-custom" type="button" data-pay>Pagar agora</button>` : ""}
                </div>` : ""}
        </div>`;

    view.querySelector("[data-pay]")?.addEventListener("click", (event) =>
        act(event.currentTarget, "pay", "Pagamento confirmado."));
    view.querySelector("[data-cancel]")?.addEventListener("click", (event) => {
        if (confirm("Cancelar este pedido? O valor pago é estornado.")) act(event.currentTarget, "cancel", "Pedido cancelado.");
    });
}

async function act(button, action, message) {
    try {
        const order = await withBusy(button, apiFetch(`/api/me/orders/${id}/${action}`, { method: "POST" }));
        render(order);
        toast(message);
    } catch (error) {
        if (error.status === 401) return;
        toast(error.status === 422 ? "Este pedido não permite mais essa ação." : "Não foi possível concluir.", "erro");
        load();
    }
}

async function load() {
    if (!id) return notFound();
    view.innerHTML = `<div class="cartao">${skeletonRows(3)}</div>`;
    try {
        render(await apiFetch(`/api/me/orders/${encodeURIComponent(id)}`));
    } catch (error) {
        if (error.status === 401) return;
        if (error.status === 404 || error.status === 400) return notFound();
        console.error("Erro ao carregar pedido:", error);
        showError(view, load);
    }
}

await requireLogin();
load();
