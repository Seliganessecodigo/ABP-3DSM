# Especificação — Comparação de aplicações (US-14, frontend)

Issue: [#78 — Implementar fluxo completo de comparação de aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/78)

História: [#20 — US-14: Comparar aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/20)

## Problem Statement

Uma pessoa que acompanha aplicações no GreenER não consegue compará-las em um mesmo período pela interface. Sem um fluxo que apresente indicadores, cobertura e diferenças com seus estados e limitações, ela não consegue identificar diferenças ambientais sem confundir ausência de dados com zero ou consumo absoluto com eficiência.

## Solution

Disponibilizar uma tela responsiva para escolher de duas a cinco aplicações, restaurar e ajustar um período comum, selecionar uma aplicação de referência e comparar os resultados fornecidos pelo backend. A tela mantém a seleção independente dos filtros da lista, registra o contexto navegável na URL e torna explícitos valores parciais, ausências e razões de diferenças não calculáveis.

## User Stories

1. Como pessoa usuária do GreenER, quero abrir a comparação pela navegação de aplicações, para comparar aplicações sem depender de um link interno.
2. Como pessoa usuária, quero ver instrução clara para selecionar de duas a cinco aplicações, para entender como iniciar uma comparação.
3. Como pessoa usuária, quero começar sem aplicações pré-selecionadas ou dados ilustrativos, para não confundir exemplos com resultados reais.
4. Como pessoa usuária, quero pesquisar aplicações por trecho em qualquer coluna de dados, sem diferenciar maiúsculas, minúsculas ou acentos, para localizar candidatas com rapidez.
5. Como pessoa usuária, quero filtrar por colunas, usando texto em campos abertos e opções em estados fechados, para refinar as candidatas com critérios compreensíveis.
6. Como pessoa usuária, quero combinar a busca geral (correspondência em qualquer coluna) e filtros de coluna (todos aplicados), para refinar a lista sem resultados ambíguos.
7. Como pessoa usuária, quero ver e limpar filtros ativos individualmente ou em conjunto, para recuperar candidatas sem perder a ordenação.
8. Como pessoa usuária, quero ordenar colunas compatíveis com o tipo de dado, com ausentes ao final e desempate estável, para encontrar aplicações sem comparar grandezas incompatíveis.
9. Como pessoa usuária, quero percorrer a lista por páginas e tamanhos definidos, para lidar com catálogos extensos sem perder a seleção.
10. Como pessoa usuária, quero ver dez itens inicialmente e escolher 5, 10, 15, 20 ou Todos, para controlar a quantidade visível conforme minha tarefa.
11. Como pessoa usuária, quero que Todos represente todo o conjunto filtrado e ordenado e que a lista mostre contagem e intervalo válidos, para não interpretar uma página como o catálogo inteiro.
12. Como pessoa usuária, quero que mudanças de busca, filtros, ordenação ou tamanho retornem à primeira página, para não ficar em uma página inexistente ou inesperada.
13. Como pessoa usuária, quero que a seleção permaneça quando filtro, ordeno ou pagino a lista, para não perder aplicações que deixaram de aparecer entre as candidatas visíveis.
14. Como pessoa usuária, quero selecionar cada aplicação uma só vez e receber orientação acessível ao atingir o máximo de cinco, para evitar seleções inválidas sem substituições silenciosas.
15. Como pessoa usuária, quero restaurar seleção, período, referência e estado da lista por link direto, reload e navegação anterior/próxima, para compartilhar ou retomar o mesmo contexto.
16. Como pessoa usuária, quero que IDs repetidos em um link sejam deduplicados mantendo a ordem; com menos de dois IDs, quero orientação para completar a seleção; acima de cinco, quero um erro editável sem descarte silencioso.
17. Como pessoa usuária, quero preservar no link IDs selecionados que já não existem e receber falha recuperável, para entender e corrigir a comparação sem alterar silenciosamente seu escopo.
18. Como pessoa usuária, quero usar o período comum do contexto de análise compartilhado, para que datas, bordas e fuso tenham o mesmo significado que nas demais análises.
19. Como pessoa usuária, quero que a comparação seja solicitada automaticamente quando houver seleção válida e após mudar período ou referência, para que links restaurados e ajustes mostrem o recorte atual sem uma etapa redundante.
20. Como pessoa usuária, quero que a primeira aplicação selecionada seja a referência inicial e que eu possa escolher outra selecionada, para entender e controlar a base das diferenças.
21. Como pessoa usuária, quero ver claramente qual aplicação é a referência e como cada diferença é orientada em relação a ela, para não confundir o sinal ou o denominador do percentual.
22. Como pessoa usuária, quero que a remoção da referência selecione a primeira aplicação restante como referência, com anúncio acessível e atualização do link, para manter diferenças definidas sem mudança oculta.
23. Como pessoa usuária, quero comparar energia, emissões, cobertura de energia e CO₂e, métricas operacionais disponíveis, estado e localizações do período, para compreender os resultados sem perder seu contexto.
24. Como pessoa usuária, quero ver CPU, memória, disco e rede com suas unidades, estados e diferenças fornecidos pelo backend, para comparar as métricas retornadas sem inferir valores ausentes.
25. Como pessoa usuária, quero ver todas as localizações históricas fornecidas para cada aplicação no período, para não receber uma localização atual que represente incorretamente o recorte.
26. Como pessoa usuária, quero ver emissões e diferenças absolutas em kgCO₂e, mesmo que a API as forneça em gCO₂e, para ler valores em uma unidade adequada sem alterar o contrato ou os percentuais.
27. Como pessoa usuária, quero que ausência, falha, cobertura parcial e diferença não calculável tenham texto e razões explícitas, para não interpretar esses estados como zero ou resultado completo.
28. Como pessoa usuária, quero que percentuais só sejam exibidos quando a unidade for compatível e a referência permitir o cálculo, para não receber uma comparação matemática inválida.
29. Como pessoa usuária, quero ver a matriz lado a lado no desktop e cartões por indicador em telas estreitas, para comparar até cinco aplicações sem perder valores ou diferenças.
30. Como pessoa usuária, quero que a tela tenha estados distintos de carregamento inicial, sucesso completo, sucesso parcial, vazio, erro e nenhum resultado da busca, para entender o que aconteceu e qual ação posso tomar.
31. Como pessoa usuária, quero que uma falha de consulta remova resultados anteriores, preserve seleção, período e referência e ofereça nova tentativa manual, para não confundir dados antigos com a comparação atual.
32. Como pessoa usuária, quero usar a tela por teclado, com foco previsível, rótulos e mensagens acessíveis e estados compreensíveis sem depender só de cor, para realizar a comparação com diferentes necessidades de acesso.
33. Como pessoa usuária, quero ler a tela nos doze idiomas suportados e em temas claro, escuro e sistema, para usar o fluxo com a mesma cobertura de localização e apresentação do restante do frontend.

## Implementation Decisions

- A entrega é frontend e consome o contrato de comparação já implementado em #178. Não altera endpoint, schema, autenticação ou cálculos do backend.
- A nova tela é responsável por sua composição, interações, estilos, traduções e contexto de URL. A navegação global apenas associa o novo destino à tela; estado de página não deve ser absorvido pelo componente raiz ou por store global.
- Reutilizar o catálogo completo de aplicações existente e o contexto de período/granularidade de #262 quando os significados forem compatíveis. A busca, os filtros e a ordenação desta lista são locais e não alteram o escopo dos IDs selecionados nem o recorte ambiental.
- A URL restaura IDs selecionados, período, referência, busca, filtros de coluna, ordenação, página e tamanho. A ordenação inicial, os nomes dos parâmetros e o caminho da rota seguem as convenções existentes do frontend, sem ampliar o contrato da API.
- A lista é filtrada e ordenada antes da paginação. Busca geral combina correspondências entre colunas por OU; filtros de coluna combinam por E. Mudanças de critérios retornam à primeira página. Tamanho padrão: 10; opções: 5, 10, 15, 20 e Todos. Todos mostra o conjunto completo após busca e filtros. O catálogo atual é entregue integralmente, sem paginação do servidor.
- Repetidos na seleção recuperada pela URL são deduplicados mantendo a ordem. Menos de dois IDs não dispara comparação e orienta a completar; mais de cinco apresenta erro editável sem remover IDs. IDs ausentes permanecem no contexto e produzem falha recuperável. Referência omitida usa a primeira selecionada; referência explícita inválida requer correção, sem consulta.
- A consulta é automática quando há duas a cinco aplicações válidas e após mudança de período ou referência. Alterar o contexto cancela ou invalida respostas anteriores para que uma resposta antiga não substitua o resultado atual. Remover a referência escolhe a primeira aplicação restante, anuncia a mudança e atualiza a URL.
- Usar “aplicação” para o sistema monitorado e “aplicação de referência” para a selecionada como base das diferenças. Acrescentar essas definições ao glossário na implementação, sem detalhes técnicos e sem alterar “integração”.
- Apresentar os valores retornados pelo backend: energia, emissões, coberturas independentes de energia e CO₂e, localização histórica, estado, CPU, memória, disco e rede. Exibir ausências e razões conforme o contrato; não substituir nulo, erro, cobertura parcial ou unidade incompatível por zero.
- Usar diferenças e razões calculadas pelo backend. Cada aplicação não referente é comparada com a referência escolhida. Percentuais só são significativos conforme compatibilidade de unidade e referência indicada pelo contrato; a própria referência é identificada como base, sem sugerir uma diferença contra si mesma.
- Converter gCO₂e para kgCO₂e apenas na apresentação, incluindo diferenças absolutas. A conversão não altera a API nem percentuais. Energia e demais métricas mantêm as unidades retornadas.
- O handoff final de #252/#365 orienta a apresentação, mas sua ilustração A/B e a orientação fixa da diferença são adaptadas à referência selecionável e às seleções de até cinco aplicações. Não incluir kWh por transação nem linguagem ou classificação de eficiência.
- Usar matriz comparável no desktop e cartões por indicador em telas estreitas, sem ocultar aplicações, cobertura, diferenças ou estados. Usar temas/tokens e componentes de formulário existentes e fornecer texto junto a cores/ícones.
- Em falha após consulta, preservar seleção e contexto, limpar os resultados anteriores, exibir erro localizado e permitir retry manual. Não fazer retry automático nem apresentar resultado desatualizado como atual.
- Completar traduções para os doze locales já suportados pelo frontend; formatar datas e números segundo o locale ativo.
- Atualizar o README da área frontend com responsabilidade da tela, execução e comando de testes. Na implementação, adicionar ao glossário as definições aprovadas de aplicação monitorada e aplicação de referência. Não é necessária mudança de OpenAPI/documentação do backend porque o contrato permanece inalterado.

## Testing Decisions

- **Seam confirmado:** Playwright no fluxo da rota de comparação, interagindo pela UI e URL. Interceptar as chamadas HTTP de catálogo e comparação para fornecer respostas de contrato controladas e verificar o comportamento observável; não testar componentes internos, hooks privados ou detalhes de implementação.
- Seguir TDD em fatias verticais: um teste de comportamento observável falhando, a menor alteração para fazê-lo passar e repetir. Não escrever uma bateria de testes antes de conhecer o comportamento real de cada fatia.
- Cobrir no seam da tela: primeira visita sem seleção; seleção única e limite de cinco; seleção preservada ao buscar, filtrar, ordenar e paginar; paginação/“Todos”; deduplicação e URLs inválidas; período e referência restaurados e alterados; remoção da referência; chamada automática; matriz e layout estreito; loading, resultado completo/parcial/vazio, busca sem resultados, falha e retry; atualização de contexto sem resposta antiga substituir a atual; estados acessíveis e interação por teclado.
- Asserções devem observar texto, unidades, linhas/cartões, estados acessíveis, chamadas HTTP resultantes do fluxo, URL e ações habilitadas. Incluir dados de referência conhecidos para conversão gCO₂e → kgCO₂e, diferença orientada à referência, referência zero, unidades incompatíveis, ausência de métrica, localização indisponível e cobertura parcial. Não derivar o valor esperado da mesma fórmula executada pela implementação.
- Verificar por interações E2E representativas textos traduzidos e longos, temas e viewport estreito. Reutilizar a checagem existente de integridade dos catálogos para assegurar as mesmas chaves e interpolações nos doze locales; não criar uma fronteira de teste adicional por locale.
- A API real e seus cálculos continuam cobertos pelos testes backend da entrega #178; os mocks E2E desta tela não afirmam validar o backend. A implementação frontend executa as verificações pertinentes definidas pela issue e skill de frontend, e registra somente comandos realmente executados.
- Prior art: E2E de catálogo, histórico, período, navegação, traduções, responsividade e tema; teste de integridade de locales do frontend.

## Out of Scope

- Alterar ou duplicar a lógica de cálculo, cobertura, períodos, diferenças ou autorização do backend de #178/#262.
- Adicionar suporte a transações, produtividade, kWh por transação ou qualquer outra métrica não fornecida pelo contrato.
- Chamar APIs auxiliares diretamente pelo frontend, fabricar dados de localização ou usar fixtures do Figma como resultados reais.
- Classificar aplicações como mais ou menos eficientes, criar ranking dentro da comparação ou inferir recomendação ambiental a partir de consumo absoluto.
- Implementar comparação entre períodos, filtros globais de domínio não suportados pelo contrato, mapa ou novos componentes globais/tabela universal.
- Recriar protótipo, alterar tokens/temas globais, ou modificar as outras telas de análise além do necessário para integrar a navegação e o contexto compartilhado.

## Further Notes

- Dependências e referências: #20 (US-14), #178 (contrato backend), #252 (handoff de design), #262 (contexto temporal) e #365 (registro do handoff).
- A história #20 exige comparar aplicações no mesmo período; valores absolutos de consumo não são eficiência. A cobertura ambiental mede suporte temporal por energia e CO₂e separadamente, não quantidade de aplicações.
- A unidade de emissões da API é gCO₂e; kgCO₂e é somente a unidade de apresentação acordada para esta tela.
- A decisão sobre o seam foi confirmada antes da redação: uma fronteira Playwright da rota, com a checagem de locales existente como verificação transversal.
