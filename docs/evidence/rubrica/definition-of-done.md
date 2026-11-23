# Definition of Done consolidada

Consolidada em 22/11/2026 a partir de AGENTS.md, quality gates e critérios das issues. Não atesta que todos os itens históricos cumpriram as condições nem altera escopos já aprovados. Aplicar às próximas revisões e registrar ressalvas explícitas ao reavaliar entregas antigas.

Uma entrega pode ser declarada concluída quando:

1. O escopo e os critérios de aceite aplicáveis foram demonstrados em uma versão identificada; dependências e exclusões estão registradas. Não usar uma captura do Figma como aprovação de requisito não implementado.
2. Código e responsabilidades respeitam as camadas; entradas/contratos são validados. Zero, ausência, erro e stale permanecem distintos; histórico e versões são preservados.
3. Testes pertinentes passam. Backend executável alterado tem testes de sucesso, falhas e limites, cobertura/LCOV de produção conferida; persistência é exercitada em PostgreSQL isolado. Mock de fonte e integração real são identificados separadamente.
4. CI obrigatória da PR para develop está aprovada: documentação, frontend, backend, migrations, fluxo integrado e Sonar. Código novo mantém cobertura mínima de 80%, duplicação máxima de 3%, ratings A e hotspots 100% revisados. Lint/typecheck/build passam; avisos preexistentes são identificados sem atribuir a eles uma correção inexistente.
5. Documentação, OpenAPI/ADR e instruções de execução afetadas acompanham a entrega. Páginas publicadas mantêm equivalência nos 12 idiomas e docs:build passa.
6. Quando há interface, estados de carregamento, vazio, erro, ausência e sucesso, teclado/foco, texto além de cor, temas e tamanhos/idiomas pertinentes foram verificados. Evidência usa dados identificados e não expõe credenciais ou dados pessoais.
7. A PR relaciona a issue, descreve decisões/limites, verificações realmente executadas e evidências. Revisão e aceite do PO/avaliador pertinentes ao item são registrados; ausência de aceite não é preenchida por inferência de commits.
8. O merge da entrega ocorreu e o escopo entregue foi confirmado antes de fechar sua issue. Project e issue ficam coerentes. Trabalho parcial ou não comprovado permanece identificado com pendência verificável.

Para critérios de processo e usabilidade, completar ainda os respectivos registros reais: planejamento/capacidade, review/retrospectiva, participantes por perfil, resultados e melhorias/reteste. Checks técnicos não substituem essas atividades.

Tags oficiais de sprint devem identificar o corte de entrega ratificado após código e documentação finalizados. Checkpoints cronológicos reconstruídos não são automaticamente promovidos a essas tags. A validação dos cortes e das evidências pendentes é acompanhada na [#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489).
