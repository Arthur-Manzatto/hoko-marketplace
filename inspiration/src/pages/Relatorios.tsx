const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"];
const revenueData = [4200, 5800, 7100, 6400, 9200, 8600, 11400, 10200, 12480];
const ordersData = [31, 44, 55, 48, 72, 65, 89, 78, 87];
const maxRevenue = Math.max(...revenueData);

export default function Relatorios() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          <h1 className="text-3xl font-black text-gray-900">Relatórios</h1>
        </div>
        <p className="text-gray-400 text-sm">Análise de desempenho da sua loja.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Faturamento total", value: "R$ 85.460", icon: "💰", sub: "+22% vs ano passado", positive: true },
          { label: "Total de pedidos", value: "569", icon: "📦", sub: "+15% vs ano passado", positive: true },
          { label: "Ticket médio", value: "R$ 150,20", icon: "🎯", sub: "+6% vs mês passado", positive: true },
          { label: "Taxa de cancelamento", value: "2,3%", icon: "❌", sub: "-0.8% vs mês passado", positive: true },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            <p className={`text-xs font-semibold mt-1.5 ${s.positive ? "text-green-600" : "text-red-500"}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-black text-gray-900">Faturamento mensal</h2>
            <p className="text-xs text-gray-400">Jan – Set 2026</p>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">+22% vs 2025</span>
        </div>
        <div className="flex items-end gap-2 h-44">
          {revenueData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-gray-400 font-medium">
                {v >= 10000 ? `${(v / 1000).toFixed(0)}k` : `${(v / 1000).toFixed(1)}k`}
              </span>
              <div
                className={`w-full rounded-t-lg transition-all ${i === revenueData.length - 1 ? "bg-blue-800" : "bg-blue-200"}`}
                style={{ height: `${(v / maxRevenue) * 100}%` }}
              />
              <span className="text-[9px] text-gray-400">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-base font-black text-gray-900 mb-5">Pedidos por mês</h2>
          <div className="space-y-2">
            {months.map((m, i) => (
              <div key={m} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6">{m}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === ordersData.length - 1 ? "bg-orange-500" : "bg-orange-300"}`}
                    style={{ width: `${(ordersData[i] / Math.max(...ordersData)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 w-6 text-right">{ordersData[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-base font-black text-gray-900 mb-5">Vendas por categoria</h2>
          <div className="space-y-3">
            {[
              { cat: "Eletrônicos", pct: 58, color: "bg-blue-600" },
              { cat: "Esportes", pct: 20, color: "bg-orange-500" },
              { cat: "Casa", pct: 12, color: "bg-purple-500" },
              { cat: "Beleza", pct: 10, color: "bg-pink-500" },
            ].map((c) => (
              <div key={c.cat}>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-gray-700">{c.cat}</span>
                  <span className="text-gray-400">{c.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button className="w-full text-sm font-bold text-blue-700 border border-blue-200 rounded-xl py-2.5 hover:bg-blue-50 transition-colors">
              Exportar relatório completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
