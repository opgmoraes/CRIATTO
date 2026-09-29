// app/api/regenerate-slide/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface RegenerateRequest {
  briefing: string;
  slideIndex: number;
  totalSlides: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  template: string;
}

async function callAIProvider(prompt: string): Promise<string> {
  // Tenta Groq primeiro
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error('Groq error');
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.warn('Groq failed, trying Google...');
    }
  }

  // Fallback para Google Gemini
  if (process.env.GOOGLE_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error('Google error');
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.warn('Google failed, trying OpenRouter...');
    }
  }

  // Fallback final: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral/mistral-7b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
      });

      if (!response.ok) throw new Error('OpenRouter error');
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('All AI providers failed:', error);
      throw new Error('Failed to generate content');
    }
  }

  throw new Error('No AI provider configured');
}

export async function POST(request: NextRequest) {
  try {
    const body: RegenerateRequest = await request.json();

    const {
      briefing,
      slideIndex,
      totalSlides,
      colors,
      fonts,
      template,
    } = body;

    // Cria um prompt focado em APENAS um slide
    const prompt = `
Você é um especialista em criar conteúdo para carrosséis de Instagram/TikTok.

CONTEXTO:
- Briefing: ${briefing}
- Slide: ${slideIndex + 1}/${totalSlides}
- Template: ${template}

GERE APENAS UM SLIDE com:
- Headline: Impactante, max 8 palavras
- Body: Descritivo, max 150 caracteres
- CTA (call-to-action): Ação clara, max 3 palavras (ex: "Saiba Mais", "Clique Aqui")

Responda APENAS em JSON puro, sem explicações:
{
  "headline": "...",
  "body": "...",
  "cta": "..."
}
`;

    const aiResponse = await callAIProvider(prompt);

    // Parse da resposta
    let parsedResponse;
    try {
      // Remove markdown code blocks se existirem
      const cleanedResponse = aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Busca imagem automática (opcional)
    let imageUrl: string | undefined;
    try {
      const imagePrompt = `${parsedResponse.headline} ${parsedResponse.body}`;
      const searchQuery = encodeURIComponent(imagePrompt.slice(0, 50));

      // Tenta Unsplash
      if (process.env.UNSPLASH_ACCESS_KEY) {
        const unsplashResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=1`,
          {
            headers: {
              'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
            },
          }
        );

        if (unsplashResponse.ok) {
          const data = await unsplashResponse.json();
          if (data.results?.[0]?.urls?.regular) {
            imageUrl = data.results[0].urls.regular;
          }
        }
      }
    } catch (error) {
      console.warn('Image search failed (non-critical):', error);
    }

    return NextResponse.json({
      success: true,
      slide: {
        id: `slide-${slideIndex}-${Date.now()}`,
        template,
        headline: parsedResponse.headline,
        body: parsedResponse.body,
        cta: parsedResponse.cta,
        image: imageUrl,
        imageAlt: parsedResponse.headline,
        colors: {
          bg: colors.bg,
          text: colors.primary,
          accent: colors.accent,
        },
        fonts: {
          headline: fonts.headline,
          body: fonts.body,
        },
      },
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate slide',
      },
      { status: 500 }
    );
  }
}
