# Consistência dos controles de formulário

A revisão parte da `develop` no commit `2647c51` e trata controles equivalentes no dashboard, catálogo, histórico, detalhe, metodologia, login e prévia de recálculo. As telas mantêm suas composições e sua hierarquia; campos de formulário compartilham a mesma base visual.

## O que foi observado

No Chromium, em 1440 × 900, os dois selects principais do dashboard tinham a mesma altura de 40 px. A inconsistência vinha da comparação com os botões de período, de 38 px, e com filtros de outras telas, de 44 px. Os selects do dashboard usavam Arial de 13,33 px, enquanto outros campos herdavam a fonte da interface. Também havia bordas com raios de 6, 7, 8 e 9 px, campos de login com 49 px e campos de preferências com 50 px. O botão de nova tentativa do dashboard conservava a aparência padrão do navegador.

Essas diferenças eram definidas independentemente no CSS de cada tela. Alterar uma página não mantinha os mesmos parâmetros nas demais.

## Regras compartilhadas

| Contexto | Altura | Aplicação |
| --- | --- | --- |
| Filtro padrão | 44 px | Selects, texto, datas e números usados para filtrar e selecionar dados |
| Controle compacto | 36 px no desktop; 44 px em tela pequena ou dispositivo de toque | Paginação e filtros da evidência em modo compacto |
| Formulário amplo | 50 px | Login, confirmação TOTP e preferências pessoais |

Os tokens de dimensão ficam em `frontend/src/index.css`. A classe `form-control`, em `styles/shared.css`, define borda, raio de 8 px, espaçamento, fonte herdada, foco, estado inválido, hover e desabilitado. As variantes explícitas mudam a densidade. `select.form-control` usa uma seta comum que acompanha os temas claro e escuro. O CSS local mantém largura, grid e contexto da tela.

A busca com ícone do catálogo mantém seu invólucro de 44 px; o campo interno não recebe uma segunda borda. O campo percentual destacado em preferências mantém sua composição específica de 56 px, e o código TOTP preserva o espaçamento entre dígitos. Checkboxes, switches e o seletor de idioma da sidebar mantêm seus componentes existentes.

O botão de nova tentativa do dashboard passa a usar o botão secundário existente. Botões de período e filtros superiores compartilham a altura de 44 px, evitando a diferença visual na mesma linha.

## Evidências

As imagens usam respostas controladas, sem credenciais ou dados de produção. O cenário antes/depois com erro compara o mesmo estado funcional.

- [Dashboard antes](../../.github/evidencias/consistencia-controles/dashboard-antes.png)
- [Dashboard depois, com erro](../../.github/evidencias/consistencia-controles/dashboard-depois-erro.png)
- [Dashboard depois, desktop](../../.github/evidencias/consistencia-controles/dashboard-depois-desktop.png)
- [Dashboard depois, celular](../../.github/evidencias/consistencia-controles/dashboard-depois-mobile.png)

`frontend/e2e/control-consistency.spec.ts` verifica dimensões e tipografia renderizadas nas páginas, densidade de paginação, foco e ausência de overflow no login; cobre desktop/celular e temas claro/escuro. Um cenário adicional verifica a geometria dos filtros do dashboard nos doze idiomas. Os testes funcionais existentes verificam filtros, navegação, preferências e autenticação.

Esta entrega padroniza os controles de formulário. A composição dos gráficos, os tamanhos de títulos e as densidades específicas de tabelas continuam pertencendo às telas, sem uma reformulação geral de layout.
