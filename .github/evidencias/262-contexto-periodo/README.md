# Evidência visual — contexto de período (#262)

`periodo-mobile-escuro.png` mostra o seletor de período recortado no viewport mobile de 358 × 844 px, em `pt-BR` e `America/Sao_Paulo`. O catálogo público e a aplicação foram simulados no browser; a chamada de evidência retornou 404 explícito. A URL iniciou com `period=7d`, conforme o estado visual de referência.

Verificações no browser: `7 dias` está selecionado (`aria-pressed="true"`) e focado por teclado; os quatro botões têm 44 px de altura, `min-height: 44px`, padding `8px 16px` e gap de 8 px. Os rótulos quebram em duas linhas sem overflow horizontal (scrollWidth 358 px). O foco visível usa contorno verde de 3 px com offset de 3 px.

A captura documenta apenas o seletor; não compara a página inteira com o Figma nem aprova a legibilidade do restante do detalhe no tema escuro. Dados são fixtures de apresentação, não dados operacionais.
