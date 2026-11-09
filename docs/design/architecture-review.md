# Revisão de arquitetura — backend e frontend

Esta revisão avalia limites de responsabilidade e trabalho repetido nos fluxos de descoberta e consulta de aplicações. A base é a `develop` no commit `7bf6734`. A análise foi dividida entre um agente de backend e um de frontend, com integração e revisão dos contratos pela coordenação.

O critério utilizado foi concentrar comportamento em módulos com interfaces pequenas, manter as decisões de domínio nas camadas existentes e reduzir operações demonstravelmente redundantes. Não houve mudança de contrato HTTP, modelo ambiental, permissões ou schema de banco.

## Backend: descoberta de aplicações

Antes, `DiscoveryService.discover` encadeava uma inserção por serviço e outra por evento de descoberta. Mesmo um catálogo inteiramente conhecido exigia uma tentativa de inserção para cada aplicação, dentro de uma única transação.

A persistência passa a receber conjuntos de aplicações e devolver somente os IDs realmente inseridos. Os eventos são gravados em lote apenas para esses IDs, na mesma transação. O service mantém a coordenação do caso de uso; os repositories concentram SQL e o tamanho técnico dos lotes. A consulta da origem continua fora da transação.

O lote técnico não limita o catálogo: conjuntos maiores são divididos internamente, mantendo a atomicidade da operação completa. Conflitos de ID preservam os registros existentes; uma falha na gravação dos eventos deve reverter as aplicações inseridas em todos os lotes. Não há consulta prévia de existência que introduza uma corrida entre leitura e escrita.

Os lotes usam execução sequencial na mesma conexão transacional: o próximo comando só é submetido após o sucesso do anterior, preservando a ordem de aquisição dos bloqueios. Os dois repositories verificam `no-await-in-loop` localmente e documentam uma exceção específica nesses laços; a regra continua verificando os demais casos. Paralelizar os comandos não oferece conexões adicionais dentro dessa transação e alteraria o protocolo de ordenação e falha.

## Frontend: catálogo independente dos filtros de análise

Antes, `useDashboard` buscava o catálogo e o resumo ambiental no mesmo efeito. Mudar período, estado ou região provocava uma nova consulta ao catálogo, embora o endpoint de catálogo não receba esses filtros. O histórico também importava o hook diretamente da página de catálogo.

`features/applications/useApplicationCatalog.ts` passa a concentrar o ciclo de vida do recurso de catálogo para catálogo, histórico e dashboard. O hook preserva validação HTTP, snapshot anterior, cancelamento e atualização periódica. Cada tela continua dona da apresentação e dos seus filtros. A implementação reutiliza o mecanismo existente, sem introduzir cache global adicional nem uma biblioteca de busca.

O resumo ambiental mantém seu próprio ciclo e seus próprios filtros. Uma atualização manual do dashboard pode atualizar os dois recursos; alterações nos filtros da análise atualizam somente o resumo. Falhas continuam distinguindo ausência de dados, erro inicial e falha de atualização com dados anteriores.

## Evidências de comportamento

As contagens anteriores de SQL são derivadas do laço de persistência substituído. As contagens posteriores são observadas pelo logger do TypeORM em PostgreSQL 18 real, sem substituir o repository por mock. A contagem exclui abertura e encerramento da transação.

| Cenário | Antes | Depois, observado em teste |
| --- | --- | --- |
| Descobrir 1.001 serviços novos | 2.002 comandos de inserção | 4 comandos: dois lotes de aplicações e dois de eventos |
| Repetir o catálogo de 1.001 serviços conhecidos | 1.001 comandos de inserção | 2 comandos, sem evento novo |
| Trocar período, estado ou região do dashboard | Nova consulta de catálogo por alteração | Nenhuma nova consulta de catálogo |
| Solicitar atualização manual do dashboard | Consulta de catálogo e resumo | Uma nova consulta de catálogo, além do resumo, respeitando carregamento pendente |

`backend/src/modules/applications/discovery-batch.database.spec.ts` também verifica catálogo vazio, primeiro duplicado, identidade já conhecida, concorrência com ordem invertida e rollback de todos os lotes após falha de evento. A corrida inclui IDs Unicode distintos com representação canonicamente equivalente, para que a ordenação de bloqueios não dependa do locale.

`frontend/e2e/dashboard.spec.ts` verifica contagem de requisições, catálogo atualizando enquanto o resumo está pendente, interrupção após navegação e preservação de regiões durante falha de atualização. `automatic-refresh.spec.ts` cobre o ciclo de atualização existente e a preservação do snapshot. Não há estimativa de ganho percentual de latência baseada nessas contagens.

## Limites da entrega

Outras oportunidades foram identificadas, mas precisam de uma investigação própria antes de alterar seu comportamento:

| Área | Evidência observada | Próximo passo necessário |
| --- | --- | --- |
| Região histórica | `getRegionAt` em `environmental-analysis-summary.service.ts` e `resolveRegionAtCollection` em `environmental-analysis.service.ts` reconstroem a região por eventos para cada coleta. | Comparar as diferenças no tratamento de eventos malformados antes de unificar a regra ou pré-processar o histórico. |
| Consultas e prévia | `EnvironmentalAnalysisService` reúne resumo, série, contribuições e prévia com consulta à origem. | Avaliar uma separação entre leitura persistida e simulação, preservando contratos, limites e falhas. |
| Ciclo de monitoramento | `MonitoringCycleRunner` recebe treze dependências; `persistObservation` coordena evidência, persistência, estado e incidentes. | Delimitar a captura persistida com testes de idempotência e falhas parciais antes de mudar a interface do módulo. |
| Carregamento inicial do cliente | O build aponta um bundle JavaScript de aproximadamente 1.050 kB e um SVG de fundo de aproximadamente 2.801 kB, antes da compressão. | Medir o carregamento inicial; avaliar carregamento por rota/idioma e otimização visual do asset com comparação de imagens. |
| Análise no cliente | `useEnvironmentalAnalysis.ts` recebe sete argumentos e coordena resumo, série, comparação e contribuições. | Definir uma interface de contexto coesa a partir dos consumidores, evitando apenas transferir a complexidade para vários hooks. |
| Detalhe da aplicação | `useApplicationDetail.ts` busca evidência depois de obter a aplicação. | Medir a latência e preservar estados de aplicação inexistente, evidência ausente e falhas antes de considerar paralelismo. |

As melhorias tratam dois fluxos concretos encontrados na análise. Não representam uma auditoria exaustiva de segurança ou uma garantia de tempo de resposta para toda a aplicação. A redução de operações pode ser verificada por contagem de consultas e requisições; latência, capacidade máxima e comportamento sob carga de produção exigem medição em ambiente representativo.

Não foram adicionados endpoints, dependências, mecanismos de cache, filas ou políticas de produto. A interface e os doze idiomas mantêm seus contratos existentes.
