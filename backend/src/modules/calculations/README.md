# Cálculo de CO₂e

`calculateCarbonEmission` é uma função pura: recebe energia em kWh e o snapshot explícito do fator, sem consultar HTTP, banco ou relógio.

Emissões em gramas = energia em kWh × intensidade em gCO₂e/kWh. A conversão para quilogramas divide o resultado por 1000, sem arredondamento intermediário. Por exemplo, 2 kWh com intensidade de 100 gCO₂e/kWh produzem 200 gCO₂e, equivalentes a 0,2 kgCO₂e. A precisão de persistência é responsabilidade do consumidor.

Energia ou intensidade realmente zero são válidas. Energia ausente/inválida, fator ausente/inválido, unidade incompatível ou metadados obrigatórios inválidos tornam as emissões indisponíveis e retornam razões tipadas. Sem fator utilizável, até energia zero mantém emissões indisponíveis. A energia recebida permanece no resultado, acompanhada da razão quando inválida.

O resultado guarda uma cópia congelada do snapshot informado, incluindo identidade, versões, região, intensidade, unidade e horário de consulta. País, nome de região e cidade podem ser nulos em snapshots históricos; a validação do contrato obrigatório da origem atual pertence ao adapter. Fonte e vigência ausentes continuam nulas, e o horário de consulta não é tratado como vigência. A função não escolhe um fator novo nem reescreve histórico.

Resultados não finitos retornam emissões indisponíveis com `NON_FINITE_RESULT`, preservando energia e snapshot para diagnóstico.
