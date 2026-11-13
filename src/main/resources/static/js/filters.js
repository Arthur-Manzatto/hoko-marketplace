// Filtros + grade de produtos com "Carregar mais".
// Reaproveitável: categorias.html usa com base { categorySlug }, todos-produtos.html sem base,
// lancamentos.html com base { sort }. Campos do form (todos opcionais, pelo name):
//   search (hidden), categorySlug (select ou rádios), inStock (checkbox), sort (select ou rádios/pílulas)
//   + slider de preço.
// Os filtros ficam na URL, então F5, "voltar" e link compartilhado mantêm a tela.
import { getJson } from "./api.js";
import { showContent, showError, showSkeleton, showState } from "./ui.js";
import { productCard } from "./cards.js";
import { createPriceRange } from "./price-range.js";

const PAGE_SIZE = 12;
const SORTS = ["name,asc", "price,asc", "price,desc", "createdAt,desc"];
const URL_KEYS = ["search", "categorySlug", "minPrice", "maxPrice", "inStock", "sort"];

/**
 * onCount(total|null): chamado a cada busca (null enquanto carrega) — ex.: "Ver N produtos" da gaveta.
 * card: opções do productCard (ex.: { col } para mudar a coluna).
 */
export function setupProductFilters({
    form, grid, moreButton, countEl, errorEl, priceRoot, base = {}, onCount, card = {},
}) {
    let page = 0;
    let current = new URLSearchParams(); // filtros da última busca
    const price = priceRoot ? createPriceRange(priceRoot, { onChange: () => apply(false) }) : null;
    const field = (name) => form.elements.namedItem(name); // input, select ou RadioNodeList
    const defaultSort = base.sort ?? SORTS[0];
    const cards = (list) => list.map(p => productCard(p, card)).join("");

    // ---- URL <-> form
    function readUrl() {
        const url = new URLSearchParams(location.search);
        if (field("search")) field("search").value = url.get("search") || "";
        if (field("categorySlug")) field("categorySlug").value = url.get("categorySlug") || "";
        if (field("inStock")) field("inStock").checked = url.get("inStock") === "true";
        if (field("sort")) field("sort").value = SORTS.includes(url.get("sort")) ? url.get("sort") : defaultSort;
        return { minPrice: url.get("minPrice") || "", maxPrice: url.get("maxPrice") || "" };
    }

    /** O que define "o universo" de produtos (sem preço): muda os limites do slider. */
    function scope() {
        const q = new URLSearchParams(base);
        q.delete("sort");
        if (field("search")?.value.trim()) q.set("search", field("search").value.trim());
        if (field("categorySlug")?.value) q.set("categorySlug", field("categorySlug").value);
        if (field("inStock")?.checked) q.set("inStock", "true");
        return q;
    }

    /** Filtros da tela (o que vai para a URL). `priceOverride` = preço lido da URL antes do slider existir. */
    function readForm(priceOverride) {
        const f = scope();
        Object.keys(base).forEach(k => f.delete(k)); // a base não vai pra URL
        const { minPrice, maxPrice } = priceOverride ?? price?.getFilter() ?? {};
        if (minPrice) f.set("minPrice", minPrice);
        if (maxPrice) f.set("maxPrice", maxPrice);
        if (field("sort") && field("sort").value !== defaultSort) f.set("sort", field("sort").value);
        return f;
    }

    function writeUrl(filters) {
        const url = new URLSearchParams(location.search);
        URL_KEYS.forEach(k => url.delete(k));
        filters.forEach((v, k) => url.set(k, v));
        const qs = url.toString();
        history.replaceState(null, "", qs ? `${location.pathname}?${qs}` : location.pathname);
    }

    function apiQuery(filters, pageNumber) {
        const q = new URLSearchParams(base);
        filters.forEach((v, k) => q.set(k, v));
        if (!q.has("sort")) q.set("sort", defaultSort);
        q.set("page", pageNumber);
        q.set("size", PAGE_SIZE);
        return q;
    }

    /** Menor e maior preço do universo atual (2 chamadas pequenas em paralelo). */
    async function refreshBounds(keep) {
        if (!price) return;
        const q = scope();
        q.set("size", "1");
        const cheapest = new URLSearchParams(q); cheapest.set("sort", "price,asc");
        const priciest = new URLSearchParams(q); priciest.set("sort", "price,desc");
        const [a, b] = await Promise.all([
            getJson(`/api/products?${cheapest}`, { notice: false }),
            getJson(`/api/products?${priciest}`, { notice: false }),
        ]);
        price.setBounds(a.content[0]?.price ?? 0, b.content[0]?.price ?? 0);
        price.setValue(keep?.minPrice ?? "", keep?.maxPrice ?? "");
    }

    function setError(message) {
        if (!errorEl) return;
        errorEl.textContent = message || "";
        errorEl.hidden = !message;
    }

    function setCount(total) {
        if (countEl) {
            countEl.textContent = total == null ? ""
                : total === 1 ? "1 produto encontrado" : `${total.toLocaleString("pt-BR")} produtos encontrados`;
        }
        onCount?.(total);
    }

    function isFiltered(filters) {
        return ["search", "categorySlug", "minPrice", "maxPrice", "inStock"].some(k => filters.has(k));
    }

    // ---- carregamento
    let lastLoad = 0;

    async function load() {
        const request = ++lastLoad;
        page = 0;
        if (moreButton) moreButton.hidden = true;
        setCount(null);
        setError("");
        showSkeleton(grid, "product", 8);
        try {
            const result = await getJson(`/api/products?${apiQuery(current, 0)}`);
            if (request !== lastLoad) return; // outro filtro já foi aplicado
            setCount(result.totalElements);
            if (result.content.length === 0) {
                showState(grid, isFiltered(current)
                    ? { icon: "bi-search", message: "Nenhum produto encontrado",
                        text: "Tente remover alguns filtros ou buscar outro termo.",
                        action: { label: "Limpar filtros", onClick: clear } }
                    : { icon: "bi-bag", message: "Nenhum produto por aqui ainda." });
                return;
            }
            showContent(grid, cards(result.content));
            if (moreButton) moreButton.hidden = result.last;
        } catch (error) {
            if (request !== lastLoad) return;
            console.error("Erro ao carregar produtos:", error);
            showError(grid, start);
        }
    }

    async function loadMore() {
        moreButton.disabled = true;
        moreButton.textContent = "Carregando…";
        try {
            const result = await getJson(`/api/products?${apiQuery(current, page + 1)}`);
            page += 1;
            grid.insertAdjacentHTML("beforeend", cards(result.content));
            moreButton.hidden = result.last;
        } catch (error) {
            console.error("Erro ao carregar mais produtos:", error);
            setError("Não foi possível carregar mais produtos. Tente de novo.");
        } finally {
            moreButton.disabled = false;
            moreButton.textContent = "Carregar mais";
        }
    }

    /** scopeChanged: busca/categoria/estoque mudaram → solta o preço e recalcula a faixa do slider. */
    async function apply(scopeChanged) {
        if (scopeChanged && price) {
            price.setValue("", "");
            refreshBounds(null).catch(error => console.error("Erro ao carregar faixa de preço:", error));
        }
        current = readForm(scopeChanged ? { minPrice: "", maxPrice: "" } : undefined);
        writeUrl(current);
        await load();
    }

    function clear() {
        if (field("search")) field("search").value = "";
        if (field("categorySlug")) field("categorySlug").value = "";
        if (field("inStock")) field("inStock").checked = false;
        if (field("sort")) field("sort").value = defaultSort;
        form.dispatchEvent(new Event("filters:cleared"));
        apply(true);
    }

    /** Primeira carga: lê a URL e busca os produtos e a faixa do slider ao mesmo tempo. Também é o "Tentar de novo". */
    async function start() {
        const fromUrl = readUrl();
        current = readForm(fromUrl);
        refreshBounds(fromUrl).catch(error => console.error("Erro ao carregar faixa de preço:", error));
        await load();
    }

    // ---- eventos
    form.addEventListener("submit", (event) => { event.preventDefault(); apply(true); });
    form.addEventListener("change", (event) => {
        const name = event.target.name;
        if (name === "sort") apply(false);
        else if (name === "categorySlug" || name === "inStock") apply(true);
    });
    form.querySelectorAll("[data-clear]").forEach(b => b.addEventListener("click", clear));
    moreButton?.addEventListener("click", loadMore);

    return { load: start, clear, apply };
}
