// vender.html: abre a loja (POST /api/me/seller). Quem já tem loja vai direto para minha-loja.html.
// O mesmo POST reabre uma loja que foi fechada.
import { apiFetch } from "./api.js";
import { clearFieldErrors, showError, showFieldErrors, withBusy } from "./ui.js";
import { requireLogin } from "./guard.js";
import { forgetMe } from "./sidebar.js";
import { setupDocumentField } from "./br.js";

const form = document.getElementById("sell_form");
const state = document.getElementById("sell_state");

const STORE_ERRORS = {
    "Document must contain 11 or 14 digits": "CPF (11 números) ou CNPJ (14 números).",
    "Invalid CPF or CNPJ": "CPF ou CNPJ inválido. Confira os números.",
    "A store with this document already exists": "Já existe uma loja com esse documento.",
    "A store with this slug already exists": "Já existe uma loja com esse nome.",
    "size must be between 3 and 80": "Entre 3 e 80 caracteres.",
};

// máscara de CPF/CNPJ + checagem dos dígitos verificadores enquanto digita
const documentField = setupDocumentField(form.elements.document);

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    if (!documentField.validate()) return;
    const body = {
        storeName: form.elements.storeName.value.trim(),
        document: documentField.value(),
    };
    try {
        await withBusy(form.querySelector("[type=submit]"), apiFetch("/api/me/seller", { method: "POST", body }));
        forgetMe(); // o menu passa a mostrar "Minha loja"
        location.href = "/minha-loja.html?nova=1";
    } catch (error) {
        if (error.status !== 401) showFieldErrors(form, error, STORE_ERRORS);
    }
});

async function start() {
    try {
        const me = await apiFetch("/api/me");
        if (me.seller) {
            location.replace("/minha-loja.html");
            return;
        }
        state.innerHTML = "";
        form.hidden = false;
        form.elements.storeName.focus();
    } catch (error) {
        if (error.status !== 401) showError(state, start);
    }
}

await requireLogin();
start();
