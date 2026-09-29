# 🎨 AI Carousel Studio - Advanced Features Pack

**Tudo pronto para adicionar ao seu Criatto!**

---

## 📦 O que você recebeu

### ✨ 4 Arquivos Prontos

1. **`advanced-generation-modal.tsx`** - Componente do modal
2. **`generate-advanced.ts`** - API route para backend
3. **`integration-example.tsx`** - Exemplo de como usar
4. **`INTEGRATION_GUIDE.md`** - Passo-a-passo detalhado

---

## 🎯 Features Implementadas

### ✅ Seleção de Cores
- Color picker visual para 4 cores (primária, secundária, destaque, fundo)
- Preview das cores em tempo real
- Botão de reset para padrão

### ✅ Escolha de Template
- 4 templates prontos (Product Showcase, Photo+Typography, Minimalista, Vibrante)
- Descrição de cada template
- Preview de qual template está selecionado

### ✅ Customização de Fontes
- 5 opções de fontes para headlines
- 5 opções de fontes para corpo de texto
- Aplica ao resultado gerado

### ✅ Extração de URL/Artigo
- Campo para colar URL de artigo
- Extrai automaticamente o conteúdo
- Enriquece o prompt da IA com conteúdo extraído

### ✅ Geração Automática de Imagens
- Toggle para ativar/desativar
- Escolha de banco (Unsplash, Pexels, Pixabay)
- Busca imagens baseado na descrição do slide
- Totalmente grátis (usa APIs públicas)

---

## 🚀 Como Integrar (5 minutos)

### Step 1: Copie os arquivos

```bash
# Componente React
cp advanced-generation-modal.tsx src/components/

# API route
cp generate-advanced.ts app/api/generate-advanced/route.ts
```

### Step 2: Importe no seu componente principal

```tsx
import { AdvancedGenerationModal } from '@/components/advanced-generation-modal';

// Adicione o estado
const [showModal, setShowModal] = useState(false);

// Adicione o botão
<button onClick={() => setShowModal(true)}>
  ✨ Gerar com IA (Pro)
</button>

// Adicione o modal
<AdvancedGenerationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onGenerate={handleGenerate}
  isLoading={isLoading}
/>
```

### Step 3: Implemente o handler

```tsx
const handleGenerate = async (config, briefing) => {
  const response = await fetch('/api/generate-advanced', {
    method: 'POST',
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
  // Aqui carrega os slides no seu editor
};
```

**Pronto! Está funcionando.**

---

## 📊 O que a API retorna

```json
{
  "success": true,
  "slides": [
    {
      "id": "slide-0",
      "template": "template-01",
      "headline": "Seu Product Launch",
      "body": "Descritivo curto e impactante",
      "cta": "Conheça Mais",
      "image": "https://images.unsplash.com/...",
      "imageAlt": "Seu Product Launch",
      "colors": {
        "bg": "#FFFFFF",
        "text": "#004E89",
        "accent": "#FF6B35"
      },
      "fonts": {
        "headline": "Inter",
        "body": "Lato"
      }
    },
    // ... mais 4 slides
  ]
}
```

Use isso para carregar no seu editor/canvas.

---

## 💻 Variáveis de Ambiente

Adicione no seu `.env.local`:

```env
# Seus providers existentes
GROQ_API_KEY=xxx
GOOGLE_API_KEY=xxx
OPENROUTER_API_KEY=xxx

# Para imagens (opcional, grátis):
PEXELS_API_KEY=sua_chave
PIXABAY_API_KEY=sua_chave
```

**Sem configurar = imagens não aparecem, mas tudo mais funciona**

---

## 🎮 Flow do Usuário

```
1. Clica "✨ Gerar com IA"
   ↓
2. STEP 1 - Escreve briefing + cola URL (opcional)
   ↓
3. STEP 2 - Escolhe template, cores, fontes
   ↓
4. STEP 3 - Habilita imagens automáticas
   ↓
5. Clica "✨ Gerar Carrossel"
   ↓
6. Recebe 5 slides prontos com:
   - Headlines + body text
   - Cores aplicadas
   - Fontes selecionadas
   - Imagens (se habilitado)
   ↓
7. Pode aplicar ao editor ou editar depois
```

---

## 🎨 Customizações Comuns

### Adicionar mais templates?

No `advanced-generation-modal.tsx`:

```tsx
const templateOptions = [
  { id: 'template-01', name: '✨ Product Showcase', desc: '...' },
  { id: 'template-02', name: '📸 Photo + Typography', desc: '...' },
  // ADICIONE AQUI:
  { id: 'luxury', name: '💎 Luxury', desc: 'Elegante e minimalista' },
  { id: 'tech', name: '⚙️ Tech', desc: 'Futurístico' },
];
```

### Adicionar mais fontes?

```tsx
const fontOptions = {
  headline: ['Inter', 'Montserrat', 'Playfair Display', 'Poppins', 'Raleway'],
  body: ['Inter', 'Open Sans', 'Lato', 'Source Sans Pro', 'Roboto'],
};
```

### Melhorar extração de URL?

Instale uma lib de parsing:

```bash
npm install cheerio
```

E atualize o `extractArticleContent()`:

```tsx
import { load } from 'cheerio';

async function extractArticleContent(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = load(html);
  return $('article, [role="main"]').text();
}
```

---

## 🐛 Troubleshooting

### ❌ "Modal não aparece"
- Verifique se `isOpen={true}`
- Verifique imports

### ❌ "Slides vêm vázios"
- Sua API de IA está respondendo?
- Confira `/api/generate-copy` existe

### ❌ "Imagens não carregam"
- API keys configuradas?
- Teste manualmente: `curl "https://api.unsplash.com/search/photos?query=test"`

### ❌ "Estilo não aplica"
- Use `slide.colors.bg`, `slide.colors.text`, etc no seu CSS
- Fonte: `slide.fonts.headline`, `slide.fonts.body`

---

## 📈 Próximos Passos

1. **Integrar com seu editor** - aplicar os slides ao canvas
2. **Salvar gerações** - localStorage ou banco de dados
3. **Analytics** - track qual template é mais usado
4. **Melhorias de UX**:
   - Barra de progresso enquanto gera
   - Preview live das cores
   - Editar slides depois de gerar
   - Duplicate slides
   - Reorder slides

---

## 💰 Custo Total

| Feature | Custo |
|---------|-------|
| Componente React | $0 (seu código) |
| API Route | $0 (seu servidor) |
| IA (Groq/Gemini) | $0 (free tier) |
| Imagens (Unsplash/Pexels) | $0 (grátis) |
| Extração de URL | $0 (fetch nativo) |
| **TOTAL** | **$0** ✅ |

---

## 📞 Support

Qualquer dúvida:
1. Leia `INTEGRATION_GUIDE.md` (completo)
2. Veja `integration-example.tsx` (tem exemplos)
3. Checa se as env vars estão certas
4. Teste cada API isoladamente

---

## 🎉 Tá pronto!

Você tem **TUDO** para:
- ✅ Gerar carrosséis com IA
- ✅ Customizar cores
- ✅ Escolher templates
- ✅ Usar diferentes fontes
- ✅ Extrair conteúdo de URLs
- ✅ Buscar imagens automaticamente
- ✅ **ZERO CUSTO**

Boa sorte com o deploy! 🚀
