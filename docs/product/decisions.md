# Decisões, dependências e fontes

Este registro mantém escolhas de produto visíveis sem transformar lacunas em funcionalidades aprovadas. O PDF v1.1 é uma referência histórica; as fontes Markdown publicadas evoluem por PR e devem ser alinhadas às issues quando o comportamento mudar.

## Decisões confirmadas

| ID | Decisão | Consequência |
| --- | --- | --- |
| D01 | Prévia de recálculo sem salvar. | Preservar original; não adicionar resultados alternativos aos totais/histórico. US-12, #263/#264. |
| D02 | Primeira ausência em snapshot completo e válido confirma remoção. | Falha de fonte e 404 de métricas não removem aplicação. US-02, #171. |
| D03 | Recebimento GreenER não é timestamp da origem. | Identificar intervalos derivados e não inventar vigência do fator. #154/#155. |
| D04 | RNFs são transversais; EP00 agrupa fundações e qualidade. | Tasks técnicas concluídas não dispensam qualidade nas próximas entregas. |
| D05 | Simulação regional mantém energia. | Alterar fator no cenário não altera medições nem resultados oficiais. US-15. |

D01 e a reorganização do EP00 foram confirmadas em 15/10/2026. As demais regras estão registradas no backlog e nos contratos versionados.

## Decisões pendentes de produto ou integração

| Tema | O que falta resolver | Entregas afetadas |
| --- | --- | --- |
| Energia | Fórmula, coeficientes, unidades de conversão e pressupostos. | #49/#53/#58 |
| Tempo e cobertura | Bordas do período, timezone, granularidade, arredondamento e resultados parciais. | #49/#156/#174/#175/#178 |
| Prévia de recálculo | Permissão, limite de volume/período e política de escolha do fator. | #91/#263/#264 |
| Acesso e contas | Matriz de papéis, bootstrap, sessão e políticas de senha/recuperação. | #90/#91/#158/#160/#245 |
| Fontes e operação | Timeout, retry, cotas, limites de concorrência e tratamento de atrasos aprovados. | #155/#243 |
| Continuidade | Retenção, backup/restauração, metas de disponibilidade e desempenho. | #110/#120/#125/#166 |
| Extras do protótipo | CSV, colunas configuráveis, período anterior e eficiência por transação. | #61/#248/#252 |

O PO resolve escopo e comportamento com os responsáveis técnicos; contratos de fontes exigem confirmação do fornecedor. Nenhuma data ou responsável individual é presumido nesta tabela.

## Como usar as fontes

- Markdown do site: visão, comportamento e regras de referência.
- Issues: critérios de aceite da entrega, tasks, dependências e discussão.
- Projects: prioridade, status, Sprint, datas e PRs vinculadas; esses campos não provam que uma regra foi implementada.
- Figma: intenção visual, fluxos e handoff; números ilustrativos não definem contratos.
- OpenAPI e código: comportamento efetivamente exposto por uma revisão.
- Contratos externos: schemas e unidades da origem, preservando versão e data de consulta.

Quando houver divergência, explicitar o conflito, decidir com o responsável adequado e atualizar as fontes afetadas na mesma entrega. Uma tela do Figma não autoriza inventar endpoint.

## Registrar uma mudança

A issue ou PR deve explicar decisão, motivo, alternativas relevantes, impacto nas histórias, dados e compatibilidade, além das evidências de aceite. Decisões arquiteturais duradouras recebem ADR junto à implementação. Consulte o [backlog](../roadmap) e os [critérios de qualidade](./quality).
