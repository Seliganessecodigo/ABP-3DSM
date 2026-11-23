# Princípios de engenharia

Épicos, histórias e tasks organizam o produto com critérios verificáveis e referências ao código. Issues, pull requests e commits conectam requisitos, implementação e testes; a documentação reúne arquitetura, contratos, operação e evidências em um acervo versionado.

## Regras do produto {#rules}

| Regra | Significado |
| --- | --- |
| Histórico preservado | Alterar preferências ou gerar uma prévia não substitui resultados originais. |
| Ausência explícita | Falhas, falta de métricas e dados antigos permanecem distintos de zero. |
| Consulta pública | Ler indicadores não exige login; salvar preferências e administrar contas exige acesso autorizado. |

## Capacidades integradas {#planned}

A plataforma oferece comparação entre aplicações, ranking ambiental, simulação regional, gestão de usuários e papéis, recuperação de senha e controles de monitoramento. Autenticação com JWT, Google SSO e segundo fator TOTP protege os fluxos administrativos, enquanto as consultas ambientais permanecem públicas.

## Modelo de estimativa {#method}

A energia é uma estimativa de um modelo simplificado, calculada a partir de CPU, memória, disco e rede durante o intervalo observado. A potência estimada é convertida em energia conforme a duração. As emissões resultam da energia multiplicada pela intensidade de carbono da região. Os coeficientes pertencem ao modelo acadêmico; não representam medição elétrica direta nem fatores regionais oficiais. Os resultados preservam a metodologia e o fator usados em sua origem.

## Critérios de aceite {#acceptance}

A interface conecta indicadores a período, unidade, cobertura e metodologia, preservando filtros e contexto de navegação. Estados de carregamento, vazio, falha e dados desatualizados recebem tratamento explícito. Teclado, foco visível, texto além de cor, dispositivos móveis, temas e 12 idiomas integram a experiência de uso.

## Leitura relacionada {#related}

[Backlog do produto](../roadmap) · [Metodologia e dados](../product/methodology)
