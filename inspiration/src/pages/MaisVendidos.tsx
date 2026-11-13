import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

interface Props {
  liked: number[];
  onToggleLike: (id: number) => void;
}

export default function MaisVendidos({ liked, onToggleLike }: Props) {
  const sorted = [...ALL_PRODUCTS].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⭐</span>
          <h1 className="text-3xl font-black text-gray-900">Mais Vendidos</h1>
        </div>
        <p className="text-gray-400 text-sm">Os produtos favoritos dos nossos clientes.</p>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {sorted.slice(0, 3).map((p, i) => (
          <div key={p.id} className={`relative bg-white border-2 rounded-3xl p-5 flex flex-col items-center text-center gap-3 ${i === 0 ? "border-yellow-400 shadow-lg" : "border-gray-100"}`}>
            <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md ${i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : "bg-amber-700"}`}>
              {i + 1}
            </span>
            <img src={p.img} alt={p.name} className="w-24 h-24 object-cover rounded-2xl mt-2" />
            <div>
              <p className="text-xs text-gray-400">{p.store}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{p.name}</p>
              <p className="text-lg font-black text-gray-900 mt-1">{p.price}</p>
            </div>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
              Adicionar ao carrinho
            </button>
          </div>
        ))}
      </div>

      {/* Rest of list */}
      <h2 className="text-xl font-black text-gray-900 mb-5">Todos os mais vendidos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {sorted.slice(3).map((p) => (
          <ProductCard key={p.id} product={p} liked={liked.includes(p.id)} onToggleLike={onToggleLike} />
        ))}
      </div>
    </div>
  );
}
