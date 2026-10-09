# React + TypeScript + Vite

## Testes do catálogo GreenER

O fluxo público do catálogo é verificado em Chromium com Playwright. O runner
inicia o Vite automaticamente em `127.0.0.1:4173`; essa porta precisa estar livre.
As respostas HTTP da API GreenER são controladas pelo teste, sem depender do
backend, banco ou APIs auxiliares. O payload segue o DTO de catálogo de #162.

Execute dentro de `frontend/`:

```sh
npm ci
npx playwright install chromium
npm run test:e2e
```

O primeiro ciclo TDD está na fase **red**: o teste espera uma linha com nome e ID
da aplicação recebida pela API, enquanto a tela atual ainda é a página inicial.
Essa falha é intencional e deve ser resolvida na próxima etapa de implementação.
O runner deve carregar a página e falhar na asserção de comportamento; falhas de
instalação, navegador ou servidor não comprovam o red.

Screenshots e traces das falhas ficam em `test-results/`, ignorado pelo Git. Para
abrir um trace, execute `npx playwright show-trace <caminho-do-trace.zip>`.

Conforme a spec de #25, os próximos ciclos incluem filtros, paginação, erros e
detalhe, com testes pelo navegador e testes isolados das regras de filtro e
paginação. Eles serão adicionados por comportamento durante os ciclos TDD.

Referências oficiais: [instalação](https://playwright.dev/docs/intro),
[servidor de testes](https://playwright.dev/docs/test-webserver) e
[respostas HTTP controladas](https://playwright.dev/docs/mock).

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
