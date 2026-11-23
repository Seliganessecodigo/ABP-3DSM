# Loading e novos idiomas

O carregamento inicial de catálogo, dashboard, detalhe ambiental e metodologia usa aviso textual, indicador de processamento e placeholders. O detalhe mantém a aplicação e o período selecionado enquanto a consulta ambiental está pendente. Não são apresentados valores zero, ausência ou indisponibilidade como resultado antes da resposta.

Durante uma atualização, o indicador é compacto e os dados anteriores continuam visíveis. Ações de atualização pendentes bloqueiam o handler e usam `aria-disabled`, preservando o foco. A troca para outro período continua disponível, com o cancelamento e descarte de respostas obsoletas já existentes. Os placeholders são decorativos e as animações respeitam `prefers-reduced-motion`.

Foram adicionados coreano (`ko-KR`), russo (`ru-RU`), hindi (`hi-IN`) e indonésio (`id-ID`) aos oito idiomas existentes, em todos os cinco namespaces. O seletor, as bandeiras, a persistência e os fusos padrão seguem os padrões existentes. Datas e números usam `Intl`; unidades, fórmulas e demais conteúdos recebidos da API não são traduzidos ou recalculados pelo cliente. O catálogo inclui as formas plurais do russo.

## Verificação

Executados em `frontend/`:

```sh
npm ci
npm run lint
npm run build
npx playwright test e2e/loading.spec.ts e2e/new-locales.spec.ts tests/unit/locales.spec.ts
```

Os 23 testes novos cobrem carregamento inicial em celular e desktop, preservação de dados/período/foco, ações duplicadas por teclado, movimento reduzido, integridade das traduções e interpolações, pluralização, navegação nas quatro telas e persistência dos novos idiomas. As capturas usam respostas controladas de teste; não são dados de monitoramento real.

A suíte completa e o quality gate obrigatório do SonarQube são verificados na PR para `develop`. Validação visual em Chromium. As traduções ainda não passaram por revisão de falantes nativos. O site de documentação mantém seus oito idiomas; os quatro novos idiomas foram adicionados à aplicação.

## Capturas

- [Loading ambiental em desktop](environmental-loading.png)
- [Loading do catálogo em celular](catalog-mobile-loading.png)
- [Coreano: loading no celular](ko-KR-loading.png) e [metodologia](ko-KR-methodology.png)
- [Russo: loading no celular](ru-RU-loading.png)
- [Hindi: loading no celular](hi-IN-loading.png)
- [Indonésio: loading no celular](id-ID-loading.png)
