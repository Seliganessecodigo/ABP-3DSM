# Fronteira de análise ambiental

Esta é a fronteira tipada de apresentação autorizada para adiantar a UI de #65. O `AnalysisViewModel` em `source.ts` e `AnalysisSource` são contratos internos entregues para compor e testar a tela; não são DTOs nem contrato HTTP oficial. Podem ser congelados como fronteira da UI sem esperar o backend. Quando os contratos reais chegarem, o adapter mapeará os DTOs para este modelo e a integração poderá exigir ajustes sem mudar a regra de que a tela não calcula dados ambientais.

## Fonte, adapter e ciclo de vida

`AnalysisSource.load(applicationId, context, signal)` carrega a análise para uma aplicação, preset opaco e granularidade opcional. A página recebe a fonte na composição; o runtime usa `unavailableAnalysisSource`, que retorna indisponibilidade. Não há valores demonstrativos no fluxo de produção. As fixtures vivem somente no harness de Playwright (`frontend/e2e/analysis-harness.html` e `analysis-harness.tsx`), ligado explicitamente nos testes; a entrada de produção continua em `index.html`/`App` e não importa o harness.

Quando #235 e #174 fornecerem contratos aprovados, o adapter HTTP, sua validação e o mapeamento para o modelo de apresentação pertencem a `features/analysis/`. Até lá, não invente caminho, query, autenticação, schema ou política de janela. A página não interpreta DTOs e não chama serviços auxiliares diretamente.

`pages/detail/useEnvironmentalAnalysis.ts` controla estados transitórios, retry, cancelamento com `AbortSignal`, descarte de resposta obsoleta para aplicação/contexto antigo e preservação do último sucesso somente no mesmo contexto. `lastAttemptAt` e `lastSuccessAt` são instantes do relógio do cliente registrados pelo hook; não significam instante de coleta, observação ou atualização do backend. `lastSuccessStatus` distingue resultado disponível de resultado global vazio. Indisponibilidade e falha de transporte são distintas de sucesso vazio e não viram zero; uma resposta vazia após valor anterior substitui esse valor, sem ressuscitá-lo em falha posterior.

## Modelo de apresentação entregue

O modelo representa:

- Totais raiz de energia e emissões e coberturas independentes, cada leitura com estado, valor numérico e unidade, ou indisponibilidade/não calculabilidade com motivo.
- `composition`: sucesso com contribuições e exclusões, sucesso vazio, ou indisponibilidade com motivo. Contribuição inclui identificador, rótulo, intervalo, leituras de energia e emissões e fonte; exclusão inclui identificador, rótulo, intervalo e motivo. Totais raiz são fornecidos separadamente, não derivados pela UI da soma das contribuições.
- Fatores e metodologia com múltiplas entradas e proveniência; fatores preservam região, intensidade/unidade, modelo, descrição, versão, `queriedAt` e snapshot original.
- Série ambiental com pontos temporais e leituras separadas de energia/emissões, incluindo lacunas e motivos por métrica.
- Capacidades de granularidade como indisponíveis ou como opções fornecidas pela fonte, com `value`, rótulo e seleção atual. A UI trata valores como opacos e informa uma opção solicitada que não consta das capacidades; não inventa granularidades.

A camada visual formata valores e datas, mas não converte unidades, calcula energia ou emissões, multiplica fator por energia, agrega contribuições, estima coberturas nem calcula médias. Unidades, fator, método, snapshots, totais, contribuições, exclusões e estados devem ser mapeados da fonte oficial sem perda de significado. Zero disponível é um valor legítimo; ausência, falha, estado não calculável e lacuna nunca são substituídos por zero.

## Período, granularidade e instante

`period` guarda uma das chaves visuais `24h`, `7d`, `30d` ou `90d`; são seleções opacas da UI, não duração exata, limite de janela, timezone ou query de endpoint. `granularity` também é valor opaco: opções e seleção vêm de `AnalysisGranularityCapabilities` da fonte. Os contratos de API e semântica temporal permanecem dependências de #49, #53, #235 e #174.

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

Resultado ambiental global `empty`, série disponível sem pontos e tabela sem correspondências de filtros são estados distintos. O QA confirmou `empty` versus ausência de correspondências; são comportamentos diferentes e já validados.

O QA confirmou em execuções focalizadas GREEN: composição; vazio global seguido de indisponibilidade sem ressuscitar números; freshness pelo relógio do cliente; apresentação no timezone escolhido; entrada ISO/timezone e limites exatos; filtros e ordenação numéricos com unidades mistas; capacidades de granularidade disponíveis/ausentes/não suportadas; “Todos” após filtros (5 → todos); série vazia versus sem correspondências; e aplicação removida com histórico válido. Também confirmou deep link inicial na página 2 durante loading, preservação da página após resposta com 12 pontos e, após atualização que retorna 3 pontos, clamp para a página válida mantendo tamanho 5. A suíte completa e o Sonar ainda estão pendentes; esses resultados focados não equivalem por si só ao aceite integral de #65.

## Navegação e limite de entrega

O detalhe atual mostra metodologia em seção inline. O botão de histórico de `AppShell` permanece desabilitado e não há rota de histórico encontrada. Não oferecer links ativos para destinos ausentes; a metodologia inline não é uma página navegável.

A fronteira e a composição da UI são entregues e testáveis pelo harness com fontes controladas. A disponibilidade em runtime e a integração GreenER não estão entregues: dependem de #235/#174 e contratos aprovados. A revisão local do código pelo designer foi concluída com as referências disponíveis; a evidência final, com capturas e observações, está em `.github/evidencias/65-detalhe-ambiental/README.md` (commit `57e7040`). `primeira-revisao.md` é uma evidência anterior. A comparação ficou limitada aos metadados/referências acessíveis, sem validação pixel-perfect. A edição do arquivo Figma segue bloqueada pela quota e é uma entrega separada. A suíte completa e o Sonar ainda aguardam execução; seus resultados serão registrados na PR. Não trate essas dependências externas nem a integração backend como comportamento já entregue.
