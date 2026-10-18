# Viabilidade frontend — US-11 / task #65

## Conclusão

Não identifiquei um incremento frontend de #65 que possa ser implementado agora sem presumir critérios ausentes, inventar um contrato ambiental ou duplicar comportamento já existente. O orquestrador consultou #65 no GitHub fora do sandbox e confirmou o aceite: composição ambiental real de #235, evolução de #174, evidências de #45, handoff #249, atualização e preservação de contexto. A avaliação considera esses critérios, as fontes versionadas e a fronteira confirmada: navegação catálogo → detalhe, com API controlada.

O detalhe operacional já implementa e testa essa jornada até evidência de coleta: identidade/estado/localização, retorno e preservação de contexto, carregamento, ausência, erro, atualização, métricas disponíveis/ausentes/inválidas, zero observado e dados stale. Um novo teste de UI para esses mesmos comportamentos seria duplicação, e um teste que exigisse energia, CO₂e ou série histórica dependeria de contratos que ainda não existem.

## Evidências na revisão atual

- `docs/backlog/ep04.md` descreve US-11 como investigação de estado, localização, evidências e indicadores, com retorno ao resumo preservando contexto compatível. O próprio backlog atribui as séries a #174 e filtros/período compartilhados a #262.
- `docs/product/decisions.md` registra energia e tempo/cobertura como decisões pendentes. `docs/product/methodology.md` confirma que CPU, memória, disco e rede não determinam energia diretamente; fórmula e coeficientes ainda dependem de aprovação. Ausência, erro e dado stale não equivalem a zero.
- `docs/reference/api.md` documenta `GET /applications`, `GET /applications/{id}`, `GET /applications/{id}/collections/latest` e `GET /applications/{id}/collections/{collectionId}`. Não publica endpoint nem DTO para resultados de energia/CO₂e ou séries.
- `backend/src/modules/applications/applications.controller.ts`, `application.dto.ts` e `collection.dto.ts` confirmam o contrato disponível: estado/localização da aplicação e evidência operacional de coleta com intervalo, timestamps, estado/frescor e métricas de CPU, memória, disco e rede.
- `frontend/src/pages/detail/ApplicationDetailPage.tsx` apresenta esses dados; `useApplicationDetail.ts` coordena consultas da aplicação/evidência, tentativa de atualização, polling e cancelamento. A UI não calcula resultados ambientais.
- `frontend/e2e/application-detail.spec.ts` já exercita catálogo → detalhe com mocks na fronteira HTTP controlada. Cobre navegação por ID, URL direta/recarga, estados e localização, timestamps, remoção, loading, 404/503 e retry, contexto de retorno, evidência atual/histórica, valores parciais, zero válido, stale, ausência e resposta atrasada.
- `frontend/src/README.md` e `docs/guide/monitoring.md` descrevem catálogo e detalhe operacional existentes, distinguindo evidências de coleta dos indicadores ambientais planejados.

## Fronteira de teste

Manter a fronteira de navegador Playwright já aprovada para #65: pessoa usuária parte do catálogo, abre o detalhe da aplicação selecionada e observa a apresentação da resposta de API controlada. O mock deve representar apenas DTOs publicados pelo backend. Não testar funções internas de parsing/hook por mock nem criar fixtures de energia, CO₂e ou série sem contrato.

Essa fronteira observa a navegação e a apresentação ponta a ponta no frontend. Ela não prova cálculo ambiental, contrato de API futuro ou integração real com fontes auxiliares.

## Ciclos RED → GREEN após desbloqueio

Não há ciclo RED → GREEN legítimo para iniciar com os contratos atuais: os comportamentos operacionais cobertos acima já estão implementados, e os resultados ambientais não têm resposta esperada aprovada. Quando os critérios e contratos forem publicados, usar ciclos verticais pequenos, na mesma fronteira Playwright:

1. Para cada estado ambiental definido por #235, adicionar um cenário com a resposta literal do contrato: resultado calculável, não calculável/ausente, stale ou falha conforme aplicável. Começar por um único cenário de sucesso; implementar só a apresentação necessária; seguir com um cenário por distinção de estado, preservando a diferença entre zero válido e ausência.
2. Quando #174 publicar uma resposta de série, cuja apresentação já faz parte do aceite de #65, adicionar primeiro um cenário com pontos e intervalo explícitos e conferir a identidade/período exibidos. Em ciclos seguintes, cobrir lacunas e cobertura somente segundo as regras aprovadas; não preencher lacunas com zero nem inventar agregações.
3. Reexecutar os cenários de navegação catálogo → detalhe e retorno com contexto somente se o novo contrato incluir contexto temporal compartilhado. O significado e a persistência do período dependem da decisão de #262; a presença visual de filtros no protótipo não define esse contrato.

Cada ciclo deve começar por um teste observável que falha pela ausência do comportamento aprovado, seguido da menor mudança de página/feature necessária para torná-lo verde. Nenhum desses testes deve ser escrito antes de existir DTO, critério de aceite e regra de estado correspondentes.

## Dependências para prosseguir

- Os critérios de #65 foram consultados pelo orquestrador e estão sintetizados na especificação US11-65 desta entrega. As pendências são de contrato e implementação das dependências, não de acesso ao texto da issue.
- Contrato publicado e critérios de apresentação ambiental de #235. Não tratar uma rota presumida ou dados de coluna do banco como contrato.
- Para séries, resposta e regras da #174; para contexto de período/filtros compartilhado, decisão/entrega #262.
- Fórmula de energia, unidades/conversões, período, cobertura, bordas temporais, arredondamento e estados de não calculabilidade, conforme decisões documentadas em `docs/product/decisions.md` e `docs/product/methodology.md`.

Até essas dependências serem resolvidas, não há mudança de produção ou novo teste frontend que preserve TDD sem codificar uma suposição. Os comportamentos operacionais atuais podem continuar sendo usados como evidência existente, sem reivindicar que energia, CO₂e ou histórico ambiental estejam entregues.
