# Série do Dashboard e leitura do fator ambiental

O quadro do Dashboard apresentava um aviso permanente, sem consultar ou desenhar uma série. A contagem de snapshots também transformava fatores numericamente iguais em “Múltiplos fatores”. A fórmula acabava misturando energia total, emissões parciais e um rótulo sem valor numérico.

## Comportamento entregue

- A mesma consulta de resumo retorna intervalos históricos quando recebe uma granularidade. O Dashboard solicita horas para 24 horas e dias para as demais janelas; gráfico e tabela preservam período, estado atual e região histórica. A tabela de aplicações não filtra os indicadores nem a série.
- O backend resolve sobreposições dentro de cada aplicação antes de somar aplicações. Preserva valores nulos, zero legítimo, coberturas independentes, versões e resultados persistidos. Não consulta fatores atuais na leitura.
- O fator equivalente divide as emissões persistidas pela energia dos mesmos segmentos calculáveis. Por exemplo, 1 kWh com 85 gCO₂e e 3 kWh com 345 gCO₂e resultam em 430 gCO₂e e fator equivalente de 107,5 gCO₂e/kWh. Não é uma nova fonte regional nem uma média aritmética de snapshots.
- Quando há energia sem fator, ela continua no total de energia, mas não entra no denominador do fator equivalente. A fórmula identifica a energia com CO₂e calculado. Energia zero, ausência de energia ou emissões sem energia correspondente não produzem intensidade inventada.
- O card apresenta o número e expande apenas a explicação, os valores regionais e as fontes. A metodologia conserva a proveniência completa. Sem intensidade equivalente, o card exibe o valor uniforme ou uma faixa numérica, sem calcular médias no navegador.
- A altura dos cards acompanha o conteúdo para evitar sobreposição de controles. No celular, o fator ocupa a largura disponível.

## Verificação e limites

A regressão de navegador reproduziu o quadro vazio mesmo com um resumo válido. Os testes cobrem série real, lacunas, reconciliação, filtros, fator ponderado, cobertura parcial, ausência, zero e abertura do resumo no desktop e no celular. A documentação de uso e referência foi atualizada nos 12 idiomas.

Comparação agregada com período anterior permanece fora desta entrega. A série só apresenta resultados que existam no histórico persistido; a correção não cria observações ausentes. As capturas de teste usam dados controlados e não representam consumo real de produção.
