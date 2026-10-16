# Metodologia e significado dos dados

O princípio central é preservar o significado da evidência: ausência, erro e dado desatualizado não equivalem a zero. As regras ambientais desta página são requisitos do produto; a fórmula completa de estimativa de energia e seus coeficientes ainda dependem de aprovação.

## Vocabulário e unidades

| Conceito | Significado |
| --- | --- |
| Aplicação | Identidade estável reconhecida no catálogo; nome ou localização podem mudar. |
| Observação/coleta | Métricas persistidas associadas à aplicação e a um intervalo. |
| Ciclo | Execução de descoberta, reconciliação e coleta; não é uma medição individual. |
| Energia | Quantidade acumulada no período, em kWh. Potência e energia não são intercambiáveis. |
| Intensidade de carbono | Fator regional em gCO₂e/kWh recebido da fonte. |
| CO₂e | Emissões equivalentes, com unidade e fator identificados. |
| Cobertura | Parte do recorte sustentada por evidência válida; a política de cálculo ainda deve ser aprovada. |
| Stale | Observação válida anterior preservada, sem representar sucesso da tentativa atual. |

O agregador documentado fornece CPU em %, memória, disco e rede em GB. Essas métricas não são diretamente kWh; conversão requer modelo, coeficientes e pressupostos documentados.

## Tempo e origem

A origem de métricas não publica timestamp da medição. O GreenER registra o recebimento e deriva o intervalo como `[receivedAt - collection_interval_seconds, receivedAt]`. Isso não comprova que a origem mediu exatamente nesses instantes.

Última tentativa, última observação válida e atualização de cadastro têm significados diferentes. O instante da consulta de um fator de carbono também não comprova sua vigência oficial. O snapshot preserva valor, identidade interna, contrato e horário da consulta; fonte bibliográfica e vigência não publicadas continuam desconhecidas.

## Relação entre energia e emissão

A relação dimensional planejada é:

    CO₂e [g] = energia [kWh] × intensidade [gCO₂e/kWh]

Exemplo exclusivamente didático: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Os números não são fatores aprovados nem leituras do GreenER. Essa relação não define como estimar energia a partir de CPU, memória, disco e rede.

Se faltar fator, uma energia válida continua válida, mas CO₂e pode ficar não calculável. Zero só é aceito quando deriva de evidência válida.

## Histórico, recálculo e simulação

| Resultado | Regra de produto |
| --- | --- |
| Original | Preserva observações, configuração, metodologia e fator utilizados. |
| Prévia de recálculo | Usa configuração atual identificada, sem salvar nem substituir o original. Permissões, limites e política do fator continuam pendentes. |
| Simulação regional | Mantém a energia e avalia outro fator regional, separada dos resultados oficiais. |

Totais, ranking e comparação devem usar recortes e coberturas compatíveis. Lacunas não ganham zeros artificiais; percentuais sem denominador válido não são inventados. Arredondamento, bordas temporais e granularidade são [decisões pendentes](./decisions), não escolhas implícitas de cada tela.
