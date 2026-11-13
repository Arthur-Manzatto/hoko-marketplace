import { useEffect, useState } from "react";
import Home from "@/pages/Home";
import OfertasDia from "@/pages/OfertasDia";
import MaisVendidos from "@/pages/MaisVendidos";
import Lancamentos from "@/pages/Lancamentos";
import Categoria from "@/pages/Categoria";
import MeusPedidos from "@/pages/MeusPedidos";
import Favoritos from "@/pages/Favoritos";
import Carteira from "@/pages/Carteira";
import Notificacoes from "@/pages/Notificacoes";
import Configuracoes from "@/pages/Configuracoes";
import MinhaLoja from "@/pages/MinhaLoja";
import Relatorios from "@/pages/Relatorios";
import Produto from "@/pages/Produto";
import Catalogo from "@/pages/Catalogo";
import { ALL_PRODUCTS } from "@/data";

const navGroups = [
  {
    title: "Principal",
    items: [
      { label: "Início", icon: "home" },
      { label: "Produtos", icon: "grid" },
      { label: "Ofertas do Dia", icon: "tag" },
      { label: "Mais Vendidos", icon: "star" },
      { label: "Lançamentos", icon: "sparkles" },
    ],
  },
  {
    title: "Categorias",
    items: ["Eletrônicos", "Moda", "Casa & Decoração", "Beleza", "Esportes", "Games", "Livros"].map((label) => ({
      label,
      icon: "grid",
    })),
  },
  {
    title: "Minha Conta",
    items: [
      { label: "Meus Pedidos", icon: "package" },
      { label: "Favoritos", icon: "heart" },
      { label: "Carteira", icon: "card" },
      { label: "Notificações", icon: "bell" },
      { label: "Configurações", icon: "settings" },
    ],
  },
  {
    title: "Vendedor",
    items: [
      { label: "Minha Loja", icon: "store" },
      { label: "Relatórios", icon: "chart" },
    ],
  },
];

function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    tag: <><path d="M20 13 13 20l-9-9V4h7l9 9Z" /><circle cx="8.5" cy="8.5" r="1" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    package: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a2 2 0 0 0 .4 2.2l.1.1-2.8 2.8-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8V22H10v-.6a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1-2.8-2.8.1-.1a2 2 0 0 0 .4-2.2 2 2 0 0 0-1.8-1.2H2v-3.6h.4A2 2 0 0 0 4.2 9a2 2 0 0 0-.4-2.2l-.1-.1 2.8-2.8.1.1a2 2 0 0 0 2.2.4A2 2 0 0 0 10 2.6V2h4v.6a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1 2.8 2.8-.1.1a2 2 0 0 0-.4 2.2 2 2 0 0 0 1.8 1.2h.4v3.6h-.6a2 2 0 0 0-2 1.2Z" /></>,
    store: <><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M8 20v-6h8v6M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function getRoute() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash.startsWith("produto/")) return hash;
  return hash || "Início";
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [route, setRoute] = useState(getRoute);
  const [liked, setLiked] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onHashChange = () => {
      setRoute(getRoute());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (page: string) => {
    window.location.hash = encodeURIComponent(page);
    setSidebarOpen(false);
  };

  const toggleLike = (id: number) =>
    setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const submitSearch = () => {
    if (search.trim()) navigate(`Produtos?busca=${search.trim()}`);
    else navigate("Produtos");
  };

  const categoryNames = ["Eletrônicos", "Moda", "Casa & Decoração", "Beleza", "Esportes", "Games", "Livros"];

  const renderPage = () => {
    if (route.startsWith("produto/")) {
      const id = Number(route.split("/")[1]);
      const product = ALL_PRODUCTS.find((item) => item.id === id);
      return product ? (
        <Produto product={product} likedProducts={liked} onToggleLike={toggleLike} onNavigate={navigate} />
      ) : <Home liked={liked} onToggleLike={toggleLike} onNavigate={navigate} />;
    }
    if (route.startsWith("Produtos")) {
      const query = route.includes("?busca=") ? route.split("?busca=")[1] : "";
      return <Catalogo key={query} liked={liked} onToggleLike={toggleLike} initialSearch={query} />;
    }
    if (categoryNames.includes(route)) return <Categoria category={route} liked={liked} onToggleLike={toggleLike} />;
    switch (route) {
      case "Ofertas do Dia": return <OfertasDia liked={liked} onToggleLike={toggleLike} />;
      case "Mais Vendidos": return <MaisVendidos liked={liked} onToggleLike={toggleLike} />;
      case "Lançamentos": return <Lancamentos liked={liked} onToggleLike={toggleLike} />;
      case "Meus Pedidos": return <MeusPedidos />;
      case "Favoritos": return <Favoritos liked={liked} onToggleLike={toggleLike} />;
      case "Carteira": return <Carteira />;
      case "Notificações": return <Notificacoes />;
      case "Configurações": return <Configuracoes />;
      case "Minha Loja": return <MinhaLoja />;
      case "Relatórios": return <Relatorios />;
      default: return <Home liked={liked} onToggleLike={toggleLike} onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
            <button onClick={() => navigate("Início")} className="flex items-center gap-2" aria-label="Ir para o início">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-sm font-black text-white">h</span>
              <span className="text-xl font-black tracking-tight text-blue-950">hoko<span className="text-orange-500">.</span></span>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" aria-label="Fechar menu">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">JD</span>
              <div className="min-w-0"><p className="truncate text-sm font-bold">João Dias</p><p className="truncate text-xs text-gray-400">joao@email.com</p></div>
              <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">Pro</span>
            </div>
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-xs font-bold uppercase tracking-widest text-gray-400">{group.title}</p>
                {group.items.map((item) => (
                  <button key={item.label} onClick={() => navigate(item.label)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${route === item.label ? "bg-blue-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    <Icon name={item.icon} className="h-4 w-4" />
                    {item.label}
                    {item.label === "Notificações" && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">4</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-gray-600 hover:bg-gray-100" aria-label="Abrir menu">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <button onClick={() => navigate("Início")} className="flex shrink-0 items-center gap-2" aria-label="Hoko, página inicial">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-sm font-black text-white">h</span>
            <span className="hidden text-xl font-black text-blue-950 sm:block">hoko<span className="text-orange-500">.</span></span>
          </button>
          <form className="mx-auto flex max-w-xl flex-1 items-center gap-2" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
            <div className="flex h-10 flex-1 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.4-4.4" /></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar produtos..." />
            </div>
            <button className="hidden h-10 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600 sm:block">Buscar</button>
          </form>
          <button onClick={() => navigate("Favoritos")} className="relative rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-red-500" aria-label="Favoritos">
            <Icon name="heart" />
            {liked.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">{liked.length}</span>}
          </button>
        </div>
      </header>
      <main>{renderPage()}</main>
    </div>
  );
}
