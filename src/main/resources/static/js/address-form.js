// Formulário de endereço (checkout e Minha conta). Monta o HTML dentro de `box`,
// formata o CEP, preenche rua/bairro/cidade/UF sozinho pelo CEP (js/br.js) e
// devolve funções para preencher, ler e mostrar erros.
import { clearFieldErrors, showFieldErrors } from "./ui.js";
import { lookupCep, maskCep, onlyDigits } from "./br.js";

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

const ERRORS = {
    "Zip code must be 00000-000 or 00000000": "CEP inválido.",
    "State must be the 2-letter UF code": "Escolha o estado.",
    "must not be blank": "Campo obrigatório.",
};

export function setupAddressForm(box, { onSubmit, onCancel, submitLabel = "Salvar endereço" }) {
    box.innerHTML = `
        <form class="endereco-form" novalidate>
            <p class="form-erro" role="alert" hidden></p>
            <div class="form-row">
                <div class="form-group col-6 col-md-4">
                    <label>CEP<input class="form-control" name="zipCode" inputmode="numeric" maxlength="9" placeholder="00000-000"
                        autocomplete="postal-code" required></label>
                    <small class="campo-dica" data-cep-status aria-live="polite"></small>
                </div>
                <div class="form-group col-6 col-md-8">
                    <label>Apelido <small class="texto-suave">(opcional)</small><input class="form-control" name="label" maxlength="30" placeholder="Casa, Trabalho…"></label>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group col-8 col-md-9">
                    <label>Rua<input class="form-control" name="street" maxlength="255" required></label>
                </div>
                <div class="form-group col-4 col-md-3">
                    <label>Número<input class="form-control" name="number" maxlength="20" required></label>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label>Complemento <small class="texto-suave">(opcional)</small><input class="form-control" name="complement" maxlength="100"></label>
                </div>
                <div class="form-group col-md-6">
                    <label>Bairro<input class="form-control" name="neighborhood" maxlength="100" required></label>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group col-8">
                    <label>Cidade<input class="form-control" name="city" maxlength="100" required></label>
                </div>
                <div class="form-group col-4">
                    <label>UF<select class="custom-select" name="state" required>
                        <option value="">—</option>${UFS.map(uf => `<option>${uf}</option>`).join("")}
                    </select></label>
                </div>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-link mr-2" type="button" data-cancel>Cancelar</button>
                <button class="btn btn-custom" type="submit">${submitLabel}</button>
            </div>
        </form>`;

    const form = box.querySelector("form");

    // ---- CEP: máscara + endereço automático
    const status = form.querySelector("[data-cep-status]");
    const AUTO = ["street", "neighborhood", "city", "state"];
    let autofilled = {};      // o que o CEP preencheu (só sobrescreve o que o usuário não mudou)
    let cepNotFound = false;
    let lastCep = "";

    function setStatus(text, kind = "") {
        status.textContent = text;
        status.className = `campo-dica ${kind}`;
    }

    async function fillFromCep() {
        const digits = onlyDigits(form.zipCode.value);
        if (digits.length !== 8 || digits === lastCep) return;
        lastCep = digits;
        cepNotFound = false;
        form.zipCode.classList.remove("is-invalid");
        setStatus("Buscando endereço…", "carregando");
        try {
            const address = await lookupCep(digits);
            if (onlyDigits(form.zipCode.value) !== digits) return; // mudou enquanto buscava
            if (!address) {
                // limpa o que veio do CEP anterior (o que o usuário digitou fica)
                for (const key of AUTO) {
                    if (autofilled[key] && form.elements[key].value === autofilled[key]) form.elements[key].value = "";
                }
                autofilled = {};
                cepNotFound = true;
                form.zipCode.classList.add("is-invalid");
                setStatus("CEP não encontrado. Confira os números.", "erro");
                return;
            }
            for (const key of AUTO) {
                const field = form.elements[key];
                const value = address[key] ?? "";
                if (value && (!field.value || field.value === autofilled[key])) field.value = value;
            }
            autofilled = { ...address };
            setStatus(`${address.city}/${address.state}`, "ok");
            // CEP geral da cidade vem sem rua: o cursor vai para a rua; senão, direto para o número
            (address.street ? form.elements.number : form.elements.street).focus();
        } catch {
            setStatus("Não foi possível buscar o CEP agora. Preencha o endereço à mão.", "");
        }
    }

    form.zipCode.addEventListener("input", () => {
        form.zipCode.value = maskCep(form.zipCode.value);
        if (onlyDigits(form.zipCode.value).length < 8) {
            lastCep = "";
            cepNotFound = false;
            form.zipCode.classList.remove("is-invalid");
            setStatus("");
        }
        fillFromCep();
    });

    form.querySelector("[data-cancel]").addEventListener("click", () => onCancel?.());
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearFieldErrors(form);
        if (cepNotFound) {
            showFieldErrors(form, { body: { errors: [{ fieldName: "zipCode", message: "CEP não encontrado." }] } });
            return;
        }
        onSubmit(read(), form.querySelector("[type=submit]"));
    });

    function read() {
        const value = name => form.elements[name].value.trim();
        return {
            label: value("label") || null,
            street: value("street"),
            number: value("number"),
            complement: value("complement") || null,
            neighborhood: value("neighborhood"),
            city: value("city"),
            state: value("state"),
            zipCode: value("zipCode"),
        };
    }

    return {
        form,
        fill(address) {
            form.reset();
            clearFieldErrors(form);
            autofilled = {};
            cepNotFound = false;
            lastCep = onlyDigits(address?.zipCode); // endereço salvo: não refaz a busca
            setStatus("");
            for (const key of ["label", "street", "number", "complement", "neighborhood", "city", "state", "zipCode"]) {
                form.elements[key].value = address?.[key] ?? "";
            }
        },
        showErrors(error) {
            showFieldErrors(form, error, ERRORS);
        },
        focus() {
            form.zipCode.focus();
        },
    };
}

/** Uma linha de texto do endereço: "Rua X, 123 - Apto 4 · Centro, Campinas/SP · 13010-000". */
export function addressText(a) {
    const street = `${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ""}`;
    return `${street} · ${a.neighborhood}, ${a.city}/${a.state} · ${a.zipCode}`;
}

/** O campo "padrão" vem como isDefault no JSON. */
export function isDefaultAddress(a) {
    return Boolean(a.isDefault ?? a.default);
}
