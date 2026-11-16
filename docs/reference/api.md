# Referência da API

Esta referência orienta integrações com a API GreenER. O contrato completo de tipos, campos opcionais e limites é publicado pelo próprio ambiente em `/openapi.json`; a interface Swagger fica em `/docs`. As consultas de catálogo e histórico leem dados persistidos. A prévia de recálculo e as rotas de carbono podem consultar a fonte de intensidade de carbono.

## Consultas públicas {#public}

| HTTP | URI | Acesso |
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
| GET | `/analysis/comparison` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |

## Períodos e histórico {#queries}

`from` e `to` exigem RFC 3339 com fuso explícito. O intervalo `[from,to)` é normalizado para UTC. A série aceita `hour`, `day`, `month` e `year`, com até 10.000 pontos; excesso é rejeitado. Resultados persistidos são rateados por sobreposição. Em conflito vence o maior `collectedAt`, seguido do ID lexical crescente, sem fallback para uma observação anterior se a vencedora não sustenta a métrica.

| URI | Parâmetro |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/analysis/comparison` | `from`, `to`, `applicationIds` (2–5 IDs), `referenceApplicationId` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

`GET /analysis/comparison` exige de 2 a 5 IDs únicos e uma referência selecionada. Retorna energia, emissões, coberturas independentes, métricas e snapshots históricos de localização no mesmo período. Diferenças são aplicação menos referência; percentuais exigem referência positiva. Ausências permanecem explícitas e o estado é `empty`, `partial` ou `complete`.

As métricas não incluem horário de medição na origem. O intervalo é derivado do recebimento menos `collection_interval_seconds`. O horário de consulta do fator não comprova vigência; fonte e validade não publicadas permanecem desconhecidas. Energia, fator e emissões persistem oito casas decimais; cobertura, quatro. Não há arredondamento intermediário. Energia e emissões preservam coberturas separadas e snapshots originais.

## Série e explicação do cálculo {#environmental-presentation}

Em `/analysis/summary`, o parâmetro opcional `granularity` inclui `series.points` no mesmo período e filtros dos totais. Cada intervalo soma os resultados persistidos das aplicações e mantém coberturas independentes. Valores ausentes permanecem `null`.

Em `/applications/{id}/analysis`, `calculation.energyKwh` informa a energia dos segmentos com emissões calculadas; `calculation.intensity` é o fator equivalente em gCO₂e/kWh, obtido dividindo essas emissões pela energia correspondente. Com energia zero ou ausente, o fator permanece nulo. Os resultados e fatores históricos são preservados.

## Entrar na sua conta {#login}

O dashboard e as consultas ambientais são públicos. Em `/login`, use e-mail/senha ou Google quando habilitado. Admin precisa configurar ou confirmar TOTP de seis dígitos antes da sessão, inclusive após Google. Analyst e Visitor não recebem autorização administrativa. O frontend mantém a sessão em memória; recarregar exige novo login. O backend valida JWT, sessão, papel e estado atuais; credencial ausente/inválida resulta em 401, papel insuficiente em 403. Novas rotas são protegidas por padrão.

| HTTP | URI | Acesso |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## Operações protegidas {#protected}

| HTTP | URI | Acesso |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

A API permite a Admin da mesma organização alterar contas entre `ACTIVE`, `BLOCKED` e `DEACTIVATED`, com `expectedStatus` e motivo obrigatório. Bloqueio/desativação revogam todas as sessões; reativação exige novo login. Há proteção da própria conta e do último Admin ativo. Estado esperado divergente retorna 409; estado desejado já alcançado é sucesso idempotente. A auditoria compartilhada grava sucesso na transação da alteração e negações fora da transação revertida, com ator explícito e sem segredos. Gestão completa de papéis e recuperação de senha não estão entregues por essa rota.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Administrar contas pela API {#accounts}

Somente Admin ativo da mesma organização pode listar e criar contas ou alterar papéis. A criação recebe `name`, `email`, `role` e `reason`, sem senha nem confirmação automática de e-mail. O titular define a senha no fluxo existente de confirmação; o envio da confirmação é solicitado separadamente. A tela de gestão e a recuperação de senha continuam em entregas próprias.

A listagem aplica busca e filtros antes de ordenar e paginar. O padrão é 10 itens, com opções 5, 10, 15, 20 e `all` para o conjunto filtrado completo. Rótulos traduzidos devem ser convertidos em códigos de enum e datas locais em RFC 3339 com fuso. Valores ausentes ficam ao final da ordenação em ambas as direções; empates usam o identificador.

Alterar papel exige `expectedRole` e `reason`. A mudança revoga sessões e credenciais TOTP temporárias, preserva a auditoria e impede retirar o próprio acesso ou o último Admin ativo com e-mail confirmado. Contas ainda não confirmadas não substituem esse administrador. A atribuição de Admin mantém a exigência de TOTP.

## Comparar com uma prévia de recálculo {#preview}

Em `/administration/calculations`, selecione aplicação e datas para comparar original e prévia. A data final da UI é inclusiva em dias UTC; a API recebe `[from,to)`. A prévia é pública, usa o modelo atual e consulta fatores atuais para as regiões históricas, sem salvar ou substituir resultados. Limites: 30 dias e 10.000 observações. A resposta contém `original`, `preview`, `warnings` e `status` (`available`, `empty` ou `partial`). Falha do fator preserva energia calculável e informa CO₂e indisponível. Percentuais exigem unidades e coberturas iguais e referência positiva.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personalizar a análise {#preferences}

Em `/methodology`, configure seus limites de energia e emissões por aplicação, a referência de cobertura e os padrões de análise. Escolha últimas 24 horas, 7, 30 ou 90 dias, mês atual em UTC ou intervalo personalizado com início incluído e fim excluído. A prévia consulta dados reais sem salvar e usa o mesmo painel de avisos das aplicações e do Dashboard. Salvar exige login e afeta apenas sua conta; não altera cálculos, histórico ou estados operacionais. Os avisos usam o período de cada limite, independentemente dos filtros da tela. Padrões de análise preenchem somente opções ausentes na URL do Dashboard e do detalhe. Dados parciais abaixo do limite não comprovam que ele foi respeitado; ausência nunca equivale a zero.

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled, period: {kind}}`; 0–100 |
| analysis | `{period: {kind}, granularity: "hour" / "day"}` |

```json
{ "period": { "kind": "custom", "from": "2026-11-01T00:00:00Z", "to": "2026-11-08T00:00:00Z" } }
```

```text
period.kind = 24h | 7d | 30d | 90d | month | custom
GET /me/preferences/alerts (JWT)
POST /me/preferences/alerts/preview (public, read-only)
{ energy, emissions, coverage } -> { configured, evaluatedAt, applications }
```

## Tratamento de erros {#errors}

Use o status HTTP e os códigos estruturados para tratar erros; o texto da mensagem não é contrato de tradução. `null` indica resultado ausente e não deve virar zero. Lista vazia é resposta válida, diferente de falha de consulta. Os códigos abaixo devem ser interpretados no contexto da operação.

| HTTP | Código |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## Contrato HTTP {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Leitura relacionada {#related}

[Operação e diagnóstico](../operations) · [Metodologia e dados](../product/methodology)
