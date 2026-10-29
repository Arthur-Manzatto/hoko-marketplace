// Utilitários de interface compartilhados pelas páginas.

/** Escapa texto vindo da API antes de ir para innerHTML (evita injeção de HTML/script). */
export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 459.9 → "R$ 459,90" */
export function formatPrice(value) {
    return brl.format(Number(value) || 0);
}

// ---------------------------------------------------------------- skeletons

const SKELETONS = {
    category: () => `
        <div class="col-6 col-md-3 col-lg-custom mb-3">
            <div class="categoria-card skeleton-card" aria-hidden="true">
                <span class="skeleton skeleton-circle"></span>
                <span class="skeleton skeleton-text w-50"></span>
            </div>
        </div>`,

    product: () => `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="product-card" aria-hidden="true">
                <div class="pimg-container skeleton"></div>
                <div class="product-info">
                    <span class="skeleton skeleton-text w-50"></span>
                    <span class="skeleton skeleton-text"></span>
                    <span class="skeleton skeleton-text w-75"></span>
                    <span class="skeleton skeleton-btn"></span>
                </div>
            </div>
        </div>`,

    categoryHeader: () => `
        <div class="container">
            <div class="categoria-header" aria-hidden="true">
                <div class="categoria-header-icon skeleton"></div>
                <div class="categoria-header-info flex-grow-1">
                    <span class="skeleton skeleton-text skeleton-title"></span>
                    <span class="skeleton skeleton-text w-50"></span>
                </div>
            </div>
        </div>`,
};

/** Preenche o container com placeholders do mesmo tamanho do conteúdo real. */
export function showSkeleton(container, kind, count = 1) {
    container.setAttribute("aria-busy", "true");
    container.innerHTML = Array.from({ length: count }, SKELETONS[kind]).join("");
}

/** Troca o conteúdo do container pelo HTML real, com fade. */
export function showContent(container, html) {
    container.removeAttribute("aria-busy");
    container.innerHTML = html;
    container.classList.remove("fade-in");
    void container.offsetWidth; // reinicia a animação se a seção for re-renderizada
    container.classList.add("fade-in");
}

// ------------------------------------------------------ estados vazio e erro

/**
 * Mensagem no lugar do conteúdo (vazio, erro, não encontrado).
 * action: { label, onClick } para um botão, ou { label, href } para um link.
 */
export function showState(container, { icon = "bi-inbox", message, action, wrap = "" } = {}) {
    container.removeAttribute("aria-busy");

    const button = action?.href
        ? `<a class="btn btn-custom btn-sm mt-2" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`
        : action
            ? `<button type="button" class="btn btn-custom btn-sm mt-2" data-state-action>${escapeHtml(action.label)}</button>`
            : "";

    const box = `
        <div class="state-box w-100">
            <i class="bi ${escapeHtml(icon)}"></i>
            <p class="mb-0">${escapeHtml(message)}</p>
            ${button}
        </div>`;

    container.innerHTML = wrap === "container" ? `<div class="container">${box}</div>` : box;
    container.querySelector("[data-state-action]")?.addEventListener("click", action.onClick);
}

export function showError(container, retry, wrap) {
    showState(container, {
        icon: "bi-wifi-off",
        message: "Não foi possível carregar.",
        action: { label: "Tentar de novo", onClick: retry },
        wrap,
    });
}

// ------------------------------------------------------- aviso de cold start

let pending = 0;
let notice;

function setNotice(visible) {
    if (!notice) {
        notice = document.createElement("div");
        notice.className = "slow-notice";
        notice.setAttribute("role", "status");
        notice.innerHTML = `
            <span class="spinner-border spinner-border-sm mr-2" aria-hidden="true"></span>
            Acordando o servidor… isso pode levar até 1 minuto na primeira visita.`;
        document.body.appendChild(notice);
    }
    notice.classList.toggle("show", visible);
}

/**
 * Se a promise demorar mais que `delay`, mostra o aviso de servidor acordando
 * (o Render grátis dorme depois de 15 min sem acesso). Some quando tudo terminar.
 */
export async function withSlowNotice(promise, delay = 4000) {
    pending++;
    const timer = setTimeout(() => setNotice(true), delay);
    try {
        return await promise;
    } finally {
        clearTimeout(timer);
        if (--pending === 0 && notice) setNotice(false);
    }
}
