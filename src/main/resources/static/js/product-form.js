// produto-form.html (novo) e produto-form.html?id= (editar).
// Fotos: sobem direto do navegador para o Supabase Storage (bucket product-images, pasta do usuário)
// e a API recebe só as URLs em imageUrls (até 8, a primeira é a capa).
import { apiFetch, getJson, getJsonCached } from "./api.js";
import { escapeHtml as e, clearFieldErrors, showError, showFieldErrors, showState, toast, withBusy } from "./ui.js";
import { requireLogin } from "./guard.js";
import { supabase } from "./supabase-client.js";

const BUCKET = "product-images";
const MAX_PHOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const id = new URLSearchParams(location.search).get("id");
const form = document.getElementById("product_form");
const state = document.getElementById("form_state");
const grid = document.getElementById("photo_grid");
const fileInput = document.getElementById("photo_input");

const ERRORS = {
    "A product can have at most 8 images": "No máximo 8 fotos.",
    "Image URL must be https": "Foto inválida.",
    "must not be null": "Campo obrigatório.",
    "must not be blank": "Campo obrigatório.",
    "Category not found": "Escolha uma categoria.",
};

let userId = null;
let photos = [];          // [{ url, uploading }]
let originalUrls = [];    // fotos que o produto tinha ao abrir (para apagar do Storage as removidas)

// ----------------------------------------------------------------- fotos

function renderPhotos() {
    const tiles = photos.map((p, i) => `
        <div class="foto-tile ${p.uploading ? "enviando" : ""}" data-index="${i}">
            ${p.uploading
                ? `<span class="spinner-border spinner-border-sm" aria-label="Enviando"></span>`
                : `<img src="${e(p.url)}" alt="Foto ${i + 1}">`}
            ${i === 0 && !p.uploading ? `<span class="foto-capa">Capa</span>` : ""}
            ${p.uploading ? "" : `
                <div class="foto-acoes">
                    <button type="button" data-move="-1" ${i === 0 ? "disabled" : ""} aria-label="Mover para a esquerda"><i class="bi bi-arrow-left"></i></button>
                    <button type="button" data-remove aria-label="Remover foto"><i class="bi bi-x-lg"></i></button>
                    <button type="button" data-move="1" ${i === photos.length - 1 ? "disabled" : ""} aria-label="Mover para a direita"><i class="bi bi-arrow-right"></i></button>
                </div>`}
        </div>`).join("");
    const add = photos.length < MAX_PHOTOS
        ? `<button type="button" class="foto-tile foto-adicionar" data-add><i class="bi bi-plus-lg"></i><span>Adicionar</span></button>`
        : "";
    grid.innerHTML = tiles + add;
}

grid.addEventListener("click", (event) => {
    if (event.target.closest("[data-add]")) return fileInput.click();
    const tile = event.target.closest("[data-index]");
    if (!tile) return;
    const i = Number(tile.dataset.index);
    const move = event.target.closest("[data-move]");
    if (move) {
        const j = i + Number(move.dataset.move);
        [photos[i], photos[j]] = [photos[j], photos[i]];
    } else if (event.target.closest("[data-remove]")) {
        photos.splice(i, 1);
    }
    renderPhotos();
});

/** Caminho do arquivo dentro do bucket, se a URL for do nosso Storage (senão null). */
function storagePath(url) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const at = url.indexOf(marker);
    return at === -1 ? null : decodeURIComponent(url.slice(at + marker.length));
}

async function upload(file) {
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

fileInput.addEventListener("change", async () => {
    const files = [...fileInput.files];
    fileInput.value = "";
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) toast(`Só cabem mais ${room} foto(s).`, "info");

    for (const file of files.slice(0, room)) {
        if (!TYPES.includes(file.type)) { toast(`${file.name}: use JPG, PNG ou WebP.`, "erro"); continue; }
        if (file.size > MAX_BYTES) { toast(`${file.name}: máximo 5 MB.`, "erro"); continue; }

        const slot = { url: "", uploading: true };
        photos.push(slot);
        renderPhotos();
        try {
            slot.url = await upload(file);
            slot.uploading = false;
        } catch (error) {
            console.error("Erro no upload:", error);
            photos.splice(photos.indexOf(slot), 1);
            toast(`Não foi possível enviar ${file.name}.`, "erro");
        }
        renderPhotos();
    }
});

// --------------------------------------------------------------- salvar

/** "1.234,56" / "99,9" / "100" -> 1234.56 / 99.9 / 100 (ou NaN) */
function parsePrice(text) {
    const clean = text.trim().replace(/\s|R\$/g, "");
    const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
    return normalized === "" ? NaN : Number(normalized);
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    if (photos.some(p => p.uploading)) return toast("Espere as fotos terminarem de enviar.", "info");

    const price = parsePrice(form.elements.price.value);
    if (!Number.isFinite(price) || price < 0) {
        return showFieldErrors(form, { body: { errors: [{ fieldName: "price", message: "Preço inválido (ex.: 99,90)." }] } });
    }
    const body = {
        name: form.elements.name.value.trim(),
        categoryId: form.elements.categoryId.value || null,
        price: Math.round(price * 100) / 100,
        quantity: Number(form.elements.quantity.value),
        description: form.elements.description.value.trim() || null,
        imageUrls: photos.map(p => p.url),
    };

    try {
        const saved = await withBusy(document.getElementById("save_button"),
            apiFetch(id ? `/api/me/seller/products/${id}` : "/api/me/seller/products",
                { method: id ? "PUT" : "POST", body }));

        // fotos que saíram do produto: apaga o arquivo do Storage (só as do nosso bucket)
        const removed = originalUrls.filter(u => !body.imageUrls.includes(u)).map(storagePath).filter(Boolean);
        if (removed.length) supabase.storage.from(BUCKET).remove(removed).catch(() => {});

        toast(id ? "Produto atualizado." : "Produto cadastrado.");
        location.href = `/produtos.html?slug=${encodeURIComponent(saved.slug)}`;
    } catch (error) {
        if (error.status === 401) return;
        if (error.status === 404 && /Seller/.test(error.body?.message ?? "")) {
            location.href = "/vender.html";
            return;
        }
        showFieldErrors(form, error, ERRORS);
    }
});

// ---------------------------------------------------------------- início

async function loadCategories() {
    await getJsonCached("/api/categories?size=50&sort=name,asc", (page) => {
        const select = form.elements.categoryId;
        const selected = select.value;
        select.replaceChildren(new Option("Escolha…", ""));
        page.content.forEach(c => select.append(new Option(c.name, c.id)));
        select.value = selected;
    });
}

function fill(product) {
    form.elements.name.value = product.name;
    form.elements.categoryId.value = product.categoryId;
    form.elements.price.value = String(product.price).replace(".", ",");
    form.elements.quantity.value = product.quantity;
    form.elements.description.value = product.description ?? "";
    originalUrls = product.imageUrls ?? [];
    photos = originalUrls.map(url => ({ url, uploading: false }));
}

async function start() {
    showState(state, { icon: "bi-hourglass-split", message: "Carregando…" });
    try {
        const [me] = await Promise.all([apiFetch("/api/me"), loadCategories()]);
        if (!me.seller) {
            location.replace("/vender.html");
            return;
        }
        userId = me.id;

        if (id) {
            const product = await getJson(`/api/products/${encodeURIComponent(id)}`);
            if (product.sellerId !== me.seller.id) {
                showState(state, { icon: "bi-lock", message: "Esse produto não é da sua loja.",
                    action: { label: "Voltar para minha loja", href: "/minha-loja.html?aba=products" } });
                return;
            }
            fill(product);
            document.title = `Editar ${product.name} | Hoko`;
            document.getElementById("form_title").textContent = "Editar produto";
            document.getElementById("form_crumb").textContent = product.name;
        }
        state.innerHTML = "";
        form.hidden = false;
        renderPhotos();
    } catch (error) {
        if (error.status === 401) return;
        if (error.status === 404) {
            showState(state, { icon: "bi-search", message: "Produto não encontrado.",
                action: { label: "Voltar para minha loja", href: "/minha-loja.html?aba=products" } });
            return;
        }
        console.error("Erro ao carregar formulário:", error);
        showError(state, start);
    }
}

await requireLogin();
start();
