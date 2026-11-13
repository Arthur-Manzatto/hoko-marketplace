// lancamentos.html: produtos mais novos primeiro (sort=createdAt,desc fixo), com "Só com estoque".
import { setupProductFilters } from "./filters.js";

setupProductFilters({
    form: document.getElementById("product_filters"),
    grid: document.getElementById("product_section"),
    moreButton: document.getElementById("load_more"),
    countEl: document.getElementById("products_count"),
    errorEl: document.getElementById("filters_error"),
    base: { sort: "createdAt,desc" },
}).load();
