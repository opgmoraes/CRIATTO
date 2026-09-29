import { NextRequest, NextResponse } from 'next/server';

interface GenerationRequest {
  briefing: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  template: string;
  fonts: {
    headline: string;
    body: string;
  };
  articleUrl?: string;
  autoImages: boolean;
  imageSource: 'unsplash' | 'pexels' | 'pixabay';
}

interface Slide {
  id: string;
  template: string;
  headline: string;
  body: string;
  cta?: string;
  image?: string;
  imageAlt?: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
}

// Extrai conteúdo de um URL
async function extractArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    // Extrai texto do HTML (simplificado - em produção usar cheerio ou jsdom)
    const textMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (textMatch) {
      const text = textMatch[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return text.substring(0, 2000); // Primeiros 2000 caracteres
    }
  } catch (error) {
    console.error('Erro ao extrair URL:', error);
  }
  return '';
}

// Busca imagens em banco grátis
async function fetchAutoImage(description: string, source: 'unsplash' | 'pexels' | 'pixabay'): Promise<string | null> {
  try {
    // Usando APIs públicas (requer API keys em produção)
    const query = encodeURIComponent(description.substring(0, 50));

    if (source === 'unsplash') {
      // Unsplash public API (sem key needed para queries simples)
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=1&client_id=YOUR_UNSPLASH_KEY`);
      const data = await res.json();
      return data.results?.[0]?.urls?.regular || null;
    } else if (source === 'pexels') {
      // Pexels API
      const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
        headers: { Authorization: process.env.PEXELS_API_KEY || '' },
      });
      const data = await res.json();
      return data.photos?.[0]?.src?.medium || null;
    } else if (source === 'pixabay') {
      // Pixabay API
      const res = await fetch(`https://pixabay.com/api/?q=${query}&per_page=1&key=${process.env.PIXABAY_API_KEY || ''}`);
      const data = await res.json();
      return data.hits?.[0]?.webformatURL || null;
    }
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
  }
  return null;
}

// Gera roteiro com IA (usa seu provider existente)
async function generateWithAI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefing: prompt }),
    });
    const data = await response.json();
    return data.copy || '';
  } catch (error) {
    console.error('Erro ao gerar com IA:', error);
    return '';
  }
}

// Processa prompt para extrair slides
function parseSlides(aiGenerated: string, colors: any, fonts: any, template: string): Slide[] {
  const slides: Slide[] = [];

  // Parse do output da IA (esperando formato JSON ou estruturado)
  try {
    // Se for JSON
    const parsed = JSON.parse(aiGenerated);
    if (Array.isArray(parsed)) {
      return parsed.map((s: any, i: number) => ({
        id: `slide-${i}`,
        template,
        headline: s.headline || s.title || '',
        body: s.body || s.description || '',
        cta: s.cta || undefined,
        colors: {
          bg: colors.background,
          text: colors.secondary,
          accent: colors.primary,
        },
        fonts,
      }));
    }
  } catch {
    // Fallback: parsear como texto estruturado
    const lines = aiGenerated.split('\n').filter((l) => l.trim());
    const slides = [];

    for (let i = 0; i < lines.length; i += 3) {
      slides.push({
        id: `slide-${slides.length}`,
        template,
        headline: lines[i] || '',
        body: lines[i + 1] || '',
        cta: lines[i + 2] || undefined,
        colors: {
          bg: colors.background,
          text: colors.secondary,
          accent: colors.primary,
        },
        fonts,
      });
    }

    return slides;
  }

  return slides;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();

    let enrichedBriefing = body.briefing;

    // Extrai conteúdo do artigo se URL fornecida
    if (body.articleUrl) {
      const articleContent = await extractArticleContent(body.articleUrl);
      enrichedBriefing = `${body.briefing}\n\nConteúdo do artigo:\n${articleContent}`;
    }

    // Gera roteiro com IA
    const prompt = `
Gere 5 slides de carrossel Instagram (1080x1350) baseado nisso:

${enrichedBriefing}

Template: ${body.template}
Cores: primária ${body.colors.primary}, secundária ${body.colors.secondary}
Tipografia: headlines em ${body.fonts.headline}, corpo em ${body.fonts.body}

Forneça JSON com array de objetos:
{
  "headline": "texto curto e impactante",
  "body": "parágrafo curto (max 2 linhas)",
  "cta": "call-to-action opcional"
}
`;

    const aiGenerated = await generateWithAI(prompt);
    const slides = parseSlides(aiGenerated, body.colors, body.fonts, body.template);

    // Busca imagens automaticamente se habilitado
    if (body.autoImages) {
      for (const slide of slides) {
        const imageDesc = `${slide.headline} ${slide.body}`;
        const imageUrl = await fetchAutoImage(imageDesc, body.imageSource);
        if (imageUrl) {
          slide.image = imageUrl;
          slide.imageAlt = slide.headline;
        }
      }
    }

    return NextResponse.json({
      success: true,
      slides,
      config: {
        colors: body.colors,
        template: body.template,
        fonts: body.fonts,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar carrossel' },
      { status: 500 }
    );
  }
}
