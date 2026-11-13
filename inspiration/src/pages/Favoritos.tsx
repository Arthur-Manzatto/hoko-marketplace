import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

interface Props {
  liked: number[];
  onToggleLike: (id: number) => void;
}

export default function Favoritos({ liked, onToggleLike }: Props) {
  const favorites = ALL_PRODUCTS.filter((p) => liked.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">❤️</span>
          <h1 className="text-3xl font-black text-gray-900">Favoritos</h1>
        </div>
        <p className="text-gray-400 text-sm">
          {favorites.length > 0
            ? `${favorites.length} produto${favorites.length > 1 ? "s" : ""} salvo${favorites.length > 1 ? "s" : ""}.`
            : "Seus produtos favoritos aparecerão aqui."}
        </p>
      </div>

      {favorites.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {favorites.map((p) => (
              <ProductCard key={p.id} product={p} liked={true} onToggleLike={onToggleLike} />
            ))}
          </div>
          <div className="mt-8 p-5 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <span className="text-3xl">🛒</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">Adicione todos ao carrinho</p>
              <p className="text-xs text-gray-500 mt-0.5">Compre todos os seus favoritos de uma vez.</p>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shrink-0">
              Adicionar tudo
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🤍</p>
          <h2 className="text-xl font-black text-gray-700 mb-2">Nenhum favorito ainda</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Clique no coração dos produtos que você gostou para salvá-los aqui.
          </p>
        </div>
      )}
    </div>
  );
}
