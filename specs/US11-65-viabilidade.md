# Viabilidade do incremento operacional — US-11 / #65

## Escopo desta triagem

Verificar o que pode ser entregue na task frontend #65 com os contratos operacionais atuais, focando a associação entre a seleção `latest`/`collectionId`, respostas assíncronas atrasadas e tratamento de erro sem esconder dados anteriores. Esta nota não altera o escopo ambiental aprovado nem as decisões de produto pendentes.

## Evidência disponível no contrato

- O backend fornece `GET /applications/{id}`, `GET /applications/{id}/collections/latest` e consulta de coleta armazenada por ID.
- `CollectionEvidence` contém identidade de aplicação e coleta, limites do intervalo, horário de recebimento, métricas com unidades e status, além do estado/motivo operacional e indicador stale.
- Ausência de coleção e aplicação inexistente são `404` categorizados; falha ao consultar evidências é `503`. Dados ausentes/inválidos não são zeros.
- A rota de detalhe já lê `collectionId` da query string e consulta a coleta histórica selecionada; sem ele, consulta `latest`.

## Comportamento existente observado

- O hook associa seu estado a `applicationId`, usa `AbortController` no cleanup ao mudar ID/seleção/tentativa e realiza o ciclo de polling sequencialmente. O retry também reinicia o efeito, abortando o anterior.
- Para uma seleção histórica, a coleta é carregada uma vez por ciclo de efeito; as atualizações seguintes consultam o estado operacional e mantêm a evidência histórica. Isso evita substituí-la automaticamente por `latest` durante a permanência naquele contexto.
- A resposta atrasada de outra aplicação já tem cobertura e é rejeitada por cleanup/aborto; há teste de falha ao atualizar com preservação da evidência, teste de evidência indisponível e teste de consulta histórica.
- Embora o caminho de erro do catálogo não redefina `collectionLoading`, no carregamento inicial a seção operacional nem é montada sem uma aplicação. Sem um teste que reproduza a seção visível presa nesse estado após mudança de contexto, isso é apenas hipótese de código e não defeito confirmado; não entra como critério deste incremento.
- Há um gap na transição da mesma aplicação entre contextos: o estado mantém uma única `collection` sem chave que registre se veio de `latest` ou de determinado `collectionId`. Ao trocar de histórico para `latest`, a marcação de carregamento pode permanecer falsa e a página considera qualquer coleção existente visível quando não há `collectionId`; a evidência histórica pode, portanto, aparecer transitoriamente como se fosse a corrente até a resposta de `latest` chegar. Na transição entre dois contextos históricos, a tela oculta coleção incompatível, mas o estado também não declara diretamente o contexto do dado preservado.
- O polling de `latest` é sequencial no efeito ativo; não há corrida entre ciclos sobrepostos nesse fluxo. Contudo, não existe teste que atrase e inverta respostas entre contextos distintos da mesma aplicação.

## Incremento implementável

Vincular cada resultado de evidência ao contexto que o produziu (modo `latest` ou ID da coleta), mostrar somente resultado compatível com a seleção atual e tornar visível o carregamento ao trocar esse contexto. Manter as proteções de cancelamento ao mudar de contexto e ignorar respostas cujo efeito já foi substituído. Preservar uma evidência em falha somente quando ela pertence ao contexto solicitado, com aviso de erro e marcação de que se está mostrando dado anterior/stale. Para erro sem dado compatível, exibir estado de erro com retry; distinguir `404` de coleta indisponível de falha técnica.

No contexto histórico, polling de catálogo/estado não deve buscar nem substituir a coleta selecionada por `latest`. Ao voltar para `latest`, a consulta corrente de `latest` deve rodar e atualizar o contexto. O comportamento completo dessa fatia cabe no contrato e componentes operacionais existentes; não depende da API ambiental.

## Critérios verificáveis

1. Ao alternar histórico → `latest`, a coleta histórica não é apresentada como coleta corrente enquanto `latest` carrega.
2. Ao alternar `latest` → histórico ou coleção A → coleção B, somente a evidência associada à seleção atual é apresentada.
3. Uma resposta atrasada do contexto anterior, mesmo para a mesma aplicação, não altera a evidência, o estado de loading nem o erro do contexto atual.
4. Uma falha de atualização mantém a evidência anterior somente se ela corresponder ao mesmo contexto e sinaliza erro/dado anterior. Sem dado compatível, apresenta erro e retry sem fabricar métricas.
5. `404` da coleta selecionada mostra indisponibilidade da seleção e não cai para outra coleta; `404` de `latest` mantém o estado vazio correspondente.
6. Polling enquanto uma coleta histórica está selecionada mantém essa evidência; retorno ao modo `latest` faz nova consulta a `latest`.

## Verificação

Usar Playwright com API controlada e gates para alternar contextos da mesma aplicação, produzir respostas atrasadas e completar requests fora de ordem. Validar estados e evidência visíveis ao usuário, incluindo retry, ausência e erro. A suíte existente de Playwright do detalhe, com cobertura de coleta histórica, falha preservando dado, 404 e resposta atrasada entre aplicações, é o prior art.

## Limites e dependências

O incremento usa somente o contrato operacional atual de catálogo e evidências. Não determina nem aprova fórmula energética, unidades de energia/CO₂e, cobertura ambiental, períodos ambientais, fatores, metodologia ou motivos ambientais. Os blocos ambientais de #65 continuam dependentes de #235, #174, #58/#57 e das regras/resultados de #49/#53/#164, com timezone, bordas, granularidade, arredondamento e cobertura ainda pendentes. A execução conjunta da #235 segue dentro do escopo confirmado, mas é propriedade do backend e não é requisito para concluir esta fatia operacional em isolamento.

## Histórico de decisão

O usuário confirmou trabalhar apenas em #65 e #235, manter dependências fora do escopo e deixar as tasks abertas até o aceite completo. A triagem identifica uma fatia operacional segura e implementável sob #65 sem transformar ausência de contrato ambiental em bloqueio de todo o frontend. Nenhuma decisão ambiental aprovada ou pendente foi alterada.

## Implementação e evidência TDD

- Primeiro ciclo: o teste histórico → consulta mais recente falhou porque não havia status de carregamento e a coleta histórica com CPU de 38% permanecia visível. O hook passou a associar o estado à seleção (`collectionId` ou consulta mais recente), retirando evidência incompatível antes do novo efeito e preservando a identidade da aplicação. O teste passou após a correção.
- Segundo ciclo: após a troca de seleção, uma falha 503 na consulta da aplicação deixava a evidência em carregamento e sem alerta. O teste falhou por ausência do alerta. O tratamento de erro agora encerra o carregamento e permite nova tentativa quando não há evidência compatível. Os dois testes passaram; o segundo também valida recuperação após clicar em tentar novamente.
- Suíte completa do detalhe: 20 testes Playwright aprovados, incluindo os dois cenários novos, em 41,2 segundos. Execução fora do sandbox, com API controlada e navegador Chromium. A revisão final do diff não encontrou novos defeitos.
- `npm.cmd ci`, `npm.cmd run lint` e `npm.cmd run build` executados com sucesso no frontend. A verificação de formatação preserva os finais de linha existentes do arquivo de testes.
- Sem mudança de contrato, dependência ou regra ambiental. #65 e #235 permanecem abertas. A PR #286 foi fechada a pedido do usuário; nenhuma nova PR deve ser aberta antes da conclusão da implementação.
