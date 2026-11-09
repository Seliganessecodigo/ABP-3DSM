# Referência da API GreenER

Referência: `origin/develop`, commit `c343698`, conferido em 08/11/2026. Cada ambiente pode executar outra revisão; merge não comprova publicação. Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

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

Em `/history`, escolha uma aplicação; `applicationId`, período e granularidade preservam contexto na URL. A tela reutiliza a série persistida do detalhe, com filtros, fuso de apresentação, eventos, paginação numerada e inspeção de buckets. As contribuições também possuem paginação interativa de 5, 10, 15, 20 ou todos os itens. Buckets do backend continuam em UTC; mudar o fuso de apresentação não reagrupa a série. A sobreposição do detalhe compara a mesma aplicação com a janela anterior equivalente.

## Consultar série ambiental

`GET /applications/{id}/analysis/series` exige `from`, `to` e `granularity` (`hour`, `day`, `month` ou `year`). A resposta inclui `points`, `events`, totais e cobertura. Buckets usam calendário UTC, contam apenas a sobreposição com o período e podem ser parciais. Períodos com mais de 10.000 pontos são rejeitados, sem truncamento ou troca automática de granularidade.

## Consultar resumo agregado

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. Em `/dashboard`, selecione 24 horas, 7, 30 ou 90 dias, estado e região. O resumo apresenta totais, cobertura, contagens por estado e composição de emissões em barras ou rosca. A tabela permite busca, filtros por coluna, ordenação por energia/CO₂e e paginação. Os filtros da tabela recortam as linhas, sem redefinir os totais do resumo. Abra uma aplicação para investigar sua evidência. O dashboard consulta `GET /analysis/summary` e atualiza periodicamente sem reload.

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

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

Para configuração de URL, CORS e diagnóstico, consulte [Operação](../operations). Para intervalos e interpretação de métricas, consulte [Metodologia](../product/methodology).

## Referência da API — JWT

| HTTP | URI | JWT / credential |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

O dashboard e as consultas ambientais são públicos. Em `/login`, use e-mail/senha ou Google quando habilitado. Admin precisa configurar ou confirmar TOTP de seis dígitos antes da sessão, inclusive após Google. Analyst e Visitor não recebem autorização administrativa. O frontend mantém a sessão em memória; recarregar exige novo login. O backend valida JWT, sessão, papel e estado atuais; credencial ausente/inválida resulta em 401, papel insuficiente em 403. Novas rotas são protegidas por padrão.

A API permite a Admin da mesma organização alterar contas entre `ACTIVE`, `BLOCKED` e `DEACTIVATED`, com `expectedStatus` e motivo obrigatório. Bloqueio/desativação revogam todas as sessões; reativação exige novo login. Há proteção da própria conta e do último Admin ativo. Estado esperado divergente retorna 409; estado desejado já alcançado é sucesso idempotente. A auditoria compartilhada grava sucesso na transação da alteração e negações fora da transação revertida, com ator explícito e sem segredos. Gestão completa de papéis e recuperação de senha não estão entregues por essa rota.

## Referência da API — POST /applications/{id}/analysis/recalculation-preview

Em `/administration/calculations`, selecione aplicação e datas para comparar original e prévia. A data final da UI é inclusiva em dias UTC; a API recebe `[from,to)`. A prévia é pública, usa o modelo atual e consulta fatores atuais para as regiões históricas, sem salvar ou substituir resultados. Limites: 30 dias e 10.000 observações. A resposta contém `original`, `preview`, `warnings` e `status` (`available`, `empty` ou `partial`). Falha do fator preserva energia calculável e informa CO₂e indisponível. Percentuais exigem unidades e coberturas iguais e referência positiva.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## Referência da API — /me/preferences

Em `/methodology`, as abas de energia, emissões, cobertura e análise permitem explorar exemplos e editar preferências pessoais. Salvar exige login de qualquer papel e altera apenas a própria aba, com revisão otimista: 409 indica conflito. Os limites são de apresentação; não alteram parâmetros globais, cálculos nem notificações externas. Período/granularidade salvos preenchem somente opções ausentes na URL do detalhe. A metodologia histórica permanece em `/services/:id/methodology`, com `collectionId` quando selecionado.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
