
const categories_row = document.getElementById("categories_row");
const productHL_row = document.getElementById("highlighted_products");

const API = "https://hoko-api.onrender.com";

async function carregarCategorias() {
    try {
        const res = await fetch(
            `${API}/api/categories?size=8&sort=name,asc`
        );



        if (!res.ok) {
            throw new Error(`Erro HTTP: ${res.status}`);
        }

        const page = await res.json();

        categories_row.innerHTML = page.content.map(cat => `
            <div class="col-6 col-md-3 col-lg-custom mb-3">
                <a href="/categorias.html?slug=${cat.slug}"
                   class="categoria-card">

                    <div class="categoria-icon">
                        <i class="bi ${cat.icon}"></i>
                    </div>

                    <span class="categoria-nome">${cat.name}</span>
                </a>
            </div>
        `).join("");

        console.log("Total de categorias:", page.totalElements);
        console.log("Total de páginas:", page.totalPages);

    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}



async function carregarHighlights() {

    const resProd = await fetch(`
        ${API}/api/products?categorySlug=eletronicos&page=0&size=4&sort=name,asc
    `)

    const pagee = await resProd.json();

    console.log("Resposta da API de produtos:", pagee);

    productHL_row.innerHTML = pagee.content.map(prod => `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
        <div class="product-card">
            <div class="pimg-container">

                <img src="${prod.coverImageUrl}" class="product-img">
                <span class="product-obs">Mais vendido</span>

                    <button type="button" class="product-favorite" aria-label="Adicionar aos favoritos">
                          <i class="bi bi-heart"></i>
                    </button>

            </div>

            <div class="product-info">

                <div class="product-rating">
                    <i class="bi bi-star-fill"></i>
                    <span>4.8</span>
                    <span class="product-store">· ${prod.sellerStoreName}</span>
                </div>

                <h3 class="product-name">
                    ${prod.name}
                </h3>

                <div class="product-prices">
                    <span class="product-price">R$ ${prod.price}</span>
                    <span class="product-old-price">R$ ${prod.price + (prod.price * 0.2)}</span>
                </div>

                <button type="button" class="product-add">
                    <i class="bi bi-cart3"></i>
                    Adicionar
                </button>

            </div>

        </div>
    </div>
    
    
    `).join("");


}


carregarCategorias();
carregarHighlights();
