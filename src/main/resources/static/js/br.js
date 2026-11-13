// Coisas do Brasil: CEP -> endereço (ViaCEP, com BrasilAPI de reserva) e CPF/CNPJ (dígitos verificadores).
// A API (SellerService) faz a mesma checagem de CPF/CNPJ; aqui é para avisar antes de enviar.

const cepCache = new Map();

/** Só os dígitos. */
export const onlyDigits = (text) => String(text ?? "").replace(/\D/g, "");

/** "01310100" -> "01310-100" (aceita digitação parcial). */
export function maskCep(text) {
    const d = onlyDigits(text).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

async function fetchJson(url, ms = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (response.status === 404) return { notFound: true };
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Endereço do CEP: { street, neighborhood, city, state } ou null se o CEP não existe.
 * Lança erro só se os dois serviços estiverem fora do ar.
 */
export async function lookupCep(cep) {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return null;
    if (cepCache.has(digits)) return cepCache.get(digits);

    let result;
    try {
        const v = await fetchJson(`https://viacep.com.br/ws/${digits}/json/`);
        result = v.erro || v.notFound ? null
            : { street: v.logradouro, neighborhood: v.bairro, city: v.localidade, state: v.uf };
    } catch {
        // ViaCEP fora do ar: tenta a BrasilAPI
        const b = await fetchJson(`https://brasilapi.com.br/api/cep/v1/${digits}`);
        result = b.notFound || !b.city ? null
            : { street: b.street, neighborhood: b.neighborhood, city: b.city, state: b.state };
    }
    cepCache.set(digits, result);
    return result;
}

// ---------------------------------------------------------------- CPF / CNPJ

function allSame(d) {
    return /^(\d)\1+$/.test(d);
}

function checkDigit(digits, weights) {
    const sum = weights.reduce((acc, w, i) => acc + Number(digits[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(text) {
    const d = onlyDigits(text);
    if (d.length !== 11 || allSame(d)) return false;
    return checkDigit(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[9])
        && checkDigit(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10]);
}

export function isValidCnpj(text) {
    const d = onlyDigits(text);
    if (d.length !== 14 || allSame(d)) return false;
    return checkDigit(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12])
        && checkDigit(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13]);
}

/** Máscara conforme o tamanho: até 11 dígitos = CPF (000.000.000-00), depois CNPJ (00.000.000/0000-00). */
export function maskDocument(text) {
    const d = onlyDigits(text).slice(0, 14);
    if (d.length <= 11) {
        return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Diz o que há de errado no documento (ou "" se estiver ok).
 * `partial`: enquanto digita, não reclama de documento incompleto.
 */
export function documentProblem(text, { partial = false } = {}) {
    const d = onlyDigits(text);
    if (d.length === 0) return partial ? "" : "Digite o CPF ou o CNPJ.";
    if (d.length === 11) return isValidCpf(d) ? "" : "CPF inválido. Confira os números.";
    if (d.length === 14) return isValidCnpj(d) ? "" : "CNPJ inválido. Confira os números.";
    if (partial) return "";
    return "CPF tem 11 números e CNPJ tem 14.";
}

/**
 * Liga um campo de CPF/CNPJ: máscara enquanto digita e aviso na hora (verde quando válido).
 * Devolve validate(): mostra o problema no campo e diz se pode enviar.
 */
export function setupDocumentField(input) {
    const hint = document.createElement("small");
    hint.className = "campo-dica";
    hint.setAttribute("aria-live", "polite");
    input.insertAdjacentElement("afterend", hint);
    input.setAttribute("inputmode", "numeric");
    input.setAttribute("maxlength", "18");
    input.setAttribute("autocomplete", "off");

    function show(problem, ok) {
        input.classList.toggle("is-invalid", Boolean(problem));
        input.classList.toggle("is-valid", ok);
        hint.textContent = problem || (ok ? (onlyDigits(input.value).length === 11 ? "CPF válido" : "CNPJ válido") : "");
        hint.classList.toggle("erro", Boolean(problem));
        hint.classList.toggle("ok", ok);
    }

    function refresh(partial) {
        const problem = documentProblem(input.value, { partial });
        const len = onlyDigits(input.value).length;
        show(problem, !problem && (len === 11 || len === 14));
        return !problem;
    }

    input.addEventListener("input", () => {
        input.value = maskDocument(input.value);
        refresh(true);
    });
    input.addEventListener("blur", () => { if (input.value) refresh(false); });

    return {
        validate() {
            const ok = refresh(false);
            if (!ok) input.focus();
            return ok;
        },
        /** Preenche (ex.: documento salvo) já com a máscara. */
        set(value) {
            input.value = maskDocument(value);
            show("", false);
        },
        value: () => onlyDigits(input.value),
    };
}
