// Página pública da loja: loja.html?slug=  (cabeçalho + produtos com os mesmos filtros da categoria)
import { getJson } from "./api.js";
import { escapeHtml as e, showContent, showError, showState } from "./ui.js";
import { setupProductFilters } from "./filters.js";

const slug = new URLSearchParams(location.search).get("slug");
const header = document.getElementById("store_header");
const productsBox = document.getElementById("store_products");

function notFound() {
    document.title = "Loja não encontrada | Hoko";
    productsBox.hidden = true;
    showState(header, {
        icon: "bi-shop",
        message: "Loja não encontrada",
        text: "Ela pode ter sido fechada pelo vendedor.",
        action: { label: "Voltar para a home", href: "/" },
    });
}

const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function renderHeader(store) {
    document.title = `${store.storeName} | Hoko`;
    document.getElementById("store_crumb").textContent = store.storeName;
    header.removeAttribute("aria-busy");
    showContent(header, `
        <span class="loja-banner-icone"><i class="bi bi-shop" aria-hidden="true"></i></span>
        <div class="flex-grow-1 min-w-0">
            <h1>${e(store.storeName)}</h1>
            <p>Na Hoko desde ${e(monthYear.format(new Date(store.createdAt)))}</p>
            <div class="banner-chips">
                <span class="banner-chip" id="store_total"><i class="bi bi-box-seam"></i> … produtos</span>
                <span class="banner-chip laranja"><i class="bi bi-truck"></i> Frete grátis</span>
            </div>
        </div>`);
}

function setTotal(total) {
    const chip = document.getElementById("store_total");
    if (chip && total != null) chip.innerHTML = `<i class="bi bi-box-seam"></i> ${total} ${total === 1 ? "produto" : "produtos"}`;
}

async function start() {
    if (!slug) return notFound();
    try {
        const store = await getJson(`/api/sellers/slug/${encodeURIComponent(slug)}`);
        renderHeader(store);
        const products = setupProductFilters({
            form: document.getElementById("product_filters"),
            grid: document.getElementById("product_section"),
            moreButton: document.getElementById("load_more"),
            onCount: setTotal,
            errorEl: document.getElementById("filters_error"),
            priceRoot: document.getElementById("price_range"),
            base: { sellerId: store.id },
        });
        await products.load();
    } catch (error) {
        if (error.status === 404) return notFound();
        console.error("Erro ao carregar loja:", error);
        showError(header, start);
    }
}

start();
