# Execução CT-028 / CT-041

Responsável: @GianlucaAlves. Execução em 23/11/2026, UTC−03:00.

Código de produção local: `c17ab84ec919911b173529150f900a9b6f578570`, posterior à base dos roteiros `bbe9fe1`. Somente o teste foi ampliado nesta branch. A rodada local terminou com **23 testes aprovados, zero falhas e zero ignorados** em duas suítes. Lint, typecheck e build do backend passaram. Não foi alterado comportamento de produção; não foi executada cobertura completa nem frontend.

## Ambientes e proveniência

- Local: API Nest real em `127.0.0.1`, porta efêmera do Jest, Node 24.15.0, Windows, PostgreSQL 18 descartável em `127.0.0.1:55449`. Sem navegador; viewport/tema/idioma não se aplicam. Fixtures técnicas persistidas em banco isolado, sem alterar fontes auxiliares.
- Staging: `https://app-greener-api-staging-brs-ecxiqsrl.azurewebsites.net`, consultas públicas sem JWT em `2026-11-23T03:15:22Z`. OpenAPI em `/openapi.json` retornou 200. O último deploy concluído antes da rodada foi [45102357949](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45102357949), SHA `c17ab84`; isso é proveniência do workflow, sem confirmação de SHA pelo processo HTTP. Um novo deploy (`f282e3c`) iniciou às 03:16:24Z, depois das consultas registradas. Nenhum teste de volume/falha forçada foi executado no ambiente compartilhado. Frontend não foi exercitado.

## CT-028 — APROVADO localmente

Fixture `ct028-<UUID>` e coletas C1/C2: C1 = 00–02 UTC com 2 kWh/20 g; C2 = 01–02 com 3 kWh/30 g, coletada depois. Resultados persistidos de fixture, sem edição de metodologia.

| Cenário | Observado e verificado por assert |
| --- | --- |
| S1 | 00–01: C1 = 1 kWh; 01–02: C2 = 3 kWh; total = 4 kWh. |
| S2 | 00:30–01:30: 0,5 + 1,5 = 2 kWh. |
| S3 | C2 com emissões null: energia = 4 kWh; emissões = 10 g; cobertura de energia = 1 e emissões = 0,5, sem fallback. |
| S4 | Empate de collectedAt: menor ID lexical venceu em três consultas HTTP; suíte de domínio também verificou ordem de entrada invertida. |
| S5 | Summary, período, soma de buckets e drilldown = 4 kWh; cobertura conciliada. pageSize 5/10/15/20/all manteve totais. Suíte existente também verificou múltiplas páginas. |

Variações: janela sem observações retorna energia/emissões null; janela com uma hora de lacuna tem cobertura energética 2/3. API/banco sem viewport. Cada projeção foi consultada via HTTP real; assertivas e resultado estão em `local.json` e no teste desta branch.

## CT-041 — APROVADO localmente, com verificações adicionais em staging

| Cenário | Observado |
| --- | --- |
| S1 | Local: 200, exatamente 10.000 pontos horários, sem truncamento. |
| S2 | Local: 10.001 pontos retorna 400 / ANALYSIS_SERIES_POINT_LIMIT_EXCEEDED. Horizonte até ano 9999 também rejeitado. |
| S3 | Local e staging: granularidade ausente/inválida e datas sem fuso/invertidas retornam 400 estruturado. Em staging, também data inválida e início=fim. |
| S4 | Local: ID ausente = 404 / APPLICATION_NOT_FOUND; tabela temporariamente renomeada = 503 / APPLICATION_ANALYSIS_UNAVAILABLE; aplicação sem coletas = 200 com medidas null. Staging: ID ausente = 404, sem falha induzida. |
| S5 | Local e staging: bucket desalinhado e paginação inválida rejeitados com 400. Staging incluiu page=0/-1/1.5, pageSize=6 e all com page=2. |

Os tempos efetivamente medidos estão em `local.json` e `staging.json`; não se define SLA. Staging forneceu observações complementares; a aprovação completa corresponde ao backend local no SHA conhecido.

## Reprodução e limpeza

Usar PostgreSQL descartável conforme `backend/test/README.md`, `TEST_DATABASE_URL` apontando para ele e executar em `backend/`:

```sh
npm ci --no-audit --no-fund
npm test -- --runInBand environmental-analysis-series.database.spec.ts persisted-environmental-period.spec.ts --json --outputFile=qa-temporal-results.json
npm run lint
npm run typecheck
npm run build
```

Fixtures removidas no finally/afterAll, tabela renomeada restaurada no finally. Container exclusivo `greener-qa-temporal-postgres` encerrado após a execução. Staging recebeu apenas GETs públicos. Nenhum bug encontrado; casos reutilizáveis permanecem abertos. SonarQube Cloud e CI da PR precisam ser conferidos antes de merge.
