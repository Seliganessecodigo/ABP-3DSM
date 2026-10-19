# Evidências visuais — #65 detalhe ambiental

## Capturas

As capturas foram feitas em Chromium com `pt-BR`, fuso `America/Sao_Paulo`, shell de produção e a fixture explícita `design-review` do harness. O viewport desktop é `1366 × 988`; o mobile é `358 × 844`. O harness forneceu série com zero, lacuna e ponto posterior, dados de fatores/metodologia/composição e granularidade. As chamadas públicas da aplicação e da coleta operacional foram mockadas com respostas estáveis; a coleta mostrou CPU `38%`, memória `12,5 GB`, disco `0 GB/s` disponível e rede `1,2 Mbps`. Essas imagens demonstram renderização controlada, não integração ou precisão da API.

Detalhe:

- `detalhe-desktop-claro.png`
- `detalhe-desktop-escuro.png`
- `detalhe-mobile-claro.png`
- `detalhe-mobile-escuro.png`

Catálogo, recapturado após os alvos acessíveis de mobile:

- `catalog-desktop-claro.png`
- `catalog-desktop-escuro.png`
- `catalog-mobile-claro.png`
- `catalog-mobile-escuro.png`

## Revisão do detalhe

- No desktop, a área principal começa em `(250, 12)` e mede `1104 px` de largura. O cabeçalho ocupa `105 px`; os quatro KPIs ficam em uma linha, com cartões de `252 px`, espaçamento de `16 px`, começando em `y=149`. O seletor de período fica ao lado do título e seus botões têm `44 px` de altura.
- No mobile, a área principal mede `358 px` sem overflow horizontal. Cabeçalho e seletor empilham; período e KPIs ficam em grades `2 × 2`. Cada botão de período tem `44 px`. O restante do detalhe vira uma coluna e os gráficos continuam legíveis.
- Os quatro KPIs mantêm headings semânticos associados aos `fieldset` por `aria-labelledby`, com títulos dentro do padding (inset de `17 px` desktop e `13 px` mobile, incluindo a borda de `1 px`). Não há `legend` atravessando a borda. As distâncias entre cartões e linhas são `16 px`.
- Os gráficos de energia e CO₂e ficam empilhados em cartões largos. Eixos e unidades permanecem visíveis. A série preserva zero, lacuna e leitura posterior sem desenhar uma conexão que atravesse o dado ausente; a tabela apresenta as três leituras. Na tabela mobile, o wrapper próprio mantém largura `326 px` e contém a tabela de `334 px` com rolagem horizontal; o documento segue em `358 px` sem overflow.
- A alternância gráfico/tabela funciona por teclado (`Space`); período e granularidade respondem a `Enter`. O foco visível foi observado no controle de tabela e de período. Controles visíveis do detalhe medidos na matriz têm pelo menos `44 px` de altura.
- Os temas usam os tokens existentes. Claro: página `#f4faf7`, cartão `#ffffff`, texto `#17332d`. Escuro: página `#101b18`, cartão `#182923`, texto `#e8f2ed`. A imagem e a revisão visual mostram texto legível em ambos.
- O detalhe contém bastante conteúdo e ocupa aproximadamente `3380 px` de altura desktop na fixture completa, contra `1406 px` de altura no metadata do frame escuro. Fatores, snapshots, metodologia, composição, frescor, evidências operacionais e localização explicam parte da diferença. Não foi ocultado resultado ou proveniência para encurtar a página; esta rodada não introduziu disclosures adicionais.

O CSS fluido foi removido dos paddings responsivos para manter a escala solicitada em passos de `4 px`. Em `1024 px`, Playwright mediu `24 px` no detalhe; os breakpoints agora usam passos fixos. Os extremos da matriz visual permanecem iguais: detalhe `24 px` desktop e `16 px` mobile; conteúdo compartilhado `48 px` desktop e `16 px` mobile. Bordas, raios, tipografia, dimensões de glifos/SVG, offsets de foco e valores definidos por conteúdo ou por breakpoints são exceções técnicas/ópticas, não espaçamentos autorais contínuos.

Após a regressão mobile da tabela, a seção da série passou a permitir encolhimento dentro da grade (`min-width: 0`). Em claro e escuro, a área da série e o grid ficam em `326 px`; a tabela rola no wrapper interno (`scrollWidth 334 px`, `clientWidth 324 px`) sem aumentar a largura da página. O foco de teclado e o botão `Tabela` continuam operacionais.

## Referências Figma e limite da comparação

Os metadados/contextos dos frames foram consultados anteriormente; a cota Figma impediu nova consulta nesta validação. Os links apontam para as referências existentes no arquivo:

- [Detalhe claro desktop — node 150:1105](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2?node-id=150-1105): `1366 × 850`, cabeçalho perto de `96 px`, indicadores começando perto de `y=117`, cerca de `1042 × 160`, cartões de aproximadamente `248/249 px` e gap `16 px`.
- [Detalhe claro mobile — node 150:1403](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2?node-id=150-1403).
- [Detalhe escuro desktop — node 363:19084](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2?node-id=363-19084): metadata com altura `1406 px`.
- [Detalhe escuro mobile — node 363:19401](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2?node-id=363-19401).
- O catálogo escuro foi comparado às capturas locais da proposta [desktop](../213-temas/aplicacoes-escuro-desktop.png) e [mobile](../213-temas/aplicacoes-escuro-mobile.png).

As capturas originais do detalhe no Figma não estão disponíveis como arquivos locais; portanto a comparação do detalhe é por metadata/contexto e medidas observadas, não uma comparação visual pixel a pixel. Na implementação, os indicadores começam em `y=149` e têm `176 px` de altura — aproximadamente `32 px` abaixo e `16 px` mais altos que o metadata do frame claro; os cartões têm `252 px`, cerca de `4 px` mais largos. A referência não foi tratada como aprovada pixel-perfect.

## Catálogo: navegação e alvos

O catálogo preserva a topbar horizontal oculta em desktop, inset do shell, navegação lateral e cores semânticas. No mobile, menu, idioma e tema permanecem acessíveis; a largura do documento acompanha o viewport. Após a correção, o disclosure nativo de estado e cada link `Ver detalhes` medem no mínimo `44 px`; `Shift+Tab` alcança o disclosure, `Enter` o abre e o link subsequente também recebe foco e navega.

## Escopo desta evidência

As imagens documentam uma revisão visual com fixtures controladas. Não verificam contrato real da API, responsividade em todos os intermediários, precisão dos cálculos ambientais nem paridade pixel a pixel com os frames Figma. A validação de `1024 px` nesta rodada mediu o padding calculado (`24 px`) e ausência de overflow no detalhe; as capturas finais foram mantidas nos extremos desktop/mobile.
