# Conciliação de issues e Project — 22/11/2026

Ações administrativas desta consolidação, posteriores às sprints. O [snapshot original](project-antes.json) preserva o estado anterior das 78 issues TASK; não foi sobrescrito. A nova #489 não faz parte desse recorte original. O [registro posterior](project-depois.json) confirma os estados consultados após a conciliação, sem sobrescrever o snapshot anterior. As alterações não comprovam homologação histórica do PO.

| Item | Antes | Ação realizada e fundamento |
| --- | --- | --- |
| #99, #130, #133 | Referência de processo a #134 excluída. | Referências atuais substituídas por [#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489), preservando os textos de critérios e registrando a data/limite da substituição. Não se recuperou o conteúdo da issue excluída. |
| #489 | Ausente. | Task criada sob EP00 e adicionada ao Project como In progress. Documentação, validações e pendências humanas ficam rastreáveis sem fechamento prematuro. |
| #243, #242, #165, #57, #69, #272 | Issues closed/completed, mas Project In progress. | Project alinhado para Done com o encerramento já existente e implementação integrada. São falhas de integração/estado, documentação REST, metodologia, histórico e sidebar; código e testes estão na base 240a2c2. Esta correção administrativa não cria novo aceite do PO nem retrodata conclusão. |
| #166 | Issue closed/completed, Project In progress. | Issue reaberta, mantendo In progress. [Comentário de 05/11](https://github.com/Seliganessecodigo/ABP-3DSM/issues/166#issuecomment-6664554399) já identifica critérios restantes. Não há workflow manual start/stop do PostgreSQL na base; ensaio de rollback e homologação também precisam de evidência. |
| #133 | Issue closed/completed e Project Done, sem relatório de execução localizado. | Issue reaberta e Project Backlog para avaliação ainda a executar/comprovar. [Roteiro](usabilidade.md) preparado; #455 descreve teste, não contém resultados de participantes. Nenhuma falha de produto foi inventada para justificar a pendência documental. |
| #249 | Issue closed/completed, Project In progress. | Estado preservado para validação do handoff completo: o documento US11-249-paginacao cobre somente parte do escopo de design. Não se declarou conclusão total por haver uma tela implementada. |

## Pendências preservadas

Sete tasks do snapshot não têm Sprint no campo de iteração: #263, #264, #265, #316, #317, #318 e #319. #263/#264 tratam da prévia legada retirada do escopo aprovado; não foram realocadas para simular planejamento. Nas demais, labels, encerramento e integração podem representar datas diferentes. A equipe deve ratificar a classificação, sem alterar a história dos commits.

Não foram preenchidas estimativas retroativas: nenhum dos 78 itens tinha Estimate/Size no recorte consultado; 71 tinham Sprint e 77 tinham responsável. Capacidade, distribuição inicial dos critérios, homologação, reuniões e avaliação representativa precisam de fontes próprias. Os checkpoints em [historico.json](historico.json) são candidatos cronológicos; tags oficiais não foram publicadas sem validação dos cortes.

#249 e as sete iterações ausentes permanecem explicitamente pendentes em #489. O estado reconciliado é uma ação atual, não evidência do que aparecia no quadro antes do prazo de entrega.
