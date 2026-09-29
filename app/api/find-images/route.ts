import { NextRequest, NextResponse } from "next/server";

// Busca 1 foto por consulta em Unsplash / Pexels / Pixabay (todos gratuitos, mas exigem chave).
type Source = "unsplash" | "pexels" | "pixabay";
const ENV: Record<Source, string> = {
  unsplash: "UNSPLASH_ACCESS_KEY",
  pexels: "PEXELS_API_KEY",
  pixabay: "PIXABAY_API_KEY",
};

async function search(source: Source, query: string): Promise<string | null> {
  const key = process.env[ENV[source]]!;
  const q = encodeURIComponent(query.slice(0, 80));
  if (source === "unsplash") {
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=portrait`, {
      headers: { Authorization: `Client-ID ${key}` },
    });
    if (!r.ok) throw new Error(`Unsplash ${r.status}`);
    return (await r.json()).results?.[0]?.urls?.regular || null;
  }
  if (source === "pexels") {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=portrait`, {
      headers: { Authorization: key },
    });
    if (!r.ok) throw new Error(`Pexels ${r.status}`);
    return (await r.json()).photos?.[0]?.src?.large || null;
  }
  const r = await fetch(`https://pixabay.com/api/?key=${key}&q=${q}&per_page=3&orientation=vertical&image_type=photo`);
  if (!r.ok) throw new Error(`Pixabay ${r.status}`);
  return (await r.json()).hits?.[0]?.largeImageURL || null;
}

export async function POST(req: NextRequest) {
  try {
    const { queries, source } = await req.json();
    if (!Array.isArray(queries) || !queries.length) {
      return NextResponse.json({ error: "Nenhuma consulta de imagem enviada." }, { status: 400 });
    }
    const wanted: Source = (source in ENV ? source : "unsplash") as Source;
    // Fonte escolhida primeiro; se faltar chave, usa outra que esteja configurada.
    const order = [wanted, ...(Object.keys(ENV) as Source[]).filter((s) => s !== wanted)].filter((s) => process.env[ENV[s]]);
    if (!order.length) {
      return NextResponse.json(
        { error: `Nenhum banco de imagens configurado. Adicione ${ENV[wanted]} ao .env.local (chave gratuita) e reinicie o servidor.` },
        { status: 400 }
      );
    }
    const errors: string[] = [];
    const images = await Promise.all(
      queries.slice(0, 12).map(async (q: string) => {
        for (const s of order) {
          try {
            const url = await search(s, String(q));
            if (url) return url;
          } catch (e: any) { errors.push(e.message); }
        }
        return null;
      })
    );
    let warning: string | undefined;
    if (order[0] !== wanted) warning = `${ENV[wanted]} não configurada — usei ${order[0]}.`;
    if (!images.some(Boolean)) warning = `Nenhuma imagem encontrada${errors.length ? " (" + [...new Set(errors)].join(", ") + ")" : ""}.`;
    return NextResponse.json({ images, warning });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao buscar imagens." }, { status: 500 });
  }
}
