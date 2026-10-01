export type CopyOptions = {
  textMode: "rewrite" | "preserve";
  highlightMode: "auto" | "manual" | "none";
  highlightWords: string[];
};

export function normalizeCopyOptions(input: any = {}): CopyOptions {
  const options = input && typeof input === "object" ? input : {};
  const words = Array.isArray(options.highlightWords)
    ? options.highlightWords
    : typeof options.highlightWords === "string" ? options.highlightWords.split(",") : [];
  return {
    textMode: options.textMode === "preserve" ? "preserve" : "rewrite",
    highlightMode: ["manual", "none"].includes(options.highlightMode) ? options.highlightMode : "auto",
    highlightWords: [...new Set(words.filter((word: unknown) => typeof word === "string").map((word: string) => word.trim()).filter(Boolean))] as string[],
  };
}

export function highlightInstructions(options: CopyOptions): string {
  if (options.highlightMode === "none") return 'DESTAQUES: desativados pelo usuário. Retorne highlightWords: [].';
  if (options.highlightMode === "manual") return `DESTAQUES: escolha manual do usuário. Use SOMENTE expressões desta lista que existirem literalmente no texto: ${JSON.stringify(options.highlightWords)}. Não sugira outras palavras.`;
  return 'DESTAQUES: escolha automática autorizada. Escolha 1–3 expressões que existam literalmente no título ou no apoio.';
}

export function applyHighlightChoice(slide: any, options: CopyOptions): any {
  const words = options.highlightMode === "none" ? [] : options.highlightMode === "manual" ? options.highlightWords : (Array.isArray(slide.highlightWords) ? slide.highlightWords : []);
  const text = `${slide.title || ""} ${slide.supportText || ""}`.toLocaleLowerCase("pt-BR");
  return {
    ...slide,
    highlightWords: [...new Set(words.filter((word: unknown) => typeof word === "string" && word.trim() && text.includes(word.trim().toLocaleLowerCase("pt-BR"))).map((word: string) => word.trim()))],
  };
}

// Reconstruct preserved copy from the user's source, never from model-written text.
// Indices refer to words, while the original whitespace within each span is retained.
export function sourceWords(source: string): string[] {
  return source.trim().match(/\S+\s*/g) || [];
}

export const PRESERVE_SYSTEM_PROMPT = `Você organiza um texto existente em slides, sem reescrever.
O usuário escolheu preservar suas palavras. Não crie títulos, resumos, ganchos, CTA ou frases novas. Não corrija ortografia, não substitua sinônimos e não remova informações.
O texto está numerado por palavra a partir de 0. Escolha pontos de corte entre palavras.
Cada slide contém [sourceStart, sourceEnd), com título [sourceStart, titleEnd) e apoio [titleEnd, sourceEnd).
Os intervalos devem cobrir TODAS as palavras UMA vez, na ordem original: primeiro sourceStart=0; cada sourceStart igual ao sourceEnd anterior; último sourceEnd igual ao total de palavras.
Use números inteiros e sourceStart < titleEnd <= sourceEnd. Priorize cortes que respeitem frases e parágrafos. Tente manter os títulos curtos, mas preservar o conteúdo é mais importante que tamanho.
Use a quantidade solicitada, ou menos slides quando o texto for curto. Escolha icon, palette_strategy e highlightStyle com as mesmas opções do roteiro editorial. Não use emoji.
JSON estrito: {"warnings":[],"slides":[{"sourceStart":0,"titleEnd":5,"sourceEnd":20,"role":"hook","icon":"lightbulb","highlightWords":[],"highlightStyle":"solid","palette_strategy":"base","image_query":""}]}.
Ícones: none, lightbulb, target, rocket, check, x, alert, info, star, heart, bookmark, share, arrow-up, arrow-right, chart-up, chart-down, money, wallet, calculator, briefcase, building, users, user, graduation, book, pencil, brain, clock, calendar, checklist, search, settings, gear, code, laptop, smartphone, database, cloud, lock, shield, megaphone, message, mail, link, globe, home, location, play, camera, image, file, folder, download, upload, refresh, sparkles, flame, trophy, flag.
palette_strategy: base, alternativa, destaque, invertida, misturada. highlightStyle: solid ou soft.`;

export function indexedSource(source: string): string {
  const words = sourceWords(source);
  return `TOTAL DE PALAVRAS: ${words.length}\nPALAVRAS ORIGINAIS (índices entre colchetes):\n${words.map((word, index) => `[${index}] ${word.trimEnd()}`).join("\n")}`;
}

export function organizePreservedScript(result: any, source: string, requestedCount: number): any {
  const words = sourceWords(source);
  if (!words.length) throw new Error("Cole um texto ou informe uma URL para organizar sem reescrever.");
  const count = Math.max(1, Math.min(20, Math.trunc(requestedCount) || 7, words.length));
  let slides = Array.isArray(result?.slides) ? result.slides : [];
  let next = 0;
  const valid = slides.length > 0 && slides.length <= count && slides.every((slide: any) => {
    if (!slide || ![slide.sourceStart, slide.titleEnd, slide.sourceEnd].every(Number.isInteger)) return false;
    const ok = slide.sourceStart === next && slide.titleEnd > next && slide.titleEnd <= slide.sourceEnd && slide.sourceEnd <= words.length;
    next = slide.sourceEnd;
    return ok;
  }) && next === words.length;
  const warnings = Array.isArray(result?.warnings) ? result.warnings.filter((warning: unknown) => typeof warning === "string") : [];
  if (!valid) {
    // An invalid model partition must not cause missing words or unauthorized rewriting.
    const fallbackCount = Math.min(count, Math.max(1, Math.ceil(words.length / 30)));
    slides = Array.from({ length: fallbackCount }, (_, index) => {
      const sourceStart = Math.floor(index * words.length / fallbackCount);
      const sourceEnd = Math.floor((index + 1) * words.length / fallbackCount);
      const titleLength = Math.min(9, Math.max(1, Math.ceil((sourceEnd - sourceStart) / 3)));
      return { sourceStart, titleEnd: sourceStart + titleLength, sourceEnd, role: index === 0 ? "hook" : index === fallbackCount - 1 ? "cta" : "content" };
    });
    warnings.push("A divisão sugerida pela IA foi ajustada para preservar todas as palavras do seu texto.");
  }
  return {
    warnings,
    slides: slides.map((slide: any) => ({
      ...slide,
      title: words.slice(slide.sourceStart, slide.titleEnd).join("").trim(),
      supportText: words.slice(slide.titleEnd, slide.sourceEnd).join("").trim(),
    })),
  };
}

export function finalizeGeneratedScript(result: any, options: CopyOptions, source: string, count: number): any {
  const script = options.textMode === "preserve" ? organizePreservedScript(result, source, count) : result;
  if (!Array.isArray(script?.slides) || !script.slides.length) throw new Error("A IA não retornou slides válidos. Tente novamente.");
  return {
    ...script,
    slides: script.slides.map((slide: any) => {
      if (!slide || typeof slide.title !== "string") throw new Error("A IA retornou um slide sem título válido. Tente novamente.");
      const supportText = slide.supportText ?? slide.subtitle ?? slide.body ?? "";
      return applyHighlightChoice({ ...slide, supportText: typeof supportText === "string" ? supportText : "" }, options);
    }),
  };
}

export function finalizeRegeneratedSlide(result: any, current: any, options: CopyOptions): any {
  const slide = options.textMode === "preserve" ? { ...result, title: current.title, supportText: current.supportText ?? "" } : result;
  if (!slide || typeof slide.title !== "string" || !slide.title.trim()) throw new Error("A IA retornou uma resposta sem título.");
  return applyHighlightChoice({ ...slide, supportText: typeof slide.supportText === "string" ? slide.supportText : "" }, options);
}
