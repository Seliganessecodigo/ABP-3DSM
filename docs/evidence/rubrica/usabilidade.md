# Protocolo de avaliação de usabilidade

O protocolo estrutura a análise dos principais fluxos do GreenER com dois perfis de uso, sete tarefas e critérios observáveis. Abrange interpretação ambiental, navegação, comparação, simulação, ajuda, idiomas e temas. Fontes: [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133), [CT-083](https://github.com/Seliganessecodigo/ABP-3DSM/issues/455) e [plano QA](https://github.com/Seliganessecodigo/ABP-3DSM/issues/372).

## Perfis e preparação

- Gestão de infraestrutura: identificar aplicações, estado, atualidade e falhas operacionais.
- Análise ambiental/operacional: interpretar estimativas, qualidade dos dados, ranking, comparação e cenários.
- Selecionar participante compatível com um desses perfis que não tenha implementado o fluxo avaliado; registrar experiência relevante sem nome, e-mail ou dado pessoal desnecessário.
- Registrar SHA frontend/backend implantados, URL, data/fuso, navegador, viewport/zoom, tema e idioma. Dados de teste devem ser explicáveis e identificados como reais, fonte controlada ou API interceptada.
- Moderador registra consentimento quando houver gravação; evita ensinar onde clicar. Definir responsáveis e duração da sessão com a equipe.

## Tarefas propostas

| ID | Tarefa apresentada ao participante | Resultado a observar |
| --- | --- | --- |
| U1 | Localizar uma aplicação e dizer se ela está disponível e quando seus dados foram observados. | Distingue estado atual, última tentativa e observação válida; consegue abrir o detalhe e voltar. |
| U2 | Identificar uma aplicação com maior emissão no mesmo período de comparação. | Usa ranking e filtros, entende unidade/período e não confunde maior emissão absoluta com menor eficiência. |
| U3 | Comparar duas aplicações e explicar um resultado ausente. | Mantém período, identifica referência e distingue ausência de zero. |
| U4 | Explicar por que sucesso das coletas e cobertura temporal podem ter percentuais diferentes. | Entende que tentativas válidas/salvas não garantem dados para todo o tempo analisado. |
| U5 | Investigar um intervalo do histórico e conferir fator/modelo preservados. | Localiza dados de origem, lacunas e informações da estimativa sem pressupor que o fator consultado hoje vale para o passado. |
| U6 | Simular a mesma energia em outra região e explicar o resultado. | Distingue cenário de resultado persistido; a simulação não altera a coleta original. |
| U7 | Abrir/fechar a ajuda, trocar idioma/tema e retomar uma tarefa. | Consegue continuar, encontra foco e não fica preso no diálogo ou perde o contexto. |

Executar os tamanhos previstos pelo CT-083, incluindo 390×844 e 1440×900 quando aplicáveis. Identificar o perfil e o ambiente de cada sessão para relacionar os resultados às condições de uso.

## Modelo de registro por sessão

| Campo | Formato do registro |
| --- | --- |
| Data/fuso, moderador e evidência de consentimento aplicável | Data/hora com fuso e referência de consentimento |
| Identificador anônimo e perfil/experiência | Código anônimo e descrição do perfil |
| SHA frontend/backend, ambiente e natureza dos dados | Hashes Git, URL e identificação da fonte dos dados |
| Dispositivo, viewport, zoom, navegador, tema e idioma | Condições de execução da sessão |
| Tarefas tentadas e sucesso/ajuda/desistência observados | Resultado por tarefa e observações |
| Dificuldades, evidência sanitizada e impacto observado | Descrição, impacto e evidência de cada achado |
| Referências de issue/PR relacionadas ao achado | Links para os itens relacionados |
| Versão e resultado do reteste | SHA avaliado e resultado por tarefa |

O modelo registra contexto, observações e evidências por tarefa. Referências a versões e issues permitem relacionar os resultados aos fluxos avaliados; dados pessoais e credenciais ficam protegidos nas capturas e nos relatórios.
