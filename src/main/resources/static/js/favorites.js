// Favoritos: lista de ids de produto guardada no navegador (localStorage), sem login.
// Qualquer mudança dispara o evento "hoko:favorites" (contador do header, corações na tela).
const KEY = "hoko:favoritos";

export function getFavorites() {
    try {
        const list = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function save(list) {
    try {
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch { /* navegador sem storage: favoritos só nesta página */ }
    document.dispatchEvent(new CustomEvent("hoko:favorites", { detail: list }));
}

export function isFavorite(id) {
    return getFavorites().includes(id);
}

/** Liga/desliga o favorito e devolve o novo estado (true = favoritado). */
export function toggleFavorite(id) {
    const list = getFavorites();
    const on = !list.includes(id);
    save(on ? [id, ...list] : list.filter(x => x !== id));
    return on;
}

export function removeFavorite(id) {
    save(getFavorites().filter(x => x !== id));
}

/** Coração (ícone + aria) de acordo com o estado. */
export function heartHtml(on) {
    return `<i class="bi ${on ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i>`;
}

/** Atualiza todos os botões [data-favorite="<id>"] da página e o contador do header. */
export function syncFavoriteButtons(root = document) {
    const list = getFavorites();
    root.querySelectorAll("[data-favorite]").forEach(button => {
        const on = list.includes(button.dataset.favorite);
        button.classList.toggle("ativo", on);
        button.setAttribute("aria-pressed", String(on));
        button.setAttribute("aria-label", on ? "Remover dos favoritos" : "Adicionar aos favoritos");
        button.innerHTML = heartHtml(on);
    });
    document.querySelectorAll("[data-favorites-badge]").forEach(badge => {
        badge.textContent = list.length;
        badge.hidden = list.length === 0;
    });
}

// clique em qualquer coração da página
document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-favorite]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(button.dataset.favorite);
});

document.addEventListener("hoko:favorites", () => syncFavoriteButtons());
// outra aba mudou os favoritos
window.addEventListener("storage", (event) => { if (event.key === KEY) syncFavoriteButtons(); });
