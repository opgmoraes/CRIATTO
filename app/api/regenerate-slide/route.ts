import { NextRequest, NextResponse } from "next/server";
import { generateTextWithFallback } from "../../../lib/ai-providers";

// Regenera UM slide, usando o mesmo roteador de provedores (Groq → Gemini → OpenRouter)
// do /api/generate-copy e levando em conta o contexto do restante do carrossel.
const SYSTEM_PROMPT = `Você é um diretor de conteúdo e redator editorial para Instagram em português do Brasil.
Reescreva UM único slide de forma realmente diferente da versão atual, mantendo o papel do slide e a coerência com o restante do carrossel.

O TEXTO ATUAL é apenas uma referência. Não apenas troque sinônimos: repense o ângulo, a ordem da informação e a forma de entregar valor.

REGRAS:
- O título é curto e forte, no máximo 9 palavras.
- "supportText" é o texto FINAL que será exibido no design. Ele deve complementar o título, trazendo contexto, consequência, exemplo ou ação. Não repita o título.
- Máximo de 180 caracteres no supportText para carousel/post e aproximadamente 100 para story.
- Não escreva "texto de apoio", "explicação", instruções para designer ou metacomentários.
- Não invente estatísticas ou fatos específicos.
- Para hook, priorize curiosidade, contraste ou promessa baseada no material.
- Para content, entregue uma informação útil e concreta.
- Para cta, seja direto e preserve o CTA.
- Escolha um ícone SEMÂNTICO da lista. Nunca use emoji.
- Escolha também um visual_intent curto.

ÍCONES:
none, lightbulb, target, rocket, check, x, alert, info, star, heart, bookmark, share, arrow-up, arrow-right, chart-up, chart-down, money, wallet, calculator, briefcase, building, users, user, graduation, book, pencil, brain, clock, calendar, checklist, search, settings, gear, code, laptop, smartphone, database, cloud, lock, shield, megaphone, message, mail, link, globe, home, location, play, camera, image, file, folder, download, upload, refresh, sparkles, flame, trophy, flag.

JSON estrito:
{
  "title": string,
  "supportText": string,
  "icon": string,
  "visual_intent": string,
  "image_query": string
}`;

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
      slide: { title: result.title, supportText: result.supportText ?? "", icon: result.icon || "none", visualIntent: result.visual_intent || "", imageQuery: result.image_query || "" },
      providerUsed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao regenerar slide." }, { status: 500 });
  }
}
