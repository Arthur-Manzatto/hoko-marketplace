import { useState } from "react";
import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

interface Props {
  category: string;
  liked: number[];
  onToggleLike: (id: number) => void;
}

const categoryMeta: Record<string, { icon: string; desc: string }> = {
  "Eletrônicos": { icon: "📱", desc: "Smartphones, notebooks, fones e muito mais." },
  "Moda": { icon: "👗", desc: "Roupas, calçados e acessórios para todos os estilos." },
  "Casa": { icon: "🏠", desc: "Decoração, utensílios e tudo para sua casa." },
  "Casa & Decoração": { icon: "🏠", desc: "Decoração, utensílios e tudo para sua casa." },
  "Beleza": { icon: "✨", desc: "Cosméticos, perfumes e cuidados pessoais." },
  "Esportes": { icon: "🚴", desc: "Equipamentos e roupas para seu esporte favorito." },
  "Games": { icon: "🎮", desc: "Jogos, consoles e acessórios gamer." },
  "Livros": { icon: "📚", desc: "Livros de todos os gêneros e formatos." },
};

const SORTS = ["Relevância", "Menor preço", "Maior preço", "Melhor avaliação"];

export default function Categoria({ category, liked, onToggleLike }: Props) {
  const [sort, setSort] = useState("Relevância");
  const meta = categoryMeta[category] || { icon: "🏷️", desc: "Explore os produtos desta categoria." };
  const catKey = category === "Casa & Decoração" ? "Casa" : category;
  let products = ALL_PRODUCTS.filter((p) => p.category === catKey);
  if (!products.length) products = ALL_PRODUCTS.slice(0, 8);

  const sorted = [...products].sort((a, b) => {
    const pa = parseFloat(a.price.replace(/[^0-9,]/g, "").replace(",", "."));
    const pb = parseFloat(b.price.replace(/[^0-9,]/g, "").replace(",", "."));
    if (sort === "Menor preço") return pa - pb;
    if (sort === "Maior preço") return pb - pa;
    if (sort === "Melhor avaliação") return parseFloat(b.rating) - parseFloat(a.rating);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-8 flex items-center gap-5">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl shrink-0">
          {meta.icon}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">{category}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{meta.desc}</p>
          <p className="text-xs text-blue-700 font-semibold mt-1">{sorted.length} produtos encontrados</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-sm font-medium text-gray-500">Ordenar por:</span>
        {SORTS.map((s) => (
          <button key={s}
            onClick={() => setSort(s)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${sort === s ? "bg-blue-800 text-white border-blue-800" : "border-gray-200 text-gray-600 bg-white hover:border-blue-300"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Products */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} liked={liked.includes(p.id)} onToggleLike={onToggleLike} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📦</p>
          <p className="font-semibold text-gray-600">Nenhum produto encontrado</p>
          <p className="text-sm">Em breve teremos novidades nesta categoria.</p>
        </div>
      )}
    </div>
  );
}
