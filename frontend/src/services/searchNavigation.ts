// Shared helper to route search queries to the best page by approximation
// Supports Portuguese and common English variants

type Page =
  | "login"
  | "signup"
  | "forgot-password"
  | "home"
  | "statistics"
  | "products"
  | "add-product"
  | "reports"
  | "settings";

const PAGE_KEYWORDS: Record<Page, string[]> = {
  login: ["login", "entrar", "acesso", "sign in"],
  signup: ["signup", "cadastrar", "registrar", "novo usuario", "criar conta", "sign up"],
  "forgot-password": [
    "recuperar",
    "esqueci",
    "senha",
    "reset",
    "forgot",
    "esqueci minha senha",
  ],
  // Home: variantes comuns e frases usuais
  home: ["home", "inicio", "início", "dashboard", "principal", "inicial", "pagina inicial", "página inicial", "home page", "painel", "overview"],
  statistics: [
    "estatistica",
    "estatisticas",
    "statistics",
    "stats",
    "analise",
    "análise",
    "graficos",
    "gráficos",
    "metricas",
    "métricas",
    "minhas estatisticas",
    "ver estatisticas",
    "ver minhas estatisticas",
    "pagina de estatisticas",
    "como ver estatisticas",
  ],
  products: [
    "produto",
    "produtos",
    "sku",
    "estoque",
    "inventory",
    "catalogo",
    "catálogo",
    "itens",
    "items",
  ],
  "add-product": [
    "adicionar",
    "novo produto",
    "add product",
    "add produto",
    "inserir produto",
    "cadastrar produto",
    "cadastar produto",
  ],
  reports: [
    "relatorio",
    "relatórios",
    "reports",
    "pdf",
    "exportar",
    "report",
    "meus relatorios",
    "ver relatorios",
    "ver meus relatorios",
    "pagina de relatorios",
    "baixar relatorio",
    "download relatorio",
    "emitir relatorio",
    "gerar relatorio",
  ],
  settings: [
    "config",
    "configuracao",
    "configuração",
    "configuracoes",
    "configurações",
    "settings",
    "perfil",
    "account",
    "conta",
    "preferencias",
    "preferências",
  ],
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const scoreQuery = (query: string, keywords: string[]) => {
  const q = normalize(query);
  let score = 0;
  for (const kw of keywords) {
    const k = normalize(kw);
    if (!k || !q) continue;
    if (q === k) {
      score += 3; // exact
    } else if (q.includes(k)) {
      score += 2; // query contains keyword
    } else if (k.includes(q)) {
      score += 1.5; // keyword contains query (prefixes like "config")
    } else {
      const qtoks = q.split(/\s+/);
      const ktoks = k.split(/\s+/);
      const overlap = qtoks.filter((t) => ktoks.includes(t)).length;
      if (overlap > 0) score += overlap * 0.5;
    }
  }
  return score;
};

export function getBestPageForQuery(query: string): Page {
  const q = normalize(query);

  // Regra explícita: consultas genéricas sobre produtos vão para a lista,
  // só enviar para "add-product" quando houver intenção clara de adicionar.
  const mentionsProducts = (
    q.includes("prod") ||
    q.includes("produto") ||
    q.includes("produtos") ||
    q.includes("catalog") ||
    q.includes("catalogo")
  );
  const addIntentTokens = ["adicionar", "inserir", "cadastrar", "cadastar", "novo", "add", "criar"];
  const hasAddIntent = addIntentTokens.some(t => q.includes(t));
  if (mentionsProducts && !hasAddIntent) {
    return "products";
  }

  const entries = Object.entries(PAGE_KEYWORDS) as Array<[Page, string[]]>;
  let best: Page = "home";
  let bestScore = 0;
  for (const [page, kws] of entries) {
    const s = scoreQuery(query, kws);
    if (s > bestScore) {
      bestScore = s;
      best = page;
    }
  }

  // Heurística simples quando nada casa
  if (bestScore === 0) {
    if (q.includes("config")) return "settings";
    if (q.includes("prod")) return "products";
    if (q.includes("relat")) return "reports";
    if (q.includes("estat")) return "statistics";
  }

  // Regra de segurança: se o best for "add-product" sem intenção de adicionar, redirecionar para lista
  if (best === "add-product" && mentionsProducts && !hasAddIntent) {
    return "products";
  }

  return best;
}