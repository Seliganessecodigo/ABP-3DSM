# Metodologia — validação em 28/10/2026

Referências: exportação local `greener-metodologia-referencias-20261028`, lida a partir de `LEIA-REFERENCIAS.md`, `atuais/index.html` e `atuais/referencias.json`. Foram examinados os cinco PNGs originais: Energia (`720:1244`), Emissões (`720:1564`), Cobertura (`720:1884`), Padrão das análises (`720:2195`) e diálogo (`713:1546`). Somente o diálogo foi usado da quinta referência. Nenhuma ferramenta do conector Figma foi utilizada.

## Comparação e implementação

Antes, `/methodology` selecionava uma aplicação para consultar a evidência metodológica de uma coleta. Essa consulta foi preservada em `RecordedMethodology` e na rota `/services/:id/methodology`, incluindo `collectionId`, fórmula original, fator histórico, resultados, ausência e erros. A rota geral agora apresenta as quatro abas com explicação, preferência ativa, edição e prévia.

Foram reaproveitados o shell, marca/folhagem originais, tokens dos temas, botões, estados operacionais e formatador de datas do catálogo. A fonte Inter declarada pela aplicação não tinha arquivo carregado: foi incluída localmente, com licença, usando um nome restrito à nova página e à sua navegação. As referências nunca são renderizadas como interface.

A revisão dos screenshots corrigiu tipografia, largura dos três cards, espaçamentos, quebras de texto, posições das abas, tabela, selo de exemplo, avisos combinados, gráfico e alinhamento do diálogo na área de conteúdo. Em larguras intermediárias, a prévia passa para uma linha própria; no celular, cada aplicação da tabela aparece como um card com os mesmos campos. Nenhum campo é omitido para fazer caber.

| Evidência | Cenário |
| --- | --- |
| [Energia](energia-desktop.png) | Preferência ativa 10 e edição 8, valores controlados exclusivamente no teste |
| [Emissões](emissoes-desktop.png) | Edição em kg CO₂e |
| [Cobertura](cobertura-desktop.png) | Referência percentual, aviso e nota de interpretação |
| [Padrão das análises](padrao-analises-desktop.png) | Período, granularidade e gráfico com área/linha/pontos |
| [Avisos combinados](avisos-combinados.png) | Três avisos simultâneos no checkout; estado operacional separado |
| [Diálogo desktop](modal-desktop.png) | Continuar, descartar e trocar, salvar e trocar |
| [Notebook](energia-notebook.png) | 1366 × 768, prévia em linha própria |
| [Monitor maior](padrao-analises-wide.png) | 2560 × 1440 |
| [Celular](energia-mobile.png) | 390 × 844, tabela convertida em cards |
| [Diálogo mobile](modal-mobile.png) | Ações empilhadas, sem overflow |
| [Tema escuro](energia-dark.png) | Mesma hierarquia e tokens existentes |
| [Persistência real](preferencias-api-real.png) | Frontend + NestJS + PostgreSQL, sem interceptar respostas HTTP |

## Verificações executadas

- Frontend: `npm ci`, `npm run lint`, `npm run build`; os checks correspondentes também são executados na CI da PR.
- Playwright focado: `npm run test:e2e -- methodology-preferences.spec.ts methodology.spec.ts`: **17 testes passaram**. Incluem salvar por aba, restaurar o ativo, diálogo e Escape/foco, falhas 409/503, múltiplos avisos, limites de cobertura, gráfico/tabela, renovação de JWT, padrões salvos e prioridade da URL, 12 idiomas e screenshots.
- Foram acrescentados e executados mais dois cenários de fronteira HTTP: unidade inválida na leitura com recuperação por retry e resposta inválida de salvamento com preservação do ativo/rascunho. A execução filtrada desses cenários e da renovação JWT passou nos três testes.
- Responsividade nas quatro abas: 320, 390, 1366, 1894 e 2560 px, com asserções de largura da página e dos cards. Conferência adicional: **24 cenários** em 390, 768 e 1600 px, temas claro/escuro, mais o diálogo mobile. Os screenshots foram abertos para comparação visual com as referências.
- Fluxo de navegador sem mocks: login real de conta temporária somente no PostgreSQL isolado da tarefa; quatro abas salvas; reload encerra a sessão em memória, conforme autenticação existente; novo login recupera o valor persistido. Nenhum erro de JavaScript foi observado nesse fluxo.
- Backend: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` e `npm run test:cov -- --runInBand --testTimeout=30000`, com PostgreSQL isolado: **376 testes passaram em 44 suítes**. O timeout estendido foi usado na máquina local; a CI passou com o timeout habitual.
- LCOV conferido: controller, DTO, módulo, repository e service de preferências têm **100% de linhas cobertas**; service e repository têm **100% dos branches cobertos**. Arquivos de testes não foram contados como produção.
- Documentação: `npm ci --prefix docs` e `npm run docs:build` passaram.
- A execução completa da CI conferida antes das últimas verificações de fronteira passou em **295 testes do frontend**, backend, migrations e documentação. O gate do SonarQube informou **100% de cobertura de código novo**, **0% de duplicação**, ratings **A** e **100% dos hotspots revisados**. Os apontamentos de legibilidade foram corrigidos e a revisão atualizada está disponível na PR.

A primeira execução local completa do backend excedeu 5 s no teste existente com mais de 10.000 observações e deixou registros que interferiram na repetição. A verificação final usou um banco isolado novo e passou integralmente. A primeira execução completa do frontend ocorreu durante ajustes com HMR; a validação focada foi repetida em seguida e a execução completa da CI, em checkout estável, passou. Um falso positivo do teste novo de idiomas foi corrigido para distinguir a frase inglesa “preferences.” de uma chave de tradução ausente.

## Contrato e limites

O solicitante autorizou incluir a persistência nova. [Contrato e operação](../../../backend/src/modules/preferences/README.md): JWT existente, recurso próprio do usuário, revisão por aba, auditoria transacional e migration. Os valores da referência são exemplos, sem seeds nem limites globais. Preferências não alteram fórmulas, fatores, resultados ou dados históricos. O uso dos limites em outras telas não foi acrescido ao contrato do catálogo real nesta tarefa.

A aplicação dos padrões de análise respeita filtros da URL, inclusive escolhas feitas enquanto as preferências carregam. Sem login, a página permanece consultável e a gravação não é simulada. Falha de leitura/gravação não atualiza o valor ativo nem vira zero.

PR de entrega: [#331, destino develop](https://github.com/Seliganessecodigo/ABP-3DSM/pull/331). A conferência final do SonarQube e dos checks fica registrada na PR; nenhum merge para `develop` ou `main` foi realizado nesta tarefa.
