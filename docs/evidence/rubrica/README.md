# Evidências da rubrica — consolidação de 22/11/2026

Base de código: [develop em 240a2c2](https://github.com/Seliganessecodigo/ABP-3DSM/tree/240a2c26ecd2eb1b0adc184f4efe01799bab8a50). Fuso de referência: America/Sao_Paulo. A consolidação é retrospectiva: não representa planejamento registrado no início das sprints, aprovação do professor, ata de reunião ou avaliação com usuários que não tenha evidência própria.

## Fontes e método

- [Project 2](https://github.com/orgs/Seliganessecodigo/projects/2): campos consultados integralmente, em três páginas; o [snapshot anterior à conciliação](project-antes.json) contém 78 issues com label TASK, sem confundir pull requests com tarefas.
- [Inventário legível das tasks](tasks.md): responsáveis e sprints atribuídos no momento da consulta, não um compromisso inicial comprovado.
- [Histórico Git](historico.json): checkpoints da cadeia first-parent anteriores ao início da iteração seguinte, no fuso de referência. As contribuições são commits não-merge incorporados entre checkpoints; a data de autoria pode anteceder sua integração.
- Iterações encontradas no Project: 05–18/10, 19/10–01/11 e 02–15/11/2026. Essas datas não comprovam que o professor validou os prazos. Checkpoints são candidatos cronológicos, não tags oficiais.
- Autores Git são agrupados pelos nomes utilizados no repositório. Commits automáticos não são atribuídos a um integrante por suposição. Quantidade de commits não mede esforço, qualidade ou nota individual.
- [CI da entrega integrada](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486): 542 testes de frontend, 705 de backend e três fluxos integrados, além de builds e Sonar. A árvore do commit d27578d testado é igual à base 240a2c2; isso não comprova testes nos checkpoints históricos.

## Documentos

- [Plano e matriz publicada](../../plano-de-entregas.md).
- [Matriz detalhada de verificação](matriz.md), com os códigos e pesos da rubrica fornecida pela equipe, sem alterações.
- [Revisão e análise retrospectiva desta consolidação](revisao-2026-11-22.md).
- [Avaliação de usabilidade: evidências, roteiro e registro de execução](usabilidade.md).
- [Conciliação dos estados e pendências](reconciliacao.md).
- [Task de processo #489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489), que substitui a referência atual à issue excluída #134 sem recriar seu conteúdo ou histórico.

## Limites do aceite

Código incorporado, teste automatizado aprovado, revisão de interface e avaliação com participante representativo são evidências diferentes. Um roteiro não é uma execução; uma issue fechada não substitui o relatório exigido. Não foram estimadas horas retroativamente, criadas atas de reuniões presumidas ou publicadas tags oficiais com cortes não ratificados.

Os documentos históricos de design preservam suas ressalvas originais e podem descrever versões anteriores. Para capacidades atuais, usar as páginas de produto/guia e a base fixada acima. Para avaliação da sprint, conferir também os registros existentes até o prazo efetivamente validado pelo professor.
