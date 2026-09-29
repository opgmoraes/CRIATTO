# 🚀 CRIATTO - Advanced Features

**Editar Slides • Regenerar Individual • Logo**

---

## ⚡ INSTALAÇÃO (5 minutos)

### PASSO 1: Copiar Arquivos

Copie os 3 arquivos para seu projeto CRIATTO:

```bash
# Componentes (copie para src/components/)
cp src/components/edit-slides-modal.tsx seu_projeto/src/components/
cp src/components/logo-upload-modal.tsx seu_projeto/src/components/

# API (copie para app/api/regenerate-slide/)
cp app/api/regenerate-slide/route.ts seu_projeto/app/api/regenerate-slide/
```

---

### PASSO 2: Importar no seu Componente

Abra o componente que usa os carrosséis (ex: `app/page.tsx`):

```tsx
import { EditSlidesModal } from '@/components/edit-slides-modal';
import { LogoUploadModal } from '@/components/logo-upload-modal';
```

---

### PASSO 3: Adicionar Estados

```tsx
const [showEditModal, setShowEditModal] = useState(false);
const [showLogoModal, setShowLogoModal] = useState(false);
const [logo, setLogo] = useState(null);
const [isRegenerating, setIsRegenerating] = useState(false);
```

---

### PASSO 4: Adicionar Modais no JSX

```tsx
<EditSlidesModal
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  slides={slides}
  onSave={handleSaveSlides}
  onRegenerateSingle={handleRegenerateSingle}
  isRegenerating={isRegenerating}
/>

<LogoUploadModal
  isOpen={showLogoModal}
  onClose={() => setShowLogoModal(false)}
  onLogoSelect={handleLogoSelect}
  currentLogo={logo?.url}
/>
```

---

### PASSO 5: Implementar Handlers

```tsx
// Salvar slides editados
const handleSaveSlides = (editedSlides) => {
  setSlides(editedSlides);
};

// Regenerar um slide
const handleRegenerateSingle = async (slideIndex) => {
  setIsRegenerating(true);
  const response = await fetch('/api/regenerate-slide', {
    method: 'POST',
    body: JSON.stringify({
      briefing: 'Regenerar',
      slideIndex,
      totalSlides: slides.length,
      colors: { ... },
      fonts: slides[slideIndex].fonts,
      template: slides[slideIndex].template,
    }),
  });
  const data = await response.json();
  return data.slide;
};

// Logo
const handleLogoSelect = (logoData) => {
  setLogo(logoData);
};
```

---

### PASSO 6: Adicionar Botões

Quando tiver slides:

```tsx
{slides.length > 0 && (
  <>
    <button onClick={() => setShowEditModal(true)}>
      ✏️ Editar Slides
    </button>
    
    <button onClick={() => setShowLogoModal(true)}>
      🎨 Adicionar Logo
    </button>
  </>
)}
```

---

### PASSO 7: Rodar

```bash
npm run dev
```

**Pronto!** ✨

---

## 📊 Funcionalidades

### ✏️ Edição de Slides
- Editar headline, body, CTA
- Upload de imagens
- Color picker
- Drag & drop para reordenar
- Duplicar/deletar slides
- Preview ao vivo

### 🔄 Regenerar Slide Individual
- Regenera apenas 1 slide
- Mantém os outros intactos
- ~2-3 segundos

### 🎨 Upload de Logo
- 3 tamanhos (P/M/G)
- 6 posições diferentes
- Controle de opacidade
- Aparece em todos os slides

---

## 📚 Documentação

1. **INTEGRATION-ADVANCED.md** - Guia completo com exemplos
2. **UPDATE-NEW-FEATURES.md** - O que tem de novo
3. **README.md** - Overview

---

## ✅ Pronto!

Tudo que você precisa está aqui. Boa sorte! 🚀
