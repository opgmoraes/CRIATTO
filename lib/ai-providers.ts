/**
 * AI Router — Regra 6 e 7 da especificação: nenhum recurso crítico depende
 * de um único provedor, e priorizamos free tier / open source.
 *
 * Cada provedor implementa a mesma interface. O router tenta cada um na
 * ordem configurada em .env.local até um funcionar.
 */

export type ChatMessage =
  | { role: "user"; text: string }
  | { role: "user"; text: string; images: string[] }; // images = data URLs base64

export interface TextProvider {
  name: string;
  generateJSON(systemPrompt: string, userText: string): Promise<any>;
}

export interface VisionProvider {
  name: string;
  analyzeImages(systemPrompt: string, userText: string, imageDataUrls: string[]): Promise<any>;
}

function extractJSON(raw: string): any {
  // Modelos às vezes envolvem o JSON em ```json ... ``` ou adicionam texto solto.
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let start = -1;
  if (firstBrace === -1) start = firstBracket;
  else if (firstBracket === -1) start = firstBrace;
  else start = Math.min(firstBrace, firstBracket);
  if (start > 0) cleaned = cleaned.slice(start);
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);
  if (end >= 0) cleaned = cleaned.slice(0, end + 1);
  return JSON.parse(cleaned);
}

/* ============ GROQ (texto — grátis, rápido) ============ */
export const groqText: TextProvider = {
  name: "groq",
  async generateJSON(systemPrompt, userText) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY ausente");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq falhou: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return extractJSON(data.choices[0].message.content);
  },
};

/* ============ GEMINI (texto + visão — grátis) ============ */
export const geminiText: TextProvider = {
  name: "gemini",
  async generateJSON(systemPrompt, userText) {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GOOGLE_API_KEY ausente");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini falhou: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini retornou resposta vazia");
    return extractJSON(text);
  },
};

export const geminiVision: VisionProvider = {
  name: "gemini",
  async analyzeImages(systemPrompt, userText, imageDataUrls) {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GOOGLE_API_KEY ausente");
    const imageParts = imageDataUrls.map((durl) => {
      const [meta, b64] = durl.split(",");
      const mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
      return { inline_data: { mime_type: mime, data: b64 } };
    });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userText }, ...imageParts] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini vision falhou: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini vision retornou resposta vazia");
    return extractJSON(text);
  },
};

/* ============ OPENROUTER (texto — modelos ":free") ============ */
export const openrouterText: TextProvider = {
  name: "openrouter",
  async generateJSON(systemPrompt, userText) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY ausente");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt + "\n\nResponda APENAS com JSON válido, sem markdown." },
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter falhou: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return extractJSON(data.choices[0].message.content);
  },
};

/* ============ GROQ VISION (fallback de análise de imagem) ============ */
export const groqVision: VisionProvider = {
  name: "groq",
  async analyzeImages(systemPrompt, userText, imageDataUrls) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY ausente");
    const content: any[] = [{ type: "text", text: userText }];
    for (const durl of imageDataUrls.slice(0, 4)) {
      content.push({ type: "image_url", image_url: { url: durl } });
    }
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt + "\n\nResponda APENAS com JSON válido." },
          { role: "user", content },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq vision falhou: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return extractJSON(data.choices[0].message.content);
  },
};

/* ============ REGISTRY + FALLBACK ============ */
const TEXT_PROVIDERS: Record<string, TextProvider> = {
  groq: groqText,
  gemini: geminiText,
  openrouter: openrouterText,
};
const VISION_PROVIDERS: Record<string, VisionProvider> = {
  gemini: geminiVision,
  groq: groqVision,
};

function orderFromEnv(envVar: string | undefined, fallback: string[]): string[] {
  if (!envVar) return fallback;
  return envVar.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function generateTextWithFallback(systemPrompt: string, userText: string) {
  const order = orderFromEnv(process.env.AI_TEXT_PROVIDER_ORDER, ["groq", "gemini", "openrouter"]);
  const errors: string[] = [];
  for (const name of order) {
    const provider = TEXT_PROVIDERS[name];
    if (!provider) continue;
    try {
      const result = await provider.generateJSON(systemPrompt, userText);
      return { result, providerUsed: provider.name };
    } catch (err: any) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error(
    "Todos os provedores de texto falharam ou não têm chave configurada.\n" + errors.join("\n")
  );
}

export async function analyzeImagesWithFallback(
  systemPrompt: string,
  userText: string,
  imageDataUrls: string[]
) {
  const order = orderFromEnv(process.env.AI_VISION_PROVIDER_ORDER, ["gemini", "groq"]);
  const errors: string[] = [];
  for (const name of order) {
    const provider = VISION_PROVIDERS[name];
    if (!provider) continue;
    try {
      const result = await provider.analyzeImages(systemPrompt, userText, imageDataUrls);
      return { result, providerUsed: provider.name };
    } catch (err: any) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error(
    "Todos os provedores de visão falharam ou não têm chave configurada.\n" + errors.join("\n")
  );
}
