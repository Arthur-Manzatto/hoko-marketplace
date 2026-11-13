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
        <div class="categoria-card skeleton-card" aria-hidden="true">
            <span class="skeleton categoria-icon"></span>
            <span class="skeleton skeleton-text w-75 mb-0"></span>
        </div>`,

    product: () => `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="product-card" aria-hidden="true">
                <div class="pimg-container skeleton"></div>
                <div class="product-info">
                    <span class="skeleton skeleton-text w-50"></span>
                    <span class="skeleton skeleton-text"></span>
                    <span class="skeleton skeleton-text skeleton-preco"></span>
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
export function showState(container, { icon = "bi-inbox", message, text, action, wrap = "" } = {}) {
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
            ${text ? `<small>${escapeHtml(text)}</small>` : ""}
            ${button}
        </div>`;

    container.innerHTML = wrap === "container" ? `<div class="container">${box}</div>` : box;
    container.querySelector("[data-state-action]")?.addEventListener("click", action.onClick);
}

export function showError(container, retry, wrap) {
    showState(container, {
        icon: "bi-wifi-off",
        message: "Não foi possível carregar.",
        text: "Confira sua conexão e tente de novo.",
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

// ------------------------------------------------------------- toast

let toastBox;

/** Aviso rápido no canto da tela que some sozinho. type: "ok" | "erro" | "info". */
/** Aviso rápido no canto. link: { label, href } opcional (ex.: "Ver carrinho"). */
export function toast(message, type = "ok", link) {
    if (!toastBox) {
        toastBox = document.createElement("div");
        toastBox.className = "toasts";
        toastBox.setAttribute("role", "status");
        toastBox.setAttribute("aria-live", "polite");
        document.body.appendChild(toastBox);
    }
    const icon = { ok: "bi-check-circle-fill", erro: "bi-exclamation-circle-fill", info: "bi-info-circle-fill" }[type];
    const item = document.createElement("div");
    item.className = `toast-item toast-${type}`;
    item.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span></span>`;
    item.querySelector("span").textContent = message;
    if (link) {
        const a = document.createElement("a");
        a.className = "toast-link";
        a.href = link.href;
        a.textContent = link.label;
        item.append(a);
    }
    toastBox.appendChild(item);
    setTimeout(() => item.classList.add("saindo"), 3200);
    setTimeout(() => item.remove(), 3600);
}

// --------------------------------------------------- botão ocupado

/** Desabilita o botão e mostra spinner enquanto a promise roda. Devolve o resultado da promise. */
export async function withBusy(button, promise) {
    const html = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm mr-1" aria-hidden="true"></span>${html}`;
    try {
        return await promise;
    } finally {
        button.disabled = false;
        button.innerHTML = html;
    }
}

// ------------------------------------------------ erros de formulário

/** Limpa as marcações de erro de um form. */
export function clearFieldErrors(form) {
    form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    form.querySelectorAll(".invalid-feedback[data-auto]").forEach(el => el.remove());
    const top = form.querySelector(".form-erro");
    if (top) { top.textContent = ""; top.hidden = true; }
}

/**
 * Mostra o erro da API no form: 422 de validação vai para cada campo (pelo name),
 * o resto (409, 422 de regra, 500) vai para o .form-erro do topo.
 */
export function showFieldErrors(form, error, labels = {}) {
    clearFieldErrors(form);
    const body = error?.body;
    let general = body?.message || error?.message || "Não foi possível salvar.";
    if (Array.isArray(body?.errors) && body.errors.length) {
        const missed = [];
        for (const { fieldName, message } of body.errors) {
            const field = form.elements[fieldName.replace(/\[\d+\]$/, "")];
            const input = field instanceof RadioNodeList ? field[0] : field;
            if (!input) { missed.push(message); continue; }
            input.classList.add("is-invalid");
            const fb = document.createElement("div");
            fb.className = "invalid-feedback";
            fb.dataset.auto = "";
            fb.textContent = labels[message] || message;
            (input.closest(".input-group") ?? input).insertAdjacentElement("afterend", fb);
        }
        general = missed.length ? missed.join(" ") : "";
    }
    const top = form.querySelector(".form-erro");
    if (top && general) { top.textContent = labels[general] || general; top.hidden = false; }
    form.querySelector(".is-invalid")?.focus();
}

// ------------------------------------------------------- formatação

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatDate(iso, withTime = false) {
    if (!iso) return "";
    return (withTime ? dateTimeFmt : dateFmt).format(new Date(iso));
}

const ORDER_STATUS = {
    PENDING: ["Aguardando pagamento", "pendente"],
    PAID: ["Pago", "pago"],
    SHIPPED: ["Enviado", "enviado"],
    DELIVERED: ["Entregue", "entregue"],
    CANCELED: ["Cancelado", "cancelado"],
};

const PAYMENT_STATUS = {
    PENDING: ["Pendente", "pendente"],
    PAID: ["Pago", "pago"],
    FAILED: ["Não pago", "cancelado"],
    REFUNDED: ["Estornado", "cancelado"],
};

export const PAYMENT_METHOD = { PIX: "PIX", CARD: "Cartão de crédito", BOLETO: "Boleto" };

/** Selo colorido do status do pedido (ou do pagamento, com kind = "payment"). */
export function statusBadge(status, kind = "order") {
    const [label, css] = (kind === "payment" ? PAYMENT_STATUS : ORDER_STATUS)[status] ?? [status, "pendente"];
    return `<span class="status-selo status-${css}">${escapeHtml(label)}</span>`;
}

export function orderStatusLabel(status) {
    return ORDER_STATUS[status]?.[0] ?? status;
}

/** Faixa de skeleton simples (linhas de lista). */
export function skeletonRows(count = 3) {
    return Array.from({ length: count }, () => `
        <div class="lista-item skeleton-card" aria-hidden="true">
            <span class="skeleton lista-sk-foto"></span>
            <div class="flex-grow-1">
                <span class="skeleton skeleton-text w-50"></span>
                <span class="skeleton skeleton-text w-25"></span>
            </div>
        </div>`).join("");
}
