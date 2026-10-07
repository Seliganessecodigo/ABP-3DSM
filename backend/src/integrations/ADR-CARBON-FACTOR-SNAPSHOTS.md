# ADR: snapshots dos fatores de carbono publicados

## Contexto

O OpenAPI 0.1.0 do Serviço de Intensidade de Carbono publica fator, região e participação renovável, mas não publica versão do fator, fonte bibliográfica, data de atualização ou período de vigência. A tabela `carbon_regions` já guarda versões referenciáveis por coletas e exige `source` e `validFrom`.

## Decisão

Guardar cada consulta válida como nova linha imutável em `carbon_regions`, com UUID em `version`, versão do contrato (`contractVersion`) e horário de consulta do GreenER (`queriedAt`). `source` e `validFrom` ficam nulos nesses snapshots; linhas históricas podem continuar usando esses campos. A unidade vem do nome documentado `carbon_intensity_gco2e_per_kwh` e é armazenada como `gCO2e/kWh`. Uma resposta inválida ou indisponível não cria linha nem substitui a última versão.

## Consequências

Uma coleta futura pode referenciar o ID e a versão exatos do fator usado, preservando o histórico. `queriedAt` não pode ser interpretado como vigência oficial. O método legado `findEffective` continua consultando somente versões com `validFrom` definido; o fluxo de cálculo que selecionar snapshots de API deverá usar uma regra explícita própria.
