// conta.html: dados pessoais (GET/PUT /api/me) e endereços (/api/me/addresses).
import { apiFetch } from "./api.js";
import { escapeHtml as e, clearFieldErrors, showError, showFieldErrors, showState, skeletonRows, toast, withBusy } from "./ui.js";
import { requireLogin } from "./guard.js";
import { addressText, isDefaultAddress, setupAddressForm } from "./address-form.js";
import { supabase } from "./supabase-client.js";

const profileForm = document.getElementById("profile_form");
const addressList = document.getElementById("address_list");
const formBox = document.getElementById("address_form_box");
const newAddressToggle = document.getElementById("new_address_toggle");

const PROFILE_ERRORS = {
    "Phone must contain 10 or 11 digits": "Telefone com DDD: 10 ou 11 números.",
    "A user with this phone number already exists": "Esse telefone já está em outra conta.",
};

// ---------------------------------------------------------------- perfil

function fillProfile(me) {
    profileForm.querySelector("#p_email").value = me.email;
    profileForm.elements.name.value = me.name ?? "";
    profileForm.elements.phone.value = me.phone ?? "";

    const text = document.getElementById("seller_text");
    const link = document.getElementById("seller_link");
    if (me.seller) {
        text.textContent = `Você tem a loja "${me.seller.storeName}".`;
        link.textContent = "Ir para minha loja";
        link.href = "/minha-loja.html";
    } else {
        text.textContent = "Abra sua loja e comece a vender seus produtos.";
    }
}

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(profileForm);
    const body = {
        name: profileForm.elements.name.value.trim(),
        phone: profileForm.elements.phone.value.replace(/\D/g, "") || null,
    };
    try {
        const me = await withBusy(profileForm.querySelector("[type=submit]"),
            apiFetch("/api/me", { method: "PUT", body }));
        fillProfile(me);
        toast("Dados salvos.");
    } catch (error) {
        if (error.status !== 401) showFieldErrors(profileForm, error, PROFILE_ERRORS);
    }
});

// ----------------------------------------------------------------- senha
// A senha é do Supabase Auth (não passa pela nossa API): updateUser com a sessão atual.

const passwordForm = document.getElementById("password_form");

const PASSWORD_ERRORS = {
    "New password should be different from the old password.": "A nova senha precisa ser diferente da atual.",
    "Password should be at least 6 characters.": "A senha precisa ter pelo menos 6 caracteres.",
};

passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(passwordForm);
    const password = passwordForm.elements.password.value;
    const confirm = passwordForm.elements.confirm.value;
    const fieldError = (fieldName, message) => showFieldErrors(passwordForm, { body: { errors: [{ fieldName, message }] } });
    if (password.length < 6) return fieldError("password", "Pelo menos 6 caracteres.");
    if (password !== confirm) return fieldError("confirm", "As senhas não são iguais.");

    const button = passwordForm.querySelector("[type=submit]");
    const { error } = await withBusy(button, supabase.auth.updateUser({ password }));
    if (error) {
        showFieldErrors(passwordForm, { message: PASSWORD_ERRORS[error.message] ?? "Não foi possível trocar a senha." });
        return;
    }
    passwordForm.reset();
    toast("Senha atualizada.");
});

// --------------------------------------------------------------- endereços

let addresses = [];
let editingId = null;

const addressForm = setupAddressForm(formBox, {
    onCancel: () => closeForm(),
    async onSubmit(data, button) {
        const path = editingId ? `/api/me/addresses/${editingId}` : "/api/me/addresses";
        try {
            await withBusy(button, apiFetch(path, { method: editingId ? "PUT" : "POST", body: data }));
            toast(editingId ? "Endereço atualizado." : "Endereço salvo.");
            closeForm();
            loadAddresses();
        } catch (error) {
            if (error.status !== 401) addressForm.showErrors(error);
        }
    },
});

function openForm(address) {
    editingId = address?.id ?? null;
    addressForm.fill(address);
    formBox.hidden = false;
    newAddressToggle.hidden = true;
    addressForm.focus();
}

function closeForm() {
    editingId = null;
    formBox.hidden = true;
    newAddressToggle.hidden = false;
}

newAddressToggle.addEventListener("click", () => openForm(null));

function addressCard(a) {
    const isDefault = isDefaultAddress(a);
    return `
        <div class="endereco-cartao ${isDefault ? "padrao" : ""}" data-id="${e(a.id)}">
            <div class="flex-grow-1">
                <strong>${e(a.label || "Endereço")}</strong>
                ${isDefault ? '<small class="selo-padrao">Padrão</small>' : ""}
                <p class="texto-suave mb-0">${e(addressText(a))}</p>
            </div>
            <div class="endereco-acoes">
                ${isDefault ? "" : `<button class="btn btn-link btn-sm" type="button" data-default>Tornar padrão</button>`}
                <button class="btn btn-link btn-sm" type="button" data-edit>Editar</button>
                <button class="btn btn-link btn-sm texto-perigo" type="button" data-delete>Excluir</button>
            </div>
        </div>`;
}

addressList.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    const id = card.dataset.id;
    const address = addresses.find(a => a.id === id);
    try {
        if (event.target.closest("[data-edit]")) {
            openForm(address);
        } else if (event.target.closest("[data-default]")) {
            await apiFetch(`/api/me/addresses/${id}/default`, { method: "PATCH" });
            toast("Endereço padrão atualizado.");
            loadAddresses();
        } else if (event.target.closest("[data-delete]")) {
            if (!confirm("Excluir este endereço?")) return;
            await apiFetch(`/api/me/addresses/${id}`, { method: "DELETE" });
            toast("Endereço excluído.");
            loadAddresses();
        }
    } catch (error) {
        if (error.status !== 401) toast("Não foi possível concluir.", "erro");
    }
});

async function loadAddresses() {
    addressList.innerHTML = skeletonRows(2);
    try {
        addresses = (await apiFetch("/api/me/addresses?size=50")).content;
        if (addresses.length === 0) {
            showState(addressList, { icon: "bi-geo-alt", message: "Nenhum endereço cadastrado." });
            return;
        }
        // padrão primeiro
        addresses.sort((a, b) => Number(isDefaultAddress(b)) - Number(isDefaultAddress(a)));
        addressList.innerHTML = addresses.map(addressCard).join("");
    } catch (error) {
        if (error.status === 401) return;
        showError(addressList, loadAddresses);
    }
}

async function loadProfile() {
    try {
        fillProfile(await apiFetch("/api/me"));
    } catch (error) {
        if (error.status !== 401) toast("Não foi possível carregar seus dados.", "erro");
    }
}

await requireLogin();
loadProfile();
loadAddresses();
