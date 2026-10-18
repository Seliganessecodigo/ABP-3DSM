# Viabilidade backend — US-11 / task #235

## Conclusão

Não há incremento de backend para resultados ambientais que possa ser implementado e testado honestamente com os contratos aprovados disponíveis na `develop`. O backend já expõe os dados básicos de detalhe (catálogo, estado, localização e evidência métrica mais recente). A parte ambiental depende de decisões de produto ainda abertas e de um contrato de resposta que não consta nesta revisão.

Não iniciar TDD para inventar um DTO ou um comportamento de cálculo. A skill TDD exige testar uma fronteira pública confirmada e comportamento especificado; hoje não há resultado esperado independente para energia, CO₂e, período ou cobertura. O teste passaria a ratificar uma suposição do agente.

## Evidência na revisão atual

- `docs/backlog/ep04.md` descreve US-11 (#17) como investigar estado, localização, métricas e resultados ambientais; sua jornada inclui retorno ao resumo com contexto compatível. O documento atribui a série temporal a #174 e os filtros/período compartilhados a #262.
- `docs/product/methodology.md` declara que fórmula e coeficientes para estimar energia dependem de aprovação. CPU (%), memória, disco e rede (GB) não se convertem diretamente em kWh. A relação dimensional CO₂e = kWh × intensidade está documentada, mas não define a energia de entrada. A mesma página deixa arredondamento, bordas temporais, granularidade e política de cobertura pendentes.
- `docs/product/decisions.md` mantém energia pendente em #49/#53/#58 e tempo/cobertura pendentes em #49/#156/#174/#175/#178. Não encontrei decisão aprovada específica para esses comportamentos na documentação da `develop`. A consulta do orquestrador ao GitHub confirmou #164 aberta: ela integra as regras de cálculo ao ciclo e persiste resultados originais de forma imutável e idempotente; não entra no escopo desta rodada.
- `backend/src/modules/applications/applications.controller.ts` já expõe `GET /applications/:id` e `GET /applications/:id/collections/latest` (além da consulta por ID da coleta). `ApplicationDto` inclui estado, motivo, localização e timestamps; `CollectionEvidenceDto` inclui intervalo, estado/stale e valores/unidades/status de CPU, memória, disco e rede.
- `backend/src/modules/README.md` registra explicitamente que essas consultas leem dados persistidos e não calculam energia nem CO₂e; também cita #114 para série/lacunas. A US-11 e as tasks atuais atribuem séries a #174; essa referência local anterior não transfere o escopo para #235.
- `CollectionEntity` já tem colunas nullable para energia, carbono, fator, versão de cálculo, cobertura e referências de configuração/fator. Isso é estrutura de persistência, não um contrato de saída nem evidência de que esses valores são calculados: o fluxo de coleta atual grava métricas e timestamps, sem popular esses resultados. A existência de `CalculationConfigEntity`/repository também não define uma metodologia aprovada.
- O orquestrador consultou #235 no GitHub: o aceite exige resultados persistidos de #49/#53/#164, metadados de #58, período e coberturas distintas, razões, parâmetros e preservação do fator original. Séries pertencem a #174 e a conclusão de #156 não é pré-requisito. O relatório acompanha a especificação US11-235 desta entrega.

## Fronteira de teste aprovada

Usar HTTP público com NestJS e PostgreSQL isolado, sem acessar métodos privados nem verificar o comportamento lendo as tabelas por fora da API. `backend/src/modules/applications/applications.database.spec.ts` já demonstra essa fronteira para catálogo, detalhe, evidência persistida, stale, ausência, escopo de aplicação, OpenAPI e falha de leitura. Ela é adequada para validar o contrato de detalhe quando a resposta ambiental e seus critérios forem aprovados. A chamada a APIs auxiliares reais não é necessária para esses cenários; as observações podem ser preparadas no banco de teste.

Essa fronteira valida integração HTTP → aplicação → persistência no backend. Não valida navegação/contexto de retorno no frontend, comportamento real do agregador/intensidade de carbono, nem uma fórmula de cálculo inexistente.

## Primeiros testes após desbloqueio

1. Transformar cada critério aprovado de #235 em um cenário pelo endpoint público de detalhe; começar pelo resultado feliz para uma aplicação com evidência persistida e conferir o DTO, incluindo o resultado ambiental versionado que for definido.
2. Exercitar as distinções de estado exigidas pelo contrato: aplicação/coleta ausente, evidência stale e resultado não calculável por falta de fator; preservar zero somente quando sustentado por evidência válida.
3. Verificar associação dos resultados ao mesmo período e identidade da aplicação, incluindo versões/IDs de configuração e fator se o contrato exigir rastreabilidade.
4. Adicionar casos de borda temporal, cobertura, precisão/arredondamento e erro de leitura somente depois que suas regras e respostas esperadas estiverem aprovadas.

Os cenários já cobertos por `applications.database.spec.ts` devem ser estendidos apenas onde os critérios de #235 exigirem novo comportamento; não duplicar testes do contrato atual sem necessidade.

## Decisões e contratos ainda necessários

- Fórmula para derivar energia das métricas, coeficientes oficiais, conversões de unidade, pressupostos e versão/metodologia (dependência documentada em #49/#53/#58).
- Escopo temporal da resposta (uma coleta ou período agregado), timezone, inclusão das bordas, granularidade, regra para intervalos sobrepostos/ausentes, cobertura e agregação de resultados parciais (dependências listadas em `docs/product/decisions.md`, incluindo as issues abertas comunicadas para esta análise).
- Forma pública para estados ambientais: campos/unidades de energia e CO₂e, valores nulos e motivos de não calculabilidade, stale e zero legítimo, precisão/arredondamento e identificadores de versão necessários para preservar o significado histórico.
- Formalizar no OpenAPI o contrato de #235 antes da integração de #65, conforme a issue consultada pelo orquestrador; o aceite inclui resultados completos, parciais, vazio, ID inexistente e período inválido.

Até essas definições chegarem, mudanças em controller, DTO, consulta ou teste ambiental seriam contrato inventado. As rotas já existentes cobrem a parcela disponível do detalhe, mas não autorizam anunciar cálculo de energia/CO₂e como entregue.
