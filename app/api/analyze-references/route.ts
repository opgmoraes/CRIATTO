import { NextRequest, NextResponse } from "next/server";
import { analyzeImagesWithFallback } from "../../../lib/ai-providers";

// Seção 5 da especificação: analisa tipografia, cores, layout, elementos
// gráficos e estilo de imagem das referências — como DIREÇÃO, não para cópia
// literal (Regra 4 / seção 6).
const SYSTEM_PROMPT = `Você é um diretor de arte analisando referências visuais de carrosséis para redes sociais.
Sua tarefa é extrair a LINGUAGEM VISUAL das imagens (não o conteúdo literal) para orientar um novo design original.
Responda em JSON estrito, no formato:
{
  "typography": { "style": string, "serif_or_sans": string, "weight": string, "case": string, "notes": string },
  "colors": { "background": string (hex aproximado), "text": string, "accent": string, "palette_notes": string },
  "layout": { "alignment": string, "spacing": string, "composition": string, "notes": string },
  "graphic_elements": string[],
  "image_style": string,
  "summary_direction": string  // frase curta tipo "tipografia grande + alto contraste + composição editorial"
}
Não descreva o conteúdo textual específico das imagens de referência, apenas o estilo visual.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const images: string[] = body.images || []; // array de data URLs base64
    const extraNotes: string = body.notes || "";

    if (!images.length) {
      return NextResponse.json({ error: "Envie ao menos uma imagem de referência." }, { status: 400 });
    }

    const userText = `Analise estas referências visuais de carrossel.${
      extraNotes ? " Notas adicionais do usuário: " + extraNotes : ""
    }`;

    const { result, providerUsed } = await analyzeImagesWithFallback(SYSTEM_PROMPT, userText, images);

    return NextResponse.json({ analysis: result, providerUsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao analisar referências." }, { status: 500 });
  }
}
