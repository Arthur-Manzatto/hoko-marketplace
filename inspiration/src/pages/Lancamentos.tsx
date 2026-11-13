import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

interface Props {
  liked: number[];
  onToggleLike: (id: number) => void;
}

export default function Lancamentos({ liked, onToggleLike }: Props) {
  const newItems = ALL_PRODUCTS.filter((p) => p.isNew);
  const recent = ALL_PRODUCTS.filter((p) => !p.isNew).slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🆕</span>
          <h1 className="text-3xl font-black text-gray-900">Lançamentos</h1>
        </div>
        <p className="text-gray-400 text-sm">As novidades que acabaram de chegar na plataforma.</p>
      </div>

      {/* New arrivals banner */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 rounded-3xl p-8 mb-10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full opacity-30" />
        <div className="absolute -right-5 bottom-0 w-60 h-24 bg-indigo-600 rounded-full opacity-20" />
        <div className="relative">
          <span className="inline-block bg-blue-600 text-blue-100 text-xs font-bold px-3 py-1 rounded-full mb-3">✨ Chegou agora</span>
          <h2 className="text-white text-2xl font-black">Novidades da semana</h2>
          <p className="text-blue-200 text-sm mt-1 max-w-md">Produtos fresquinhos chegando todos os dias. Seja o primeiro a ter!</p>
        </div>
      </div>

      {/* New items */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-black text-gray-900">Recém chegados</h2>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{newItems.length} novos</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {newItems.map((p) => (
          <ProductCard key={p.id} product={p} liked={liked.includes(p.id)} onToggleLike={onToggleLike} />
        ))}
      </div>

      <h2 className="text-xl font-black text-gray-900 mb-5">Em alta esta semana</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {recent.map((p) => (
          <ProductCard key={p.id} product={p} liked={liked.includes(p.id)} onToggleLike={onToggleLike} />
        ))}
      </div>
    </div>
  );
}
