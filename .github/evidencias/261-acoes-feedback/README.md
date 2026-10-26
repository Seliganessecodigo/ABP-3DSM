# Evidências visuais — #261

Screenshots pós-implementação capturados no Chromium com viewport de 1366×900 (catálogo) e 358×844 (detalhe). A API foi mockada localmente para representar erro e recuperação por retry; estes dados são evidência de apresentação, não fixture de runtime nem dados reais.

- `catalog-desktop-light-error-retry.png`: falha de catálogo em tema claro, com ação de retry. O mock foi liberado após a captura; o catálogo retornou e a linha `svc-0142` apareceu sem reload.
- `detail-mobile-dark-evidence-error.png`: detalhe com aplicação carregada em tema escuro e falha da evidência operacional. O retry carregou a evidência mockada e a tabela apareceu.

Verificações visuais no browser: `ActionButton` calculou altura mínima/real de 44px, gap de 8px e padding horizontal de 16px. A navegação por teclado acionou `:focus-visible` com contorno sólido de 3px; no tema claro a cor computada foi `rgb(0, 135, 93)` (`--focus-ring`). No tema escuro, texto `rgb(8, 46, 37)` sobre botão `rgb(100, 216, 172)` teve contraste calculado de 8,38:1. Regressão funcional de 77 testes foi executada por QA; o script de screenshot não substitui esses testes.

Limite conhecido fora da fatia #261: no screenshot do detalhe escuro, o card de evidências permanece branco e o texto de erro usa o secundário claro do tema, com contraste visual insuficiente sobre branco. A causa observada é estilo hardcoded pré-existente em `OperationalEvidence.module.css` e conteúdo de erro sem superfície semântica; registrar/corrigir na fatia ambiental #65/262. Não declarar legibilidade geral do detalhe dark aprovada com base nesta captura. As imagens do catálogo dark Figma de referência já estão em `.github/evidencias/213-temas/`; screenshots desta pasta são da aplicação executada localmente.
