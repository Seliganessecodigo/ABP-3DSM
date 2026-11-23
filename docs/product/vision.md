# Visão e escopo

O GreenER ajuda a acompanhar aplicações e compreender seu consumo estimado de energia e suas emissões equivalentes de dióxido de carbono (CO₂e). Reúne indicadores, localização e histórico para apoiar a análise do impacto ambiental de serviços digitais.

## Para quem {#readers}

| Público | Necessidade |
| --- | --- |
| Gestão de infraestrutura | Identificar aplicações e acompanhar mudanças no ambiente. |
| Análise ambiental e operacional | Investigar consumo, emissões e qualidade dos dados de um período. |
| Desenvolvimento e avaliação | Verificar o comportamento do produto e reproduzir seus resultados. |

## Recursos disponíveis {#features}

| Recurso | Referência |
| --- | --- |
| Catálogo e busca | [Encontrar uma aplicação](../guide/monitoring#catalog) |
| Monitoramento automático | [Interpretar os dados](../guide/monitoring#data) |
| Dashboard ambiental | [Consultar o dashboard](../guide/monitoring#dashboard) |
| Detalhe da aplicação | [Investigar o detalhe](../guide/monitoring#detail) |
| Histórico e composição | [Explorar o histórico](../guide/monitoring#history) |
| Prévia legada (fora do escopo) | [Comparar com uma prévia de recálculo](../guide/monitoring#preview) |
| Preferências pessoais | [Personalizar a análise](../guide/monitoring#preferences) |
| Login e segundo fator | [Entrar na sua conta](../guide/monitoring#access) |
| Ranking ambiental | [Ranking ambiental](../guide/monitoring#other) |
| Comparação de aplicações | [Comparação de aplicações](../guide/monitoring#other) |
| Simulação regional | [Simulação regional](../guide/monitoring#other) |
| Contas e recuperação de senha | [Contas e recuperação de senha](../guide/monitoring#other) |

## Jornada de análise {#journey}

Comece pelo resumo ambiental, identifique uma aplicação que merece atenção e consulte seu detalhe. Use o histórico para investigar o período e a metodologia para entender como os valores foram estimados. Considere sempre a cobertura antes de comparar resultados.

## Limites de uso {#limits}

A energia é uma estimativa de um modelo simplificado, calculada a partir de CPU, memória, disco e rede durante o intervalo observado. A potência estimada é convertida em energia conforme a duração. As emissões resultam da energia multiplicada pela intensidade de carbono da região. Os coeficientes pertencem ao modelo acadêmico; não representam medição elétrica direta nem fatores regionais oficiais. Os resultados preservam a metodologia e o fator usados em sua origem.

Cobertura é a proporção do período sustentada por observações válidas. Energia e emissões têm coberturas separadas: pode existir energia estimada mesmo quando falta um fator de carbono para calcular emissões. Compare períodos, unidades e coberturas compatíveis. Um percentual de cobertura baixo sinaliza uma análise parcial, não uma redução comprovada de consumo.

## Estado atual e dependências {#planned}

Comparação, simulação regional, ranking, gestão de usuários e papéis, recuperação de senha e controles de monitoramento estão implementados. A administração exige acesso autorizado; SSO e envio de e-mails dependem da configuração do ambiente. A exportação CSV e políticas de retenção, backup e recuperação continuam dependências de produto.

## Leitura relacionada {#related}

[Guia de uso](../guide/monitoring) · [Metodologia e dados](../product/methodology) · [Backlog do produto](../roadmap)
