# Qualidade e aceite

A interface conecta indicadores a período, unidade, cobertura e metodologia, preservando filtros e contexto de navegação. Estados de carregamento, vazio, falha e dados desatualizados recebem tratamento explícito. Teclado, foco visível, texto além de cor, dispositivos móveis, temas e 12 idiomas integram a experiência de uso.

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

Épicos, histórias e tasks organizam o produto com critérios verificáveis e referências ao código. Issues, pull requests e commits conectam requisitos, implementação e testes; a documentação reúne arquitetura, contratos, operação e evidências em um acervo versionado.

## Verificações {#engineering}

Na base documentada, a CI aprovou 542 testes de frontend, 705 de backend e três fluxos integrados, além de lint, tipagem, builds, migrations e gate SonarQube Cloud. O site oferece 12 idiomas com verificação automática de equivalência de conteúdo, contratos e links.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

[Contribuição](../contributing)

## Leitura relacionada {#related}

[Princípios de engenharia](../product/decisions) · [Contribuição](../contributing)
