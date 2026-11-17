# Consultas administrativas do monitoramento

Somente a API GreenER é consumida, por `authenticatedFetch`. Este módulo valida a projeção dos campos usados pela interface; payload inválido é falha de integração, nunca diagnóstico saudável ou valor zero. Ausências declaradas como `null` são preservadas. O módulo não inicia outro scheduler, não consulta diretamente fontes externas e não faz cálculos ambientais.

| Operação | Contrato existente |
| --- | --- |
| Saúde | `GET /monitoring/health`: estado ACTIVE/PAUSED/UNAVAILABLE, controle nullable, intervalo, último ciclo, fontes e contagens |
| Pausa/retomada | `PATCH /monitoring/control`: `{ paused, reason }`; valida confirmação `{ paused, changed, updatedAt }` |
| Auditoria | `GET /monitoring/audit`: parâmetros documentados de busca/filtros/ordenação/paginação; snapshots autorizados e metadados |

401/403 permanecem distintos de falha de consulta. O componente decide a mensagem traduzida; respostas internas não são exibidas como erro. O sinal de cancelamento acompanha todas as operações. Não há cache ou polling novo: atualização do diagnóstico é explícita e não dispara coleta.

Contratos de referência: `backend/src/modules/applications/monitoring-operations.controller.ts`, `monitoring-operations.dto.ts` e `monitoring-audit.query.ts`. Nenhuma alteração de contrato backend foi feita.
