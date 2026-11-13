import { useState } from "react";

export default function Configuracoes() {
  const [name, setName] = useState("João Dias");
  const [email, setEmail] = useState("joao@email.com");
  const [phone, setPhone] = useState("(11) 99999-8888");
  const [tab, setTab] = useState<"perfil" | "seguranca" | "notif" | "privacidade">("perfil");
  const [saved, setSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ pedidos: true, promos: true, avaliacoes: false, sistema: true });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const TABS = [
    { key: "perfil", label: "Perfil", icon: "👤" },
    { key: "seguranca", label: "Segurança", icon: "🔒" },
    { key: "notif", label: "Notificações", icon: "🔔" },
    { key: "privacidade", label: "Privacidade", icon: "🛡️" },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚙️</span>
          <h1 className="text-3xl font-black text-gray-900">Configurações</h1>
        </div>
        <p className="text-gray-400 text-sm">Gerencie sua conta e preferências.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-8">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${tab === t.key ? "bg-white text-blue-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span>{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center text-white font-black text-2xl">
              JD
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Foto de perfil</p>
              <p className="text-xs text-gray-400">JPG ou PNG. Máximo 2MB.</p>
              <button className="mt-1.5 text-xs font-semibold text-blue-700 hover:underline">Alterar foto</button>
            </div>
          </div>
          {[
            { label: "Nome completo", value: name, set: setName },
            { label: "E-mail", value: email, set: setEmail },
            { label: "Telefone", value: phone, set: setPhone },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">{f.label}</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 transition-colors"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">CPF</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400 outline-none bg-gray-50 cursor-not-allowed" value="•••.456.890-00" readOnly />
            <p className="text-xs text-gray-400 mt-1">O CPF não pode ser alterado.</p>
          </div>
          <div className="pt-2">
            <button onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${saved ? "bg-green-500 text-white" : "bg-blue-800 hover:bg-blue-700 text-white"}`}>
              {saved ? "✓ Salvo!" : "Salvar alterações"}
            </button>
          </div>
        </div>
      )}

      {tab === "seguranca" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-black text-gray-900 mb-4">Alterar senha</h2>
          {["Senha atual", "Nova senha", "Confirmar nova senha"].map((l) => (
            <div key={l}>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">{l}</label>
              <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors" placeholder="••••••••" />
            </div>
          ))}
          <button className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">Atualizar senha</button>
          <div className="pt-4 border-t border-gray-100">
            <h2 className="text-base font-black text-gray-900 mb-3">Autenticação de dois fatores</h2>
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-800">Verificação por SMS</p>
                <p className="text-xs text-gray-400">Receba um código no seu celular ao fazer login.</p>
              </div>
              <div className="w-11 h-6 bg-green-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "notif" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-black text-gray-900 mb-4">Preferências de notificação</h2>
          {[
            { key: "pedidos" as const, label: "Atualizações de pedidos", desc: "Status de entrega e confirmações." },
            { key: "promos" as const, label: "Promoções e ofertas", desc: "Descontos exclusivos e novidades." },
            { key: "avaliacoes" as const, label: "Avaliações", desc: "Pedidos para avaliar suas compras." },
            { key: "sistema" as const, label: "Sistema", desc: "Atualizações de segurança e conta." },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`w-11 h-6 rounded-full relative transition-colors ${notifPrefs[item.key] ? "bg-blue-700" : "bg-gray-200"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifPrefs[item.key] ? "right-1" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "privacidade" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-black text-gray-900 mb-4">Privacidade e dados</h2>
          {[
            { label: "Perfil público", desc: "Outros usuários podem ver suas avaliações." },
            { label: "Personalização de anúncios", desc: "Exibir anúncios baseados no seu histórico." },
            { label: "Compartilhar dados analíticos", desc: "Ajude a melhorar a plataforma." },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <div className={`w-11 h-6 rounded-full relative ${i === 0 ? "bg-blue-700" : "bg-gray-200"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow ${i === 0 ? "right-1" : "left-1"}`} />
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <button className="w-full text-left p-4 border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex justify-between items-center">
              Baixar meus dados <span className="text-gray-400">›</span>
            </button>
            <button className="w-full text-left p-4 border border-red-100 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex justify-between items-center">
              Excluir minha conta <span>›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
