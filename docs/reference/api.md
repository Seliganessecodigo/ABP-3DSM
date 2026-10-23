# Referência da API GreenER

As rotas abaixo foram conferidas no código de `develop` em 23/10/2026 (commit `1633ca2`). O ambiente local publica Swagger em `http://localhost:3000/docs` e o schema em `/openapi.json`. Consulte o OpenAPI do ambiente que está integrando para obter os DTOs completos.

## Rotas de leitura existentes

| Método e rota | Resultado |
| --- | --- |
| GET /health | Resposta de saúde HTTP do serviço. |
| GET /applications | Array do catálogo persistido; `[]` é um resultado válido. |
| GET /applications/{id} | Aplicação conhecida, incluindo estado, horários e localização. |
| GET /applications/{id}/collections/latest | Observação válida mais recente e seu contexto operacional. |
| GET /applications/{id}/collections/{collectionId} | Observação identificada dentro do escopo da aplicação; collectionId é UUID. |
| GET /applications/{id}/analysis?from=…&to=… | Resultado ambiental persistido da aplicação para o período solicitado. |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | Série ambiental da aplicação, agrupada por hora, dia, mês ou ano. |
| GET /applications/{id}/analysis/series/contributions?… | Contribuições e exclusões de um bucket da série, com paginação. |
| GET /analysis/summary?from=…&to=… | Resumo ambiental agregado, com filtros opcionais. |
| GET /monitoring/incidents | Incidentes de integração, com filtros e paginação. |
| GET /openapi.json | Contrato legível por ferramentas. |

As leituras do catálogo e das coletas usam dados persistidos e não disparam monitoramento. As consultas ambientais agregam resultados já salvos; não recalculam o histórico. As séries usam granularidades UTC e preservam lacunas e eventos. A busca e a paginação do catálogo são feitas pelo frontend.

## Consultar análise ambiental

~~~sh
curl --fail-with-body --get 'http://localhost:3000/applications/ID/analysis' \
  --data-urlencode 'from=2026-10-01T00:00:00-03:00' \
  --data-urlencode 'to=2026-10-08T00:00:00-03:00'
~~~

`from` e `to` são timestamps RFC 3339 com fuso explícito. O início é incluído, o fim é excluído, e ambos são normalizados para UTC. A resposta identifica `status` (`available` ou `empty`), período, energia, emissões, cobertura separada e proveniência (metodologias, fatores consultados e motivos). Um valor `null` significa que não há resultado utilizável; zero é um valor válido. A janela não pode ser invertida nem vazia.

| HTTP / código | Interpretação |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Timestamp sem fuso, inválido, ou período com `to` menor ou igual a `from`. |
| 404 / APPLICATION_NOT_FOUND | Aplicação não reconhecida. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Falha ao consultar análise ou resultados persistidos. |

Essa análise e sua série estão conectadas ao detalhe da aplicação. A tabela permite inspecionar contribuições de um bucket; a consulta aceita `bucketStart`, `page` e `pageSize` (`5`, `10`, `15`, `20` ou `all`). `all` só é válido na primeira página. O frontend atualmente solicita a primeira página; consultar todos os itens depende da paginação interativa.

## Consultar série ambiental

`GET /applications/{id}/analysis/series` exige `from`, `to` e `granularity` (`hour`, `day`, `month` ou `year`). A resposta inclui `points`, `events`, totais e cobertura. Buckets usam calendário UTC, contam apenas a sobreposição com o período e podem ser parciais. Períodos com mais de 10.000 pontos são rejeitados, sem truncamento ou troca automática de granularidade.

## Consultar resumo agregado

`GET /analysis/summary` exige `from` e `to`; filtros opcionais repetíveis: `states`, `regionCodes` e `applicationIds`. A resposta reúne totais, cobertura, contagem por estado, aplicações, `dataAsOf` e proveniência. Este endpoint já existe, mas a interface ainda não oferece uma tela de dashboard agregado.

## Consultar incidentes de monitoramento

`GET /monitoring/incidents` aceita `applicationId`, `source`, `integration`, `status`, `page` e `limit`. O status pode ser `OPEN`, `RECOVERING` ou `RESOLVED`; a página padrão é 1 e o limite padrão é 20. A resposta contém `items`, `total`, `page` e `limit`. Consulte o OpenAPI para limites e enumerações vigentes.

## Consultar localmente

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Use um ID retornado pelo catálogo ao montar a rota de detalhe e codifique-o como segmento de URL. Não presuma IDs sequenciais ou que o ID externo da aplicação seja UUID.

O DTO de aplicação inclui `id`, `name`, `state`, `reason`, `lastObservationAt`, `isStale`, `isCalculable`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `updatedAt` e `location`. O detalhe usa os campos operacionais para explicar estado, atualização e calculabilidade; consulte o OpenAPI para tipos e nulabilidade. Cidade pode ser nula; registros legados incompletos podem ter `location: null`.

## Erros e ausência

| HTTP / código | Interpretação |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | ID vazio/inválido conforme validação da rota. UUID inválido de coleta também resulta em 400. |
| 404 / APPLICATION_NOT_FOUND | Aplicação não reconhecida. |
| 404 / COLLECTION_NOT_FOUND | Observação não encontrada para aquela aplicação. |
| 503 / CATALOG_UNAVAILABLE | Falha de leitura do catálogo. |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | Falha de leitura de evidências. |

Trate códigos estruturados e status HTTP; mensagens não são contrato de tradução. Falha não deve ser substituída por lista vazia ou indicador zero.

## Fronteiras da integração

Somente o backend chama fontes auxiliares. Contratos e unidades de origem estão na [referência versionada](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md). Esta página não publica endpoints futuros de energia, autenticação ou administração. Acesso administrativo por JWT é requisito de [EP06](../backlog/ep06), não uma API disponível presumida.

Para configuração de URL, CORS e diagnóstico, consulte [Operação](../operations). Para intervalos e interpretação de métricas, consulte [Metodologia](../product/methodology).
