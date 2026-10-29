import { supabase } from "./supabase-client.js";
import { withSlowNotice } from "./ui.js";

// Página servida pelo próprio Spring (Render ou localhost:8080) → mesma origem.
// Aberta por outro servidor (ex.: Live Server do VS Code) → usa a API do Render.
const SERVED_BY_API = location.port === "8080" || location.hostname.endsWith("onrender.com");
export const API_BASE = SERVED_BY_API ? "" : "https://hoko-api.onrender.com";

/**
 * GET público. Lança erro com `.status` se a resposta não for 2xx.
 * Com `notice` (padrão), mostra o aviso de "acordando o servidor" se demorar.
 */
export async function getJson(path, { notice = true } = {}) {
    const request = fetch(API_BASE + path);
    const response = await (notice ? withSlowNotice(request) : request);
    if (!response.ok) {
        const error = new Error(`Erro ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

/**
 * GET com cache no sessionStorage (stale-while-revalidate):
 * se houver cópia com menos de `maxAgeMs`, chama render(cópia) na hora;
 * depois busca na API e chama render de novo só se o dado mudou.
 * Use para dados que mudam pouco (categorias). Lança erro só se não havia cópia.
 */
export async function getJsonCached(path, render, maxAgeMs = 5 * 60 * 1000) {
    const key = `api-cache:${path}`;
    let cached = null;

    try {
        const entry = JSON.parse(sessionStorage.getItem(key));
        if (entry && Date.now() - entry.at < maxAgeMs) cached = entry.raw;
    } catch { /* sessionStorage indisponível: segue sem cache */ }

    if (cached) render(JSON.parse(cached));

    try {
        const data = await getJson(path, { notice: !cached }); // já tem algo na tela: atualiza em silêncio
        const raw = JSON.stringify(data);
        try {
            sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), raw }));
        } catch { /* sem espaço ou bloqueado */ }
        if (raw !== cached) render(data);
    } catch (error) {
        if (!cached) throw error; // sem cópia para mostrar: quem chamou trata o erro
    }
}

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const response = await fetch(API_BASE + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return null;

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(payload?.message ?? `Erro ${response.status}`);
        error.status = response.status;
        error.body = payload;
        throw error;
    }

    return payload;
}
