import { useState } from "react";
import { NOTIFICATIONS } from "@/data";
import type { Notification } from "@/data";

const TYPE_ICON: Record<Notification["type"], string> = {
  promo: "🔥",
  pedido: "📦",
  avaliacao: "⭐",
  sistema: "🔔",
};

const TYPE_COLOR: Record<Notification["type"], string> = {
  promo: "bg-orange-50",
  pedido: "bg-blue-50",
  avaliacao: "bg-yellow-50",
  sistema: "bg-purple-50",
};

export default function Notificacoes() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const remove = (id: number) => setNotifs((prev) => prev.filter((n) => n.id !== id));

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔔</span>
            <h1 className="text-3xl font-black text-gray-900">Notificações</h1>
            {unread > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
            )}
          </div>
          <p className="text-gray-400 text-sm">Fique por dentro de tudo que acontece.</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm font-semibold text-blue-700 hover:underline mt-2">
            Marcar tudo como lido
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🔕</p>
          <h2 className="text-xl font-black text-gray-700 mb-2">Nenhuma notificação</h2>
          <p className="text-sm text-gray-400">Você está em dia com tudo!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div key={n.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${n.read ? "bg-white border-gray-100" : "bg-blue-50 border-blue-100"}`}
              onClick={() => markRead(n.id)}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${TYPE_COLOR[n.type]}`}>
                {TYPE_ICON[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold ${n.read ? "text-gray-700" : "text-gray-900"}`}>{n.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
