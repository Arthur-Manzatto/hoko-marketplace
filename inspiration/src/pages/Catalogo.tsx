import { useMemo, useState } from "react";
import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

interface Props {
  liked: number[];
  onToggleLike: (id: number) => void;
  initialSearch?: string;
}

const categories = ["Todos", "Eletrônicos", "Moda", "Casa", "Beleza", "Esportes", "Games", "Livros"];
const priceRanges = [
  { label: "Todos os preços", min: 0, max: Infinity },
  { label: "Até R$ 200", min: 0, max: 200 },
  { label: "R$ 200 a R$ 500", min: 200, max: 500 },
  { label: "R$ 500 a R$ 1.000", min: 500, max: 1000 },
  { label: "Acima de R$ 1.000", min: 1000, max: Infinity },
];

function toNumber(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", "."));
}

export default function Catalogo({ liked, onToggleLike, initialSearch = "" }: Props) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("Todos");
  const [priceRange, setPriceRange] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [offersOnly, setOffersOnly] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [sort, setSort] = useState("Relevância");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const products = useMemo(() => {
    const selectedRange = priceRanges[priceRange];
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = ALL_PRODUCTS.filter((product) => {
      const price = toNumber(product.price);
      const matchesSearch = !normalizedSearch ||
        product.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        product.store.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        product.category.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesPrice = price >= selectedRange.min && price <= selectedRange.max;
      const matchesRating = Number(product.rating) >= minRating;
      const matchesOffer = !offersOnly || Boolean(product.badge?.includes("OFF") || product.badge === "Oferta");
      const matchesShipping = !freeShipping || product.badge === "Frete grátis";
      return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesOffer && matchesShipping;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "Menor preço") return toNumber(a.price) - toNumber(b.price);
      if (sort === "Maior preço") return toNumber(b.price) - toNumber(a.price);
      if (sort === "Melhor avaliação") return Number(b.rating) - Number(a.rating);
      if (sort === "Novidades") return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
      return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    });
  }, [category, freeShipping, minRating, offersOnly, priceRange, search, sort]);

  const activeFilters = [
    category !== "Todos",
    priceRange !== 0,
    minRating > 0,
    offersOnly,
    freeShipping,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setCategory("Todos");
    setPriceRange(0);
    setMinRating(0);
    setOffersOnly(false);
    setFreeShipping(false);
    setSort("Relevância");
  };

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-gray-900">Filtros</h2>
        {(activeFilters > 0 || search) && <button onClick={clearFilters} className="text-xs font-bold text-blue-800 hover:underline">Limpar tudo</button>}
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-gray-800">Categoria</legend>
        <div className="space-y-2.5">
          {categories.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
              <input type="radio" name="category" checked={category === item} onChange={() => setCategory(item)} className="h-4 w-4 accent-blue-800" />
              <span className={category === item ? "font-bold text-blue-900" : ""}>{item}</span>
              <span className="ml-auto text-xs text-gray-400">
                {item === "Todos" ? ALL_PRODUCTS.length : ALL_PRODUCTS.filter((product) => product.category === item).length}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-t border-gray-100 pt-5">
        <legend className="mb-3 text-sm font-bold text-gray-800">Preço</legend>
        <div className="space-y-2.5">
          {priceRanges.map((range, index) => (
            <label key={range.label} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
              <input type="radio" name="price" checked={priceRange === index} onChange={() => setPriceRange(index)} className="h-4 w-4 accent-blue-800" />
              <span className={priceRange === index ? "font-bold text-blue-900" : ""}>{range.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-t border-gray-100 pt-5">
        <legend className="mb-3 text-sm font-bold text-gray-800">Avaliação mínima</legend>
        <div className="flex flex-wrap gap-2">
          {[0, 4, 4.5, 4.8].map((rating) => (
            <button key={rating} onClick={() => setMinRating(rating)}
              className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${minRating === rating ? "border-blue-800 bg-blue-800 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"}`}>
              {rating === 0 ? "Todas" : `${rating}+ ★`}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-gray-100 pt-5">
        <legend className="mb-3 text-sm font-bold text-gray-800">Benefícios</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
          <input type="checkbox" checked={offersOnly} onChange={(event) => setOffersOnly(event.target.checked)} className="h-4 w-4 rounded accent-blue-800" />
          Somente ofertas
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
          <input type="checkbox" checked={freeShipping} onChange={(event) => setFreeShipping(event.target.checked)} className="h-4 w-4 rounded accent-blue-800" />
          Frete grátis
        </label>
      </fieldset>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-8 text-white sm:px-9">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Catálogo Hoko</p>
        <h1 className="mt-2 text-3xl font-black">Encontre o produto ideal</h1>
        <p className="mt-2 max-w-xl text-sm text-blue-100">Compare produtos, preços e avaliações de lojas verificadas.</p>
        <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl">
          <svg className="ml-2 h-5 w-5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.4-4.4" /></svg>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none" placeholder="Busque por produto, loja ou categoria" />
          {search && <button onClick={() => setSearch("")} className="rounded-lg px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100">Limpar</button>}
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-gray-900">{products.length} {products.length === 1 ? "produto encontrado" : "produtos encontrados"}</p>
          {(search || activeFilters > 0) && <p className="mt-0.5 text-xs text-gray-400">Resultados atualizados automaticamente</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(true)} className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 lg:hidden">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            Filtros
            {activeFilters > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">{activeFilters}</span>}
          </button>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none">
            {["Relevância", "Menor preço", "Maior preço", "Melhor avaliação", "Novidades"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[240px_1fr]">
        <aside className="hidden self-start rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:block">{filters}</aside>
        <div>
          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product} liked={liked.includes(product.id)} onToggleLike={onToggleLike} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.4-4.4" /></svg>
              </span>
              <h2 className="mt-4 text-lg font-black">Nenhum produto encontrado</h2>
              <p className="mt-1 text-sm text-gray-500">Tente remover alguns filtros ou buscar outro termo.</p>
              <button onClick={clearFilters} className="mt-5 rounded-xl bg-blue-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-900">Limpar filtros</button>
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setFiltersOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-80 max-w-full overflow-y-auto bg-white p-6 shadow-2xl lg:hidden">
            <div className="mb-6 flex justify-end">
              <button onClick={() => setFiltersOpen(false)} className="rounded-xl bg-gray-100 p-2 text-gray-600" aria-label="Fechar filtros">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>
            {filters}
            <button onClick={() => setFiltersOpen(false)} className="mt-8 h-12 w-full rounded-xl bg-orange-500 text-sm font-bold text-white">Ver {products.length} produtos</button>
          </aside>
        </>
      )}
    </div>
  );
}
