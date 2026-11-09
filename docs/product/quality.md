# Requisitos transversais e aceite

O [EP00](../backlog/ep00) organiza fundações técnicas e qualidade. Um RNF é uma condição permanente do produto; uma task ligada a ele entrega um artefato finito. Concluir a task de banco, por exemplo, não encerra a obrigação de preservar integridade nas próximas funcionalidades.

## Qualidade observável

| Requisito | Evidência esperada |
| --- | --- |
| RNF-01 — Tecnologias | Frontend React/TypeScript e backend NestJS/TypeScript compiláveis. |
| RNF-02 — Responsabilidades | UI apresenta; backend decide; adapters validam; repositories persistem. |
| RNF-03 — Histórico | Migrations e testes demonstram identidade, integridade e preservação das versões. |
| RNF-04 — Segurança | Segredos fora do Git; operações protegidas verificam autorização no backend. |
| RNF-05 — Reprodutibilidade | Ambiente documentado, CI verificável e publicação com evidência de funcionamento. |
| RNF-06 — Falhas | Sucesso, vazio, erro, ausência e stale permanecem distinguíveis. |
| RNF-07 — Experiência | Teclado, foco, contraste, texto/ícone além de cor, responsividade e doze idiomas. |

Permanecem fora da entrega: comparação dedicada entre pelo menos duas aplicações, simulação regional, gestão geral de usuários/papéis, recuperação de senha por autoatendimento, configuração global/pausa do monitoramento e exportação CSV. Ordenar o dashboard por impacto já é possível. Cotas externas, retenção, backup/restauração e metas operacionais precisam de definição; não há SLA declarado. Recuperação de TOTP é operação de suporte, não reset de senha.

## Cenários essenciais para demonstração

| Dado / quando | Resultado esperado | Referência |
| --- | --- | --- |
| Aplicação conhecida; snapshot completo e válido não a contém | Registrar remoção e preservar histórico. | US-02 |
| A fonte falha ou retorna payload inválido | Não confirmar remoção nem transformar dados em zero. | US-02/05 |
| Há observação válida; próxima tentativa falha | Manter observação e distinguir o frescor. | US-03/04 |
| Há energia válida; fator não está disponível | Não fabricar CO₂e nem descartar energia. | US-07/08 |
| Usuário solicita prévia de recálculo | Original permanece intacto e a prévia não é persistida. | US-12 |
| Operação administrativa sem permissão | Backend nega a alteração. | US-18/19/20 |

São critérios do produto; cada capacidade planejada precisa da implementação e dos testes antes de ser anunciada como entregue.

## Prontidão e conclusão

Antes de iniciar uma task, identificar entrega, consumidores, critérios, contrato e dependências reais. Coeficiente ou permissão pendente não vira decisão técnica por conveniência. Design precisa de estados, navegação e handoff verificáveis.

Para concluir: demonstrar critérios, revisar código, validar falhas relevantes, atualizar contrato/documentação e registrar evidências. PR aberta não equivale a issue concluída. Planning, review e feedback ficam na entrega de processo #134.

## Gate de engenharia

PRs para `develop` devem cumprir as verificações pertinentes e o SonarQube Cloud: cobertura de código novo ≥ 80%, duplicação ≤ 3%, ratings A e 100% dos security hotspots revisados. Mudanças executáveis no backend exigem testes e LCOV. Consulte as [regras completas da CI](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/.github/quality-gates.md) e [Contribuição](../contributing). Passar na CI não substitui aceite funcional nem avaliação de usabilidade.

## CI — c343698

A CI verifica o build da documentação, lint/testes/build do frontend, lint/typecheck/testes com PostgreSQL/cobertura/build/migrations do backend e fluxo integrado real no navegador. `TEST_DATABASE_URL` deve apontar para PostgreSQL isolado; sem ela, suítes Jest de banco são ignoradas e a suíte integrada do navegador falha. O gate SonarQube Cloud continua obrigatório em PRs para `develop`: cobertura nova ≥ 80%, duplicação ≤ 3%, ratings A e hotspots 100% revisados. Teste automatizado não substitui avaliação de usabilidade ou aceite do produto.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
