import type { Product } from "@/data";

interface Props {
  product: Product;
  liked: boolean;
  onToggleLike: (id: number) => void;
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="#f97316">
      <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 7.95 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z" />
    </svg>
  );
}

export default function ProductCard({ product: p, liked, onToggleLike }: Props) {
  const openProduct = () => {
    window.location.hash = `produto/${p.id}`;
  };

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
      onClick={openProduct}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openProduct();
      }}
      role="link"
      tabIndex={0}
      aria-label={`Ver detalhes de ${p.name}`}
    >
      <div className="relative bg-gray-50 h-52">
        {p.badge && (
          <span className={`absolute top-3 left-3 z-10 text-white text-[10px] font-bold px-2.5 py-1 rounded-full ${p.badgeColor}`}>
            {p.badge}
          </span>
        )}
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleLike(p.id);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={liked ? "#ef4444" : "none"}
            stroke={liked ? "#ef4444" : "#9ca3af"}
            strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1">
          <StarIcon />
          <span className="text-xs font-semibold text-gray-700">{p.rating}</span>
          <span className="text-xs text-gray-400">· {p.store}</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug">{p.name}</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-black text-gray-900">{p.price}</span>
          <span className="text-xs text-gray-400 line-through">{p.oldPrice}</span>
        </div>
        <button onClick={(event) => event.stopPropagation()} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold h-10 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Adicionar
        </button>
      </div>
    </div>
  );
}
