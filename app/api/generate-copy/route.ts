import { NextRequest, NextResponse } from "next/server";
import { generateTextWithFallback } from "../../../lib/ai-providers";
import { extractArticle } from "../../../lib/extract";

// Seção 8 da especificação: gera hook, título, subtítulo, desenvolvimento,
// exemplos, destaques, números, frases de impacto e CTA — respeitando o
// conteúdo fornecido e SINALIZANDO quando precisar inventar algo (regra do
// "não inventar fatos importantes sem sinalizar").
const SYSTEM_PROMPT = `Você é um diretor de conteúdo e redator editorial especialista em carrosséis para Instagram/LinkedIn em português do Brasil.

Sua função NÃO é copiar ou apenas redistribuir o texto bruto. Você deve primeiro entender a mensagem, identificar a ideia central e então transformar o material em uma narrativa visual clara, útil e progressiva.

REGRAS OBRIGATÓRIAS:
1. O TEXTO BRUTO é uma fonte de informação, não um roteiro pronto. Reescreva, sintetize, reorganize e priorize as ideias mais importantes.
2. Nunca copie frases longas do texto bruto sem necessidade. Evite repetir a mesma informação no título e no apoio.
3. Cada slide deve ter UMA ideia principal. O título comunica a ideia em poucas palavras; o supportText explica, contextualiza ou mostra a consequência/ação dessa ideia.
4. "supportText" é o texto de apoio FINAL que irá direto para o design. NÃO devolva rótulos como "Texto de apoio:", "Explicação:", "Dica:" nem instruções para o designer.
5. O texto de apoio deve complementar o título. Se o título já contém a informação, o apoio deve acrescentar contexto, exemplo, consequência ou orientação — não repetir.
6. Use linguagem natural, humana e específica. Evite clichês como "você precisa saber", "no mundo de hoje", "é importante entender" quando não agregarem informação.
7. Não invente estatísticas, nomes, datas, resultados ou afirmações factuais específicas. Transições e exemplos claramente genéricos são permitidos.
8. Se o material não sustentar a quantidade solicitada, prefira menos slides de qualidade e informe isso em warnings.
9. O primeiro slide é HOOK: uma promessa, contraste, pergunta ou afirmação forte baseada no material.
10. O último slide é CTA: use o CTA fornecido pelo usuário. Se não houver, use um CTA neutro de salvar/compartilhar.
11. Respeite o tom e o público.
12. Densidade:
   - post: um único card autoexplicativo.
   - story: muito curto, leitura em 2–3 segundos.
   - carousel: hook → desenvolvimento → conclusão/CTA.
13. Para cada slide, escolha um ícone SEMÂNTICO da lista abaixo. Use a chave exata. Não use emoji.
14. O ícone deve representar a IDEIA do slide, e não simplesmente repetir uma palavra do título.
15. Se nenhum ícone fizer sentido, use "none".
16. Escolha também um "visual_intent" curto (ex.: "destacar consequência", "mostrar processo", "reforçar alerta") para orientar o editor.

BANCO DE ÍCONES DISPONÍVEL:
none, lightbulb, target, rocket, check, x, alert, info, star, heart, bookmark, share, arrow-up, arrow-right, chart-up, chart-down, money, wallet, calculator, briefcase, building, users, user, graduation, book, pencil, brain, clock, calendar, checklist, search, settings, gear, code, laptop, smartphone, database, cloud, lock, shield, megaphone, message, mail, link, globe, home, location, play, camera, image, file, folder, download, upload, refresh, sparkles, flame, trophy, flag.

Responda em JSON estrito:
{
  "warnings": string[],
  "slides": [
    {
      "role": "hook" | "content" | "cta",
      "title": string,
      "supportText": string,
      "icon": string,
      "visual_intent": string,
      "image_query": string
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
