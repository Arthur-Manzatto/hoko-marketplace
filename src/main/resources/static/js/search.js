// Busca (header de todas as páginas + hero da home + banner do catálogo):
// - enquanto digita, mostra até 4 produtos com nome parecido (GET /api/products?search=&size=4);
// - Enter / "Buscar" / "Ver todos os resultados" leva para todos-produtos.html?search=
//   (nessa página a busca é aplicada ali mesmo, sem recarregar — evento "hoko:search").
import { getJson } from "./api.js";
import { escapeHtml as e, formatPrice } from "./ui.js";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const cache = new Map(); // termo -> lista (evita repetir a mesma chamada)

const onProductsPage = location.pathname.endsWith("/todos-produtos.html");

/** Vai para a página de produtos com a busca (ou aplica ali mesmo se já estiver nela). */
export function goSearch(term) {
    const q = term.trim();
    if (onProductsPage) {
        document.dispatchEvent(new CustomEvent("hoko:search", { detail: q }));
        return;
    }
    location.href = q ? `/todos-produtos.html?search=${encodeURIComponent(q)}` : "/todos-produtos.html";
}

/** Mantém as duas barras (desktop e mobile) com o mesmo texto. */
export function setSearchText(text) {
    document.querySelectorAll("[data-search-input]").forEach(input => { input.value = text; });
}

function suggestionItem(prod, index) {
    const img = prod.coverImageUrl
        ? `<img src="${e(prod.coverImageUrl)}" alt="" loading="lazy" onerror="this.remove()">`
        : "";
    return `
        <a class="sugestao" role="option" id="sug-${index}" href="/produtos.html?slug=${encodeURIComponent(prod.slug)}">
            <span class="sugestao-foto"><i class="bi bi-image" aria-hidden="true"></i>${img}</span>
            <span class="sugestao-info">
                <span class="sugestao-nome">${e(prod.name)}</span>
                <span class="sugestao-cat">${e(prod.categoryName)}</span>
            </span>
            <span class="sugestao-preco">${formatPrice(prod.price)}</span>
        </a>`;
}

/**
 * Liga uma barra de busca: <form data-search> com um <input> e (opcional) um botão [data-search-button].
 * Usada no header de todas as páginas, no hero da home e no banner do catálogo.
 */
export function setupSearchBox(group) {
    const input = group.querySelector("input");
    const button = group.querySelector("[data-search-button]");
    group.addEventListener("submit", (event) => event.preventDefault());
    const box = document.createElement("div");
    box.className = "sugestoes";
    box.setAttribute("role", "listbox");
    box.hidden = true;
    group.style.position = "relative";
    group.append(box);

    input.setAttribute("data-search-input", "");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    let timer;
    let lastRequest = 0;
    let active = -1; // item marcado pelas setas

    function close() {
        box.hidden = true;
        active = -1;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
    }

    function open(html) {
        box.innerHTML = html;
        box.hidden = false;
        input.setAttribute("aria-expanded", "true");
    }

    function render(term, products) {
        const more = `
            <button type="button" class="sugestao-todos" data-all>
                <i class="bi bi-search"></i> Ver todos os resultados para "${e(term)}"
            </button>`;
        if (products.length === 0) {
            open(`<p class="sugestao-vazia">Nenhum produto com "${e(term)}".</p>${more}`);
        } else {
            open(products.map(suggestionItem).join("") + more);
        }
        box.querySelector("[data-all]").addEventListener("click", () => { close(); goSearch(term); });
    }

    async function suggest() {
        const term = input.value.trim();
        if (term.length < MIN_CHARS) return close();

        if (cache.has(term)) return render(term, cache.get(term));

        const request = ++lastRequest;
        open(`<p class="sugestao-vazia"><span class="spinner-border spinner-border-sm mr-2"></span>Buscando…</p>`);
        try {
            const page = await getJson(
                `/api/products?search=${encodeURIComponent(term)}&size=4&sort=name,asc`, { notice: false });
            cache.set(term, page.content);
            // resposta velha (o usuário continuou digitando): descarta
            if (request === lastRequest && input.value.trim() === term) render(term, page.content);
        } catch (error) {
            if (request === lastRequest) close();
        }
    }

    function move(step) {
        const items = [...box.querySelectorAll(".sugestao, .sugestao-todos")];
        if (box.hidden || items.length === 0) return;
        active = (active + step + items.length) % items.length;
        items.forEach((item, i) => item.classList.toggle("ativa", i === active));
        if (items[active].id) input.setAttribute("aria-activedescendant", items[active].id);
    }

    input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(suggest, DEBOUNCE_MS);
    });
    input.addEventListener("focus", () => {
        if (input.value.trim().length >= MIN_CHARS) suggest();
    });
    input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
        else if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
        else if (event.key === "Escape") close();
        else if (event.key === "Enter") {
            event.preventDefault();
            const chosen = box.hidden ? null : box.querySelectorAll(".sugestao, .sugestao-todos")[active];
            close();
            if (chosen) chosen.click();
            else goSearch(input.value);
        }
    });
    button?.addEventListener("click", () => { close(); goSearch(input.value); });

    // clicar fora fecha
    document.addEventListener("click", (event) => {
        if (!group.contains(event.target)) close();
    });
}

document.querySelectorAll("[data-search]").forEach(setupSearchBox);
setSearchText(new URLSearchParams(location.search).get("search") ?? "");
