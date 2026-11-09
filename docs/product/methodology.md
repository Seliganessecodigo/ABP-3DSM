# Metodologia e dados

A energia é uma estimativa de um modelo simplificado, calculada a partir de CPU, memória, disco e rede durante o intervalo observado. A potência estimada é convertida em energia conforme a duração. As emissões resultam da energia multiplicada pela intensidade de carbono da região. Os coeficientes pertencem ao modelo acadêmico; não representam medição elétrica direta nem fatores regionais oficiais. Os resultados preservam a metodologia e o fator usados em sua origem.

## Interpretar os dados {#vocabulary}

| Conceito | Significado |
| --- | --- |
| Aplicação | Serviço com identidade estável no catálogo. |
| Observação | Conjunto de métricas associado a um intervalo. |
| Energia | Quantidade estimada no período, expressa em kWh. |
| Intensidade de carbono | Fator regional, expresso em gCO₂e/kWh. |
| Emissões | Quantidade equivalente de CO₂, com unidade informada. |
| Cobertura | Parcela do período sustentada por evidência válida. |

## Modelo de estimativa {#model}

| Parâmetro | Valor |
| --- | --- |
| CPU (100%) | 100 W |
| Memória | 0.375 W/GB |
| Disco | 0.01 W/GB |
| Rede | 0.02 W/GB |

```text
P [W] = P_CPU + P_RAM + P_disk + P_network
E [kWh] = P [W] × Δt [h] / 1000
CO₂e [g] = E [kWh] × I [gCO₂e/kWh]
```

## Entender a cobertura {#coverage}

Cobertura é a proporção do período sustentada por observações válidas. Energia e emissões têm coberturas separadas: pode existir energia estimada mesmo quando falta um fator de carbono para calcular emissões. Compare períodos, unidades e coberturas compatíveis. Um percentual de cobertura baixo sinaliza uma análise parcial, não uma redução comprovada de consumo.

Zero significa que existe uma observação válida com esse valor. Uma lacuna indica que faltam dados utilizáveis; ela não deve ser interpretada como consumo zero. Se uma atualização falhar, o sistema pode manter a última leitura válida com seu horário original. Confira a atualização e a cobertura antes de usar o indicador em uma decisão. As telas consultam novas informações a cada 60 segundos após cada tentativa; isso não garante uma nova medição a cada atualização.

## Períodos e histórico {#history}

| Regra | Significado |
| --- | --- |
| Histórico preservado | Alterar preferências ou gerar uma prévia não substitui resultados originais. |
| Ausência explícita | Falhas, falta de métricas e dados antigos permanecem distintos de zero. |
| Consulta pública | Ler indicadores não exige login; salvar preferências e administrar contas exige acesso autorizado. |

Na prévia de recálculo, selecione a aplicação e as datas para comparar o resultado original com uma estimativa pelo modelo atual e pelos fatores de carbono atuais das regiões observadas. O último dia selecionado é incluído por completo, em UTC. A consulta aceita até 30 dias e 10.000 observações. A prévia não é salva e não altera o histórico. Diferenças percentuais aparecem quando unidade e cobertura coincidem e o valor original é positivo.

## Leitura relacionada {#related}

[Guia de uso](../guide/monitoring) · [Referência da API](../reference/api)
