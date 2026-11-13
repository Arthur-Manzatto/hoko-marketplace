export default function MinhaLoja() {
  const stats = [
    { label: "Faturamento mês", value: "R$ 12.480,00", icon: "💰", trend: "+18%", up: true },
    { label: "Pedidos recebidos", value: "87", icon: "📦", trend: "+12%", up: true },
    { label: "Produtos ativos", value: "24", icon: "🛍️", trend: "0%", up: true },
    { label: "Avaliação média", value: "4.9 ★", icon: "⭐", trend: "+0.2", up: true },
  ];

  const recentOrders = [
    { id: "#1204", customer: "Ana Lima", product: "Fone Bluetooth", value: "R$ 249,90", status: "Novo" },
    { id: "#1203", customer: "Bruno Costa", product: "Mochila Urban 25L", value: "R$ 229,90", status: "Enviado" },
    { id: "#1202", customer: "Carla Mendes", product: "Smartwatch Pro X", value: "R$ 399,00", status: "Entregue" },
    { id: "#1201", customer: "Daniel Reis", product: "Cafeteira Aroma", value: "R$ 179,90", status: "Entregue" },
  ];

  const statusColor: Record<string, string> = {
    Novo: "bg-blue-100 text-blue-700",
    Enviado: "bg-yellow-100 text-yellow-700",
    Entregue: "bg-green-100 text-green-700",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🏪</span>
          <h1 className="text-3xl font-black text-gray-900">Minha Loja</h1>
        </div>
        <p className="text-gray-400 text-sm">Visão geral do desempenho da sua loja.</p>
      </div>

      {/* Store header card */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shrink-0">🏪</div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-white font-black text-xl">TechStore Oficial</p>
          <p className="text-blue-200 text-sm mt-0.5">Membro desde Jan 2024 · Vendedor verificado ✓</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            <span className="bg-blue-700 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full">⭐ 4.9 avaliação</span>
            <span className="bg-blue-700 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full">📦 1.2k pedidos</span>
            <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">🏆 Top Vendedor</span>
          </div>
        </div>
        <button className="bg-white text-blue-800 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shrink-0">
          Editar loja
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {s.trend}
              </span>
            </div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-900">Pedidos recentes</h2>
            <button className="text-xs font-semibold text-blue-700 hover:underline">Ver todos</button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">{o.id}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{o.customer}</p>
                  <p className="text-xs text-gray-400 truncate">{o.product}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-900">{o.value}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[o.status]}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-900">Produtos mais vendidos</h2>
            <button className="text-xs font-semibold text-blue-700 hover:underline">Gerenciar</button>
          </div>
          <div className="space-y-3">
            {[
              { name: "Fone Bluetooth Hoko", sales: 342, revenue: "R$ 85.465,80", pct: 92 },
              { name: "Notebook UltraSlim", sales: 87, revenue: "R$ 217.413,00", pct: 68 },
              { name: "Tablet 10\" 128GB", sales: 65, revenue: "R$ 58.435,00", pct: 45 },
              { name: "Headset Gamer RGB", sales: 48, revenue: "R$ 14.395,20", pct: 30 },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-700 truncate">{p.name}</span>
                  <span className="text-gray-400 ml-2 shrink-0">{p.sales} vendas</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
