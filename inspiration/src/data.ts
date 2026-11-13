export interface Product {
  id: number;
  badge?: string;
  badgeColor?: string;
  img: string;
  rating: string;
  store: string;
  name: string;
  price: string;
  oldPrice: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: "entregue" | "em_transito" | "processando" | "cancelado";
  items: string;
  total: string;
  img: string;
}

export interface Notification {
  id: number;
  type: "promo" | "pedido" | "avaliacao" | "sistema";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface Transaction {
  id: number;
  type: "entrada" | "saida";
  desc: string;
  amount: string;
  date: string;
}

export const ALL_PRODUCTS: Product[] = [
  { id: 1, badge: "Mais vendido", badgeColor: "bg-orange-500", img: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&q=80", rating: "4.8", store: "TechStore Oficial", name: "Fone Bluetooth Hoko Sound", price: "R$ 249,90", oldPrice: "R$ 329,90", category: "Eletrônicos", isFeatured: true },
  { id: 2, badge: "Novo", badgeColor: "bg-blue-600", img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80", rating: "4.9", store: "Moda & Cia", name: "Tênis Runner Pro Edition", price: "R$ 389,00", oldPrice: "R$ 459,00", category: "Moda", isFeatured: true, isNew: true },
  { id: 3, badge: "Oferta", badgeColor: "bg-orange-500", img: "https://images.unsplash.com/photo-1707241358597-bafcc8a8e73d?w=400&q=80", rating: "4.7", store: "Casa Boa", name: "Cafeteira Aroma Plus", price: "R$ 179,90", oldPrice: "R$ 219,90", category: "Casa", isFeatured: true },
  { id: 4, badge: "Frete grátis", badgeColor: "bg-green-500", img: "https://images.unsplash.com/photo-1761653457980-21b9f7fd3a04?w=400&q=80", rating: "4.8", store: "Trilha Store", name: "Mochila Urban Nomad 25L", price: "R$ 229,90", oldPrice: "R$ 279,90", category: "Esportes", isFeatured: true },
  { id: 5, badge: "60% OFF", badgeColor: "bg-red-500", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80", rating: "4.6", store: "Relógio Plus", name: "Relógio Smartwatch Pro X", price: "R$ 399,00", oldPrice: "R$ 999,00", category: "Eletrônicos" },
  { id: 6, badge: "Novo", badgeColor: "bg-blue-600", img: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80", rating: "4.5", store: "Beauty House", name: "Kit Skincare Completo", price: "R$ 149,90", oldPrice: "R$ 189,90", category: "Beleza", isNew: true },
  { id: 7, badge: "Mais vendido", badgeColor: "bg-orange-500", img: "https://images.unsplash.com/photo-1461773518188-b3e86f98242f?w=400&q=80", rating: "4.9", store: "BookWorld", name: "Box Harry Potter Ed. Especial", price: "R$ 279,90", oldPrice: "R$ 349,90", category: "Livros" },
  { id: 8, badge: "Oferta", badgeColor: "bg-orange-500", img: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80", rating: "4.7", store: "TechStore Oficial", name: "Notebook UltraSlim 15\"", price: "R$ 2.499,00", oldPrice: "R$ 3.199,00", category: "Eletrônicos" },
  { id: 9, badge: "Novo", badgeColor: "bg-blue-600", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", rating: "4.8", store: "SportMax", name: "Tênis de Corrida AirMax", price: "R$ 459,00", oldPrice: "R$ 599,00", category: "Esportes", isNew: true },
  { id: 10, badge: "40% OFF", badgeColor: "bg-red-500", img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80", rating: "4.6", store: "Casa Boa", name: "Aspirador Robô Smart", price: "R$ 599,00", oldPrice: "R$ 999,00", category: "Casa" },
  { id: 11, img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80", rating: "4.4", store: "Moda & Cia", name: "Jaqueta Couro Premium", price: "R$ 349,00", oldPrice: "R$ 489,00", category: "Moda" },
  { id: 12, badge: "Novo", badgeColor: "bg-blue-600", img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80", rating: "4.9", store: "GameZone", name: "Controle PS5 Dualsense", price: "R$ 449,90", oldPrice: "R$ 499,90", category: "Games", isNew: true },
  { id: 13, img: "https://images.unsplash.com/photo-1616627452072-4cfcb68af12a?w=400&q=80", rating: "4.7", store: "TechStore Oficial", name: "Tablet 10\" 128GB", price: "R$ 899,00", oldPrice: "R$ 1.299,00", category: "Eletrônicos" },
  { id: 14, badge: "35% OFF", badgeColor: "bg-red-500", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80", rating: "4.5", store: "Beauty House", name: "Perfume Floral 100ml", price: "R$ 129,90", oldPrice: "R$ 199,90", category: "Beleza" },
  { id: 15, img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80", rating: "4.8", store: "SportMax", name: "Bicicleta Speed 21 Marchas", price: "R$ 1.299,00", oldPrice: "R$ 1.799,00", category: "Esportes" },
  { id: 16, badge: "Novo", badgeColor: "bg-blue-600", img: "https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?w=400&q=80", rating: "4.6", store: "GameZone", name: "Headset Gamer RGB 7.1", price: "R$ 299,90", oldPrice: "R$ 399,90", category: "Games", isNew: true },
];

export const ORDERS: Order[] = [
  { id: "#HK-2024-001", date: "15 Set 2026", status: "entregue", items: "Fone Bluetooth Hoko Sound", total: "R$ 249,90", img: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=80&q=80" },
  { id: "#HK-2024-002", date: "12 Set 2026", status: "em_transito", items: "Tênis Runner Pro Edition + 1 item", total: "R$ 618,90", img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=80&q=80" },
  { id: "#HK-2024-003", date: "08 Set 2026", status: "processando", items: "Cafeteira Aroma Plus", total: "R$ 179,90", img: "https://images.unsplash.com/photo-1707241358597-bafcc8a8e73d?w=80&q=80" },
  { id: "#HK-2024-004", date: "01 Set 2026", status: "entregue", items: "Mochila Urban Nomad 25L + 2 itens", total: "R$ 709,70", img: "https://images.unsplash.com/photo-1761653457980-21b9f7fd3a04?w=80&q=80" },
  { id: "#HK-2024-005", date: "22 Ago 2026", status: "cancelado", items: "Relógio Smartwatch Pro X", total: "R$ 399,00", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80" },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 1, type: "pedido", title: "Pedido em trânsito!", body: "Seu pedido #HK-2024-002 saiu para entrega. Previsão: hoje até 20h.", time: "5 min atrás", read: false },
  { id: 2, type: "promo", title: "60% OFF em Eletrônicos 🔥", body: "Só hoje! Aproveite os melhores descontos em TVs, notebooks e muito mais.", time: "1h atrás", read: false },
  { id: 3, type: "avaliacao", title: "Avalie sua compra", body: "Como foi o Fone Bluetooth Hoko Sound? Sua opinião ajuda outros compradores.", time: "2h atrás", read: false },
  { id: 4, type: "promo", title: "Produtos novos chegaram!", body: "As últimas novidades em Games já estão disponíveis. Confira agora.", time: "5h atrás", read: true },
  { id: 5, type: "sistema", title: "Bem-vindo ao Hoko Pro 🎉", body: "Sua assinatura Pro foi ativada com sucesso. Aproveite frete grátis ilimitado!", time: "1 dia atrás", read: true },
  { id: 6, type: "pedido", title: "Pedido entregue!", body: "Seu pedido #HK-2024-001 foi entregue com sucesso. Obrigado pela compra!", time: "6 dias atrás", read: true },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 1, type: "saida", desc: "Pagamento Tênis Runner Pro", amount: "- R$ 389,00", date: "12 Set 2026" },
  { id: 2, type: "entrada", desc: "Reembolso Smartwatch Pro X", amount: "+ R$ 399,00", date: "05 Set 2026" },
  { id: 3, type: "saida", desc: "Pagamento Cafeteira Aroma", amount: "- R$ 179,90", date: "08 Set 2026" },
  { id: 4, type: "entrada", desc: "Cashback Hoko Pro", amount: "+ R$ 24,99", date: "01 Set 2026" },
  { id: 5, type: "saida", desc: "Pagamento Mochila Urban", amount: "- R$ 229,90", date: "01 Set 2026" },
  { id: 6, type: "entrada", desc: "Depósito via Pix", amount: "+ R$ 500,00", date: "28 Ago 2026" },
];
