import { useMemo, useState } from "react";
import type { Product } from "@/data";
import { ALL_PRODUCTS } from "@/data";
import ProductCard from "@/components/ProductCard";

interface Props {
  product: Product;
  likedProducts: number[];
  onToggleLike: (id: number) => void;
  onNavigate: (page: string) => void;
}

const categoryDetails: Record<string, { description: string; features: string[] }> = {
  Eletrônicos: {
    description: "Tecnologia de alta performance, acabamento premium e uso simples para acompanhar sua rotina. Produto original, testado e enviado com garantia.",
    features: ["Conexão rápida e estável", "Bateria de longa duração", "Garantia de 12 meses", "Conteúdo original lacrado"],
  },
  Moda: {
    description: "Conforto e estilo em uma peça versátil, produzida com materiais selecionados e acabamento pensado para o uso diário.",
    features: ["Material resistente", "Acabamento premium", "Troca grátis em 30 dias", "Produto original"],
  },
  Casa: {
    description: "Mais praticidade para a sua casa com design moderno, operação intuitiva e materiais duráveis para todos os dias.",
    features: ["Fácil de usar e limpar", "Baixo consumo", "Garantia de 12 meses", "Manual em português"],
  },
};

function priceNumber(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", "."));
}

export default function Produto({ product, likedProducts, onToggleLike, onNavigate }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState("");
  const [delivery, setDelivery] = useState("");
  const [feedback, setFeedback] = useState("");
  const details = categoryDetails[product.category] ?? {
    description: "Produto selecionado de uma loja parceira Hoko, com qualidade verificada, envio seguro e compra protegida do pedido à entrega.",
    features: ["Qualidade verificada", "Compra protegida", "Troca grátis em 30 dias", "Envio com rastreamento"],
  };
  const discount = Math.round((1 - priceNumber(product.price) / priceNumber(product.oldPrice)) * 100);
  const installments = (priceNumber(product.price) / 12).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const related = useMemo(() => ALL_PRODUCTS.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4), [product]);

  const calculateDelivery = () => {
    if (cep.replace(/\D/g, "").length === 8) setDelivery("Chega entre 2 e 4 dias úteis. Frete grátis.");
    else setDelivery("Digite um CEP válido com 8 números.");
  };

  return (
    <div className="pb-20">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <button onClick={() => onNavigate("Início")} className="hover:text-blue-800">Início</button>
          <span>/</span>
          <button onClick={() => onNavigate(product.category)} className="hover:text-blue-800">{product.category}</button>
          <span>/</span>
          <span className="max-w-xs truncate text-gray-800">{product.name}</span>
        </div>

        <section className="grid gap-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-8">
          <div className="relative flex min-h-96 items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
            {product.badge && <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold text-white ${product.badgeColor}`}>{product.badge}</span>}
            <img src={product.img.replace("w=400", "w=900")} alt={product.name} className="h-full max-h-[560px] w-full object-contain p-8" />
            <button onClick={() => onToggleLike(product.id)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:text-red-500" aria-label={likedProducts.includes(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill={likedProducts.includes(product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
            </button>
          </div>

          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
              <span>Novo</span><span>|</span><span>+100 vendidos</span>
            </div>
            <h1 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2">
              <span className="font-bold text-orange-500">{product.rating}</span>
              <span className="text-orange-400">★★★★★</span>
              <span className="text-sm text-gray-400">127 avaliações</span>
            </div>
            <div className="mt-7">
              <p className="text-sm text-gray-400 line-through">{product.oldPrice}</p>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-light tracking-tight text-gray-900">{product.price}</p>
                <span className="rounded-md bg-green-50 px-2 py-1 text-sm font-bold text-green-700">{discount}% OFF</span>
              </div>
              <p className="mt-1 text-sm text-green-700">em 12x de {installments} sem juros</p>
            </div>

            <div className="my-6 border-y border-gray-100 py-5">
              <div className="flex gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></svg>
                <div><p className="font-bold text-green-700">Frete grátis para todo o Brasil</p><p className="text-sm text-gray-500">Envio rápido com rastreamento</p></div>
              </div>
              <div className="mt-4 flex max-w-sm gap-2">
                <input value={cep} onChange={(event) => setCep(event.target.value)} placeholder="Digite seu CEP" maxLength={9} className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-700" />
                <button onClick={calculateDelivery} className="rounded-xl border border-blue-800 px-4 text-sm font-bold text-blue-800 hover:bg-blue-50">Calcular</button>
              </div>
              {delivery && <p className={`mt-2 text-xs ${delivery.startsWith("Chega") ? "text-green-700" : "text-red-500"}`}>{delivery}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div><p className="text-sm font-bold">Estoque disponível</p><p className="text-xs text-gray-400">Mais de 10 unidades</p></div>
              <label className="flex items-center gap-2 text-sm text-gray-500">Quantidade
                <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="rounded-lg border border-gray-200 bg-white p-2 font-bold text-gray-800">
                  {[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button onClick={() => setFeedback(`${quantity} unidade(s) adicionada(s) ao carrinho.`)} className="h-12 rounded-xl bg-blue-100 font-bold text-blue-800 hover:bg-blue-200">Adicionar ao carrinho</button>
              <button onClick={() => setFeedback("Compra iniciada com segurança pela Hoko.")} className="h-12 rounded-xl bg-orange-500 font-bold text-white shadow-md shadow-orange-100 hover:bg-orange-600">Comprar agora</button>
            </div>
            {feedback && <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm font-medium text-green-700">{feedback}</p>}
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gray-100 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-800 font-black text-white">{product.store.charAt(0)}</span>
              <div className="flex-1"><p className="text-xs text-gray-400">Vendido por</p><p className="font-bold">{product.store}</p><p className="text-xs text-green-700">Loja oficial • Excelente atendimento</p></div>
              <button className="text-sm font-bold text-blue-800">Ver loja</button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 lg:col-span-2">
            <h2 className="text-xl font-black">Descrição do produto</h2>
            <p className="mt-4 leading-relaxed text-gray-600">{details.description}</p>
            <h3 className="mt-7 font-black">Destaques</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {details.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm text-gray-600"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700">✓</span>{feature}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-6">
            <h2 className="text-xl font-black">Compra garantida</h2>
            <div className="mt-5 space-y-5">
              {[
                ["Pagamento seguro", "Seus dados sempre protegidos."],
                ["Devolução grátis", "Você tem até 30 dias."],
                ["Garantia Hoko", "Receba o produto ou seu dinheiro de volta."],
              ].map(([title, text]) => <div key={title} className="border-b border-gray-100 pb-4 last:border-0"><p className="text-sm font-bold text-blue-900">{title}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p></div>)}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-black">Você também pode gostar</h2>
            <p className="mt-1 text-sm text-gray-400">Mais produtos selecionados para você.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => <ProductCard key={item.id} product={item} liked={likedProducts.includes(item.id)} onToggleLike={onToggleLike} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
