# GreenER

Vocabulário canônico do domínio de monitoramento de aplicações e de suas evidências operacionais.

## Monitoramento operacional

**Estado operacional**:
A classificação atual de uma aplicação monitorada, derivada da última evidência conhecida. Pode ser disponível, indisponível, sem métricas ou removida.
_Evite_: status genérico, saúde

**Motivo do estado**:
A causa classificável que explica o estado operacional atual de uma aplicação.
_Evite_: mensagem de erro, detalhe técnico

**Última verificação**:
O instante da tentativa mais recente de coletar ou classificar o estado de uma aplicação, com sucesso ou falha.
_Evite_: última métrica, última observação

**Última observação válida**:
O instante da evidência mais recente de métricas válida para uma aplicação. Não avança quando uma tentativa falha, quando não há métricas ou quando a resposta é inválida.
_Evite_: última verificação, dado atual

**Observação desatualizada**:
Uma observação válida mantida depois de uma falha mais recente de coleta ou classificação; ela continua sendo evidência histórica e não representa valor zero.
_Evite_: sem dados, consumo zero

**Falha de consulta do catálogo**:
A indisponibilidade temporária de obter o catálogo na interface. Não altera o estado operacional persistido de nenhuma aplicação.
_Evite_: observação desatualizada, aplicação removida

**Calculabilidade**:
A condição de haver evidência e fator regional suficientes para calcular energia e emissões de uma aplicação.
_Evite_: disponível, saudável
