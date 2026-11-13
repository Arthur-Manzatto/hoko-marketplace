import { useState } from "react";
import { ORDERS } from "@/data";
import type { Order } from "@/data";

const STATUS_MAP = {
  entregue: { label: "Entregue", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  em_transito: { label: "Em trânsito", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  processando: { label: "Processando", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-600", dot: "bg-red-500" },
};

const FILTERS = ["Todos", "Em trânsito", "Entregue", "Processando", "Cancelado"];

function OrderCard({ order }: { order: Order }) {
  const st = STATUS_MAP[order.status];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
      <img src={order.img} alt={order.items} className="w-16 h-16 object-cover rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-gray-400">{order.id}</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{order.items}</p>
            <p className="text-xs text-gray-400 mt-0.5">{order.date}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <p className="text-base font-black text-gray-900">{order.total}</p>
        <div className="flex gap-2">
          <button className="text-xs font-semibold text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            Detalhes
          </button>
          {order.status === "entregue" && (
            <button className="text-xs font-semibold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
              Avaliar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeusPedidos() {
  const [filter, setFilter] = useState("Todos");
  const filtered = ORDERS.filter((o) => {
    if (filter === "Todos") return true;
    return STATUS_MAP[o.status].label === filter;
  });

  const counts = {
    Todos: ORDERS.length,
    "Em trânsito": ORDERS.filter((o) => o.status === "em_transito").length,
    "Entregue": ORDERS.filter((o) => o.status === "entregue").length,
    "Processando": ORDERS.filter((o) => o.status === "processando").length,
    "Cancelado": ORDERS.filter((o) => o.status === "cancelado").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📦</span>
          <h1 className="text-3xl font-black text-gray-900">Meus Pedidos</h1>
        </div>
        <p className="text-gray-400 text-sm">Acompanhe o status das suas compras.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total de pedidos", value: ORDERS.length, icon: "📦", color: "text-blue-700" },
          { label: "Em trânsito", value: counts["Em trânsito"], icon: "🚚", color: "text-blue-600" },
          { label: "Entregues", value: counts["Entregue"], icon: "✅", color: "text-green-600" },
          { label: "Cancelados", value: counts["Cancelado"], icon: "❌", color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${filter === f ? "bg-blue-800 text-white border-blue-800" : "border-gray-200 text-gray-600 bg-white hover:border-blue-300"}`}>
            {f}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f ? "bg-blue-700 text-blue-100" : "bg-gray-100 text-gray-500"}`}>
              {counts[f as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map((o) => (
          <OrderCard key={o.id} order={o} />
        )) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📭</p>
            <p className="font-semibold text-gray-600">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
