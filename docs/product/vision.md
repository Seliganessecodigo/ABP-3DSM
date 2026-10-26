# Visão e escopo do produto

O GreenER ajuda a responder três perguntas: quais aplicações estão sendo acompanhadas, que evidências existem sobre seu consumo e como interpretar sua energia e emissões estimadas. O produto reúne descoberta, métricas, contexto regional e histórico para apoiar investigação e priorização.

## Para quem

| Público | Necessidade |
| --- | --- |
| Gestão de infraestrutura | Reconhecer aplicações e acompanhar mudanças do ambiente. |
| Análise operacional e ambiental | Investigar períodos, comparar resultados compatíveis e entender lacunas. |
| Equipe de desenvolvimento e avaliação | Reproduzir o ambiente e demonstrar critérios de aceite. |

Esses públicos descrevem necessidades; a matriz completa de papéis e permissões ainda depende de [decisão de produto](./decisions).

## Escopo e disponibilidade

Referência da documentação: código de `develop` em 23/10/2026 (commit `1633ca2`). Cada ambiente pode executar uma revisão diferente; uma issue encerrada não comprova disponibilidade em produção.

| Capacidade | Situação documentada |
| --- | --- |
| Catálogo, busca, filtros, paginação, navegação e oito idiomas | Implementados na interface. |
| Descoberta, eventos de ciclo de vida, coleta periódica, incidentes e persistência | Implementados no backend. |
| Estado operacional, métricas de origem, evidências e metodologia da coleta | API e detalhe da aplicação disponíveis; uma página expõe modelo, fórmula, parâmetros e fator registrados sem recalcular. Falhas, ausência e dados antigos permanecem distintos. |
| Análise ambiental por aplicação, série temporal e inspeção de contribuições | Disponíveis na API e integradas ao detalhe da aplicação. |
| Resumo agregado ambiental | Endpoint disponível na API (`GET /analysis/summary`); dashboard agregado ainda não está disponível na interface. |
| Tema claro/escuro | Preferência disponível na interface. |

## Jornadas e valor

1. Localizar uma aplicação no catálogo e abrir seu detalhe: confirmar identidade, localização e estado.
2. Investigar uma mudança: distinguir última tentativa, última observação válida e ausência de dados.
3. No detalhe, selecionar período e granularidade, interpretar série/cobertura e investigar as contribuições de um bucket sem transformar lacunas em zero.

O [guia de uso](../guide/monitoring) descreve a experiência existente; os [épicos](../roadmap) detalham o comportamento esperado.

## Limites do produto

Estimativas ambientais não são medição elétrica direta nem prova de economia causada por uma ação. Não há indicador de eficiência por transação sem dados de trabalho produzido. A série do detalhe compara uma aplicação com a janela imediatamente anterior de mesma duração; isso não representa comparação entre aplicações ou dashboard de períodos. Mapa é opcional.

## Como avaliar o resultado

Nas reviews, verificar se as pessoas encontram a aplicação, distinguem zero de ausência e rastreiam um resultado até período, unidade e evidências. Registrar tarefas avaliadas, dificuldades, feedback e mudanças em [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) e [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Metas de tempo, satisfação e desempenho exigem baseline e aprovação; esta documentação não estabelece números arbitrários.
