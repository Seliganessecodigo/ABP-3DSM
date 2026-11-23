# Usabilidade — evidências e protocolo de execução

Situação em 22/11/2026: **execução com usuários representativos não comprovada**. Fontes: [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133), roteiro [CT-083 / #455](https://github.com/Seliganessecodigo/ABP-3DSM/issues/455) e [plano QA / #372](https://github.com/Seliganessecodigo/ABP-3DSM/issues/372). A #133 constava encerrada, mas sem relatório/comentários de resultados. A equipe informou não haver registros adicionais fora do GitHub.

Os feedbacks documentados na [revisão](revisao-2026-11-22.md) sustentam decisões e melhorias de interface. Revisão por agente, captura com fixture, teste automatizado ou aprovação visual de protótipo não substituem uma sessão com pessoa representativa, tarefas e resultados registrados.

## Perfis e preparação

- Gestão de infraestrutura: identificar aplicações, estado, atualidade e falhas operacionais.
- Análise ambiental/operacional: interpretar estimativas, qualidade dos dados, ranking, comparação e cenários.
- Selecionar participante compatível com um desses perfis que não tenha implementado o fluxo avaliado; registrar experiência relevante sem nome, e-mail ou dado pessoal desnecessário.
- Registrar SHA frontend/backend implantados, URL, data/fuso, navegador, viewport/zoom, tema e idioma. Dados de teste devem ser explicáveis e identificados como reais, fonte controlada ou API interceptada.
- Moderador registra consentimento quando houver gravação; evita ensinar onde clicar. Definir responsáveis e duração real com a equipe antes da sessão, sem preenchimento retroativo.

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

Executar os tamanhos previstos pelo CT-083, incluindo 390×844 e 1440×900 quando aplicáveis. Não declarar todos os perfis, idiomas ou dispositivos aprovados a partir de uma sessão única.

## Registro por sessão — ainda não preenchido

| Campo | Registro |
| --- | --- |
| Data/fuso, moderador e evidência de consentimento aplicável | Pendente |
| Identificador anônimo e perfil/experiência | Pendente |
| SHA frontend/backend, ambiente e natureza dos dados | Pendente |
| Dispositivo, viewport, zoom, navegador, tema e idioma | Pendente |
| Tarefas tentadas e sucesso/ajuda/desistência observados | Pendente |
| Dificuldades, evidência sanitizada e impacto observado | Pendente |
| Issue/PR da melhoria ou justificativa da pendência | Pendente |
| Versão e resultado do reteste | Pendente |

Ao executar, adicionar registros com datas reais e vínculos em #133/#455/#489, preservando o histórico desta proposta. Não inserir credenciais, tokens, dados de participantes ou indicadores reais privados nas capturas. Apenas então avaliar o atendimento de IHC05 e IHC06.
