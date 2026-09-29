# 🚀 Guia de Integração - Advanced Generation Modal

## O que foi criado

Você agora tem **3 arquivos prontos** para adicionar ao seu projeto:

### 1. **advanced-generation-modal.tsx** 
Componente React com:
- ✅ Step-by-step modal (Briefing → Design → Imagens)
- ✅ Seletor de template (4 opções prontas)
- ✅ Color picker para customizar cores (primária, secundária, destaque, fundo)
- ✅ Seletor de fontes (5 opções headlines, 5 opções body)
- ✅ Campo de URL para extrair conteúdo de artigo
- ✅ Toggle para gerar imagens automaticamente
- ✅ Seletor de banco de imagens (Unsplash, Pexels, Pixabay)

### 2. **generate-advanced.ts**
API Route que:
- Extrai conteúdo de URLs (Webhook de artigos)
- Enriquece o prompt com conteúdo extraído
- Gera slides com IA (seu provider existente)
- Busca imagens automáticas em bancos grátis
- Retorna slides prontos com cores, fontes, e imagens

### 3. Este guia
Instruções passo-a-passo

---

## ✅ Passo-a-Passo de Integração

### **PASSO 1: Copiar Componente**

```bash
# Copie o arquivo para seu projeto:
cp advanced-generation-modal.tsx src/components/
```

### **PASSO 2: Copiar API Route**

```bash
# Copie para suas API routes:
cp generate-advanced.ts app/api/generate-advanced/route.ts
```

### **PASSO 3: Adicionar ao seu componente pai (page.tsx ou similar)**

```tsx
import { AdvancedGenerationModal } from '@/components/advanced-generation-modal';
import { useState } from 'react';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (config, briefing) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefing,
          colors: config.colors,
          template: config.template,
          fonts: config.fonts,
          articleUrl: config.articleUrl,
          autoImages: config.autoImages,
          imageSource: config.imageSource,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Carrega os slides no editor
        console.log('Slides gerados:', data.slides);
        // Você vai integrar isso com seu editor
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        ✨ Gerar com IA (Pro)
      </button>

      <AdvancedGenerationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### **PASSO 4: Configurar variáveis de ambiente** (.env.local)

```env
# Seu provider de IA (já tem)
GROQ_API_KEY=xxx
GOOGLE_API_KEY=xxx
OPENROUTER_API_KEY=xxx

# Para imagens automáticas (opcional, grátis):
PEXELS_API_KEY=seu_token_pexels
PIXABAY_API_KEY=seu_token_pixabay
UNSPLASH_ACCESS_KEY=seu_token_unsplash (opcional)
```

### **PASSO 5: Integrar resposta no Editor**

A resposta da API retorna:
```json
{
  "success": true,
  "slides": [
    {
      "id": "slide-0",
      "template": "template-01",
      "headline": "...",
      "body": "...",
      "cta": "...",
      "image": "url_da_imagem",
      "colors": { "bg": "#fff", "text": "#004E89", "accent": "#FF6B35" },
      "fonts": { "headline": "Inter", "body": "Lato" }
    }
  ],
  "config": { ... }
}
```

Você vai usar isso para **atualizar seu editor** com:
- Slides novos já com layout configurado
- Cores aplicadas
- Fontes selecionadas  
- Imagens prontas (opcional)

---

## 🎨 Customizações

### Adicionar mais templates

No `advanced-generation-modal.tsx`, expanda `templateOptions`:

```tsx
const templateOptions = [
  // ... existentes
  { id: 'luxury', name: '✨ Luxury', desc: 'Elegante, minimalista' },
  { id: 'tech', name: '⚙️ Tech', desc: 'Futurístico, moderno' },
];
```

### Adicionar mais fontes

```tsx
const fontOptions = {
  headline: ['Inter', 'Montserrat', 'Playfair Display', 'Poppins', 'DM Serif Display', 'Raleway'],
  body: ['Inter', 'Open Sans', 'Lato', 'Source Sans Pro', 'Roboto', 'Work Sans'],
};
```

### Customizar a lógica de extração de URL

Em `generate-advanced.ts`, melhore o `extractArticleContent()`:

```tsx
// Use uma lib como cheerio ou jsdom para parsing melhor
import { load } from 'cheerio';

async function extractArticleContent(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = load(html);
  
  // Extrai apenas o conteúdo principal
  const content = $('article, [role="main"], .content').text();
  return content.substring(0, 2000);
}
```

---

## 🖼️ Integração de Imagens

### Opção 1: APIs Públicas (já está pronto)
```tsx
// Unsplash, Pexels, Pixabay - sem custo
// Já implementado em generate-advanced.ts
```

### Opção 2: Gemini Vision (você já usa!)
```tsx
// Usar sua integração de visão para gerar descrições melhores
const prompt = `Descreva uma imagem perfeita para este slide: "${slide.headline}"`;
// Integre com seu /api/analyze-references existente
```

---

## 🔧 Troubleshooting

### "Erro ao buscar imagem"
- Verifique se as API keys estão configuradas
- Teste manualmente: `curl "https://api.unsplash.com/search/photos?query=test"`

### "Modal não aparece"
- Verifique se está importando `AdvancedGenerationModal` corretamente
- Confira se `isOpen={true}` está sendo passado

### "Slides não carregam cores/fontes"
- A resposta da API inclui `config` - use isso para aplicar estilos
- Você vai precisar updatear seu editor para ler esse `config`

---

## 📊 Próximos Passos Recomendados

1. **Integrar com seu editor** - receber os slides e aplicar ao canvas
2. **Adicionar localStorage** - salvar últimas gerações
3. **Implementar histórico** - mostrar últimas 5 gerações
4. **Melhorar UX** - toasts de sucesso/erro, barra de progresso
5. **Teste com dados reais** - vá gerando carrosséis pra refinar

---

## 💰 Custo

- ✅ Totalmente grátis (usa seus providers + APIs grátis)
- Imagens: Unsplash/Pexels/Pixabay (grátis)
- IA: Seus provedores (Groq free tier, etc)
- Extração: Fetch nativo (sem custo)

---

**Qualquer dúvida na integração, é só chamar!** 🚀
