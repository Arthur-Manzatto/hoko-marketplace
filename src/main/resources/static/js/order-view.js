// Detalhe de pedido (comprador em pedido.html e vendedor em vendas.html):
// linha do tempo, itens, entrega e pagamento. As ações (botões) ficam com cada página.
import { escapeHtml as e, formatDate, formatPrice, PAYMENT_METHOD, statusBadge } from "./ui.js";

const STEPS = [
    ["PENDING", "Pedido feito", o => o.createdAt],
    ["PAID", "Pagamento aprovado", o => o.payment?.paidAt],
    ["SHIPPED", "Enviado", o => o.shippedAt],
    ["DELIVERED", "Entregue", o => o.deliveredAt],
];

function timeline(order) {
    if (order.status === "CANCELED") {
        return `<div class="linha-tempo cancelada"><i class="bi bi-x-circle-fill"></i> Pedido cancelado
            ${order.payment?.status === "REFUNDED" ? "· valor estornado" : ""}</div>`;
    }
    const reached = STEPS.findIndex(([s]) => s === order.status);
    return `<ol class="linha-tempo">${STEPS.map(([, label, date], i) => `
        <li class="${i <= reached ? "feito" : ""}">
            <span class="ponto"></span>
            <span class="rotulo">${label}</span>
            <small>${i <= reached && date(order) ? e(formatDate(date(order), true)) : ""}</small>
        </li>`).join("")}</ol>`;
}

export function orderDetailHtml(order, { role = "buyer" } = {}) {
    const a = order.shippingAddress;
    const p = order.payment;
    const items = order.items.map(item => {
        const img = item.imageUrl ? `<img src="${e(item.imageUrl)}" alt="" loading="lazy" onerror="this.remove()">` : "";
        const name = item.productSlug
            ? `<a class="lista-nome" href="/produtos.html?slug=${encodeURIComponent(item.productSlug)}">${e(item.productName)}</a>`
            : `<span class="lista-nome">${e(item.productName)}</span>`;
        return `
            <div class="lista-item">
                <span class="lista-foto"><i class="bi bi-image"></i>${img}</span>
                <div class="lista-info">${name}<span class="texto-suave">${item.quantity}× ${formatPrice(item.unitPrice)}</span></div>
                <div class="lista-preco">${formatPrice(item.lineTotal)}</div>
            </div>`;
    }).join("");

    const who = role === "seller"
        ? `<p class="mb-1"><strong>Comprador:</strong> ${e(order.buyerName ?? "")}</p>`
        : `<p class="mb-1"><strong>Loja:</strong> <a href="/loja.html?slug=${encodeURIComponent(order.sellerSlug)}">${e(order.sellerStoreName)}</a></p>`;

    return `
        <div class="pedido-cabecalho d-flex flex-wrap justify-content-between align-items-center">
            <div>
                <p class="texto-suave mb-1">Pedido #${e(order.id.slice(0, 8).toUpperCase())} · ${e(formatDate(order.createdAt, true))}</p>
                ${who}
            </div>
            ${statusBadge(order.status)}
        </div>
        ${timeline(order)}
        ${order.trackingCode ? `<p class="rastreio"><i class="bi bi-truck"></i> Código de rastreio: <strong>${e(order.trackingCode)}</strong></p>` : ""}
        <div class="row">
            <div class="col-12 col-lg-7 mb-3">
                <h3 class="subtitulo">Itens</h3>
                <div class="lista-compacta">${items}</div>
            </div>
            <div class="col-12 col-lg-5">
                <h3 class="subtitulo">Entrega</h3>
                <p class="texto-suave">${e(a.street)}, ${e(a.number)}${a.complement ? ` - ${e(a.complement)}` : ""}<br>
                    ${e(a.neighborhood)} · ${e(a.city)}/${e(a.state)}<br>CEP ${e(a.zipCode)}</p>
                <h3 class="subtitulo">Pagamento</h3>
                <p class="texto-suave mb-1">${e(PAYMENT_METHOD[p?.method] ?? p?.method ?? "")}${p?.installments > 1 ? ` em ${p.installments}x` : ""} ${p ? statusBadge(p.status, "payment") : ""}</p>
                ${p?.paidAt ? `<p class="texto-suave mb-1">Pago em ${e(formatDate(p.paidAt, true))}</p>` : ""}
                <div class="resumo-linha mt-3"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
                <div class="resumo-linha"><span>Frete</span><span class="texto-verde">${Number(order.shippingCost) ? formatPrice(order.shippingCost) : "Grátis"}</span></div>
                <div class="resumo-linha resumo-total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
            </div>
        </div>`;
}
