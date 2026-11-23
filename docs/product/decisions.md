# Decisões e dependências

Mudanças de escopo e regras de uso devem registrar o problema, o resultado esperado e os critérios de aceite nas histórias correspondentes. Revisões do produto e avaliações de usabilidade registram dificuldades observadas, feedback e melhorias. Retenção de dados, backup e recuperação, metas operacionais e cotas das fontes externas ainda exigem definição.

## Regras do produto {#rules}

| Regra | Significado |
| --- | --- |
| Histórico preservado | Alterar preferências ou gerar uma prévia não substitui resultados originais. |
| Ausência explícita | Falhas, falta de métricas e dados antigos permanecem distintos de zero. |
| Consulta pública | Ler indicadores não exige login; salvar preferências e administrar contas exige acesso autorizado. |

## Estado atual e dependências {#planned}

Comparação, simulação regional, ranking, gestão de usuários e papéis, recuperação de senha e controles de monitoramento estão implementados. A administração exige acesso autorizado; SSO e envio de e-mails dependem da configuração do ambiente. A exportação CSV e políticas de retenção, backup e recuperação continuam dependências de produto.

## Modelo de estimativa {#method}

A energia é uma estimativa de um modelo simplificado, calculada a partir de CPU, memória, disco e rede durante o intervalo observado. A potência estimada é convertida em energia conforme a duração. As emissões resultam da energia multiplicada pela intensidade de carbono da região. Os coeficientes pertencem ao modelo acadêmico; não representam medição elétrica direta nem fatores regionais oficiais. Os resultados preservam a metodologia e o fator usados em sua origem.

## Critérios de aceite {#acceptance}

O produto deve permitir localizar uma aplicação, distinguir zero de ausência e rastrear um indicador até seu período, unidade, cobertura e metodologia. As consultas precisam preservar o contexto de navegação e comunicar carregamento, vazio, falha e dados antigos. A avaliação inclui teclado, foco visível, leitura por texto além de cor, dispositivos móveis e os 12 idiomas.

## Leitura relacionada {#related}

[Backlog do produto](../roadmap) · [Metodologia e dados](../product/methodology)
