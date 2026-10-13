# Estilos por página

Capturas do catálogo e detalhe após separar os estilos em CSS Modules. Os dados são demonstrativos, com a API simulada no Chromium, idioma `pt-BR` e fuso `America/Sao_Paulo`.

| Tela | Desktop (1440 × 900) | Mobile (390 × 900) |
| --- | --- | --- |
| Catálogo | [Captura](catalog-desktop.png) | [Captura](catalog-mobile.png) |
| Detalhe | [Captura](detail-desktop.png) | [Captura](detail-mobile.png) |

As capturas incluem a página completa, que pode exceder a altura do viewport. A comparação com o CSS anterior aplicado ao mesmo DOM e aos mesmos dados confirmou estilos calculados e geometria idênticos em dez cenários: catálogo e detalhe em 1440, 768 e 390 pixels, catálogo vazio/erro e detalhe não encontrado/erro. Os PNGs não são todos idênticos pixel a pixel: pequenas diferenças de rasterização foram observadas nas bordas.

Os 50 testes E2E de catálogo, detalhe e idiomas passaram após a alteração.
