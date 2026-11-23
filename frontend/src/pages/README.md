# pages

Componentes de página associados às rotas do produto, compondo funcionalidades e componentes reutilizáveis.

`dashboard/` apresenta o resumo ambiental agregado por período. A página controla período, região histórica, situação, busca, filtros locais, ordenação e paginação na URL; `features/analysis/environmentalSummary.ts` valida e consulta o contrato do backend. A implementação visual deve manter energia e CO₂e, suas coberturas temporais e os estados de ausência separados.

`ranking/` apresenta `GET /analysis/ranking`. Período UTC [início, fim), indicador, sentido, situação, região histórica e IDs de aplicações definem o escopo enviado ao servidor. Busca geral, filtros por coluna, ordenação e paginação são parâmetros de apresentação e não devem alterar os totais do escopo. `features/analysis/environmentalRanking.ts` valida a resposta, mantém ausência diferente de zero e a URL preserva o contexto ao abrir o detalhe. Regiões históricas são informadas como códigos porque o contrato atual não oferece catálogo; localização atual não substitui esse filtro.
# Regional simulation

`regionalSimulation/` selects an application, period (24h/7d/30d, default 7d), and destination region. The context is stored in the URL; only an explicit action submits the simulation. The page presents original results, factor provenance, scenario, coverage, and differences. Changing a criterion marks the previous result as pending.
