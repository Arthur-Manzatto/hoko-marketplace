import { getJson, getJsonCached } from "./api.js";
import { escapeHtml as e, showContent, showError, showSkeleton, showState, formatPrice } from "./ui.js";
import { productCard, productImage } from "./index.js";

const productSlug = new URLSearchParams(window.location.search).get("slug");

const product_title = document.getElementById("product_title")
const product_curprice = document.getElementById("product_curprice")
const product_installments = document.getElementById("product_installments")
const product_units = document.getElementById("product_units")
const product_store = document.getElementById("product_store")
const product_cat_path = document.getElementById("product_cat_path")

async function loadPage() {
    try {
        const page = await getJson(`/api/products/slug/${productSlug}`);
        

        console.log(page)

        product_title.textContent = page.name
        product_curprice.textContent = `${formatPrice(page.price)}`
        product_installments.textContent = `em 12x de ${formatPrice(page.price/12)} sem juros`;
        product_units.textContent = `${page.quantity} unidades disponíveis`
        product_store.textContent = page.sellerStoreName
        //falta dinamizar a quantidade de option no select

        product_cat_path.textContent = page.categoryName
        product_cat_path.href = `categorias.html?slug=${page.categorySlug}`
        product_name_path.textContent = page.name

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        //showError(productHL_row, carregarHighlights);
    }
}

loadPage()