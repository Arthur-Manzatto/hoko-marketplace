import { getJson } from "./api.js";
import { formatPrice, showContent, showError, showSkeleton, showState, withBusy } from "./ui.js";
import { addToCart } from "./cart.js";
import { productCard } from "./cards.js";
import { syncFavoriteButtons } from "./favorites.js";
import { lookupCep, maskCep, onlyDigits } from "./br.js";

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
const product_store_name = document.getElementById("product_store_name");
const product_store_initial = document.getElementById("product_store_initial");
const product_condition_stock = document.getElementById("product_condition_stock");
const product_fav = document.getElementById("product_fav");
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
    product_condition_stock.textContent = available
        ? (quantity <= 3 ? "Últimas unidades" : `${quantity} em estoque`)
        : "Esgotado";

    product_qty.replaceChildren();
    for (let n = 1; n <= Math.max(1, Math.min(quantity, MAX_QTY)); n++) {
        product_qty.append(new Option(String(n), String(n)));
    }
    product_qty.disabled = !available;
    action_buttons.forEach(button => { button.disabled = !available; });
}

// ----------------------------------------------------------- carrinho

let currentProduct = null;
const cartButton = document.querySelector(".produto-carrinho");
const buyButton = document.querySelector(".produto-comprar");

cartButton.addEventListener("click", () => {
    if (currentProduct) withBusy(cartButton, addToCart(currentProduct.id, Number(product_qty.value)));
});

// "Comprar agora": põe no carrinho e já vai para o checkout
buyButton.addEventListener("click", async () => {
    if (!currentProduct) return;
    const cart = await withBusy(buyButton, addToCart(currentProduct.id, Number(product_qty.value)));
    if (cart) location.href = "/checkout.html";
});

// ---------------------------------------------------------------- página

function render(prod) {
    document.title = `${prod.name} | Hoko`;

    // textContent: o texto da API nunca vira HTML
    product_cat_path.textContent = prod.categoryName;
    product_cat_path.href = `/categorias.html?slug=${encodeURIComponent(prod.categorySlug)}`;
    product_name_path.textContent = prod.name;

    product_title.textContent = prod.name;
    product_curprice.textContent = formatPrice(prod.price);
    product_installments.textContent = `em 12x de ${formatPrice(prod.price / 12)} sem juros`;
    loadRelated(prod);
    product_store_name.textContent = prod.sellerStoreName;
    product_store_initial.textContent = (prod.sellerStoreName || "?").trim().charAt(0).toUpperCase();
    product_store.href = `/loja.html?slug=${encodeURIComponent(prod.sellerSlug)}`;
    product_store.setAttribute("aria-label", `Ver loja ${prod.sellerStoreName}`);

    product_fav.dataset.favorite = prod.id;
    syncFavoriteButtons(view);
    currentProduct = prod;

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

// ---------------------------------------------------------- relacionados

async function loadRelated(prod) {
    const section = document.getElementById("related_section");
    const grid = document.getElementById("related_products");
    document.getElementById("related_more").href = `/categorias.html?slug=${encodeURIComponent(prod.categorySlug)}`;
    section.hidden = false;
    showSkeleton(grid, "product", 4);
    try {
        const page = await getJson(
            `/api/products?categorySlug=${encodeURIComponent(prod.categorySlug)}&inStock=true&size=5&sort=createdAt,desc`,
            { notice: false });
        const others = page.content.filter(p => p.id !== prod.id).slice(0, 4);
        if (others.length === 0) {
            section.hidden = true;
            return;
        }
        showContent(grid, others.map(p => productCard(p)).join(""));
    } catch {
        section.hidden = true; // é um extra: sem rede, só some
    }
}

// --------------------------------------------------------------- frete (CEP)

const cepForm = document.getElementById("produto-cep-form");
const cepInput = document.getElementById("produto-cep");
const cepResult = document.getElementById("produto-cep-retorno");

cepInput.addEventListener("input", () => {
    cepInput.value = maskCep(cepInput.value);
    // 8 números: calcula sozinho, sem precisar clicar
    if (onlyDigits(cepInput.value).length === 8) cepForm.requestSubmit();
});

function setCepResult(text, ok) {
    cepResult.textContent = text;
    cepResult.classList.toggle("ok", ok);
    cepResult.classList.toggle("erro", !ok);
}

// o form não navega: antes recarregava a página como produtos.html?cep= e perdia o produto
cepForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const cep = onlyDigits(cepInput.value);
    if (cep.length !== 8) return setCepResult("Digite um CEP válido com 8 números.", false);

    const button = cepForm.querySelector("button");
    let place = "";
    try {
        const address = await withBusy(button, lookupCep(cep));
        if (!address) return setCepResult("CEP não encontrado. Confira os números.", false);
        place = ` para ${address.city}/${address.state}`;
    } catch {
        // ViaCEP e BrasilAPI fora do ar: o frete é grátis para todo o Brasil de qualquer jeito
    }
    setCepResult(`Frete grátis${place}. Chega entre 3 e 7 dias úteis depois do envio.`, true);
});

function notFound() {
    document.title = "Produto não encontrado | Hoko";
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
