# React + TypeScript + Vite

## Testes do catálogo GreenER

Os fluxos públicos do catálogo e do detalhe são verificados em Chromium com
Playwright. Filtro e paginação são verificados isoladamente pela interface
`selectCatalog`, usando o mesmo runner, sem iniciar navegador nesses testes.
O runner
inicia o Vite automaticamente em `127.0.0.1:4173`; essa porta precisa estar livre.
As respostas HTTP da API GreenER são controladas pelo teste, sem depender do
backend, banco ou APIs auxiliares. O payload segue o DTO de catálogo de #162.

Execute dentro de `frontend/`:

```sh
npm ci
npx playwright install chromium
npm test
```

Para executar somente uma frente, use `npm run test:e2e` (Chromium) ou
`npm run test:unit` (regras isoladas). A configuração compartilhada inicia Vite
também na execução isolada, mas os testes de regras não usam a página nem HTTP.

A suíte está na fase **red**, a pedido do responsável: todos os testes foram
escritos antes da implementação. A interface `selectCatalog` só declara o
contrato e lança “Filtro e paginação do catálogo ainda não implementados”.
Não há lógica de filtro/paginação, client HTTP, rotas ou catálogo implementados.
Os testes isolados devem chegar a essa falha explícita; os de navegador devem
carregar a tela inicial e falhar no comportamento esperado. Erros de importação,
TypeScript, instalação, navegador ou servidor não comprovam o red.

| Frente | Comportamentos verificados |
| --- | --- |
| Regras isoladas | Busca por nome/ID/região/código, maiúsculas e minúsculas, todos os estados, interseção de filtros, nomes iguais, localização nula, vazio, total filtrado, ordem, páginas inicial/intermediária/final, redução do resultado e preservação da entrada. |
| Catálogo no navegador | Leitura sem login, identidades, carregamento/vazio/erro, falhas HTTP/rede/JSON/DTO, retry sem reload, contagens, filtros, busca, paginação, localização, estado textual, última verificação, atualização, dados anteriores, prevenção de sobreposição, teclado, mobile e menu. |
| Detalhe no navegador | Seleção pelo ID, nomes iguais, codificação de URL, entrada direta/recarga, campos/timestamps, nulos, carregamento, não encontrada, erro/retry, volta com busca/estado/página/período, histórico do navegador e resposta atrasada de seleção anterior. |

Decisões técnicas registradas pelos testes: página padrão da UI com 10 itens;
paginações isoladas recebem tamanho explícito; página excedente é ajustada à
última válida; resultado vazio tem zero páginas e referência de página 1;
busca ignora diferença de maiúsculas/minúsculas e conserva a ordem recebida.
Uma ação acessível “Atualizar catálogo” permite testar atualizações sem definir
polling. O contexto `period` dos testes é apenas navegação e não define parâmetro
temporal da API. Esses contratos poderão orientar a implementação.

Screenshots e traces das falhas ficam em `test-results/`, ignorado pelo Git. Para
abrir um trace, execute `npx playwright show-trace <caminho-do-trace.zip>`.

Correspondência visual com a imagem, foco visual, experiência com leitor de tela
real e entrega de deep links pelo hosting precisam de evidência na etapa de
implementação. Os testes de URL direta/recarga aqui rodam no Vite. A suíte não
afirma que regras de polling, cálculo ambiental ou infraestrutura foram entregues.
O gate SonarQube Cloud continua obrigatório na PR para `develop`; a CI existente
ainda não executa o novo comando `npm test` do frontend.

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
