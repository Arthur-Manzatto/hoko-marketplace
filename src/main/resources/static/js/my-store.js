// minha-loja.html: painel do vendedor com 3 abas.
//   Visão geral  -> GET /api/me/seller/orders/summary
//   Produtos     -> GET /api/me/seller/products, estoque rápido (PATCH /stock), editar, excluir
//   Configurações-> PUT/DELETE /api/me/seller
// Sem loja (404) -> vender.html
import { apiFetch } from "./api.js";
import {
    escapeHtml as e, clearFieldErrors, formatDate, formatPrice, showError, showFieldErrors, showState,
    skeletonRows, statusBadge, toast, withBusy,
} from "./ui.js";
import { requireLogin } from "./guard.js";
import { forgetMe } from "./sidebar.js";
import { onlyDigits, setupDocumentField } from "./br.js";

const tabs = document.getElementById("store_tabs");
const productsBox = document.getElementById("my_products");
const moreButton = document.getElementById("load_more");
const storeForm = document.getElementById("store_form");

const STORE_ERRORS = {
    "Document must contain 11 or 14 digits": "CPF (11 números) ou CNPJ (14 números).",
    "Invalid CPF or CNPJ": "CPF ou CNPJ inválido. Confira os números.",
    "A store with this document already exists": "Já existe uma loja com esse documento.",
    "A store with this slug already exists": "Já existe uma loja com esse nome.",
    "size must be between 3 and 80": "Entre 3 e 80 caracteres.",
};

let store = null;
let page = 0;
const loaded = new Set();

// ---------------------------------------------------------------- abas

function openTab(name) {
    tabs.querySelectorAll(".aba").forEach(t => t.classList.toggle("ativa", t.dataset.tab === name));
    document.querySelectorAll("[data-panel]").forEach(p => { p.hidden = p.dataset.panel !== name; });
    history.replaceState(null, "", `${location.pathname}?aba=${name}`);
    if (!loaded.has(name)) {
        loaded.add(name);
        ({ overview: loadOverview, products: loadProducts, settings: fillSettings })[name]();
    }
}

tabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) openTab(tab.dataset.tab);
});

// "Editar loja" (banner) e "Gerenciar" (estoque baixo)
document.querySelectorAll("[data-goto-tab]").forEach(button => button.addEventListener("click", () => {
    openTab(button.dataset.gotoTab);
    tabs.scrollIntoView({ behavior: "smooth", block: "start" });
}));

// ---------------------------------------------------------- visão geral

function summaryCard(icon, label, value, extra = "", tone = "") {
    return `
        <div class="col-6 col-lg-3 mb-4">
            <div class="numero-cartao">
                <span class="numero-icone ${tone}"><i class="bi ${icon}" aria-hidden="true"></i></span>
                <span class="numero-valor">${value}</span>
                <span class="numero-rotulo">${label}</span>
                ${extra}
            </div>
        </div>`;
}

let chipProducts = null;
let chipOrders = null;

function setChips() {
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    document.getElementById("store_chips").innerHTML = `
        ${chipProducts == null ? "" : `<span class="banner-chip"><i class="bi bi-box-seam"></i> ${plural(chipProducts, "produto", "produtos")}</span>`}
        ${chipOrders == null ? "" : `<span class="banner-chip"><i class="bi bi-receipt"></i> ${plural(chipOrders, "pedido", "pedidos")}</span>`}
        <span class="banner-chip laranja"><i class="bi bi-truck"></i> Frete grátis</span>`;
}

async function loadRecentOrders() {
    const box = document.getElementById("recent_orders");
    box.innerHTML = skeletonRows(3);
    try {
        const page = await apiFetch("/api/me/seller/orders?size=5&sort=createdAt,desc");
        if (page.content.length === 0) {
            box.innerHTML = `<p class="texto-suave py-3 mb-0">Nenhum pedido ainda. Eles aparecem aqui assim que alguém comprar.</p>`;
            return;
        }
        box.innerHTML = page.content.map(o => `
            <a class="mini-linha" href="/vendas.html">
                <span class="mini-linha-num">#${e(o.id.slice(0, 4).toUpperCase())}</span>
                <span class="mini-linha-info"><strong>${e(o.buyerName)}</strong><small>${e(formatDate(o.createdAt, true))}</small></span>
                <span class="mini-linha-lado"><strong>${formatPrice(o.total)}</strong>${statusBadge(o.status)}</span>
            </a>`).join("");
    } catch (error) {
        if (error.status !== 401) showError(box, loadRecentOrders);
    }
}

async function loadLowStock() {
    const box = document.getElementById("low_stock");
    box.innerHTML = skeletonRows(3);
    try {
        const page = await apiFetch("/api/me/seller/products?size=5&sort=quantity,asc");
        chipProducts = page.totalElements;
        setChips();
        if (page.content.length === 0) {
            box.innerHTML = `<p class="texto-suave py-3 mb-0">Você ainda não cadastrou produtos. <a href="/produto-form.html">Cadastrar o primeiro</a></p>`;
            return;
        }
        const ref = Math.max(10, ...page.content.map(p => p.quantity));
        box.innerHTML = page.content.map(p => `
            <a class="estoque-linha" href="/produto-form.html?id=${encodeURIComponent(p.id)}">
                <span class="estoque-linha-topo">
                    <span class="estoque-linha-nome">${e(p.name)}</span>
                    <span class="${p.quantity === 0 ? "texto-perigo" : p.quantity <= 3 ? "texto-laranja" : "texto-suave"}">
                        ${p.quantity === 0 ? "Esgotado" : `${p.quantity} em estoque`}</span>
                </span>
                <span class="estoque-trilho"><span class="${p.quantity <= 3 ? "baixo" : ""}"
                    style="width:${Math.min(100, p.quantity / ref * 100)}%"></span></span>
            </a>`).join("");
    } catch (error) {
        if (error.status !== 401) showError(box, loadLowStock);
    }
}

function loadOverview() {
    loadSummary();
    loadRecentOrders();
    loadLowStock();
}

async function loadSummary() {
    const box = document.getElementById("summary_cards");
    box.innerHTML = Array.from({ length: 4 }, () =>
        `<div class="col-6 col-lg-3 mb-4"><div class="numero-cartao"><span class="skeleton numero-icone"></span><span class="skeleton skeleton-title"></span><span class="skeleton skeleton-text w-50"></span></div></div>`).join("");
    try {
        const s = await apiFetch("/api/me/seller/orders/summary");
        const by = s.ordersByStatus;
        const total = Object.values(by).reduce((a, b) => a + b, 0);
        chipOrders = total;
        setChips();
        box.innerHTML =
            summaryCard("bi-cash-stack", "Faturamento (pagos)", formatPrice(s.revenue)) +
            summaryCard("bi-hourglass-split", "Aguardando pagamento", formatPrice(s.pendingRevenue), "", "laranja") +
            summaryCard("bi-box-seam", "A despachar", s.toShip,
                s.toShip ? `<a class="link-pequeno mt-1" href="/vendas.html">Ver vendas →</a>` : "", "verde") +
            summaryCard("bi-receipt", "Pedidos no total", total,
                `<small class="numero-rotulo">${by.DELIVERED ?? 0} entregues · ${by.SHIPPED ?? 0} enviados · ${by.CANCELED ?? 0} cancelados</small>`);
    } catch (error) {
        if (error.status === 401) return;
        showError(box, loadSummary);
    }
}

// ------------------------------------------------------------- produtos

function productRow(p) {
    const img = p.coverImageUrl ? `<img src="${e(p.coverImageUrl)}" alt="" loading="lazy" onerror="this.remove()">` : "";
    return `
        <div class="lista-item meu-produto" data-id="${e(p.id)}">
            <a class="lista-foto" href="/produtos.html?slug=${encodeURIComponent(p.slug)}"><i class="bi bi-image"></i>${img}</a>
            <div class="lista-info">
                <a class="lista-nome" href="/produtos.html?slug=${encodeURIComponent(p.slug)}">${e(p.name)}</a>
                <span class="texto-suave">${e(p.categoryName)} · ${formatPrice(p.price)}</span>
            </div>
            <label class="estoque-rapido">
                <span class="texto-suave">Estoque</span>
                <input class="form-control form-control-sm" type="number" min="0" step="1" value="${p.quantity}" data-stock aria-label="Estoque de ${e(p.name)}">
            </label>
            <div class="endereco-acoes">
                <a class="btn btn-link btn-sm" href="/produto-form.html?id=${encodeURIComponent(p.id)}">Editar</a>
                <button class="btn btn-link btn-sm texto-perigo" type="button" data-delete>Excluir</button>
            </div>
        </div>`;
}

function query(pageNumber) {
    return new URLSearchParams({ page: pageNumber, size: 20, sort: "createdAt,desc" });
}

async function loadProducts() {
    page = 0;
    moreButton.hidden = true;
    productsBox.innerHTML = skeletonRows(4);
    try {
        const result = await apiFetch(`/api/me/seller/products?${query(0)}`);
        document.getElementById("my_products_count").textContent =
            result.totalElements === 1 ? "1 produto" : `${result.totalElements} produtos`;
        if (result.content.length === 0) {
            showState(productsBox, {
                icon: "bi-box-seam",
                message: "Você ainda não cadastrou produtos.",
                action: { label: "Cadastrar o primeiro", href: "/produto-form.html" },
            });
            return;
        }
        productsBox.innerHTML = result.content.map(productRow).join("");
        moreButton.hidden = result.last;
    } catch (error) {
        if (error.status === 401) return;
        showError(productsBox, loadProducts);
    }
}

moreButton.addEventListener("click", async () => {
    moreButton.disabled = true;
    try {
        const result = await apiFetch(`/api/me/seller/products?${query(page + 1)}`);
        page += 1;
        productsBox.insertAdjacentHTML("beforeend", result.content.map(productRow).join(""));
        moreButton.hidden = result.last;
    } finally {
        moreButton.disabled = false;
    }
});

// estoque: salva quando sai do campo (ou Enter)
productsBox.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-stock]");
    if (!input) return;
    const id = input.closest("[data-id]").dataset.id;
    const quantity = Math.max(0, Math.floor(Number(input.value) || 0));
    input.value = quantity;
    input.disabled = true;
    try {
        await apiFetch(`/api/me/seller/products/${id}/stock`, { method: "PATCH", body: { quantity } });
        toast("Estoque atualizado.");
    } catch (error) {
        if (error.status !== 401) toast("Não foi possível salvar o estoque.", "erro");
    } finally {
        input.disabled = false;
    }
});

productsBox.addEventListener("click", async (event) => {
    if (!event.target.closest("[data-delete]")) return;
    const row = event.target.closest("[data-id]");
    if (!confirm("Excluir este produto? Ele sai da vitrine.")) return;
    try {
        await apiFetch(`/api/me/seller/products/${row.dataset.id}`, { method: "DELETE" });
        row.remove();
        toast("Produto excluído.");
    } catch (error) {
        if (error.status !== 401) toast("Não foi possível excluir.", "erro");
    }
});

// -------------------------------------------------------- configurações

function fillSettings() {
    storeForm.elements.storeName.value = store.storeName;
    documentField.set(store.document);
}

// máscara de CPF/CNPJ + checagem dos dígitos verificadores
const documentField = setupDocumentField(storeForm.elements.document);

storeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(storeForm);
    // só confere o documento se ele mudou (lojas antigas podem ter um documento de teste)
    if (documentField.value() !== onlyDigits(store.document) && !documentField.validate()) return;
    const body = {
        storeName: storeForm.elements.storeName.value.trim(),
        document: documentField.value(),
    };
    try {
        store = await withBusy(storeForm.querySelector("[type=submit]"),
            apiFetch("/api/me/seller", { method: "PUT", body }));
        renderHeader();
        toast("Loja atualizada.");
    } catch (error) {
        if (error.status !== 401) showFieldErrors(storeForm, error, STORE_ERRORS);
    }
});

document.getElementById("close_store").addEventListener("click", async (event) => {
    if (!confirm("Fechar sua loja? Os produtos saem da vitrine.")) return;
    try {
        await withBusy(event.currentTarget, apiFetch("/api/me/seller", { method: "DELETE" }));
        forgetMe();
        location.href = "/conta.html";
    } catch (error) {
        if (error.status !== 401) toast("Não foi possível fechar a loja.", "erro");
    }
});

// ---------------------------------------------------------------- início

const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function renderHeader() {
    document.title = `${store.storeName} | Minha loja | Hoko`;
    document.getElementById("store_title").textContent = store.storeName;
    document.getElementById("store_since").textContent = `Na Hoko desde ${monthYear.format(new Date(store.createdAt))}`;
    setChips();
    const link = document.getElementById("store_public_link");
    link.href = `/loja.html?slug=${encodeURIComponent(store.slug)}`;
    link.hidden = false;
}

async function start() {
    try {
        store = await apiFetch("/api/me/seller");
    } catch (error) {
        if (error.status === 404) return location.replace("/vender.html");
        if (error.status === 401) return;
        showError(document.getElementById("summary_cards"), start);
        return;
    }
    renderHeader();
    if (new URLSearchParams(location.search).has("nova")) toast("Loja criada! Agora cadastre seus produtos.");
    const tab = new URLSearchParams(location.search).get("aba");
    openTab(["overview", "products", "settings"].includes(tab) ? tab : "overview");
}

await requireLogin();
start();
