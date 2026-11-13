// Slider de faixa de preço com 2 bolinhas (dois <input type="range"> sobrepostos).
// Os limites vêm da API (menor e maior preço do que está sendo filtrado).
import { formatPrice } from "./ui.js";

export function createPriceRange(root, { onChange }) {
    const lo = root.querySelector("[data-lo]");
    const hi = root.querySelector("[data-hi]");
    const fill = root.querySelector(".price-range-fill");
    const loLabel = root.querySelector("[data-lo-label]");
    const hiLabel = root.querySelector("[data-hi-label]");

    let min = 0;
    let max = 0;

    function paint() {
        const span = max - min || 1;
        const a = ((Number(lo.value) - min) / span) * 100;
        const b = ((Number(hi.value) - min) / span) * 100;
        fill.style.left = `${a}%`;
        fill.style.width = `${b - a}%`;
        loLabel.textContent = formatPrice(lo.value);
        hiLabel.textContent = formatPrice(hi.value);
        lo.setAttribute("aria-valuetext", formatPrice(lo.value));
        hi.setAttribute("aria-valuetext", formatPrice(hi.value));
    }

    // uma bolinha não passa da outra
    lo.addEventListener("input", () => {
        if (Number(lo.value) > Number(hi.value)) lo.value = hi.value;
        paint();
    });
    hi.addEventListener("input", () => {
        if (Number(hi.value) < Number(lo.value)) hi.value = lo.value;
        paint();
    });
    // filtra quando solta a bolinha (não a cada pixel)
    lo.addEventListener("change", () => onChange());
    hi.addEventListener("change", () => onChange());

    return {
        /** Limites do slider (arredondados para fora, de 10 em 10). */
        setBounds(lowest, highest) {
            min = Math.floor((Number(lowest) || 0) / 10) * 10;
            max = Math.ceil((Number(highest) || 0) / 10) * 10;
            for (const input of [lo, hi]) {
                input.min = min;
                input.max = max;
                input.step = max - min > 1000 ? 10 : 1;
                input.disabled = max <= min;
            }
            root.classList.toggle("is-disabled", max <= min);
            root.classList.add("pronto"); // antes disso o slider fica como skeleton
        },

        /** Posição das bolinhas; vazio = ponta do slider. Valores fora dos limites são encaixados. */
        setValue(from, to) {
            const clamp = v => Math.min(max, Math.max(min, Number(v)));
            lo.value = from === "" || from == null ? min : clamp(from);
            hi.value = to === "" || to == null ? max : clamp(to);
            if (Number(lo.value) > Number(hi.value)) lo.value = hi.value;
            paint();
        },

        /** minPrice/maxPrice para a API; a bolinha encostada na ponta não filtra. */
        getFilter() {
            return {
                minPrice: Number(lo.value) > min ? lo.value : "",
                maxPrice: Number(hi.value) < max ? hi.value : "",
            };
        },
    };
}
