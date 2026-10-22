
const categories_row = document.getElementById("categories_row");

const API = "https://hoko-api.onrender.com";

async function carregarCategorias() {
    try {
        const res = await fetch(
            `${API}/api/categories?size=12&sort=name,asc`
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

carregarCategorias();
