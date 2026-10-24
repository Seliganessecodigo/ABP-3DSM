# Issue #248 — dashboard ambiental

## O que os quadros validam

- Dashboard desktop e mobile, em claro e escuro, com a navegação GreenER existente.
- Resumo do período: energia, CO₂e e coberturas separadas; estados das aplicações; série temporal; composição; tabela responsiva.
- Donut claro em desktop/mobile; alternativa de barras claras em desktop/mobile, ordenável crescente/decrescente.
- Expansões desktop claras para gráfico temporal, donut e barras. O mobile não oferece expansão.
- Estados em claro e escuro: carregamento, vazio, erro inicial, sucesso, falha de atualização preservando dados anteriores e lacuna temporal.
- O conjunto versionado contém os 17 PNGs listados na PR: dashboards principal, composição, expansões e estados/erros.
- O gráfico segue a referência: período atual preenchido, período anterior tracejado, lacunas hachuradas, marcador de mudança de região e tooltip em ponto selecionado.
- A composição destaca o total central, separa segmentos e mantém a legenda no rodapé. Barras horizontais usam trilhos proporcionais e valores/percentuais alinhados.
- Quatro KPIs compactos no topo: energia, CO₂e, cobertura e aplicações por estado. Variações e sparklines são demonstrativas; comparação real depende da #156.
- Tabela compacta: primeira página com 10 linhas, busca, filtros, paginação e navegação compatíveis com `origin/develop`.
- O aviso aparece somente para cobertura parcial informada pela API. Ausência é uma lacuna, nunca zero.
- Série global e composição são demonstrativas porque o contrato atual não fornece a série agregada. Comparação anterior depende de #156; períodos seguem #262.

## Handoff

- Reutilizar tokens e componentes GreenER e validar contraste, foco, teclado, textos longos e oito idiomas antes da implementação.
- Preservar filtros, ordenação, paginação e período na URL e no retorno do detalhe.
- As regras da tabela, dependências de API e decisões de produto estão documentadas neste arquivo e na issue #248.
- Este PR versiona artefatos de design; não altera o frontend. Figma aguarda aprovação explícita dos PNGs.

## Método

PNGs rasterizados em Barlow com os tokens do projeto. Os quadros foram inspecionados após exportação; nenhum teste de frontend se aplica a estes artefatos estáticos.
