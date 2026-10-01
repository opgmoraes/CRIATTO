# Atualização — Camadas, ícones, paleta e destaques

## O que mudou

- Removidos os números exibidos acima/dentro dos slides.
- Cada elemento visual passou a possuir uma camada lógica própria: imagem, overlay, elemento visual, ícone, etiqueta, logo, título, texto de apoio, indicadores, rodapé e borda.
- A seção **Camadas** do editor permite trazer uma camada para frente ou enviar para trás.
- O elemento decorativo começa atrás do título e do texto, evitando o problema do asterisco cobrindo a tipografia.
- O banco de ícones continua inline/SVG e agora recebe fallback semântico quando a IA não retorna um ícone válido.
- A geração com IA recebe `highlightWords`, `highlightStyle` e `palette_strategy`.
- A IA pode indicar palavras para receber destaque estilo marca-texto.
- A geração sem template mistura as quatro cores fornecidas pelo usuário em composições diferentes por slide.
- Ícones e elementos decorativos também podem alternar entre cor de destaque, alternativa e texto.
- A regeneração individual respeita a mesma lógica de paleta, destaque e ícone.

## Compatibilidade

Projetos antigos são migrados automaticamente: se o slide não possuir `layers`, o editor cria a ordem padrão.

## Validação

- JavaScript embutido em `public/editor.html`: `node --check` passou.
- `git diff --check` passou.
- O `tsc` não pôde ser concluído neste ambiente porque as dependências de `node_modules` não estão instaladas.
