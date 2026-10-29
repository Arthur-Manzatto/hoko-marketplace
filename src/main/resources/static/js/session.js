import { supabase } from "./supabase-client.js";

const loginLink      = document.querySelector("#loginLink");
const profileWrap    = document.querySelector("#profileWrap");
const profileButton  = document.querySelector("#profileButton");
const profileMenu    = document.querySelector("#profileMenu");
const profileInitial = document.querySelector("#profileInitial");
const userName       = document.querySelector("#userName");

function setMenuOpen(open) {
    profileMenu.hidden = !open;
    profileButton.setAttribute("aria-expanded", String(open));
}

function closeMenu() {
    setMenuOpen(false);
}

function renderSession(session) {
    const logged = Boolean(session);

    loginLink.hidden = logged;
    profileWrap.hidden = !logged;
    // o HTML começa com o "Entrar" invisível (data-auth="pending") para não piscar antes do avatar
    loginLink.removeAttribute("data-auth");

    if (!logged) {
        closeMenu();
        return;
    }

    const name = session.user.user_metadata?.name ?? session.user.email;
    userName.textContent = name;
    profileInitial.textContent = name.trim().charAt(0).toUpperCase();
}

// getSession lê a sessão salva no navegador: resolve na hora, sem ir à rede
const { data: { session: initialSession } } = await supabase.auth.getSession();
renderSession(initialSession);

supabase.auth.onAuthStateChange((event, session) => renderSession(session));

profileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(profileMenu.hidden);
});

profileMenu.addEventListener("click", (event) => event.stopPropagation());

document.addEventListener("click", closeMenu);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
});

document.querySelector("#profileLink")?.addEventListener("click", () => {
    closeMenu();
    alert("Perfil em breve.");
});

document.querySelector("#logoutButton")?.addEventListener("click", async () => {
    closeMenu();
    await supabase.auth.signOut();
    window.location.reload();
});