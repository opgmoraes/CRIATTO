import { NextRequest, NextResponse } from "next/server";
import { generateTextWithFallback } from "../../../lib/ai-providers";
import { extractArticle } from "../../../lib/extract";

// Seção 8 da especificação: gera hook, título, subtítulo, desenvolvimento,
// exemplos, destaques, números, frases de impacto e CTA — respeitando o
// conteúdo fornecido e SINALIZANDO quando precisar inventar algo (regra do
// "não inventar fatos importantes sem sinalizar").
const SYSTEM_PROMPT = `Você é um redator especialista em conteúdo para Instagram/LinkedIn em português do Brasil.
Você transforma o material bruto do usuário em uma estrutura de peça, slide por slide (ou card único).

REGRAS OBRIGATÓRIAS:
1. Use APENAS fatos, números e afirmações fornecidos pelo usuário. Se precisar complementar algo para o texto funcionar (um exemplo genérico, uma transição), está liberado, mas NUNCA invente estatísticas, dados ou afirmações factuais específicas que pareçam reais.
2. Se o conteúdo fornecido for insuficiente para preencher todos os slides pedidos com qualidade, gere menos slides e explique isso em "warnings", em vez de inventar conteúdo para completar.
3. Respeite rigorosamente o tom de voz e o público-alvo indicados.
4. O primeiro slide é sempre o HOOK (gancho) — precisa parar o scroll.
5. O último slide é sempre o CTA fornecido pelo usuário (ou um CTA neutro de "salvar/compartilhar" se nada for informado).
6. Se houver direção visual (visual_direction) vinda da análise de referências, use-a apenas para calibrar o TOM da escrita (ex: minimalista = frases mais curtas), nunca para inventar conteúdo.
7. Adapte a densidade de texto ao formato informado (campo "format"):
   - "post": é UM ÚNICO card, autoexplicativo — título forte + texto de apoio que já entrega o valor completo sozinho, sem depender de "próximo slide".
   - "story": cards curtos e diretos, feitos para serem lidos em 2-3 segundos cada — título ainda mais curto que no carrossel, texto de apoio opcional ou bem enxuto.
   - "carousel" (padrão): sequência com hook → desenvolvimento → CTA, pode ter texto de apoio mais completo.

Responda em JSON estrito, exatamente neste formato:
{
  "warnings": string[],
  "slides": [
    {
      "role": "hook" | "content" | "cta",
      "title": string,       // texto curto, grande, o elemento mais importante do slide
      "subtitle": string,    // opcional, pode ser ""
      "body": string,        // opcional, texto de apoio mais longo, pode ser ""
      "notes": string,       // opcional: sugestão de imagem/ícone para este slide, pode ser ""
      "image_query": string  // 2-4 palavras EM INGLÊS para buscar uma foto de banco de imagens (ex: "laptop code night")
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      theme,
      rawText,
      tone,
      audience,
      cta,
      slideCount,
      visualDirection, // resultado opcional de /api/analyze-references . summary_direction
      format, // "carousel" | "post" | "story"
      articleUrl,
    } = body;
    let { rawText: raw } = body;

    if (articleUrl) {
      try {
        const article = await extractArticle(articleUrl);
        raw = `${raw ? raw + "\n\n" : ""}CONTEÚDO EXTRAÍDO DO ARTIGO (${articleUrl}):\n${article}`;
      } catch (e: any) {
        return NextResponse.json({ error: `URL: ${e.message}` }, { status: 400 });
      }
    }

    if (!theme && !raw) {
      return NextResponse.json(
        { error: "Informe pelo menos um tema ou um texto bruto." },
        { status: 400 }
      );
    }

    const userText = `
TEMA: ${theme || "(não informado, use o texto bruto abaixo)"}

TEXTO BRUTO / RASCUNHO FORNECIDO PELO USUÁRIO:
${raw || "(nenhum, gere a partir do tema apenas — mas não invente fatos específicos, mantenha genérico e sinalize em warnings)"}

TOM DE VOZ: ${tone || "direto e claro"}
PÚBLICO-ALVO: ${audience || "geral"}
CTA FINAL: ${cta || "(nenhum informado — use um CTA neutro de salvar o post)"}
QUANTIDADE DE SLIDES DESEJADA: ${slideCount || 7}
FORMATO: ${format || "carousel"}
DIREÇÃO VISUAL (apenas para calibrar tom da escrita): ${visualDirection || "(nenhuma)"}
`.trim();

    const { result, providerUsed } = await generateTextWithFallback(SYSTEM_PROMPT, userText);

    return NextResponse.json({ script: result, providerUsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao gerar copy." }, { status: 500 });
  }
}
