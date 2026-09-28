# AI Carousel Studio

Ferramenta pessoal e gratuita para criar carrosséis (1080×1350) com apoio de IA:
referências + conteúdo + direção → roteiro gerado → editor visual completo → exportação em PNG.

100% gratuita: usa apenas provedores de IA com **free tier**, com **fallback automático**
entre eles (se um falhar ou a cota acabar, o próximo entra no lugar).

---

## 1. Pré-requisitos

- [Node.js](https://nodejs.org) versão 18 ou superior instalado no seu computador.
- Uma conta de e-mail para criar as chaves de API (todas grátis).

## 2. Instalar o projeto

Abra um terminal na pasta do projeto e rode:

```bash
npm install
```

## 3. Criar as chaves de API gratuitas

Você não precisa de todas — mas quanto mais tiver, mais forte o fallback.
Recomendado ter pelo menos **Groq** e **Gemini**.

### Groq (texto, muito rápido, free tier generoso)
1. Acesse https://console.groq.com/keys
2. Crie uma conta grátis e gere uma chave (API Key).
3. Copie a chave.

### Google AI Studio / Gemini (texto + análise de imagens de referência)
1. Acesse https://aistudio.google.com/apikey
2. Faça login com uma conta Google e clique em "Create API Key".
3. Copie a chave.

### OpenRouter (opcional — 3ª camada de fallback, modelos ":free")
1. Acesse https://openrouter.ai/keys
2. Crie uma conta grátis e gere uma chave.
3. Copie a chave.

## 4. Configurar as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Abra `.env.local` e cole suas chaves:

```
GROQ_API_KEY=sua_chave_aqui
GOOGLE_API_KEY=sua_chave_aqui
OPENROUTER_API_KEY=sua_chave_aqui
```

**Nunca** compartilhe esse arquivo nem o suba para um repositório público (já está
no `.gitignore`).

## 5. Rodar localmente

```bash
npm run dev
```

Abra http://localhost:3000 no navegador. Pronto — editor e IA já conectados.

## 6. Como usar

1. Clique em **"✨ Gerar com IA"** no topo.
2. Aba **Referências** (opcional): envie prints/carrosséis que você admira e uma nota do que gostou.
3. Aba **Conteúdo**: informe tema, ou cole seu texto/roteiro pronto, tom de voz, público, CTA e quantidade de slides.
4. Aba **Direção**: escolha um estilo (ou descreva livremente).
5. Clique em **"Gerar roteiro"**. A IA escreve o carrossel inteiro e os slides já aparecem no editor.
6. Edite tudo normalmente: textos, fontes, cores, imagens, posição — como já era possível antes.
7. Exporte os PNGs.

Se você já tem o texto pronto e só quer usar o editor manual, **não precisa usar o botão de IA** —
o editor funciona 100% offline e sozinho (Regra 8 da especificação: nunca fica refém da IA).

## 7. Publicar online (opcional)

Se quiser acessar de qualquer lugar (não só do seu computador):

1. Suba este projeto para um repositório no GitHub (privado, se preferir).
2. Crie uma conta grátis na [Vercel](https://vercel.com) e conecte o repositório.
3. Nas configurações do projeto na Vercel, adicione as mesmas variáveis de ambiente
   do seu `.env.local` (GROQ_API_KEY, GOOGLE_API_KEY, OPENROUTER_API_KEY).
4. Deploy automático a cada alteração.

## 8. Estrutura do projeto

```
app/
  page.tsx                        → carrega o editor (public/editor.html)
  api/generate-copy/route.ts      → gera o roteiro do carrossel (com fallback)
  api/analyze-references/route.ts → analisa imagens de referência (com fallback)
lib/
  ai-providers.ts                 → roteador de IA: Groq → Gemini → OpenRouter
public/
  editor.html                     → editor visual completo (drag/resize/fontes/cores/export)
```

## 9. Sobre os limites do free tier

Os provedores gratuitos têm cotas diárias/por minuto. Se um provedor recusar
(cota esgotada, erro, indisponibilidade), o sistema tenta automaticamente o
próximo da lista configurada em `AI_TEXT_PROVIDER_ORDER` / `AI_VISION_PROVIDER_ORDER`
no `.env.local`. Se todos falharem, você verá a mensagem de erro com o detalhe
de cada tentativa — e pode sempre preencher o carrossel manualmente enquanto isso.

## 10. Próximas fases (roadmap)

- **Fase 3**: geração/troca de imagens por IA dentro do editor (ex: modelos gratuitos
  de geração de imagem, quando disponíveis com free tier estável).
- **Fase 4**: exportação em PDF/ZIP, biblioteca de estilos salvos, histórico de projetos,
  múltiplos projetos com persistência em banco (ex: Supabase), se algum dia sair do uso
  puramente local.
