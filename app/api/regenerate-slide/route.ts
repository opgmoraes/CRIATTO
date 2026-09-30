import { NextRequest, NextResponse } from "next/server";
import { generateTextWithFallback } from "../../../lib/ai-providers";

// Regenera UM slide, usando o mesmo roteador de provedores (Groq → Gemini → OpenRouter)
// do /api/generate-copy e levando em conta o contexto do restante do carrossel.
const SYSTEM_PROMPT = `Você é um redator de conteúdo para Instagram em português do Brasil.
Reescreva UM único slide de um carrossel, com uma abordagem diferente da versão atual, mantendo o mesmo papel e coerência com os outros slides.
Regras: não invente estatísticas ou fatos específicos; respeite tom de voz e formato; título curto e forte (máx. 9 palavras); texto de apoio com no máximo 160 caracteres (pode ser "" em stories).
Responda em JSON estrito: { "title": string, "supportText": string, "image_query": string /* 2-4 palavras EM INGLÊS para buscar uma foto de banco de imagens */ }`;

export async function POST(req: NextRequest) {
  try {
    const { theme, tone, audience, slideIndex, totalSlides, format, current, others } = await req.json();
    if (typeof slideIndex !== "number" || !current) {
      return NextResponse.json({ error: "Dados do slide ausentes." }, { status: 400 });
    }
    const role = slideIndex === 0 ? "hook (gancho)" : slideIndex === totalSlides - 1 && totalSlides > 1 ? "cta (chamada final)" : "content (desenvolvimento)";
    const userText = `
TEMA: ${theme || "(não informado — deduza pelos outros slides)"}
TOM DE VOZ: ${tone || "direto e claro"}
PÚBLICO-ALVO: ${audience || "geral"}
FORMATO: ${format || "carousel"}
SLIDE: ${slideIndex + 1} de ${totalSlides} — papel: ${role}
VERSÃO ATUAL (reescreva de forma diferente): título="${current.title}" | apoio="${current.supportText}"
OUTROS SLIDES (para manter coerência e não repetir): ${(others || []).join(" | ") || "(nenhum)"}`.trim();

    const { result, providerUsed } = await generateTextWithFallback(SYSTEM_PROMPT, userText);
    if (!result?.title) throw new Error("A IA retornou uma resposta sem título.");
    return NextResponse.json({
      slide: { title: result.title, supportText: result.supportText ?? "", imageQuery: result.image_query || "" },
      providerUsed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao regenerar slide." }, { status: 500 });
  }
}
