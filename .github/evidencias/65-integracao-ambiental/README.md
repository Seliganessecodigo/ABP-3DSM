# Revisão visual — integração ambiental

Capturas de Chromium em 1366×900 e 390×844, com `pt-BR` e `America/Sao_Paulo`. O detalhe usa a fixture `svc-0142` (disponível, BR-SP), respostas de análise da `analysis-runtime-api.spec.ts` e coleta operacional controlada baseada nos DTOs de `application-detail.spec.ts`. O relógio foi fixado em `2026-10-17T20:00:00Z`, igual ao fim do período mockado. As imagens são evidência de renderização controlada, não de dados do backend.

## Capturas

- Catálogo (capturas preliminares): `catalog-desktop-claro-preliminar.png`, `catalog-desktop-escuro-preliminar.png`, `catalog-mobile-claro-preliminar.png`, `catalog-mobile-dark-preliminar.png`.
- Detalhe antes do ajuste: `detail-desktop-light-preliminar.png`, `detail-desktop-dark-preliminar.png`, `detail-mobile-light-preliminar.png`, `detail-mobile-dark-preliminar.png`.
- Detalhe depois do ajuste: `detail-desktop-light-pos-ajuste.png`, `detail-desktop-dark-pos-ajuste.png`, `detail-mobile-light-pos-ajuste.png`, `detail-mobile-dark-pos-ajuste.png`.
- Detalhe alinhado ao frame anexado: `detail-desktop-light-figma-alinhado.png` (996×619) e `detail-mobile-light-figma-alinhado.png` (390×844).
- Medidas antes/depois: `medidas-preliminares.json` e `medidas-pos-ajuste.json`.

## Achados

Depois do ajuste, o cabeçalho desktop mede `1054×97 px` em `(276, 20)`. O grid dos indicadores começa em `(276, 117)` e mede `1054×160 px`, com `gap: 16px`; os quatro cartões medem `251,5×160 px`. As mesmas medidas aparecem nos temas claro e escuro. Posição y, altura e gap coincidem com os metadados Figma registrados anteriormente.

Os metadados para o frame claro `150:1105` indicam `1366×850`, cabeçalho próximo de `96 px`, indicadores em `y≈117`, altura `160 px`, cartões `248/249 px` e gap `16 px`. Cada cartão atual continua `2,5–3,5 px` mais largo que a medida registrada. Como não há render Figma original local e o MCP está limitado pela cota Starter, a comparação é por metadados e medidas, não pixel a pixel.

No detalhe mobile, claro e escuro, o documento permanece com `390 px` de largura; não há overflow horizontal nem corte visual nos cartões. O cabeçalho mede `358×286 px` em `(16, 60)` e os indicadores começam em `(16, 362)`, com largura `358 px` e gap `16 px`. Os cartões se adaptam em duas colunas, com larguras fluidas de `171 px` e alturas de `144` e `200 px`, conforme o conteúdo. A paleta escura existente é preservada.

O catálogo não foi recapturado porque sua composição não mudou nesta rodada; consulte as capturas preliminares para aquela vista. Um heading usa recorte visual acessível (largura visual de `1 px`), sem conteúdo aparente cortado.

A captura alinhada usa a mesma fixture ambiental controlada, mas no tamanho da referência anexada. A composição agora acompanha a ordem visual do frame; os pontos e as evidências exibem apenas os valores fornecidos pela fixture, inclusive a ausência de pontos nesse período.

## Limites

As capturas do detalhe usam fixtures controladas com relógio fixo, não respostas ao vivo do backend. Navegação por teclado/foco e a captura final após estabilização do drilldown ainda precisam de validação. Não se declara paridade visual pixel a pixel com Figma: a referência original não está disponível localmente e o MCP foi limitado pela cota Starter.
