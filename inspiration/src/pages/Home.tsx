import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

const HERO_IMG = "https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80";

const categories = [
  { label: "Eletrônicos", icon: "📱" },
  { label: "Moda", icon: "👗" },
  { label: "Casa", icon: "🏠" },
  { label: "Beleza", icon: "✨" },
  { label: "Esportes", icon: "🚴" },
  { label: "Games", icon: "🎮" },
  { label: "Livros", icon: "📚" },
  { label: "Ofertas", icon: "🏷️" },
];

interface Props {
  liked: number[];
  onToggleLike: (id: number) => void;
  onNavigate: (page: string) => void;
}

export default function Home({ liked, onToggleLike, onNavigate }: Props) {
  const featured = ALL_PRODUCTS.filter((p) => p.isFeatured);

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
            ✦ Novo marketplace, feito pra você
          </span>
          <h1 className="text-5xl font-black leading-tight text-gray-900 mb-2">
            Tudo o que você<br />procura,
          </h1>
          <h1 className="text-5xl font-black leading-tight text-blue-800 mb-5">
            perto de você.
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
            Milhares de lojas verificados em um só lugar. Compre com segurança, pague em até{" "}
            <strong className="text-gray-700">12x</strong> e receba rápido onde estiver.
          </p>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex flex-1 max-w-sm items-center bg-white border border-gray-200 rounded-full px-4 h-12 gap-2 shadow-sm">
              <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input className="flex-1 bg-transparent text-sm text-gray-500 outline-none" placeholder="O que você procura hoje?" />
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 h-12 rounded-full transition-colors shrink-0">
              Buscar
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-10">
            <span className="text-sm font-medium text-gray-500">Populares:</span>
            {["Fone", "Tênis", "Cafeteira", "Mochila", "Notebook"].map((tag) => (
              <button key={tag} className="border border-gray-200 rounded-full px-3 py-0.5 text-xs hover:border-orange-400 hover:text-orange-500 transition-colors bg-white text-gray-500">
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-8">
            <div><p className="text-2xl font-black text-gray-900">+12k</p><p className="text-xs text-gray-400">lojas ativas</p></div>
            <div><p className="text-2xl font-black text-gray-900">+2M</p><p className="text-xs text-gray-400">produtos</p></div>
            <div><p className="text-2xl font-black text-gray-900">4.8 <span className="text-orange-500">★</span></p><p className="text-xs text-gray-400">avaliação média</p></div>
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden h-[480px]">
            <img src={HERO_IMG} alt="Mulher com sacolas de compras" className="w-full h-full object-cover object-top" />
          </div>
          <div className="absolute top-6 left-6 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-lg">🚚</div>
            <div><p className="text-xs font-bold text-gray-800">Entrega em 24h</p><p className="text-xs text-gray-400">sua cidade</p></div>
          </div>
          <div className="absolute bottom-6 right-6 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-lg">🛡️</div>
            <div><p className="text-xs font-bold text-gray-800">Compra protegida</p><p className="text-xs text-gray-400">100% Hoko</p></div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Explore por categoria</h2>
            <p className="text-sm text-gray-400 mt-0.5">Ache o que precisa em segundos.</p>
          </div>
          <button onClick={() => onNavigate("Produtos")} className="text-sm font-semibold text-blue-800 hover:underline flex items-center gap-1">Ver todas ›</button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <button key={cat.label}
              onClick={() => onNavigate(cat.label === "Ofertas" ? "Ofertas do Dia" : cat.label)}
              className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl py-4 px-2 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors">
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-800 transition-colors">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-3xl px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-orange-300 text-xs font-bold uppercase tracking-widest mb-1">Oferta especial</p>
            <h3 className="text-white text-2xl font-black">Até 60% OFF em eletrônicos</h3>
            <p className="text-blue-200 text-sm mt-1">Só hoje, enquanto durar o estoque.</p>
          </div>
          <button onClick={() => onNavigate("Ofertas do Dia")} className="bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-7 py-3 rounded-2xl transition-colors shrink-0 shadow-lg">
            Ver ofertas →
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Ofertas em destaque</h2>
            <p className="text-sm text-gray-400 mt-0.5">Selecionados a dedo pra você hoje.</p>
          </div>
          <button onClick={() => onNavigate("Ofertas do Dia")} className="text-sm font-semibold text-blue-800 hover:underline flex items-center gap-1">Ver todas ›</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} liked={liked.includes(p.id)} onToggleLike={onToggleLike} />
          ))}
        </div>
      </section>
    </div>
  );
}
