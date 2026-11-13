import { useState, useEffect } from "react";
import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

interface Props {
  liked: number[];
  onToggleLike: (id: number) => void;
}

function useCountdown() {
  const getEnd = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    return d;
  };
  const calc = () => {
    const diff = Math.max(0, getEnd().getTime() - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function Pad({ n }: { n: number }) {
  return <span className="bg-blue-800 text-white font-black text-2xl px-3 py-1.5 rounded-xl min-w-[52px] text-center tabular-nums">{String(n).padStart(2, "0")}</span>;
}

export default function OfertasDia({ liked, onToggleLike }: Props) {
  const { h, m, s } = useCountdown();
  const deals = ALL_PRODUCTS.filter((p) => p.badge?.includes("OFF") || p.badge === "Oferta" || p.badge === "Mais vendido");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <h1 className="text-3xl font-black text-gray-900">Ofertas do Dia</h1>
          </div>
          <p className="text-gray-400 text-sm">Descontos exclusivos que terminam à meia-noite.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 mr-1">Termina em:</span>
          <Pad n={h} />
          <span className="text-blue-800 font-black text-xl">:</span>
          <Pad n={m} />
          <span className="text-blue-800 font-black text-xl">:</span>
          <Pad n={s} />
        </div>
      </div>

      {/* Highlight banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <span className="text-orange-100 text-xs font-bold uppercase tracking-widest">Destaque do dia</span>
          <h2 className="text-white text-2xl font-black mt-1">Relógio Smartwatch Pro X</h2>
          <p className="text-orange-100 text-sm mt-1">De R$ 999,00 por apenas R$ 399,00. Últimas 8 unidades!</p>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-white text-3xl font-black">R$ 399,00</span>
            <span className="text-orange-200 line-through text-lg">R$ 999,00</span>
            <span className="bg-white text-orange-500 text-xs font-black px-2 py-1 rounded-full">60% OFF</span>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"
          alt="Smartwatch"
          className="w-36 h-36 object-cover rounded-2xl shadow-xl"
        />
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { name: "Fone Bluetooth", sold: 87, total: 100 },
          { name: "Cafeteira Aroma", sold: 43, total: 60 },
          { name: "Mochila Urban", sold: 21, total: 50 },
        ].map((item) => (
          <div key={item.name} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
              <span>{item.name}</span>
              <span className="text-orange-500 font-bold">{item.sold}/{item.total} vendidos</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all"
                style={{ width: `${(item.sold / item.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Products grid */}
      <h2 className="text-xl font-black text-gray-900 mb-5">Todos os produtos em oferta</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {deals.map((p) => (
          <ProductCard key={p.id} product={p} liked={liked.includes(p.id)} onToggleLike={onToggleLike} />
        ))}
      </div>
    </div>
  );
}
