// Extrai o texto principal de um artigo a partir de uma URL (sem dependências).
const ENT: Record<string, string> = { "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };
const decode = (s: string) => s.replace(/&amp;|&nbsp;|&quot;|&#39;|&lt;|&gt;/g, (m) => ENT[m]);

export async function extractArticle(url: string): Promise<string> {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error("URL inválida."); }
  const h = u.hostname;
  if (!/^https?:$/.test(u.protocol) || h === "localhost" || h.endsWith(".local") || h === "[::1]" ||
      /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) {
    throw new Error("URL não permitida (use um endereço público http/https).");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CarouselStudio/1.0)", Accept: "text/html" },
    });
    if (!res.ok) throw new Error(`O site respondeu com erro ${res.status}.`);
    const html = (await res.text()).slice(0, 1_500_000);
    const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
    const main = html.match(/<article[\s\S]*?<\/article>/i)?.[0] || html.match(/<body[\s\S]*<\/body>/i)?.[0] || html;
    const text = decode(
      main
        .replace(/<(script|style|noscript|nav|header|footer|aside|svg|form)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    ).replace(/\s+/g, " ").trim();
    if (text.length < 200) {
      throw new Error("Não consegui extrair texto suficiente dessa página (ela pode exigir JavaScript ou login).");
    }
    return `${title}\n\n${text.slice(0, 6000)}`;
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Tempo esgotado ao abrir a URL.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
