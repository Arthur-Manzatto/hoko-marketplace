// Telas que exigem login: requireLogin() devolve a sessão ou manda para o login
// com ?next=<página atual> (o login volta para cá depois de entrar).
import { supabase } from "./supabase-client.js";

export function loginUrl() {
    const next = location.pathname + location.search;
    return `/login.html?next=${encodeURIComponent(next)}`;
}

export function goToLogin() {
    location.href = loginUrl();
}

export async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export async function requireLogin() {
    const session = await getSession();
    if (!session) {
        goToLogin();
        // a navegação já começou: trava o resto do script da página
        return new Promise(() => {});
    }
    return session;
}
