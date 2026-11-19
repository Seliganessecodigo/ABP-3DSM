# Revisão de arquitetura e desempenho

Revisão de 19/11/2026 sobre `develop` (`d1d56b1`), acompanhando as correções de avisos, auditoria, traduções e sidebar. O objetivo é remover trabalho comprovadamente redundante e registrar as mudanças maiores que precisam de medição antes de serem implementadas.

## Correções entregues

| Área | Problema observado | Alteração e limite |
| --- | --- | --- |
| Avisos pessoais | `insufficient-data` entrava na lista e nos badges junto com `exceeded`. | Exibir somente violações confirmadas e ocultar o painel sem violações. As avaliações do backend, os valores nulos e a cobertura parcial continuam preservados. |
| Auditoria em Configurações | A exclusão de oito nomes de autenticação deixava outros eventos de acesso/preparação aparecerem. Login ainda gravava eventos. | `AuditLogsRepository.listChanges` seleciona um catálogo explícito de alterações e tentativas relevantes antes de contar/paginar. Login, refresh, logout e preparação TOTP deixam de escrever na auditoria. Registros históricos são mantidos. |
| Traduções | As 94 entradas de simulação regional eram cópias do inglês em dez idiomas; Configurações também tinha ações em inglês. | Traduzir os dez idiomas, incluindo russo; manter as mesmas chaves e interpolações nos 12 locales. Testar títulos e ações com textos nativos, sem usar o próprio JSON como expectativa. |
| Sidebar | A rota de Metodologia herdava outra fonte e, a partir de 1600 px, ampliava os textos e a sidebar. | Remover as sobrescritas da navegação e conservar a tipografia comum, verificada em 1366 e 1920 px. |

O catálogo de auditoria pertence a `backend/src/shared/audit/audit-activity.ts`: novas ações de alteração precisam ser registradas ali. As ações existentes de conta, papel, situação, monitoramento, preferências, senha e identidades/autenticadores continuam consultáveis. Escopo por organização, autorização, motivos, resultados e atomicidade continuam no fluxo existente. A API/OpenAPI e os READMEs de propriedade foram atualizados.

## Trabalho redundante removido

### Busca de avisos por aplicação

Catálogo e Dashboard procuravam cada aviso com `Array.find` durante a renderização das linhas. Agora constroem um `Map` por renderização e consultam pelo ID. Não há cache, memoização ou novo estado compartilhado.

O experimento abaixo usa o Catálogo real em Chromium, com 500 aplicações e respostas HTTP controladas, selecionando a opção “Todos”:

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Aplicações recebidas / linhas exibidas | 500 / 500 | 500 / 500 |
| Chamadas de `find` sobre a lista de avisos | 2.000 | 0 |
| Comparações dos predicados dessas buscas | 501.000 | 0 |

Dados: [antes](alert-lookups-before.json), [depois](alert-lookups-after.json). O contador mede somente essas buscas lineares; construir e consultar o `Map` também tem custo. Estes números não representam latência, throughput ou consumo de memória em produção.

Reprodução manual, com as dependências do frontend instaladas: iniciar o Vite em uma porta livre e executar `node .github/evidencias/revisao-arquitetura/measure-alert-lookups.mjs http://127.0.0.1:PORTA`. O script usa apenas respostas simuladas e instrumenta o navegador do experimento; não modifica o código de produção. Para comparar, executar sobre a implementação anterior e a atual mantendo o mesmo ambiente.

### Ranking com “Todos”

O efeito de carregamento enviava duas requisições idênticas quando a tabela já solicitava todos os itens. Nesse caso, a tabela e a escala dos gráficos agora compartilham a mesma promessa. O teste de navegador reproduziu duas requisições antes e verifica uma depois. Páginas com limite continuam buscando a lista completa para preservar posições e escala globais; filtros, cancelamento e erros são mantidos.

### Escopo explícito de análise no banco

`EnvironmentalAnalysisSummaryService` carregava todo o catálogo mesmo quando recebia `applicationIds`. Agora usa `ApplicationsRepository.findByIds` nesse caso e preserva a leitura completa para consultas globais. A busca usa `Any(ids)` do TypeORM, com um único parâmetro de array PostgreSQL, evitando que o número de IDs vire o número de parâmetros SQL. IDs vazios não consultam o banco.

Os testes cobrem o resultado de domínio com ausência de leituras e, em PostgreSQL isolado, o formato da consulta com 70.001 IDs e o escopo de uma aplicação. O filtro de apresentação do ranking não foi convertido em escopo de domínio: isso alteraria as posições globais.

### Escritas na autenticação

O teste de confirmação de login TOTP demonstrava dois eventos de auditoria para a mesma entrada. Agora são zero. Pelo fluxo de `AuditWriter`, isso remove duas consultas de identificação de ator e duas inserções nesse caminho. A criação/rotação de sessões, validação TOTP, proteção contra replay e atualização do último acesso continuam existentes. Ativação, substituição e recuperação do autenticador continuam auditadas.

## Próximas oportunidades, sem mudanças especulativas

| Prioridade | Ponto no código | Evidência e próxima decisão |
| --- | --- | --- |
| Alta, com histórico volumoso | `EnvironmentalAnalysisSummaryService` e `MetricCollectionsRepository.findEnvironmentalByApplicationsAndPeriod` | A agregação já busca observações em lote, sem uma consulta por aplicação, mas carrega intervalos brutos no Node. Medir tempo, heap e plano SQL em períodos representativos antes de desenhar pré-agregação versionada. Uma soma SQL simples perderia recorte de intervalos, cobertura, ausência e versões metodológicas. |
| Alta, com histórico volumoso | Histórico de metadados e `getRegionAt` | O histórico é carregado e percorrido por observação. Medir e avaliar uma busca por data mais eficiente. Cortar todos os eventos posteriores ao período seria incorreto: o estado anterior ao primeiro evento pode depender de seu metadado “antes”. |
| Média | `EnvironmentalAnalysisRankingService` | O ranking carrega o catálogo enquanto o resumo também o consulta. Considerar compartilhar a leitura dentro da mesma requisição, preservando o contrato do resumo e a distinção entre localização atual e histórica. Não adicionar cache global para encobrir a duplicação. |
| Média | `AuditLogsRepository.listChanges` | Busca sem distinção de acentos, com `LIKE '%texto%'` em vários campos e JSON, pode crescer em custo. Coletar planos com volumes e distribuição reais antes de criar índices. [EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) e [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) orientam a avaliação; qualquer índice precisa corresponder à expressão normalizada usada na consulta. |
| Média | `AccountsService.list` / `withAdmin` | A leitura passa pelo fluxo com locks usado por alterações administrativas. Medir contenção antes de separar o caminho de leitura, preservando autorização e proteção concorrente do último administrador. |
| Média | Catálogo HTTP e tabelas com “Todos” | O payload e o DOM crescem com o catálogo. Paginação real no servidor exige alinhar filtros, ordenação localizada, seleção e o contrato de “Todos”; não impor um limite silencioso. |
| Baixa | Páginas grandes, especialmente detalhe e ranking | Separar coordenação de consulta da apresentação quando novas mudanças exigirem isso, seguindo os hooks e features existentes. Não criar uma tabela genérica nem mover regras para `App.tsx`. |

O coletor já usa lotes e concorrência limitada, e o resumo já busca observações/histórico em lote. Essas soluções foram preservadas. Não foram adicionados índices, migrations, caches, dependências, novos limites nem alterações na fórmula ambiental.

## Verificação e limites

Os testes de regressão foram executados antes das correções: avisos incluíam as três aplicações, o ranking fazia duas requisições, a simulação russa não tinha o botão localizado e a tipografia da sidebar mudava. Os testes focados passaram após as mudanças.

As instalações `npm ci`, lint e build foram executadas nos dois projetos; o backend também passou no typecheck. A execução local de cobertura passou com 477 testes de backend; 216 testes que requerem PostgreSQL ficaram desabilitados sem `TEST_DATABASE_URL`. Na seleção ampliada de 48 testes de navegador, 47 passaram inicialmente e um parou no carregamento inicial de `/login`; esse caso passou isoladamente, junto com a nova captura móvel em russo. O Docker local não disponibilizou o PostgreSQL durante esta revisão. A CI da [PR #479](https://github.com/Seliganessecodigo/ABP-3DSM/pull/479) complementa essas verificações com PostgreSQL, fluxo integrado, suíte completa do frontend, documentação e SonarQube Cloud; os checks registram o resultado do commit mais recente.

Evidências visuais com respostas simuladas: [somente violações](avisos-somente-limites-ultrapassados.png), [sem violações](sem-avisos-sem-violacoes.png), [auditoria de alteração](auditoria-desktop.png), [sidebar na Metodologia em 1920 px](sidebar-metodologia-1920.png), [russo no desktop](simulacao-russo-desktop.png) e [no celular](simulacao-russo-mobile.png).

Não houve medição de latência de produção ou `EXPLAIN ANALYZE` sobre o banco em uso. [EXPLAIN ANALYZE executa a consulta](https://www.postgresql.org/docs/current/sql-explain.html); a investigação futura deve usar dados representativos e ambiente apropriado. As melhorias entregues têm evidência de trabalho eliminado e preservação de comportamento, não uma promessa de ganho global.
