# Metodologia e significado dos dados

O princípio central é preservar o significado da evidência: ausência, erro e dado desatualizado não equivalem a zero. A energia é estimada pelo modelo simplificado com parâmetros versionados; não é medição elétrica real e seus parâmetros não são fator regional oficial. A relação de conversão para CO₂e está implementada em #49/#53.

## Vocabulário e unidades

| Conceito | Significado |
| --- | --- |
| Aplicação | Identidade estável reconhecida no catálogo; nome ou localização podem mudar. |
| Observação/coleta | Métricas persistidas associadas à aplicação e a um intervalo. |
| Ciclo | Execução de descoberta, reconciliação e coleta; não é uma medição individual. |
| Energia | Quantidade acumulada no período, em kWh. Potência e energia não são intercambiáveis. |
| Intensidade de carbono | Fator regional em gCO₂e/kWh recebido da fonte. |
| CO₂e | Emissões equivalentes, com unidade e fator identificados. |
| Cobertura | Fração do período sustentada por evidência válida, calculada separadamente para energia e CO₂e. |
| Stale | Observação válida anterior preservada, sem representar sucesso da tentativa atual. |

O agregador documentado fornece CPU em %, memória, disco e rede em GB. Essas métricas não são diretamente kWh; conversão requer modelo, coeficientes e pressupostos documentados.

## Tempo e origem

A origem de métricas não publica timestamp da medição. O GreenER registra o recebimento e deriva o intervalo como `[receivedAt - collection_interval_seconds, receivedAt]`. Isso não comprova que a origem mediu exatamente nesses instantes.

Última tentativa, última observação válida e atualização de cadastro têm significados diferentes. O instante da consulta de um fator de carbono também não comprova sua vigência oficial. O snapshot preserva valor, identidade interna, contrato e horário da consulta; fonte bibliográfica e vigência não publicadas continuam desconhecidas.

## Regras temporais ambientais

Consultas usam timestamps ISO com fuso explícito, normalizados para UTC, no intervalo [from,to). Buckets UTC por hora/dia/mês/ano contam apenas a sobreposição com o período, inclusive buckets parciais. Presets 24h/7d/30d/90d são janelas móveis exatas com âncora única para KPIs e série. Limite: 10.000 pontos; excesso é rejeitado, sem truncar ou trocar granularidade. Séries rateiam resultados salvos por sobreposição, sem recalcular observações; desempate por collectedAt mais recente e ID lexical crescente, sem fallback se a vencedora não sustenta a métrica. Sem arredondamento adicional; coberturas e snapshots originais permanecem separados e preservados.

## Relação entre energia e emissão

A relação dimensional implementada é:

    CO₂e [g] = energia [kWh] × intensidade [gCO₂e/kWh]

Exemplo exclusivamente didático: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Os números não são fatores aprovados nem leituras do GreenER. Essa relação não define como estimar energia a partir de CPU, memória, disco e rede.

Se faltar fator, uma energia válida continua válida, mas CO₂e pode ficar não calculável. Zero só é aceito quando deriva de evidência válida.

## Histórico, recálculo e simulação

| Resultado | Regra de produto |
| --- | --- |
| Original | Preserva observações, configuração, metodologia e fator utilizados. |
| Simulação regional | Mantém a energia e avalia outro fator regional, separada dos resultados oficiais. |

Totais, ranking e comparação devem usar recortes e coberturas compatíveis. Lacunas não ganham zeros e percentuais exigem denominador válido. As regras temporais aprovadas estão acima. Na persistência, energia, emissão em gramas e fator usam oito casas decimais; cobertura, como fração entre zero e um, usa quatro. Cálculos não arredondam intermediários, e snapshots JSON preservam sua representação original.

## Metodologia e dados — simplified-energy v1

O modelo implementado é `simplified-energy`, versão `1`: CPU a 100% = 100 W; memória = 0,375 W/GB; disco = 0,01 W/GB; rede = 0,02 W/GB. São parâmetros do modelo simplificado, sem alegação de medição elétrica ou fator regional oficial. Potência soma as parcelas; energia = W × horas / 1000; CO₂e[g] = kWh × gCO₂e/kWh. Os snapshots registram método e fator usados. A prévia consulta fatores atuais e não reescreve os snapshots originais.

Em `/administration/calculations`, selecione aplicação e datas para comparar original e prévia. A data final da UI é inclusiva em dias UTC; a API recebe `[from,to)`. A prévia é pública, usa o modelo atual e consulta fatores atuais para as regiões históricas, sem salvar ou substituir resultados. Limites: 30 dias e 10.000 observações. A resposta contém `original`, `preview`, `warnings` e `status` (`available`, `empty` ou `partial`). Falha do fator preserva energia calculável e informa CO₂e indisponível. Percentuais exigem unidades e coberturas iguais e referência positiva.

Em `/methodology`, as abas de energia, emissões, cobertura e análise permitem explorar exemplos e editar preferências pessoais. Salvar exige login de qualquer papel e altera apenas a própria aba, com revisão otimista: 409 indica conflito. Os limites são de apresentação; não alteram parâmetros globais, cálculos nem notificações externas. Período/granularidade salvos preenchem somente opções ausentes na URL do detalhe. A metodologia histórica permanece em `/services/:id/methodology`, com `collectionId` quando selecionado.
