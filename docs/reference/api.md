# Referência da API GreenER

As rotas abaixo foram conferidas no código de `develop` em 15/10/2026. O ambiente local publica Swagger em `http://localhost:3000/docs` e o schema em `/openapi.json`. Consulte o OpenAPI do ambiente que está integrando para obter os DTOs completos.

## Rotas de leitura existentes

| Método e rota | Resultado |
| --- | --- |
| GET /health | Resposta de saúde HTTP do serviço. |
| GET /applications | Array do catálogo persistido; `[]` é um resultado válido. |
| GET /applications/{id} | Aplicação conhecida, incluindo estado, horários e localização. |
| GET /applications/{id}/collections/latest | Observação válida mais recente e seu contexto operacional. |
| GET /applications/{id}/collections/{collectionId} | Observação identificada dentro do escopo da aplicação; collectionId é UUID. |
| GET /applications/{id}/collections/{collectionId}/methodology | Metadados da metodologia aplicada ao resultado, incluindo versão, fórmula, unidades, parâmetros e snapshot. |
| GET /openapi.json | Contrato legível por ferramentas. |

Essas leituras usam dados persistidos; não disparam coleta nem cálculo ambiental. A busca e a paginação atuais do catálogo são feitas pelo frontend; não há parâmetros de paginação do servidor documentados nessas rotas.

## Consultar localmente

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Use um ID retornado pelo catálogo ao montar a rota de detalhe e codifique-o como segmento de URL. Não presuma IDs sequenciais ou que o ID externo da aplicação seja UUID.

O DTO de aplicação inclui `id`, `name`, `state`, `firstSeenAt`, `lastCheckedAt`, `removedAt` e `location`. O backend também expõe motivo, frescor e calculabilidade. A UI atual ainda não consome todos esses campos. Cidade pode ser nula; registros legados incompletos podem ter `location: null`.

## Erros e ausência

| HTTP / código | Interpretação |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | ID vazio/inválido conforme validação da rota. UUID inválido de coleta também resulta em 400. |
| 404 / APPLICATION_NOT_FOUND | Aplicação não reconhecida. |
| 404 / COLLECTION_NOT_FOUND | Observação não encontrada para aquela aplicação. |
| 503 / CATALOG_UNAVAILABLE | Falha de leitura do catálogo. |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | Falha de leitura de evidências. |

Trate códigos estruturados e status HTTP; mensagens não são contrato de tradução. Falha não deve ser substituída por lista vazia ou indicador zero.

## Metodologia aplicada

`GET /applications/{id}/collections/{collectionId}/methodology` é uma leitura pública. Quando o snapshot estiver completo, a resposta informa a chave e a versão da metodologia, fórmula, entradas, saída, parâmetros, pressupostos, limites, limitações, configuração vinculada e a consulta do GreenER à fonte.

O snapshot pertence ao resultado histórico. Alteração posterior da configuração não reinterpreta esse resultado. Fonte bibliográfica e vigência oficial permanecem ausentes quando a fonte auxiliar não as publica; o horário da consulta do GreenER não representa vigência oficial.

Quando o resultado existir sem metodologia, a resposta mantém status e razão estruturados, como `METHODOLOGY_NOT_AVAILABLE`, `UNAPPROVED_CONFIGURATION` ou `INCOMPLETE_METADATA`. Resultado inexistente retorna `404 / RESULT_NOT_FOUND`; falha de leitura retorna `503 / METHODOLOGY_UNAVAILABLE`. Textos traduzidos pertencem à issue #57 e não fazem parte do contrato backend.

## Fronteiras da integração

Somente o backend chama fontes auxiliares. Contratos e unidades de origem estão na [referência versionada](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md). Esta página não publica endpoints futuros de energia, autenticação ou administração. Acesso administrativo por JWT é requisito de [EP06](../backlog/ep06), não uma API disponível presumida.

Para configuração de URL, CORS e diagnóstico, consulte [Operação](../operations). Para intervalos e interpretação de métricas, consulte [Metodologia](../product/methodology).
