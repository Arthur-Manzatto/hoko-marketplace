import { supabase } from "./supabase-client.js";

const loginForm    = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");

function showError(form, message) {
    const box = form.querySelector(".form-error");
    box.textContent = message;
    box.hidden = false;
}

function clearError(form) {
    const box = form.querySelector(".form-error");
    box.textContent = "";
    box.hidden = true;
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError(loginForm);

    const email    = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;

    if (!email || !password) return showError(loginForm, "Preencha e-mail e senha.");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showError(loginForm, error.message);

    window.location.href = "/";
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError(registerForm);

    const name = document.querySelector("#register-name").value.trim();
    const email           = document.querySelector("#register-email").value.trim();
    const password        = document.querySelector("#register-password").value;
    const passwordConfirm = document.querySelector("#register-password-confirm").value;

    if (!name || !email || !password) return showError(registerForm, "Preencha todos os campos.");
    if (password !== passwordConfirm) return showError(registerForm, "As senhas não coincidem!");

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
    });

    if (error) return showError(registerForm, error.message);

    if (data.session) {
        window.location.href = "/";
    } else {
        showError(registerForm, "Conta criada! Confirme seu e-mail para entrar.");
    }
});

supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.href = "/login.html";
});