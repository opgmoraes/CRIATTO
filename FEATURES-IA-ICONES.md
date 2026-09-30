# CRIATTO — IA editorial + banco de ícones

## IA editorial
- O texto bruto agora é tratado como fonte, não como roteiro pronto.
- A IA retorna `supportText` final para o design.
- O apoio deve complementar o título e evitar repetição.
- Cada slide recebe `visual_intent` e um ícone semântico.
- Regeneração individual usa a mesma lógica.

## Banco de ícones
- Banco de opções de ícones SVG inline no editor, sem dependência de CDN para a interface funcionar.
- Busca por nome e termos em português.
- Seleção manual por slide.
- Cores: destaque, texto ou branco.
- Tamanhos: pequeno, médio e grande.
- Ícones são SVG no DOM e acompanham a exportação.

## Compatibilidade
Slides antigos sem `icon`, `iconSize` ou `iconColor` recebem valores padrão automaticamente.

## Correção de estabilidade
- Removida a dependência bloqueante do CDN do Lucide.
- Corrigida a referência de paleta usada pelo renderizador do banco de ícones.
- Mantido o html2canvas como carregamento não bloqueante para não impedir a inicialização do editor.
