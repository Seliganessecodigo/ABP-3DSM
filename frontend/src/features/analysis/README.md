# Fronteira de análise ambiental

Esta feature contém a integração ambiental HTTP e o mapeamento para o `AnalysisViewModel`, um modelo interno de apresentação, não um DTO de transporte. `environmentalAnalysisSource` é a fonte usada por padrão no detalhe da aplicação. A tela não calcula nem converte resultados ambientais: valores, unidades, cobertura, metodologia e proveniência vêm do backend.

## Fonte, adapter e ciclo de vida

`AnalysisSource.load(applicationId, context, signal)` carrega resumo e série para uma aplicação. O adapter faz `GET /applications/{id}/analysis?from=&to=` e `GET /applications/{id}/analysis/series?from=&to=&granularity=` no backend GreenER, usando a mesma faixa UTC nos dois pedidos. Os presets `24h`, `7d`, `30d` e `90d` são janelas móveis exatas, calculadas a partir de uma âncora UTC compartilhada. A granularidade é enviada como valor selecionado (`hour`, `day`, `month` ou `year`); o backend define os buckets UTC e seus limites. Não há chamada direta a serviços ambientais externos.

O resumo fornece totais e coberturas independentes de energia e CO₂e, unidades (`kWh` e `gCO2e`), metodologias e fatores efetivamente usados. A proveniência de fatores no resumo é agrupada por identidade efetiva e `queriedAt` representa a faixa de consultas GreenER, não a vigência do fator. Ela não contém snapshots individuais por coleta. O endpoint de série fornece pontos, lacunas, motivos, totais/coberturas e eventos de estado, remoção/retorno, região, metodologia e versão de fator. O adapter mapeia pontos e eventos; a tela apresenta eventos junto à série. `unavailableAnalysisSource` continua disponível para uso explícito em harnesses/fallbacks, mas não é a fonte padrão de runtime.

O endpoint `GET /applications/{id}/analysis/series/contributions` fornece inspeção paginada das contribuições e exclusões de um bucket, incluindo intervalos, leituras originais e contabilizadas e snapshots originais por coleta, inclusive entradas não calculáveis. O adapter faz essa chamada ao inspecionar um ponto e valida a resposta; a interface apresenta 10 itens por padrão e permite navegar páginas ou solicitar todos os itens, mantendo o bucket selecionado. No histórico, a página mostra uma tabela de contribuições do agregado e os detalhes da linha selecionada; no detalhe da aplicação, mantém a lista completa. Essa inspeção é separada de `composition`, que permanece indisponível no runtime; não substituir snapshots pela proveniência agrupada do resumo nem derivar contribuições no cliente. Fixtures são restritas ao harness de Playwright (`frontend/e2e/analysis-harness.html` e `analysis-harness.tsx`), habilitado explicitamente nos testes; a entrada de produção (`index.html`/`App`) não importa o harness.

`pages/detail/useEnvironmentalAnalysis.ts` controla estados transitórios, retry, cancelamento com `AbortSignal`, descarte de resposta obsoleta para aplicação/contexto antigo e preservação do último sucesso somente no mesmo contexto. `lastAttemptAt` e `lastSuccessAt` são instantes do relógio do cliente registrados pelo hook; não significam instante de coleta, observação ou atualização do backend. `lastSuccessStatus` distingue resultado disponível de resultado global vazio. Indisponibilidade e falha de transporte são distintas de sucesso vazio e não viram zero; uma resposta vazia após valor anterior substitui esse valor, sem ressuscitá-lo em falha posterior.

## Resumo ambiental do dashboard

`pages/dashboard/` consulta `GET /analysis/summary` com os limites UTC semiabertos derivados dos mesmos presets e âncora usados pelo detalhe. Estado e código regional são filtros multivalorados do contrato; o seletor regional apresenta os códigos atuais do catálogo, enquanto o backend classifica resultados pela região histórica da coleta. O adapter valida intervalo, medidas, coberturas, contagens, identidade das aplicações contribuintes e presença dos metadados de proveniência antes de expor os dados à página.

A resposta contém energia, emissões em `gCO2e`, coberturas temporais independentes e composição reconciliável por aplicação. `applications[]` inclui apenas aplicações com algum resultado ambiental; a tabela deixa esse limite explícito e usa a localização atual do catálogo para sua coluna de região. As contagens de estado continuam cobrindo o escopo selecionado, inclusive aplicações sem resultado.

O contrato atual não oferece série histórica agregada entre aplicações nem define comparação com período anterior. O dashboard informa essas pendências sem calcular séries no cliente, interpolar lacunas ou mostrar valores demonstrativos. As opções de filtros locais, ordenação e paginação da tabela são aplicadas à coleção completa de contribuições antes de paginar.

Validações direcionadas:

```sh
npm run test:unit -- tests/unit/environmentalSummary.spec.ts tests/unit/dashboardData.spec.ts
npx playwright test --project=chromium e2e/dashboard.spec.ts
```

## Modelo de apresentação entregue

O modelo representa:

- Totais raiz de energia e emissões e coberturas independentes, cada leitura com estado, valor numérico e unidade, ou indisponibilidade/não calculabilidade com motivo.
- `composition`: sucesso com contribuições e exclusões, sucesso vazio, ou indisponibilidade com motivo. Contribuição inclui identificador, rótulo, intervalo, leituras de energia e emissões e fonte; exclusão inclui identificador, rótulo, intervalo e motivo. Totais raiz são fornecidos separadamente, não derivados pela UI da soma das contribuições.
- Fatores e metodologias agrupados conforme proveniência do resumo backend. `queriedAt` é a faixa de recebimento/consulta GreenER, não a vigência; a inspeção do bucket apresenta os snapshots originais individuais retornados pelo endpoint de contribuições.
- Série ambiental com pontos temporais e leituras separadas de energia/emissões, incluindo lacunas e motivos por métrica.
- Capacidades de granularidade como indisponíveis ou como opções fornecidas pela fonte, com `value`, rótulo e seleção atual. A UI trata valores como opacos e informa uma opção solicitada que não consta das capacidades; não inventa granularidades.

A camada visual formata valores e datas, mas não converte unidades, calcula energia ou emissões, multiplica fator por energia, agrega contribuições, estima coberturas nem calcula médias. Unidades, fator, método, snapshots, totais, contribuições, exclusões e estados devem ser mapeados da fonte oficial sem perda de significado. Zero disponível é um valor legítimo; ausência, falha, estado não calculável e lacuna nunca são substituídos por zero.

## Período, granularidade e instante

`period` guarda uma das chaves visuais `24h`, `7d`, `30d` ou `90d`; o adapter as converte em janelas móveis exatas com a mesma âncora UTC para resumo e série. Requisições usam instantes ISO UTC e intervalo `[from,to)`. `granularity` é enviada à série como `hour`, `day`, `month` ou `year`; os buckets e períodos parciais são definidos pelo backend em calendário UTC. A tabela ainda permite filtrar momentos no timezone IANA selecionado na URL: esse fuso controla a apresentação/filtro local, não altera os limites UTC enviados à API.

Na tabela da série, valores `datetime-local` são interpretados no timezone IANA declarado em `seriesTimeZone` e serializados como instantes ISO com offset/Z; a apresentação volta a usar esse timezone. Limites de data são exatos, sem expansão artificial do minuto final. Entradas ambíguas/inválidas são sinalizadas, e não enviadas como limite. Isso define apenas a interação local da UI; não define a política temporal ou agregação do backend.

## Tabelas: tipos, filtros, ordenação e exceções

Busca e filtros da UI são aplicados ao conjunto completo antes de paginação. Cabeçalhos ordenáveis comunicam `aria-sort`. O sort estável mantém identificador como desempate; valores ausentes ficam ao final em ambas as direções.

| Tabela/coluna | Tipo apresentado | Busca e filtros | Ordenação | Exceções e limites |
| --- | --- | --- | --- | --- |
| Evidência operacional — Métrica | Enum `cpu`, `memory`, `disk`, `network`, localizado como texto. | Busca textual sem distinção de caixa/acentos; filtro por enum. | Texto localizado; desempate pela chave estável. | Quatro linhas fixas; sem paginação. |
| Evidência operacional — Valor | Número opcional mais unidade recebida; ausência tem texto próprio. | Busca textual sobre valor formatado e unidade; sem filtro numérico. | Não ordenável numericamente. | CPU, memória, disco e rede têm unidades/sentidos diferentes; não comparar nem converter em escala comum. Zero disponível é distinto de ausente/inválido. |
| Evidência operacional — Estado | Categoria disponível/ausente/inválido; disponível zero pode receber rótulo explícito. | Busca textual e filtro por estado. | Texto localizado; desempate estável. | Intervalo observado e instante de recebimento são metadados acima da tabela, não colunas dessas linhas. |
| Série — Momento | Instante ISO apresentado no timezone selecionado. | Busca textual e limites inclusivos de/até, interpretados no timezone IANA guardado na URL. | Cronológica; desempate pelo identificador do ponto. | Datas inválidas, timezone inválido ou intervalo invertido não produzem resultados; limite é o instante escolhido, sem arredondamento. |
| Série — Energia | Leitura: número e unidade, indisponível ou não calculável. | Busca textual; filtro de estado; seleção de unidade quando há unidades distintas; limites numéricos mínimo/máximo apenas para a unidade selecionada. | Numericamente, somente numa unidade selecionada ou única; valores ausentes ficam ao final nas duas direções. | Unidades nunca são convertidas. Se houver unidades mistas, os filtros/sort numéricos exigem seleção; sem unidade escolhida, a UI não compara magnitudes incompatíveis. |
| Série — CO₂e | Leitura: número e unidade, indisponível ou não calculável. | Busca textual; filtro de estado; seleção de unidade quando há unidades distintas; limites numéricos mínimo/máximo apenas para a unidade selecionada. | Numericamente, somente numa unidade selecionada ou única; valores ausentes ficam ao final nas duas direções. | Não comparar com energia nem converter unidades. Uma métrica não compartilha filtro ou ordenação numérica com a outra. |

A tabela da série oferece páginas de 10 por padrão e opções 5, 10, 15, 20 e todos. Filtros, sort, período, granularidade e tamanho/página usam chaves próprias e preservam os demais parâmetros: `period`, `granularity`, `seriesSearch`, `seriesEnergyStatus`, `seriesEmissionsStatus`, `seriesFrom`, `seriesTo`, `seriesTimeZone`, `seriesEnergyUnit`, `seriesEmissionsUnit`, `seriesEnergyMin`, `seriesEnergyMax`, `seriesEmissionsMin`, `seriesEmissionsMax`, `seriesSort`, `seriesDirection`, `seriesPage`, `seriesSize`. Evidência operacional usa `evidenceSearch`, `evidenceMetric`, `evidenceStatus`, `evidenceSort`. O catálogo já usa `q`, `state`, `region`, `regionCode`, `page`, `size`, `sort`, `direction`, `name`, `country`, `city`, `cityMissing`, `columnState`, `from`, `to` e `tz`; manter os namespaces ambientais separados evita colisões. Mudanças de filtro/sort removem `seriesPage` e voltam à primeira página.

Resultado ambiental global `empty`, série disponível sem pontos e tabela sem correspondências de filtros são estados distintos. Busca e filtros precedem ordenação e paginação; mudanças de filtro/sort reiniciam a página, enquanto deep links e atualização preservam o tamanho e limitam a página ao intervalo válido.

## Navegação e limite de entrega

`/history` oferece seleção de aplicação e preserva o recorte ambiental na URL, reutilizando o carregamento e a análise do detalhe sem duplicar o contrato. A série permite comparar energia e CO₂e em gráficos separados e escalas próprias; lacunas permanecem distintas de valores zero, e eventos continuam visíveis quando não há observações. A ação de um evento foca seu item acessível sem substituir o contexto da consulta. A metodologia continua inline no detalhe.

A integração de resumo/série e sua apresentação estão conectadas ao backend. A inspeção por bucket busca contribuições e exclusões paginadas com snapshots originais; ela não substitui a proveniência agrupada do resumo nem torna `composition` disponível no runtime. A cobertura, a região e a metodologia por ponto dependem dos campos fornecidos pelo contrato da origem e não são inferidas no cliente. Resultados de testes/gates e evidências visuais anteriores estão nas PRs #294/#295 e em `.github/evidencias/65-detalhe-ambiental/README.md`. A revisão visual local usou as referências acessíveis, com comparação limitada a metadados e capturas, sem validação pixel-perfect. A edição do arquivo Figma segue bloqueada pela quota e é uma entrega separada.
