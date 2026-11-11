import { getJson } from "./api.js";
import { formatPrice, showError, showState } from "./ui.js";

const MAX_QTY = 10; // limite do select (a API aceita até 99 por item no carrinho)

const productSlug = new URLSearchParams(window.location.search).get("slug");

const skeleton = document.getElementById("product_skeleton");
const view = document.getElementById("product_view");
const skeletonHtml = skeleton.innerHTML; // para voltar ao skeleton no "Tentar de novo"

const product_title = document.getElementById("product_title");
const product_curprice = document.getElementById("product_curprice");
const product_installments = document.getElementById("product_installments");
const product_stock = document.getElementById("product_stock");
const product_units = document.getElementById("product_units");
const product_qty = document.getElementById("product_qty");
const product_store = document.getElementById("product_store");
const product_cat_path = document.getElementById("product_cat_path");
const product_name_path = document.getElementById("product_name_path");
const product_img = document.getElementById("product_img");
const product_thumbs = document.getElementById("product_thumbs");
const product_description = document.getElementById("product_description");
const action_buttons = document.querySelectorAll(".produto-acoes .produto-botao");

// ------------------------------------------------------------------- fotos

function showPhoto(url, alt) {
    product_img.classList.remove("loaded");
    product_img.hidden = false;
    product_img.alt = alt;
    product_img.onload = () => product_img.classList.add("loaded");
    // link quebrado: some e fica o placeholder que está por baixo
    product_img.onerror = () => { product_img.hidden = true; };
    product_img.src = url;
}

function renderPhotos(prod) {
    const urls = prod.imageUrls ?? [];
    product_thumbs.replaceChildren();

    if (urls.length === 0) {
        product_img.hidden = true;
        return;
    }
    showPhoto(urls[0], prod.name);

    if (urls.length < 2) return;
    urls.forEach((url, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "produto-miniatura";
        button.setAttribute("aria-label", `Foto ${i + 1} de ${urls.length}`);
        button.setAttribute("aria-current", String(i === 0));

        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.loading = "lazy";
        img.onerror = () => button.remove();
        button.append(img);

        button.addEventListener("click", () => {
            product_thumbs.querySelectorAll(".produto-miniatura")
                .forEach(b => b.setAttribute("aria-current", String(b === button)));
            showPhoto(url, prod.name);
        });
        product_thumbs.append(button);
    });
}

// ------------------------------------------------------------- estoque

function renderStock(quantity) {
    const available = quantity > 0;

    product_stock.textContent = available ? "Estoque disponível" : "Esgotado";
    product_stock.classList.toggle("esgotado", !available);
    product_units.textContent = available
        ? `${quantity} ${quantity === 1 ? "unidade disponível" : "unidades disponíveis"}`
        : "Sem unidades no momento";

    product_qty.replaceChildren();
    for (let n = 1; n <= Math.max(1, Math.min(quantity, MAX_QTY)); n++) {
        product_qty.append(new Option(String(n), String(n)));
    }
    product_qty.disabled = !available;
    action_buttons.forEach(button => { button.disabled = !available; });
}

// ---------------------------------------------------------------- página

function render(prod) {
    document.title = `${prod.name} · Hoko`;

    // textContent: o texto da API nunca vira HTML
    product_cat_path.textContent = prod.categoryName;
    product_cat_path.href = `categorias.html?slug=${encodeURIComponent(prod.categorySlug)}`;
    product_name_path.textContent = prod.name;

    product_title.textContent = prod.name;
    product_curprice.textContent = formatPrice(prod.price);
    product_installments.textContent = `em 12x de ${formatPrice(prod.price / 12)} sem juros`;
    product_store.textContent = prod.sellerStoreName;

    product_description.textContent = prod.description || "Este produto ainda não tem descrição.";
    product_description.classList.toggle("vazia", !prod.description);

    renderPhotos(prod);
    renderStock(prod.quantity);

    skeleton.hidden = true;
    view.hidden = false;
    view.classList.remove("fade-in");
    void view.offsetWidth; // reinicia a animação
    view.classList.add("fade-in");
}

function notFound() {
    document.title = "Produto não encontrado · Hoko";
    showState(skeleton, {
        icon: "bi-search",
        message: "Produto não encontrado.",
        action: { label: "Voltar para a home", href: "/" },
    });
}

async function loadPage() {
    if (!productSlug) {
        notFound();
        return;
    }

    skeleton.hidden = false;
    skeleton.innerHTML = skeletonHtml;
    view.hidden = true;

    try {
        render(await getJson(`/api/products/slug/${encodeURIComponent(productSlug)}`));
    } catch (error) {
        if (error.status === 404) {
            notFound();
        } else {
            console.error("Erro ao carregar produto:", error);
            showError(skeleton, loadPage);
        }
    }
}

loadPage();
