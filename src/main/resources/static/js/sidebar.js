// Casca comum de todas as páginas: menu lateral (☰), rodapé e contador de favoritos.
// O HTML só tem as caixas vazias (#sidebar, #site_footer); o conteúdo é montado aqui.
import { supabase } from "./supabase-client.js";
import { API_BASE, getJsonCached } from "./api.js";
import { escapeHtml as e } from "./ui.js";
import { syncFavoriteButtons } from "./favorites.js";

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const openBtn = document.getElementById("sidebarToggle");

const here = location.pathname === "/" ? "/index.html" : location.pathname;
const hereSlug = new URLSearchParams(location.search).get("slug");

// ------------------------------------------------------------ abrir/fechar

function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
    sidebar.setAttribute("aria-hidden", "false");
    openBtn?.setAttribute("aria-expanded", "true");
    sidebar.querySelector("a, button")?.focus({ preventScroll: true });
}

function closeSidebar() {
    if (!sidebar.classList.contains("open")) return;
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    sidebar.setAttribute("aria-hidden", "true");
    openBtn?.setAttribute("aria-expanded", "false");
    openBtn?.focus({ preventScroll: true });
}

openBtn?.addEventListener("click", openSidebar);
overlay?.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSidebar(); });
document.addEventListener("hoko:open-sidebar", openSidebar);

// ------------------------------------------------------------ conteúdo

function item(href, icon, label, active = href === here) {
    return `<a class="menu-item ${active ? "ativo" : ""}" href="${href}" ${active ? 'aria-current="page"' : ""}>
        <i class="bi ${icon}" aria-hidden="true"></i><span>${label}</span></a>`;
}

function group(title, html, extra = "") {
    return `<div class="menu-grupo" ${extra}><p class="menu-grupo-titulo">${title}</p>${html}</div>`;
}

function renderSidebar() {
    sidebar.setAttribute("aria-hidden", "true");
    sidebar.setAttribute("aria-label", "Menu");
    sidebar.innerHTML = `
        <div class="menu-topo">
            <a href="/" class="nav-brand"><img src="/img/logo.svg" alt="Hoko" class="logo"></a>
            <button class="btn-fechar" type="button" data-close aria-label="Fechar menu"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="menu-usuario" id="menu_user">
            <a class="menu-entrar" href="/login.html"><i class="bi bi-person"></i> Entrar ou criar conta</a>
        </div>
        <nav class="menu-grupos">
            ${group("Principal",
                item("/index.html", "bi-house", "Início") +
                item("/todos-produtos.html", "bi-grid", "Produtos") +
                item("/lancamentos.html", "bi-stars", "Lançamentos"))}
            ${group("Categorias", `<div id="menu_categories">${'<span class="skeleton skeleton-text menu-sk"></span>'.repeat(5)}</div>`)}
            ${group("Minha conta",
                item("/pedidos.html", "bi-box-seam", "Meus pedidos") +
                item("/favoritos.html", "bi-heart", "Favoritos") +
                item("/carrinho.html", "bi-cart2", "Carrinho") +
                item("/conta.html", "bi-gear", "Configurações"))}
            ${group("Vendedor",
                `<div id="menu_seller">${item("/vender.html", "bi-shop", "Vender na Hoko")}</div>`)}
        </nav>`;
    sidebar.querySelector("[data-close]").addEventListener("click", closeSidebar);
}

async function renderCategories() {
    const box = document.getElementById("menu_categories");
    try {
        await getJsonCached("/api/categories?size=50&sort=name,asc", (page) => {
            box.innerHTML = page.content.map(c => item(
                `/categorias.html?slug=${encodeURIComponent(c.slug)}`,
                e(c.icon || "bi-tag"), e(c.name),
                here === "/categorias.html" && hereSlug === c.slug)).join("");
        });
    } catch {
        box.innerHTML = item("/todos-produtos.html", "bi-grid", "Ver todos os produtos", false);
    }
}

// ------------------------------------------------- usuário e loja (vendedor)

const SELLER_KEY = "hoko:me";

/** {name, email, seller} do /api/me, com cópia no sessionStorage (sem redirecionar no 401). */
async function loadMe(session) {
    try {
        const cached = JSON.parse(sessionStorage.getItem(SELLER_KEY));
        if (cached && cached.userId === session.user.id && Date.now() - cached.at < 5 * 60 * 1000) return cached.me;
    } catch { /* sem cache */ }
    const response = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const me = await response.json();
    try {
        sessionStorage.setItem(SELLER_KEY, JSON.stringify({ userId: session.user.id, at: Date.now(), me }));
    } catch { /* sem espaço */ }
    return me;
}

/** Chamado pelas telas quando a loja muda (criou/fechou): esquece o /api/me guardado. */
export function forgetMe() {
    try { sessionStorage.removeItem(SELLER_KEY); } catch { /* ok */ }
}

function initials(name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)[0] : "")).toUpperCase();
}

function renderSeller(hasStore) {
    document.getElementById("menu_seller").innerHTML = hasStore
        ? item("/minha-loja.html", "bi-shop", "Minha loja") +
          item("/vendas.html", "bi-receipt", "Vendas") +
          item("/relatorios.html", "bi-bar-chart", "Relatórios")
        : item("/vender.html", "bi-shop", "Vender na Hoko");
    // menu do avatar no header
    document.querySelectorAll("[data-seller-link]").forEach(link => {
        link.href = hasStore ? "/minha-loja.html" : "/vender.html";
        link.querySelector("span").textContent = hasStore ? "Minha loja" : "Vender na Hoko";
    });
}

async function renderUser(session) {
    const box = document.getElementById("menu_user");
    if (!session) {
        box.innerHTML = `<a class="menu-entrar" href="/login.html"><i class="bi bi-person"></i> Entrar ou criar conta</a>`;
        renderSeller(false);
        return;
    }
    const name = session.user.user_metadata?.name ?? session.user.email;
    box.innerHTML = `
        <a class="menu-cartao" href="/conta.html">
            <span class="menu-avatar">${e(initials(name))}</span>
            <span class="menu-cartao-info"><strong>${e(name)}</strong><small>${e(session.user.email)}</small></span>
        </a>`;
    try {
        const me = await loadMe(session);
        renderSeller(Boolean(me.seller));
    } catch {
        renderSeller(true); // sem resposta: mostra os atalhos de vendedor (as telas tratam quem não tem loja)
    }
}

// ------------------------------------------------------------ rodapé

function renderFooter() {
    const footer = document.getElementById("site_footer");
    if (!footer) return;
    footer.className = "rodape";
    footer.innerHTML = `
        <div class="container rodape-grade">
            <div class="rodape-marca">
                <a href="/"><img src="/img/logo.svg" alt="Hoko" class="logo"></a>
                <p>Marketplace de lojas independentes. Frete grátis para todo o Brasil e parcelamento em até 12x.</p>
            </div>
            <div>
                <p class="rodape-titulo">Comprar</p>
                <a href="/todos-produtos.html">Todos os produtos</a>
                <a href="/lancamentos.html">Lançamentos</a>
                <a href="/favoritos.html">Favoritos</a>
            </div>
            <div>
                <p class="rodape-titulo">Minha conta</p>
                <a href="/pedidos.html">Meus pedidos</a>
                <a href="/carrinho.html">Carrinho</a>
                <a href="/conta.html">Configurações</a>
            </div>
            <div>
                <p class="rodape-titulo">Vender</p>
                <a href="/vender.html">Vender na Hoko</a>
                <a href="/minha-loja.html">Minha loja</a>
            </div>
        </div>
        <div class="container rodape-base">
            <span>© ${new Date().getFullYear()} Hoko · Projeto acadêmico</span>
            <span><i class="bi bi-shield-check"></i> Pagamento simulado, nenhuma cobrança real</span>
        </div>`;
}

// ------------------------------------------------------------ início

if (sidebar) {
    renderSidebar();
    renderCategories();
    const { data } = await supabase.auth.getSession();
    renderUser(data.session);
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") forgetMe();
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") renderUser(session);
    });
}
renderFooter();
syncFavoriteButtons();
