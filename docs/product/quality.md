# Qualidade e aceite

O produto deve permitir localizar uma aplicação, distinguir zero de ausência e rastrear um indicador até seu período, unidade, cobertura e metodologia. As consultas precisam preservar o contexto de navegação e comunicar carregamento, vazio, falha e dados antigos. A avaliação inclui teclado, foco visível, leitura por texto além de cor, dispositivos móveis e os 12 idiomas.

## Critérios de aceite {#acceptance}

| Regra | Significado |
| --- | --- |
| Histórico preservado | Alterar preferências ou gerar uma prévia não substitui resultados originais. |
| Ausência explícita | Falhas, falta de métricas e dados antigos permanecem distintos de zero. |
| Consulta pública | Ler indicadores não exige login; salvar preferências e administrar contas exige acesso autorizado. |

## Interpretar os dados {#integrity}

Zero significa que existe uma observação válida com esse valor. Uma lacuna indica que faltam dados utilizáveis; ela não deve ser interpretada como consumo zero. Se uma atualização falhar, o sistema pode manter a última leitura válida com seu horário original. Confira a atualização e a cobertura antes de usar o indicador em uma decisão. As telas consultam novas informações a cada 60 segundos após cada tentativa; isso não garante uma nova medição a cada atualização.

Cobertura é a proporção do período sustentada por observações válidas. Energia e emissões têm coberturas separadas: pode existir energia estimada mesmo quando falta um fator de carbono para calcular emissões. Compare períodos, unidades e coberturas compatíveis. Um percentual de cobertura baixo sinaliza uma análise parcial, não uma redução comprovada de consumo.

## Critérios de validação {#assessment}

Mudanças de escopo e regras de uso devem registrar o problema, o resultado esperado e os critérios de aceite nas histórias correspondentes. Revisões do produto e avaliações de usabilidade registram dificuldades observadas, feedback e melhorias. Retenção de dados, backup e recuperação, metas operacionais e cotas das fontes externas ainda exigem definição.

## Verificações {#engineering}

[Contribuição](../contributing)

## Leitura relacionada {#related}

[Decisões e dependências](../product/decisions) · [Contribuição](../contributing)
