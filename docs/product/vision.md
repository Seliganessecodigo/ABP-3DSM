# Visão e escopo do produto

O GreenER ajuda a responder três perguntas: quais aplicações estão sendo acompanhadas, que evidências existem sobre seu consumo e como interpretar sua energia e emissões estimadas. O produto reúne descoberta, métricas, contexto regional e histórico para apoiar investigação e priorização.

## Para quem

| Público | Necessidade |
| --- | --- |
| Gestão de infraestrutura | Reconhecer aplicações e acompanhar mudanças do ambiente. |
| Análise operacional e ambiental | Investigar períodos, comparar resultados compatíveis e entender lacunas. |
| Operação administrativa | Alterar parâmetros e acesso com autorização e rastreabilidade. |
| Equipe de desenvolvimento e avaliação | Reproduzir o ambiente e demonstrar critérios de aceite. |

Esses públicos descrevem necessidades; a matriz completa de papéis e permissões ainda depende de [decisão de produto](./decisions).

## Escopo e disponibilidade

Referência da documentação: 15/10/2026, código de `develop`. Cada ambiente pode executar uma revisão diferente; uma issue encerrada não comprova disponibilidade em produção.

| Capacidade | Situação documentada |
| --- | --- |
| Catálogo, busca/filtro de estado, navegação e oito idiomas | Implementados na interface. |
| Descoberta, eventos de ciclo de vida, coleta periódica e persistência | Implementados no backend. |
| Estado operacional e consulta de evidências de coletas | Expostos pela API; a apresentação completa nas telas tem tasks próprias. |
| Dashboard ambiental, energia/CO₂e, séries, ranking e comparação | Escopo planejado; não são prometidos como funções disponíveis. |
| Temas, autenticação, administração, simulação regional e prévia de recálculo | Escopo planejado, com dependências registradas no backlog. |

## Jornadas e valor

1. Localizar uma aplicação no catálogo e abrir seu detalhe: confirmar identidade, localização e estado.
2. Investigar uma mudança: distinguir última tentativa, última observação válida e ausência de dados.
3. No escopo ambiental planejado, selecionar um período, ler resultados com cobertura e metodologia e comparar aplicações no mesmo recorte.
4. Na administração planejada, alterar parâmetros autorizados sem reescrever resultados históricos.

O [guia de uso](../guide/monitoring) descreve a experiência existente; os [épicos](../roadmap) detalham o comportamento esperado.

## Limites do produto

Estimativas ambientais não são medição elétrica direta nem prova de economia causada por uma ação. Não há indicador de eficiência por transação sem dados de trabalho produzido. Exportação CSV, personalização de colunas e comparação com período anterior não entram no MVP apenas por aparecerem no protótipo. Mapa é opcional.

## Como avaliar o resultado

Nas reviews, verificar se as pessoas encontram a aplicação, distinguem zero de ausência e rastreiam um resultado até período, unidade e evidências. Registrar tarefas avaliadas, dificuldades, feedback e mudanças em [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) e [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Metas de tempo, satisfação e desempenho exigem baseline e aprovação; esta documentação não estabelece números arbitrários.
