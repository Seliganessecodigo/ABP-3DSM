# Primeira revisão visual do detalhe (#65)

Revisão provisória, somente leitura, feita em browser headless com o harness `frontend/e2e/analysis-harness.html`, `fixture=series-table`, e uma resposta de aplicação controlada. Contexto Playwright: `pt-BR`, `America/Sao_Paulo`; viewport desktop 1366×988 e mobile 358×844. Não são capturas do Figma nem evidência final do comportamento integrado.

- [Desktop claro — antes dos ajustes](antes-detalhe-desktop-claro.png)
- [Mobile escuro — antes dos ajustes](antes-detalhe-mobile-escuro.png)

## Achados

Em 1366px, a composição é identidade/localização → seletor de período → quatro KPIs → grade inferior de contexto e evolução. A sidebar ocupa 222px. O conteúdo principal começa em x=250, y=12 e mede 1104px. O KPI aparece em y≈357. A referência recuperada em `Temp/greener-design-reference/design-reference.md` registra header de aproximadamente 96px, indicadores de 1042×160 começando perto de y=117, com colunas de 248–249px e intervalo de 16px. A composição implementada empurra os indicadores muito para baixo e difere materialmente dessa referência.

A cobertura, por conter duas leituras e justificativas, alonga os quatro KPIs por alinhamento da linha; os cartões medem aproximadamente 210px apesar de `min-height: 144px`. Abaixo, a grade desktop tem duas colunas, mas a coluna de evolução divide novamente seu espaço em dois gráficos; cada gráfico fica estreito, com rótulos de eixo temporal comprimidos. A coluna de contexto continua muito abaixo da coluna de evolução.

Em 358px, KPIs passam a 2×2 e o restante empilha em uma coluna. O botão de 90 dias quebra para a linha seguinte; não há clipping. A medição de `document.documentElement.scrollWidth` foi igual à largura do viewport nos quatro pares (1366/358 × claro/escuro). O tema escuro usa os tokens existentes e as superfícies/textos dos cartões permanecem legíveis nesta fixture.

## Recomendações para a próxima revisão

1. No desktop, colocar o seletor de período no cabeçalho, alinhado ao lado direito, e mantê-lo empilhado no mobile. Aproximar o início dos KPIs da referência (~y=117) reduzindo a separação atual entre cabeçalho, período e título dos indicadores.
2. Manter a grade inferior em duas colunas e empilhar os cartões de série dentro da coluna de evolução para dar largura útil aos gráficos. Preservar apresentação em uma coluna para os gráficos no mobile.
3. Compactar a cobertura sem remover as duas métricas nem os respectivos estados/motivos; evitar que esse card determine sozinho uma altura excessiva para toda a fileira.
4. Comparar novamente com os frames Figma quando as capturas originais estiverem disponíveis. As dimensões acima vêm de contexto/metadados previamente recuperados; não foi possível fazer comparação pixel a pixel nesta revisão.

## Limitações

As capturas mostram apenas uma fixture local com energia e duas amostras de série. Fator/carbono, cobertura de emissões e metodologia são estados indisponíveis deliberados do fixture; não representam dados reais. A evidência não valida API de produção, tabela de série, todos os estados, foco/acessibilidade ou fidelidade pixel a pixel. Nenhuma chamada Figma foi repetida devido ao limite de cota já registrado.
