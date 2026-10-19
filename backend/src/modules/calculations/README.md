# Cálculo de CO₂e

`calculateCarbonEmission` é uma função pura: recebe energia em kWh e o snapshot explícito do fator, sem consultar HTTP, banco ou relógio.

Emissões em gramas = energia em kWh × intensidade em gCO₂e/kWh. A conversão para quilogramas divide o resultado por 1000, sem arredondamento intermediário. Por exemplo, 2 kWh com intensidade de 100 gCO₂e/kWh produzem 200 gCO₂e, equivalentes a 0,2 kgCO₂e. A precisão de persistência é responsabilidade do consumidor.

Energia ou intensidade realmente zero são válidas. Energia ausente/inválida, fator ausente/inválido, unidade incompatível ou metadados obrigatórios inválidos tornam as emissões indisponíveis e retornam razões tipadas. Sem fator utilizável, até energia zero mantém emissões indisponíveis. A energia recebida permanece no resultado, acompanhada da razão quando inválida.

O resultado guarda uma cópia congelada do snapshot informado, incluindo identidade, versões, região, intensidade, unidade e horário de consulta. País, nome de região e cidade podem ser nulos em snapshots históricos; a validação do contrato obrigatório da origem atual pertence ao adapter. Fonte e vigência ausentes continuam nulas, e o horário de consulta não é tratado como vigência. A função não escolhe um fator novo nem reescreve histórico.

Resultados não finitos retornam emissões indisponíveis com `NON_FINITE_RESULT`, preservando energia e snapshot para diagnóstico.

## Projeção ambiental persistida por período — #235

`persisted-environmental-period.ts` implementa duas projeções puras sobre os valores ambientais e snapshots já persistidos nas coletas. `aggregatePersistedEnvironmentalPeriod` produz a composição integral com contribuições e exclusões por trecho; `summarizePersistedEnvironmentalPeriod`, usada por #235, calcula o resumo sem devolver essas listas. Ambas compartilham a mesma resolução temporal e proveniência de origem. Nenhuma equivale ao agregador legado `aggregateApplicationEnergyPeriod` de `energy-period.ts`: este calcula energia usando métricas operacionais e o modelo de energia da observação; as projeções persistidas não voltam às métricas brutas, não reaplicam o modelo e não consultam um fator de carbono atual. Assim, o histórico permanece fiel aos resultados gravados.

A projeção exige timestamps ISO com fuso explícito, normaliza a janela para UTC e usa `[from,to)`. Cada coleta intersectada é recortada ao período, e seus resultados salvos são rateados pela razão entre a duração contada e a duração original. Quando coletas se sobrepõem, vence a de `collectedAt` mais recente; empate é resolvido pelo ID em ordem lexical crescente. Um resultado ausente na vencedora deixa lacuna para essa métrica, sem fallback. A cobertura de energia e a de emissões são calculadas separadamente como fração do período sustentada por valores não nulos.

O resumo #235 usa energia `kWh` e emissões `gCO2e`. Zero persistido continua sendo valor disponível; `null` significa indisponibilidade e não vira zero. Período sem coletas intersectadas retorna `status: empty`, valores nulos, coberturas zero e proveniência vazia. Razões de ausência são preservadas separadamente para energia e emissões; razões de proveniência identificam metodologia ou fator ausentes quando o respectivo resultado está disponível. Metodologias são deduplicadas pela tupla `key`, `version` e parâmetros completos. Fatores são agrupados por código/país/região/cidade, intensidade, unidade, versão, versão do contrato, fonte e vigência; mesma versão nominal não funde fatores efetivamente distintos. O resumo registra `queriedAt.from/to` como a faixa dos horários de consulta GreenER para o fator agrupado, nunca como vigência, e não repete IDs ou timestamps individuais dos snapshots.

`aggregatePersistedEnvironmentalPeriod` mantém as contribuições e exclusões detalhadas: intervalo original e recortado, instante de coleta, valores e razões, metodologia/parâmetros e snapshot original do fator. Esse detalhe, incluindo proveniência de observações não calculáveis, deve ser consultado pela série e pelo drilldown paginado de #174; não é truncado nem duplicado na resposta resumida de #235. Nenhuma projeção arredonda além da precisão já persistida ou busca dados para preencher lacunas.

O teste de integração de `GET /applications/{id}/analysis` comprova o resumo contra PostgreSQL real em `src/modules/applications/environmental-analysis.database.spec.ts`; as instruções para `TEST_DATABASE_URL` estão em [`../README.md`](../README.md#consulta-ambiental-por-período--235).
