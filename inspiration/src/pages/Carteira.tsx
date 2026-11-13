import { useState } from "react";
import { TRANSACTIONS } from "@/data";

export default function Carteira() {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💳</span>
          <h1 className="text-3xl font-black text-gray-900">Carteira</h1>
        </div>
        <p className="text-gray-400 text-sm">Gerencie seu saldo e pagamentos.</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue-800 to-indigo-700 rounded-3xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-600 rounded-full opacity-30" />
        <div className="absolute right-10 bottom-0 w-32 h-32 bg-indigo-500 rounded-full opacity-20" />
        <div className="relative">
          <p className="text-blue-200 text-sm font-medium mb-1">Saldo disponível</p>
          <p className="text-white text-4xl font-black mb-4">R$ 294,09</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowAdd(true)} className="bg-white text-blue-800 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
              + Depositar
            </button>
            <button className="bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors border border-blue-600">
              Sacar
            </button>
          </div>
        </div>
      </div>

      {/* Add funds modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-4">Depositar via Pix</h3>
            <p className="text-sm text-gray-500 mb-4">Informe o valor que deseja adicionar à carteira.</p>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 mb-4 gap-2">
              <span className="text-gray-400 font-semibold text-sm">R$</span>
              <input
                className="flex-1 outline-none text-gray-900 font-bold"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total gasto", value: "R$ 1.447,70", icon: "💸", color: "text-red-500" },
          { label: "Cashback total", value: "R$ 24,99", icon: "🎁", color: "text-green-600" },
          { label: "Parcelas ativas", value: "3", icon: "📅", color: "text-blue-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-gray-900">Métodos de pagamento</h2>
          <button className="text-sm font-semibold text-blue-700 hover:underline">+ Adicionar</button>
        </div>
        <div className="space-y-3">
          {[
            { type: "Pix", last: "CPF •••.890-00", icon: "⚡" },
            { type: "Cartão Crédito", last: "**** **** **** 4521", icon: "💳" },
            { type: "Boleto", last: "Pagamento via boleto", icon: "📄" },
          ].map((m) => (
            <div key={m.type} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">{m.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{m.type}</p>
                <p className="text-xs text-gray-400">{m.last}</p>
              </div>
              <button className="text-xs text-red-400 hover:text-red-600 font-medium">Remover</button>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-base font-black text-gray-900 mb-4">Extrato</h2>
        <div className="space-y-2">
          {TRANSACTIONS.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${t.type === "entrada" ? "bg-green-50" : "bg-red-50"}`}>
                {t.type === "entrada" ? "⬆️" : "⬇️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{t.desc}</p>
                <p className="text-xs text-gray-400">{t.date}</p>
              </div>
              <span className={`text-sm font-black shrink-0 ${t.type === "entrada" ? "text-green-600" : "text-red-500"}`}>
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
