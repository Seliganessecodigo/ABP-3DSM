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
| RNF-07 — Experiência | Teclado, foco, contraste, texto/ícone além de cor, responsividade e oito idiomas. |

A matriz de acesso, retenção, recuperação de desastre e metas numéricas de disponibilidade/desempenho ainda precisam de definição. Não há SLA ou certificação de acessibilidade declarados por esta página.

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
