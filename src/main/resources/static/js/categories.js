const params = new URLSearchParams(window.location.search);
const cat_header = document.getElementById("category_header")

const categoriaSlug = params.get("slug");


const API = "https://hoko-api.onrender.com";

async function carregarPagina(){

    console.log(categoriaSlug)
    const res = await fetch(
            
        `${API}/api/categories/slug/${categoriaSlug}`
        
    );

    const page = await res.json();

    cat_header.innerHTML = `
    
        <div class="container">
            <div class="categoria-header" id="categoriaHeader" data-slug="${page.slug}">

                <div class="categoria-header-icon">
                    <i class="bi ${page.icon}"></i> 
                </div>

                <div class="categoria-header-info">
                    <h1 class="categoria-header-titulo" id="categoriaName">${page.name}</h1>
                    <p class="categoria-header-desc" id="categoriaDescription">Smartphones, notebooks, fones e muitos mais</p>
                   
                </div>

            </div>
        </div>
    
    `



}

carregarPagina();