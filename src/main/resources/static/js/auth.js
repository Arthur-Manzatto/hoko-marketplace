import { supabase } from "./supabase-client.js";

const loginForm    = document.querySelector("#login-form");

// volta para a página que pediu login (?next=/carrinho.html). Só aceita caminho do próprio site.
function nextUrl() {
    const next = new URLSearchParams(location.search).get("next") || "/";
    return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
const registerForm = document.querySelector("#register-form");

const AUTH_ERRORS = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).",
    "User already registered": "Já existe uma conta com esse e-mail.",
    "Password should be at least 6 characters.": "A senha precisa ter pelo menos 6 caracteres.",
    "New password should be different from the old password.": "A nova senha precisa ser diferente da antiga.",
};

function showError(form, message, ok = false) {
    const box = form.querySelector(".form-error");
    box.textContent = AUTH_ERRORS[message] ?? message;
    box.classList.toggle("form-ok", ok);
    box.hidden = false;
}

function clearError(form) {
    const box = form.querySelector(".form-error");
    box.textContent = "";
    box.hidden = true;
}

// ------------------------------------------------ esqueci a senha / nova senha
// 1) "Esqueceu sua senha?" manda o link do Supabase para o e-mail digitado.
// 2) O link volta para /login.html?reset=1 com a sessão de recuperação: o form vira "Nova senha".
let resetMode = false;
const forgotLink = document.querySelector("#forgot_link");

function enterResetMode() {
    resetMode = true;
    document.querySelector("#login-email-box").hidden = true;
    forgotLink.hidden = true;
    loginForm.querySelector("h1").textContent = "Crie uma nova senha";
    loginForm.querySelector(".subtitle").textContent = "Digite a nova senha da sua conta.";
    const password = document.querySelector("#login-password");
    password.placeholder = "Nova senha";
    password.autocomplete = "new-password";
    password.value = "";
    password.focus();
    document.querySelector("#login-submit").textContent = "SALVAR NOVA SENHA";
}

forgotLink.addEventListener("click", async () => {
    clearError(loginForm);
    const email = document.querySelector("#login-email").value.trim();
    if (!email) {
        document.querySelector("#login-email").focus();
        return showError(loginForm, "Digite seu e-mail acima e clique de novo em \"Esqueceu sua senha?\".");
    }
    forgotLink.disabled = true;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/login.html?reset=1`,
    });
    forgotLink.disabled = false;
    if (error) return showError(loginForm, "Não foi possível enviar agora. Tente de novo em alguns minutos.");
    showError(loginForm, `Se existir uma conta com ${email}, enviamos um link para criar uma nova senha.`, true);
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError(loginForm);

    if (resetMode) {
        const password = document.querySelector("#login-password").value;
        if (password.length < 6) return showError(loginForm, "A senha precisa ter pelo menos 6 caracteres.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return showError(loginForm, error.message);
        window.location.href = "/";
        return;
    }

    const email    = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;

    if (!email || !password) return showError(loginForm, "Preencha e-mail e senha.");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showError(loginForm, error.message);

    window.location.href = nextUrl();
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError(registerForm);

    const name = document.querySelector("#register-name").value.trim();
    const email           = document.querySelector("#register-email").value.trim();
    const phone = document.querySelector("#register-phone").value.trim();
    const password        = document.querySelector("#register-password").value;
    const passwordConfirm = document.querySelector("#register-password-confirm").value;

    if (!name || !email || !password) return showError(registerForm, "Preencha todos os campos.");
    if (password !== passwordConfirm) return showError(registerForm, "As senhas não coincidem!");

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                phone: phone || null  // envia null se vazio
            }
        },
    });

    if (error) return showError(registerForm, error.message);

    if (data.session) {
        window.location.href = nextUrl();
    } else {
        showError(registerForm, "Conta criada! Confirme seu e-mail para entrar.");
    }
});

supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") enterResetMode();
    if (event === "SIGNED_OUT") window.location.href = "/login.html";
});

if (new URLSearchParams(location.search).has("reset")) {
    // chegou pelo link do e-mail: o Supabase já trocou o link por uma sessão de recuperação
    supabase.auth.getSession().then(({ data }) => {
        if (data.session) enterResetMode();
        else showError(loginForm, "Link vencido ou já usado. Peça um novo em \"Esqueceu sua senha?\".");
    });
}