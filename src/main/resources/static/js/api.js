import { supabase } from "./supabase-client.js";

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const response = await fetch(path, {
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