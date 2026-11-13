// relatorios.html: desempenho da loja, calculado no navegador a partir dos pedidos reais
// (GET /api/me/seller/orders, todas as páginas). Gráficos em CSS puro, sem biblioteca:
// cada gráfico tem uma série só (um tom de azul, sem legenda), tooltip no hover/foco e uma tabela.
import { apiFetch } from "./api.js";
import { escapeHtml as e, formatPrice, orderStatusLabel, showError, showState } from "./ui.js";
import { requireLogin } from "./guard.js";

const MONTHS = 6;
const PAID = ["PAID", "SHIPPED", "DELIVERED"];
const STATUS_ORDER = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELED"];
const STATUS_CSS = { PENDING: "pendente", PAID: "pago", SHIPPED: "enviado", DELIVERED: "entregue", CANCELED: "cancelado" };

const body = document.getElementById("report_body");
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const monthFull = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

async function fetchAllOrders() {
    const all = [];
    for (let page = 0; page < 50; page++) {
        const result = await apiFetch(`/api/me/seller/orders?page=${page}&size=100&sort=createdAt,desc`);
        all.push(...result.content);
        if (result.last) break;
    }
    return all;
}

/** Últimos 6 meses (o atual incluído), do mais antigo para o mais novo. */
function lastMonths() {
    const now = new Date();
    return Array.from({ length: MONTHS }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
        return { key: `${d.getFullYear()}-${d.getMonth()}`, date: d, revenue: 0, orders: 0 };
    });
}

function numberCard(icon, tone, value, label) {
    return `
        <div class="col-6 col-lg-3 mb-4">
            <div class="numero-cartao">
                <span class="numero-icone ${tone}"><i class="bi ${icon}" aria-hidden="true"></i></span>
                <span class="numero-valor">${value}</span>
                <span class="numero-rotulo">${label}</span>
            </div>
        </div>`;
}

/** Barras verticais de uma série. format: valor -> texto. */
function barChart(months, field, format) {
    const max = Math.max(...months.map(m => m[field]), 0);
    if (max === 0) return `<p class="grafico-vazio">Nada nos últimos ${MONTHS} meses.</p>`;
    return `
        <div class="grafico-barras" role="img"
            aria-label="${e(months.map(m => `${monthFull.format(m.date)}: ${format(m[field])}`).join("; "))}">
            ${months.map(m => `
                <div class="grafico-coluna" tabindex="0">
                    <span class="grafico-dica">${e(monthFull.format(m.date))}<strong>${e(format(m[field]))}</strong></span>
                    <span class="grafico-barra" style="height:${Math.max(m[field] / max * 100, m[field] ? 2 : 0)}%"></span>
                    <span class="grafico-mes">${e(monthName.format(m.date).replace(".", ""))}</span>
                </div>`).join("")}
        </div>`;
}

function statusBars(orders) {
    const total = orders.length;
    return STATUS_ORDER.map(s => {
        const n = orders.filter(o => o.status === s).length;
        const pct = total ? Math.round(n / total * 100) : 0;
        return `
            <div class="status-linha">
                <div class="status-linha-topo">
                    <span class="status-selo status-${STATUS_CSS[s]}">${e(orderStatusLabel(s))}</span>
                    <span class="texto-suave">${n} · ${pct}%</span>
                </div>
                <div class="status-trilho"><span class="status-${STATUS_CSS[s]}-barra" style="width:${pct}%"></span></div>
            </div>`;
    }).join("");
}

function table(months) {
    return `
        <thead><tr><th>Mês</th><th class="text-right">Pedidos</th><th class="text-right">Faturamento</th></tr></thead>
        <tbody>${[...months].reverse().map(m => `
            <tr><td>${e(monthFull.format(m.date))}</td><td class="text-right">${m.orders}</td><td class="text-right">${formatPrice(m.revenue)}</td></tr>`).join("")}
        </tbody>`;
}

async function load() {
    document.getElementById("report_numbers").innerHTML = Array.from({ length: 4 }, () => `
        <div class="col-6 col-lg-3 mb-4"><div class="numero-cartao">
            <span class="skeleton numero-icone"></span><span class="skeleton skeleton-title w-75"></span>
            <span class="skeleton skeleton-text w-50"></span></div></div>`).join("");
    try {
        const orders = await fetchAllOrders();
        if (orders.length === 0) {
            showState(body, {
                icon: "bi-bar-chart",
                message: "Sem vendas ainda",
                text: "Quando sua loja receber pedidos, os gráficos aparecem aqui.",
                action: { label: "Cadastrar produto", href: "/produto-form.html" },
            });
            return;
        }

        const months = lastMonths();
        const byKey = new Map(months.map(m => [m.key, m]));
        for (const o of orders) {
            const d = new Date(o.createdAt);
            const m = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
            if (!m) continue;
            m.orders += 1;
            if (PAID.includes(o.status)) m.revenue += Number(o.total);
        }

        const paid = orders.filter(o => PAID.includes(o.status));
        const revenue = paid.reduce((sum, o) => sum + Number(o.total), 0);
        const canceled = orders.filter(o => o.status === "CANCELED").length;

        document.getElementById("report_numbers").innerHTML =
            numberCard("bi-cash-stack", "", formatPrice(revenue), "Faturamento total") +
            numberCard("bi-bag-check", "verde", paid.length, "Pedidos pagos") +
            numberCard("bi-receipt", "laranja", formatPrice(paid.length ? revenue / paid.length : 0), "Ticket médio") +
            numberCard("bi-x-circle", "vermelho", canceled, "Cancelados");

        document.getElementById("chart_revenue").innerHTML = barChart(months, "revenue", formatPrice);
        document.getElementById("chart_orders").innerHTML =
            barChart(months, "orders", n => `${n} ${n === 1 ? "pedido" : "pedidos"}`);
        document.getElementById("chart_status").innerHTML = statusBars(orders);
        document.getElementById("report_table").innerHTML = table(months);
    } catch (error) {
        if (error.status === 401) return;
        if (error.status === 404) return location.replace("/vender.html"); // sem loja
        console.error("Erro ao carregar relatórios:", error);
        showError(body, () => location.reload());
    }
}

await requireLogin();
load();
