# shared

Tipos, constantes e utilitários de backend reutilizados por domínios distintos. Evite transformar esta pasta em dependência circular ou depósito de código sem dono claro.

`audit/AuditWriter` mantém o mecanismo append-only e a sanitização de eventos. `audit/audit-activity.ts` registra as ações de alteração exibidas pela consulta administrativa, incluindo tentativas relevantes. Novas ações de domínio com impacto devem entrar nesse catálogo; eventos de acesso e etapas preparatórias não pertencem à consulta de alterações. A filtragem pertence à consulta SQL e precede contagem/paginação, mantendo coerência dos totais.
